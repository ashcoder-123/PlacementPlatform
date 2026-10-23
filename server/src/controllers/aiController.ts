import { Response } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth";
import { AIService } from "../services/aiService";
import { JudgeClient } from "../services/judgeClient";

export class AIController {
  /**
   * Health and status check for AI engine (Google Gemini / Grounded Engine status)
   */
  static async getStatus(req: AuthRequest, res: Response) {
    try {
      const status = await AIService.getAIStatus();
      return res.json(status);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * AI Stub endpoint for smoke checks
   */
  static async stub(req: AuthRequest, res: Response) {
    const status = await AIService.getAIStatus();
    return res.json({
      status: "AI service online",
      ...status,
      supportedFeatures: ["resume_review", "company_question_generator"],
    });
  }

  /**
   * Reviews a specific resume version against an optional Job Description
   */
  static async reviewResumeVersion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { resumeVersionId } = req.params;
      const { jobDescription } = req.body;

      const version = await prisma.resumeVersion.findFirst({
        where: {
          id: resumeVersionId,
          resume: { userId: req.user.id },
        },
      });

      if (!version) {
        return res.status(404).json({ error: "Resume version not found" });
      }

      // Check active provider
      const aiStatus = await AIService.getAIStatus();

      // Perform AI review
      const reviewResult = await AIService.reviewResume(version.extractedText, jobDescription);

      const modelUsed = aiStatus.geminiConfigured
        ? `Gemini (${aiStatus.activeModel})`
        : "Local Grounded Engine";

      // Store in database
      const savedReview = await prisma.resumeReview.create({
        data: {
          resumeVersionId: version.id,
          jobDescriptionText: jobDescription || null,
          overallScore: reviewResult.overallScore,
          keywordOverlapScore: reviewResult.keywordOverlapScore,
          sectionScores: JSON.stringify(reviewResult.sectionScores),
          suggestions: JSON.stringify(reviewResult.suggestions),
          missingKeywords: JSON.stringify(reviewResult.missingKeywords),
          summary: reviewResult.summary,
          modelUsed,
        },
      });

      return res.status(201).json({
        review: {
          ...reviewResult,
          id: savedReview.id,
          resumeVersionId: version.id,
          modelUsed: savedReview.modelUsed,
          createdAt: savedReview.createdAt.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("AI Resume Review error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Generates grounded interview questions tailored for a company and user's weak topics
   */
  static async generateQuestions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { companyId, targetRole, includeWeakTopics, count } = req.body;

      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Fetch company verified questions
      const verifiedQuestions = await prisma.question.findMany({
        where: {
          round: { companyId },
          verified: true,
        },
        include: { topic: true, round: true },
        take: 15,
      });

      // Calculate student weak topics if requested
      let weakTopics: Array<{ topicName: string; gapScore: number }> = [];
      if (includeWeakTopics) {
        const stats = await JudgeClient.calculateWeakTopics(req.user.id, companyId);
        weakTopics = stats.map((s) => ({ topicName: s.topicName, gapScore: s.gapScore }));
      }

      const generatedSet = await AIService.generateQuestions({
        companyName: company.name,
        targetRole: targetRole || "Software Development Engineer",
        verifiedQuestions: verifiedQuestions.map((q) => ({
          text: q.text,
          difficulty: q.difficulty,
          topicName: q.topic.name,
          roundType: q.round.type,
        })),
        weakTopics,
        count: count || 4,
      });

      // Save generated question set in database
      const savedSet = await prisma.generatedQuestionSet.create({
        data: {
          userId: req.user.id,
          companyId: company.id,
          targetRole: targetRole || "Software Development Engineer",
          questions: JSON.stringify(generatedSet.questions),
        },
      });

      return res.status(201).json({
        id: savedSet.id,
        ...generatedSet,
      });
    } catch (error: any) {
      console.error("AI Question Generator error:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}
