import { Router } from "express";
import { AIController } from "../controllers/aiController";
import { authenticateJWT } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { GenerateQuestionsRequestSchema } from "@placement/shared";

const router = Router();

// AI Engine Status (Google Gemini / Grounded connectivity)
router.get("/status", AIController.getStatus);

// Stub endpoint for health check
router.get("/stub", AIController.stub);

// AI Resume Review
router.post(
  "/resume-review/:resumeVersionId",
  authenticateJWT,
  AIController.reviewResumeVersion
);

// AI Question Generator
router.post(
  "/generate-questions",
  authenticateJWT,
  validateBody(GenerateQuestionsRequestSchema),
  AIController.generateQuestions
);

export default router;
