import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { validateBody } from "../middlewares/validate";
import { RegisterRequestSchema, LoginRequestSchema } from "@placement/shared";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

router.post("/register", validateBody(RegisterRequestSchema), AuthController.register);
router.post("/login", validateBody(LoginRequestSchema), AuthController.login);
router.get("/me", authenticateJWT, AuthController.getMe);

export default router;
