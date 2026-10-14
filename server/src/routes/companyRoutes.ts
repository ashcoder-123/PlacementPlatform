import { Router } from "express";
import { CompanyController } from "../controllers/companyController";
import { authenticateJWT, requireRole } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { CreateQuestionSchema, VoteQuestionSchema, CreateCompanySchema } from "@placement/shared";

const router = Router();

router.get("/companies", CompanyController.listCompanies);
router.get("/companies/:id", CompanyController.getCompanyDetails);

// Admin-only company creation
router.post(
  "/companies",
  authenticateJWT,
  requireRole("admin"),
  validateBody(CreateCompanySchema),
  CompanyController.createCompany
);

router.get("/questions", CompanyController.listQuestions);

// Student submitted question
router.post(
  "/questions",
  authenticateJWT,
  validateBody(CreateQuestionSchema),
  CompanyController.createQuestion
);

// Upvote / matched interview vote
router.post(
  "/questions/:id/vote",
  authenticateJWT,
  validateBody(VoteQuestionSchema),
  CompanyController.voteQuestion
);

// Admin-only verification guard
router.patch(
  "/questions/:id/verify",
  authenticateJWT,
  requireRole("admin"),
  CompanyController.verifyQuestion
);

export default router;
