import { Router } from "express";
import { ResourceController } from "../controllers/resourceController";
import { authenticateJWT, optionalAuthenticateJWT, requireRole } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { CreateResourceSchema } from "@placement/shared";

const router = Router();

// Public + admin: listResources filters by verified for non-admins, while admins see pending too
router.get("/resources", optionalAuthenticateJWT, ResourceController.listResources);
router.get("/resources/recommendations", authenticateJWT, ResourceController.getRecommendations);

// Any logged-in user can submit a resource (goes pending for students)
router.post(
  "/resources",
  authenticateJWT,
  validateBody(CreateResourceSchema),
  ResourceController.createResource
);

// Admin-only: approve or reject a pending resource
router.patch(
  "/resources/:id/verify",
  authenticateJWT,
  requireRole("admin"),
  ResourceController.verifyResource
);

export default router;
