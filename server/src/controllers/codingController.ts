import { Response } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth";
import { JudgeClient } from "../services/judgeClient";

export class CodingController {
  static async getProfiles(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const profiles = await prisma.codingProfile.findMany({
        where: { userId: req.user.id },
        include: {
          _count: {
            select: { solvedProblems: true },
          },
        },
      });

      return res.json({ profiles });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async syncProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { platform, handle } = req.body;
      const userId = req.user.id;

      // Upsert profile
      const profile = await prisma.codingProfile.upsert({
        where: {
          userId_platform: {
            userId,
            platform,
          },
        },
        update: {
          handle,
          lastSyncedAt: new Date(),
        },
        create: {
          userId,
          platform,
          handle,
          lastSyncedAt: new Date(),
        },
      });

      // Fetch external problems
      let externalProblems: any[] = [];
      if (platform === "codeforces") {
        externalProblems = await JudgeClient.syncCodeforces(handle);
      } else if (platform === "leetcode") {
        // Delete ALL old LC solved-problem records for this profile before re-syncing.
        // This ensures a user who changes their handle (or re-syncs) always sees
        // accurate counts for the current handle instead of accumulating stale rows.
        await prisma.solvedProblem.deleteMany({
          where: {
            codingProfileId: profile.id,
            externalId: { startsWith: "LC-" },
          },
        });
        externalProblems = await JudgeClient.syncLeetCode(handle);
      }

      // Insert problems and connect to canonical topics.
      // Since we deleted all LC-* rows above before this point, we only create (no upsert needed
      // for LC). For Codeforces we still upsert to avoid duplicates across syncs.
      let addedCount = 0;
      for (const prob of externalProblems) {
        // Find corresponding topics by slug
        const matchingTopics = await prisma.topic.findMany({
          where: { slug: { in: prob.topicSlugs } },
        });

        const existing = await prisma.solvedProblem.findUnique({
          where: {
            codingProfileId_externalId: {
              codingProfileId: profile.id,
              externalId: prob.externalId,
            },
          },
        });

        if (existing) {
          // Update stale entry (Codeforces re-sync path)
          await prisma.solvedProblem.update({
            where: { id: existing.id },
            data: {
              title: prob.title,
              difficulty: prob.difficulty,
              link: prob.link,
              solvedAt: prob.solvedAt,
              topics: { set: matchingTopics.map((t) => ({ id: t.id })) },
            },
          });
        } else {
          // New entry
          await prisma.solvedProblem.create({
            data: {
              codingProfileId: profile.id,
              externalId: prob.externalId,
              title: prob.title,
              difficulty: prob.difficulty,
              link: prob.link,
              solvedAt: prob.solvedAt,
              topics: {
                connect: matchingTopics.map((t) => ({ id: t.id })),
              },
            },
          });
          addedCount++;
        }
      }

      return res.json({
        message: `Successfully synced ${addedCount} problems for ${platform} (${handle})`,
        profile,
        count: addedCount,
      });
    } catch (error: any) {
      console.error("Sync profile error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async addManualProblem(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { platform, title, difficulty, link, topicIds } = req.body;
      const userId = req.user.id;

      // Find or create profile
      const profile = await prisma.codingProfile.upsert({
        where: {
          userId_platform: {
            userId,
            platform,
          },
        },
        update: { lastSyncedAt: new Date() },
        create: {
          userId,
          platform,
          handle: "manual-entry",
          lastSyncedAt: new Date(),
        },
      });

      const externalId = `MANUAL-${Date.now()}`;
      const problem = await prisma.solvedProblem.create({
        data: {
          codingProfileId: profile.id,
          externalId,
          title,
          difficulty,
          link,
          topics: {
            connect: (topicIds || []).map((id: string) => ({ id })),
          },
        },
        include: { topics: true },
      });

      return res.status(201).json({ problem });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getWeakTopics(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { companyId } = req.query;
      const weakTopics = await JudgeClient.calculateWeakTopics(
        req.user.id,
        companyId ? String(companyId) : undefined
      );

      return res.json({ weakTopics });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
