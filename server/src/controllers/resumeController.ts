import { Response } from "express";
import pdfParse from "pdf-parse";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth";

export class ResumeController {
  static async listResumes(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const resumes = await prisma.resume.findMany({
        where: { userId: req.user.id },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            include: {
              reviews: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return res.json({ resumes });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createResume(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { title, targetRole } = req.body;
      const resume = await prisma.resume.create({
        data: {
          userId: req.user.id,
          title,
          targetRole,
        },
      });

      return res.status(201).json({ resume });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async uploadVersion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { resumeId } = req.params;
      const file = req.file;
      let extractedText = req.body.pastedText || "";

      // Verify ownership
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId: req.user.id },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      });

      if (!resume) {
        return res.status(404).json({ error: "Resume profile not found" });
      }

      let fileUrl = "";
      if (file) {
        fileUrl = `/uploads/${file.filename}`;
        try {
          const pdfData = await pdfParse(file.buffer || (file as any).path);
          if (pdfData.text && pdfData.text.trim().length > 20) {
            extractedText = pdfData.text.trim();
          }
        } catch (pdfErr: any) {
          console.warn("pdf-parse notice:", pdfErr.message);
          // If PDF parsing fails on scanned docs, fall back to pastedText if provided
        }
      }

      if (!extractedText || extractedText.trim().length < 10) {
        return res.status(400).json({
          error: "Could not extract text from document. Please use the Paste Text fallback tab for scanned resumes.",
        });
      }

      const nextVersionNumber = (resume.versions[0]?.versionNumber || 0) + 1;

      const newVersion = await prisma.resumeVersion.create({
        data: {
          resumeId: resume.id,
          versionNumber: nextVersionNumber,
          fileUrl: fileUrl || undefined,
          extractedText,
        },
      });

      await prisma.resume.update({
        where: { id: resume.id },
        data: { updatedAt: new Date() },
      });

      return res.status(201).json({ version: newVersion });
    } catch (error: any) {
      console.error("Resume upload error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteVersion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { versionId } = req.params;
      const version = await prisma.resumeVersion.findFirst({
        where: {
          id: versionId,
          resume: { userId: req.user.id },
        },
      });

      if (!version) {
        return res.status(404).json({ error: "Resume version not found" });
      }

      await prisma.resumeVersion.delete({ where: { id: versionId } });
      return res.json({ message: "Version deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
