import axios from "axios";
import { normalizeTag } from "./topicMapping";
import { prisma } from "../prisma/client";

export interface ExternalProblem {
  externalId: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  link?: string;
  topicSlugs: string[];
  solvedAt: Date;
}

export interface RankedTopic {
  topicId: string;
  topicName: string;
  companyFrequency: number;
  studentSolvedCount: number;
  gapScore: number;
  recommendationNote: string;
}

export class JudgeClient {
  /**
   * Syncs solved problems from Codeforces official public API
   */
  static async syncCodeforces(handle: string): Promise<ExternalProblem[]> {
    try {
      const response = await axios.get(
        `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=100`,
        { timeout: 10000 }
      );

      if (response.data.status !== "OK") {
        throw new Error(response.data.comment || "Failed to fetch Codeforces data");
      }

      const submissions = response.data.result;
      const solvedMap = new Map<string, ExternalProblem>();

      for (const sub of submissions) {
        if (sub.verdict === "OK" && sub.problem) {
          const prob = sub.problem;
          const externalId = `CF-${prob.contestId || "0"}${prob.index}`;

          if (!solvedMap.has(externalId)) {
            let difficulty: "easy" | "medium" | "hard" = "medium";
            if (prob.rating) {
              if (prob.rating < 1200) difficulty = "easy";
              else if (prob.rating >= 1600) difficulty = "hard";
              else difficulty = "medium";
            }

            const topicSlugs = (prob.tags || [])
              .map((t: string) => normalizeTag(t))
              .filter((s: string | null): s is string => Boolean(s));

            solvedMap.set(externalId, {
              externalId,
              title: prob.name || `Problem ${prob.index}`,
              difficulty,
              link: prob.contestId
                ? `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`
                : undefined,
              topicSlugs: topicSlugs.length ? topicSlugs : ["arrays-hashing"],
              solvedAt: new Date(sub.creationTimeSeconds * 1000),
            });
          }
        }
      }

      return Array.from(solvedMap.values());
    } catch (error: any) {
      console.error(`Codeforces sync error for handle ${handle}:`, error.message);
      throw new Error(`Codeforces sync failed: ${error.message}`);
    }
  }

  /**
   * Syncs solved problems from LeetCode using tagProblemCounts (per-user cumulative tag stats).
   * This gives accurate "You Solved X for topic Y" counts rather than just the last 20 submissions,
   * which fixes the bug where all users appeared to have the same (or similarly low) solved counts.
   *
   * Strategy:
   * 1. Query `tagProblemCounts` — returns actual total problems solved per LeetCode tag for that user.
   * 2. Map each LeetCode tag → canonical topic slug.
   * 3. Return synthetic ExternalProblem entries (up to MAX_PER_TAG per canonical topic) so that
   *    calculateWeakTopics counting `.length` reflects the real solved count reasonably well.
   *    externalIds use the format `LC-SKILL-{canonicalSlug}-{n}` so they are stable across syncs.
   */
  static async syncLeetCode(handle: string): Promise<ExternalProblem[]> {
    // Maximum synthetic problem entries to store per canonical topic (keeps DB rows bounded)
    const MAX_PER_TAG = 50;

    try {
      const response = await axios.post(
        "https://leetcode.com/graphql",
        {
          query: `
            query lcSkillStats($username: String!) {
              matchedUser(username: $username) {
                tagProblemCounts {
                  advanced  { tagName tagSlug problemsSolved }
                  intermediate { tagName tagSlug problemsSolved }
                  fundamental  { tagName tagSlug problemsSolved }
                }
              }
            }
          `,
          variables: { username: handle },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            Referer: "https://leetcode.com",
          },
          timeout: 12000,
        }
      );

      if (response.data?.errors) {
        const msg = response.data.errors[0]?.message || "LeetCode GraphQL error";
        throw new Error(msg);
      }

      const tagCounts = response.data?.data?.matchedUser?.tagProblemCounts;
      if (!tagCounts) {
        throw new Error(`LeetCode user '${handle}' not found or has no tag data`);
      }

      const allTags: Array<{ tagName: string; tagSlug: string; problemsSolved: number }> = [
        ...(tagCounts.advanced || []),
        ...(tagCounts.intermediate || []),
        ...(tagCounts.fundamental || []),
      ];

      // Aggregate solved counts per canonical topic slug (a user may have multiple LC tags
      // mapping to the same canonical topic, e.g. "tree" + "binary-tree" both → "trees")
      const canonicalCounts = new Map<string, number>();
      for (const tag of allTags) {
        if (!tag.problemsSolved || tag.problemsSolved <= 0) continue;
        const canonical =
          normalizeTag(tag.tagSlug) || normalizeTag(tag.tagName.toLowerCase());
        if (!canonical) continue;
        canonicalCounts.set(
          canonical,
          (canonicalCounts.get(canonical) || 0) + tag.problemsSolved
        );
      }

      // Build synthetic ExternalProblem list
      // Each canonical topic gets min(actualCount, MAX_PER_TAG) entries so that
      // the DB record count approximates the real solved count for gap scoring.
      const problems: ExternalProblem[] = [];
      const now = new Date();

      for (const [canonicalSlug, count] of canonicalCounts.entries()) {
        const cappedCount = Math.min(count, MAX_PER_TAG);
        for (let i = 0; i < cappedCount; i++) {
          problems.push({
            externalId: `LC-SKILL-${canonicalSlug}-${i}`,
            title: `LeetCode [${canonicalSlug}] #${i + 1}`,
            difficulty: "medium",
            link: `https://leetcode.com/tag/${canonicalSlug}/`,
            topicSlugs: [canonicalSlug],
            solvedAt: now,
          });
        }
      }

      return problems;
    } catch (error: any) {
      console.warn(`LeetCode sync failed for ${handle}: ${error.message}`);
      return [];
    }
  }

  /**
   * Computes weak topics for a student with respect to a target company.
   * Algorithm as described in the plan:
   * Rank topics by how often they appear in that company's tracked questions,
   * subtract the share the student has already solved, and the largest gaps are the weak topics.
   */
  static async calculateWeakTopics(userId: string, companyId?: string) {
    // 1. Get all canonical topics
    const allTopics = await prisma.topic.findMany();

    // 2. Count question frequencies for the company (or globally if no company specified)
    const questionWhere = companyId
      ? { round: { companyId } }
      : {};

    const companyQuestions = await prisma.question.findMany({
      where: questionWhere,
      select: { topicId: true },
    });

    const totalCompanyQuestions = Math.max(companyQuestions.length, 1);
    const companyTopicCounts: Record<string, number> = {};
    for (const q of companyQuestions) {
      companyTopicCounts[q.topicId] = (companyTopicCounts[q.topicId] || 0) + 1;
    }

    // 3. Count solved problems by this user per topic
    const studentProfiles = await prisma.codingProfile.findMany({
      where: { userId },
      include: {
        solvedProblems: {
          include: { topics: true },
        },
      },
    });

    const studentTopicCounts: Record<string, number> = {};

    for (const profile of studentProfiles) {
      for (const prob of profile.solvedProblems) {
        for (const topic of (prob.topics || []) as Array<{ id: string }>) {
          studentTopicCounts[topic.id] = (studentTopicCounts[topic.id] || 0) + 1;
        }
      }
    }

    // 4. Calculate Gap Score for each topic
    const rankedTopics: RankedTopic[] = allTopics.map((topic: { id: string; name: string }) => {
      const companyCount = companyTopicCounts[topic.id] || 0;
      const studentCount = studentTopicCounts[topic.id] || 0;

      // Frequency in interview rounds (normalized percentage)
      const companyWeight = (companyCount / totalCompanyQuestions) * 100;

      // Student competency factor (normalized percentage of solved problems or threshold)
      const studentCompetency = Math.min((studentCount / 5) * 100, 100);

      // Gap = High appearance in company, low student solved count
      const gapScore = Math.max(0, Math.round(companyWeight * 1.5 - studentCompetency * 0.8));

      let recommendationNote = "Adequate coverage";
      if (companyCount > 0 && studentCount === 0) {
        recommendationNote = `Frequently asked in rounds (${companyCount} questions), but 0 solved by you`;
      } else if (gapScore > 30) {
        recommendationNote = `High question weight (${companyCount}) with low practice count (${studentCount})`;
      } else if (studentCount > 0) {
        recommendationNote = `Solved ${studentCount} problems; strengthen with advanced patterns`;
      }

      return {
        topicId: topic.id,
        topicName: topic.name,
        companyFrequency: companyCount,
        studentSolvedCount: studentCount,
        gapScore,
        recommendationNote,
      };
    });

    // Sort descending by gapScore
    rankedTopics.sort((a: RankedTopic, b: RankedTopic) => b.gapScore - a.gapScore || b.companyFrequency - a.companyFrequency);

    return rankedTopics;
  }
}
