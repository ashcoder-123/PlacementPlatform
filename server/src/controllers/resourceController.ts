import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth";
import { JudgeClient } from "../services/judgeClient";

export class ResourceController {
  static async listResources(req: AuthRequest, res: Response) {
    try {
      const { type, difficulty, topicId, search } = req.query;
      const isAdmin = req.user?.role === "admin";

      const where: any = {};

      // Non-admins only see verified resources.
      // Admins see everything (so they can moderate pending ones).
      if (!isAdmin) {
        where.verified = true;
      }

      if (type) where.type = String(type);
      if (difficulty) where.difficulty = String(difficulty);
      if (topicId) {
        where.topics = { some: { id: String(topicId) } };
      }
      if (search) {
        where.title = { contains: String(search), mode: "insensitive" };
      }

      const resources = await prisma.resource.findMany({
        where,
        include: {
          topics: true,
          addedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ verified: "asc" }, { createdAt: "desc" }], // pending first for admin
      });

      return res.json({ resources });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getRecommendations(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { companyId } = req.query;

      // 1. Get student's top 3 weak topics
      const rankedWeakTopics = await JudgeClient.calculateWeakTopics(
        req.user.id,
        companyId ? String(companyId) : undefined
      );

      const topThreeTopicIds = rankedWeakTopics.slice(0, 3).map((t) => t.topicId);

      // 2. Query VERIFIED resources tagged with these top 3 topics
      const recommended = await prisma.resource.findMany({
        where: {
          verified: true,
          topics: {
            some: { id: { in: topThreeTopicIds } },
          },
        },
        include: { topics: true },
        take: 10,
      });

      return res.json({
        topWeakTopics: rankedWeakTopics.slice(0, 3),
        recommended,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createResource(req: AuthRequest, res: Response) {
    try {
      const { title, url, type, difficulty, topicIds } = req.body;
      const isAdmin = req.user?.role === "admin";

      const resource = await prisma.resource.create({
        data: {
          title,
          url,
          type,
          difficulty: difficulty || "medium",
          // Admin-added resources are auto-verified; student submissions are pending
          verified: isAdmin,
          addedById: req.user?.id || null,
          topics: {
            connect: (topicIds || []).map((id: string) => ({ id })),
          },
        },
        include: { topics: true },
      });

      return res.status(201).json({
        resource,
        message: isAdmin
          ? "Resource published successfully."
          : "Resource submitted for admin review. It will be visible once approved.",
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Admin-only: approve or reject a pending resource
  static async verifyResource(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { verified } = req.body;

      const resource = await prisma.resource.update({
        where: { id },
        data: { verified: Boolean(verified ?? true) },
        include: { topics: true, addedBy: { select: { id: true, name: true } } },
      });

      return res.json({
        resource,
        message: verified ? "Resource approved and now public." : "Resource rejected and hidden.",
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
