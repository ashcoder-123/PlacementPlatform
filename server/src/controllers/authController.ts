import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client";
import { RegisterRequest, LoginRequest } from "@placement/shared";
import { AuthRequest } from "../middlewares/auth";

const JWT_SECRET = process.env.JWT_SECRET || "placement_super_secret_jwt_key_2026";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password, branch, graduationYear } = req.body as RegisterRequest;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "student",
          branch,
          graduationYear,
        },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branch: user.branch,
          graduationYear: user.graduationYear,
        },
      });
    } catch (error: any) {
      console.error("Register error:", error);
      return res.status(500).json({ error: error.message || "Registration failed" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as LoginRequest;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branch: user.branch,
          graduationYear: user.graduationYear,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ error: error.message || "Login failed" });
    }
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          branch: true,
          graduationYear: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ user });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
