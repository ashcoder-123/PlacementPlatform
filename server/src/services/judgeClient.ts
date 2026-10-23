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
  static async syncCodeforces(handle: string, profileId: string): Promise<ExternalProblem[]> {
    const cleanHandle = handle.trim();
    try {
      const response = await axios.get(
        `https://codeforces.com/api/user.status?handle=${encodeURIComponent(cleanHandle)}&from=1&count=1000`,
        { timeout: 15000 }
      );

      if (response.data.status !== "OK") {
        throw new Error(response.data.comment || "Failed to fetch Codeforces data");
      }

      // Delete any CF rows that belong to a DIFFERENT handle on this profile slot.
      // This happens when a user changes their Codeforces username after a previous sync.
      await prisma.solvedProblem.deleteMany({
        where: {
          codingProfileId: profileId,
          externalId: {
            startsWith: "CF-",
            // Keep only rows whose handle prefix matches the current handle
            NOT: { startsWith: `CF-${cleanHandle.toLowerCase()}-` },
          },
        },
      });

      const submissions = response.data.result;
      const solvedMap = new Map<string, ExternalProblem>();

      for (const sub of submissions) {
        if (sub.verdict === "OK" && sub.problem) {
          const prob = sub.problem;
          const externalId = `CF-${cleanHandle.toLowerCase()}-${prob.contestId || "0"}${prob.index}`;

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
      console.error(`Codeforces sync error for handle ${cleanHandle}:`, error.message);
      throw new Error(`Codeforces error: ${error.response?.data?.comment || error.message}`);
    }
  }

  /**
   * Syncs solved problems from LeetCode using GraphQL tagProblemCounts and submitStatsGlobal fallback.
   */
  static async syncLeetCode(handle: string): Promise<ExternalProblem[]> {
    const cleanHandle = handle.trim();
    const MAX_PER_TAG = 500;

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
                submitStats: submitStatsGlobal {
                  acSubmissionNum {
                    difficulty
                    count
                  }
                }
              }
              recentSubmissionList(username: $username) {
                title
                titleSlug
                statusDisplay
              }
            }
          `,
          variables: { username: cleanHandle },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Referer: "https://leetcode.com",
          },
          timeout: 15000,
        }
      );

      if (response.data?.errors) {
        const msg = response.data.errors[0]?.message || "LeetCode GraphQL error";
        throw new Error(msg);
      }

      const matchedUser = response.data?.data?.matchedUser;
      if (!matchedUser) {
        throw new Error(`LeetCode account '${cleanHandle}' not found. Please verify username.`);
      }

      const tagCounts = matchedUser.tagProblemCounts;
      const allTags: Array<{ tagName: string; tagSlug: string; problemsSolved: number }> = [
        ...(tagCounts?.advanced || []),
        ...(tagCounts?.intermediate || []),
        ...(tagCounts?.fundamental || []),
      ];

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

      // If no tag counts were returned, use submitStatsGlobal total count distributed across core topics
      const acSubmissionNum = matchedUser.submitStats?.acSubmissionNum || [];
      const totalAc = acSubmissionNum.find((s: any) => s.difficulty === "All")?.count || 0;

      if (canonicalCounts.size === 0 && totalAc > 0) {
        const defaultTopics = [
          "arrays-hashing",
          "two-pointers",
          "trees",
          "dynamic-programming",
          "graphs",
          "binary-search",
          "strings",
          "linked-lists",
        ];
        const perTopic = Math.max(1, Math.floor(totalAc / defaultTopics.length));
        let remaining = totalAc;
        for (const slug of defaultTopics) {
          const allocation = Math.min(perTopic, remaining);
          if (allocation > 0) {
            canonicalCounts.set(slug, allocation);
            remaining -= allocation;
          }
        }
        if (remaining > 0 && canonicalCounts.has("arrays-hashing")) {
          canonicalCounts.set("arrays-hashing", (canonicalCounts.get("arrays-hashing") || 0) + remaining);
        }
      }

      const problems: ExternalProblem[] = [];
      const now = new Date();

      for (const [canonicalSlug, count] of canonicalCounts.entries()) {
        const cappedCount = Math.min(count, MAX_PER_TAG);
        for (let i = 0; i < cappedCount; i++) {
          problems.push({
            externalId: `LC-${cleanHandle.toLowerCase()}-${canonicalSlug}-${i}`,
            title: `LeetCode (${cleanHandle}) [${canonicalSlug}] #${i + 1}`,
            difficulty: i % 3 === 0 ? "hard" : i % 2 === 0 ? "medium" : "easy",
            link: `https://leetcode.com/tag/${canonicalSlug}/`,
            topicSlugs: [canonicalSlug],
            solvedAt: now,
          });
        }
      }

      return problems;
    } catch (error: any) {
      console.warn(`LeetCode sync failed for ${cleanHandle}:`, error.message);
      throw new Error(`LeetCode error: ${error.message || "Failed to reach LeetCode API"}`);
    }
  }

  /**
   * Computes weak topics for a student with respect to a target company.
   */
  static async calculateWeakTopics(userId: string, companyId?: string) {
    const allTopics = await prisma.topic.findMany();

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

    const rankedTopics: RankedTopic[] = allTopics.map((topic: { id: string; name: string }) => {
      const companyCount = companyTopicCounts[topic.id] || 0;
      const studentCount = studentTopicCounts[topic.id] || 0;

      const companyWeight = (companyCount / totalCompanyQuestions) * 100;
      // Proportional benchmark: scaled against expected campus interview prep targets
      const targetThreshold = Math.max(companyCount * 3, 20);
      const studentCompetency = Math.min((studentCount / targetThreshold) * 100, 100);
      const gapScore = Math.max(0, Math.round(companyWeight * 1.5 - studentCompetency * 0.7));

      let recommendationNote = "Adequate coverage";
      if (companyCount > 0 && studentCount === 0) {
        recommendationNote = `Frequently asked in rounds (${companyCount} questions), but 0 solved by you`;
      } else if (gapScore > 30) {
        recommendationNote = `High question weight (${companyCount}) with low practice count (${studentCount})`;
      } else if (studentCount > 0) {
        recommendationNote = `Solved ${studentCount} problems; reinforce with advanced patterns`;
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

    rankedTopics.sort((a: RankedTopic, b: RankedTopic) => b.gapScore - a.gapScore || b.companyFrequency - a.companyFrequency);

    return rankedTopics;
  }
}

