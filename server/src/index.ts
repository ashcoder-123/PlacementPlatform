import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cron from "node-cron";

dotenv.config();

import authRoutes from "./routes/authRoutes";
import companyRoutes from "./routes/companyRoutes";
import resumeRoutes from "./routes/resumeRoutes";
import codingRoutes from "./routes/codingRoutes";
import resourceRoutes from "./routes/resourceRoutes";
import aiRoutes from "./routes/aiRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
const clientOrigin = process.env.CLIENT_URL || "http://localhost:3000";
app.use(
  cors({
    origin: [clientOrigin, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", companyRoutes);
app.use("/api", resumeRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api", resourceRoutes);
app.use("/api/ai", aiRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Placement Preparation Platform API",
  });
});

// Central error handler
app.use(errorHandler);

// Nightly cron job for coding stats refresh (as per plan: 00:00 every night)
cron.schedule("0 0 * * *", () => {
  console.log("[Cron] Running nightly coding-stats refresh job...");
  // In a production setup, iterate through active coding profiles and refresh problems
});

app.listen(PORT, () => {
  console.log(`🚀 Placement Platform Server running on http://localhost:${PORT}`);
});

export default app;
