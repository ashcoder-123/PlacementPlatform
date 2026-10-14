import { Router } from "express";
import { CodingController } from "../controllers/codingController";
import { authenticateJWT } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { SyncProfileSchema, ManualProblemEntrySchema } from "@placement/shared";

const router = Router();

router.get("/profiles", authenticateJWT, CodingController.getProfiles);
router.post(
  "/profiles/sync",
  authenticateJWT,
  validateBody(SyncProfileSchema),
  CodingController.syncProfile
);
router.post(
  "/problems/manual",
  authenticateJWT,
  validateBody(ManualProblemEntrySchema),
  CodingController.addManualProblem
);
router.get("/weak-topics", authenticateJWT, CodingController.getWeakTopics);

export default router;
