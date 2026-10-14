import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth";

export class CompanyController {
  static async listCompanies(req: Request, res: Response) {
    try {
      const companies = await prisma.company.findMany({
        include: {
          rounds: {
            orderBy: { order: "asc" },
            include: {
              _count: {
                select: { questions: true },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });

      const formatted = companies.map((c) => ({
        id: c.id,
        name: c.name,
        sector: c.sector,
        description: c.description,
        rolesHiredFor: c.rolesHiredFor.split(",").map((r) => r.trim()),
        rounds: c.rounds.map((r) => ({
          id: r.id,
          type: r.type,
          order: r.order,
          description: r.description,
          questionCount: r._count.questions,
        })),
      }));

      return res.json({ companies: formatted });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getCompanyDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          rounds: {
            orderBy: { order: "asc" },
            include: {
              questions: {
                include: {
                  topic: true,
                  submittedBy: {
                    select: { id: true, name: true },
                  },
                },
                orderBy: [
                  { verified: "desc" },
                  { upvoteCount: "desc" },
                  { createdAt: "desc" },
                ],
              },
            },
          },
        },
      });

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      return res.json({
        company: {
          ...company,
          rolesHiredFor: company.rolesHiredFor.split(",").map((r) => r.trim()),
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listQuestions(req: AuthRequest, res: Response) {
    try {
      const { companyId, roundType, topicId, difficulty, search } = req.query;

      const where: any = {};

      if (roundType) {
        where.round = { ...(where.round || {}), type: String(roundType) };
      }
      if (companyId) {
        where.round = { ...(where.round || {}), companyId: String(companyId) };
      }
      if (topicId) {
        where.topicId = String(topicId);
      }
      if (difficulty) {
        where.difficulty = String(difficulty);
      }
      if (search) {
        where.text = { contains: String(search), mode: "insensitive" };
      }

      const questions = await prisma.question.findMany({
        where,
        include: {
          topic: true,
          round: {
            include: {
              company: true,
            },
          },
          submittedBy: {
            select: { id: true, name: true },
          },
          votes: req.user ? { where: { userId: req.user.id } } : false,
        },
        orderBy: [
          { verified: "desc" },
          { upvoteCount: "desc" },
          { createdAt: "desc" },
        ],
      });

      const formatted = questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        difficulty: q.difficulty,
        source: q.source,
        verified: q.verified,
        upvoteCount: q.upvoteCount,
        matchCount: q.matchCount,
        createdAt: q.createdAt.toISOString(),
        topic: {
          id: q.topic.id,
          name: q.topic.name,
        },
        round: {
          id: q.round.id,
          type: q.round.type,
          order: q.round.order,
          company: {
            id: q.round.company.id,
            name: q.round.company.name,
          },
        },
        submittedBy: q.submittedBy,
        userVote: req.user && q.votes?.length ? q.votes[0].kind : null,
      }));

      return res.json({ questions: formatted });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createQuestion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { roundId, topicId, text, difficulty, source } = req.body;

      const question = await prisma.question.create({
        data: {
          roundId,
          topicId,
          text,
          difficulty: difficulty || "medium",
          source: source || "Student Interview Experience",
          verified: req.user.role === "admin", // Admin submissions automatically verified
          submittedById: req.user.id,
        },
        include: {
          topic: true,
          round: {
            include: { company: true },
          },
        },
      });

      return res.status(201).json({ question });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async voteQuestion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const { kind } = req.body; // "upvote" or "matched"
      const userId = req.user.id;

      const existingVote = await prisma.questionVote.findUnique({
        where: {
          userId_questionId: {
            userId,
            questionId: id,
          },
        },
      });

      if (existingVote) {
        if (existingVote.kind === kind) {
          // Toggle off
          await prisma.questionVote.delete({ where: { id: existingVote.id } });
          const decrementField = kind === "upvote" ? { upvoteCount: { decrement: 1 } } : { matchCount: { decrement: 1 } };
          await prisma.question.update({
            where: { id },
            data: decrementField,
          });
          return res.json({ action: "removed", vote: null });
        } else {
          // Change kind
          await prisma.questionVote.update({
            where: { id: existingVote.id },
            data: { kind },
          });
          if (kind === "upvote") {
            await prisma.question.update({
              where: { id },
              data: { upvoteCount: { increment: 1 }, matchCount: { decrement: 1 } },
            });
          } else {
            await prisma.question.update({
              where: { id },
              data: { matchCount: { increment: 1 }, upvoteCount: { decrement: 1 } },
            });
          }
          return res.json({ action: "updated", kind });
        }
      } else {
        // Create new vote
        await prisma.questionVote.create({
          data: {
            userId,
            questionId: id,
            kind,
          },
        });
        const incrementField = kind === "upvote" ? { upvoteCount: { increment: 1 } } : { matchCount: { increment: 1 } };
        await prisma.question.update({
          where: { id },
          data: incrementField,
        });
        return res.json({ action: "added", kind });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async verifyQuestion(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { verified } = req.body;

      const question = await prisma.question.update({
        where: { id },
        data: { verified: Boolean(verified ?? true) },
      });

      return res.json({ question });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createCompany(req: AuthRequest, res: Response) {
    try {
      const { name, sector, description, rolesHiredFor, rounds } = req.body;

      const existing = await prisma.company.findUnique({ where: { name } });
      if (existing) {
        return res.status(400).json({ error: `Company with name '${name}' already exists` });
      }

      const rolesString = Array.isArray(rolesHiredFor)
        ? rolesHiredFor.join(", ")
        : String(rolesHiredFor);

      const defaultRounds = [
        { type: "online_test", order: 1, description: "Online Assessment (Coding & Aptitude)" },
        { type: "technical", order: 2, description: "Technical Interview Round 1" },
        { type: "hr", order: 3, description: "HR / Managerial Round" },
      ];

      const roundsToCreate = rounds && rounds.length > 0 ? rounds : defaultRounds;

      const company = await prisma.company.create({
        data: {
          name,
          sector,
          description: description || null,
          rolesHiredFor: rolesString,
          rounds: {
            create: roundsToCreate.map((r: any, idx: number) => ({
              type: r.type,
              order: r.order || idx + 1,
              description: r.description || `${r.type.replace("_", " ")} Round`,
            })),
          },
        },
        include: {
          rounds: true,
        },
      });

      return res.status(201).json({ company });
    } catch (error: any) {
      console.error("Create company error:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}
