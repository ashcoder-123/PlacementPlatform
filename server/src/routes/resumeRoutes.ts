import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ResumeController } from "../controllers/resumeController";
import { authenticateJWT } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { CreateResumeSchema } from "@placement/shared";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB capped as specified
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are permitted"));
    }
  },
});

const router = Router();

router.get("/resumes", authenticateJWT, ResumeController.listResumes);
router.post(
  "/resumes",
  authenticateJWT,
  validateBody(CreateResumeSchema),
  ResumeController.createResume
);
router.post(
  "/resumes/:resumeId/versions",
  authenticateJWT,
  upload.single("file"),
  ResumeController.uploadVersion
);
router.delete("/resumes/versions/:versionId", authenticateJWT, ResumeController.deleteVersion);

export default router;
