import { z } from "zod";

// ==========================================
// User & Auth Schemas & Types
// ==========================================
export const UserRoleSchema = z.enum(["student", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const RegisterRequestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  branch: z.string().optional().default("Computer Science"),
  graduationYear: z.number().int().min(2020).max(2035).optional().default(2026),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch?: string;
  graduationYear?: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// ==========================================
// Topic Schemas & Types
// ==========================================
export interface Topic {
  id: string;
  name: string;
  slug: string;
  category?: string;
  parentTopicId?: string | null;
}

// ==========================================
// Company & Questions Schemas & Types
// ==========================================
export const RoundTypeSchema = z.enum(["online_test", "technical", "hr"]);
export type RoundType = z.infer<typeof RoundTypeSchema>;

export const DifficultySchema = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const CreateRoundSchema = z.object({
  type: RoundTypeSchema,
  order: z.number().int().min(1).default(1),
  description: z.string().optional(),
});

export const CreateCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  sector: z.string().min(2, "Sector is required"),
  description: z.string().optional(),
  rolesHiredFor: z.union([z.array(z.string()), z.string()]),
  rounds: z.array(CreateRoundSchema).optional(),
});
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;

export const CreateQuestionSchema = z.object({
  roundId: z.string().uuid("Valid round ID required"),
  topicId: z.string().uuid("Valid topic ID required"),
  text: z.string().min(10, "Question text must be at least 10 characters"),
  difficulty: DifficultySchema.default("medium"),
  source: z.string().optional().default("Student Submission"),
});
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

export const VoteQuestionSchema = z.object({
  kind: z.enum(["upvote", "matched"]),
});
export type VoteQuestionInput = z.infer<typeof VoteQuestionSchema>;

export interface QuestionItem {
  id: string;
  text: string;
  difficulty: Difficulty;
  source?: string;
  verified: boolean;
  upvoteCount: number;
  matchCount: number;
  createdAt: string;
  topic: {
    id: string;
    name: string;
  };
  round: {
    id: string;
    type: RoundType;
    order: number;
    company: {
      id: string;
      name: string;
    };
  };
  submittedBy?: {
    id: string;
    name: string;
  };
  userVote?: "upvote" | "matched" | null;
}

export interface CompanyWithRounds {
  id: string;
  name: string;
  sector: string;
  description?: string;
  rolesHiredFor: string[];
  rounds: {
    id: string;
    type: RoundType;
    order: number;
    description?: string;
    _count?: {
      questions: number;
    };
  }[];
}

// ==========================================
// Resume Management Schemas & Types
// ==========================================
export const CreateResumeSchema = z.object({
  title: z.string().min(2, "Title is required"),
  targetRole: z.string().min(2, "Target role is required"),
});

export const CreateResumeVersionSchema = z.object({
  extractedText: z.string().min(20, "Resume content must have at least 20 characters"),
  fileUrl: z.string().optional(),
});

export interface ResumeVersionSummary {
  id: string;
  versionNumber: number;
  fileUrl?: string | null;
  extractedText: string;
  createdAt: string;
  reviews?: ResumeReviewSummary[];
}

export interface ResumeSummary {
  id: string;
  title: string;
  targetRole: string;
  createdAt: string;
  updatedAt: string;
  versions: ResumeVersionSummary[];
}

// ==========================================
// Coding Tracker Schemas & Types
// ==========================================
export const CodingPlatformSchema = z.enum(["codeforces", "leetcode", "gfg"]);
export type CodingPlatform = z.infer<typeof CodingPlatformSchema>;

export const SyncProfileSchema = z.object({
  platform: CodingPlatformSchema,
  handle: z.string().min(1, "Handle is required"),
});
export type SyncProfileInput = z.infer<typeof SyncProfileSchema>;

export const ManualProblemEntrySchema = z.object({
  platform: CodingPlatformSchema,
  title: z.string().min(2),
  difficulty: DifficultySchema,
  link: z.string().optional(),
  topicIds: z.array(z.string()),
});

export interface WeakTopicStat {
  topicId: string;
  topicName: string;
  companyFrequency: number;
  studentSolvedCount: number;
  gapScore: number; // companyWeight - studentCompetency
  recommendationNote: string;
}

// ==========================================
// Resource Library Schemas & Types
// ==========================================
export const ResourceTypeSchema = z.enum(["video", "article", "course", "sheet"]);
export type ResourceType = z.infer<typeof ResourceTypeSchema>;

export const CreateResourceSchema = z.object({
  title: z.string().min(3),
  url: z.string().url("Valid URL required"),
  type: ResourceTypeSchema,
  difficulty: DifficultySchema.default("medium"),
  topicIds: z.array(z.string().uuid()).min(1, "At least one topic tag required"),
});
export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;

export interface ResourceItem {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  difficulty: Difficulty;
  createdAt: string;
  topics: {
    id: string;
    name: string;
  }[];
  addedBy?: {
    id: string;
    name: string;
  };
}

// ==========================================
// AI Resume Review & Question Generator Schemas
// ==========================================
export const SectionScoreSchema = z.object({
  sectionName: z.string(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
});

export const BulletSuggestionSchema = z.object({
  original: z.string(),
  suggested: z.string(),
  reason: z.string(),
});

export const ResumeReviewOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  keywordOverlapScore: z.number().min(0).max(100),
  sectionScores: z.array(SectionScoreSchema),
  suggestions: z.array(BulletSuggestionSchema),
  missingKeywords: z.array(z.string()),
  summary: z.string(),
});
export type ResumeReviewOutput = z.infer<typeof ResumeReviewOutputSchema>;

export interface ResumeReviewSummary extends ResumeReviewOutput {
  id: string;
  resumeVersionId: string;
  jobDescriptionText?: string | null;
  modelUsed: string;
  createdAt: string;
}

export const GenerateQuestionsRequestSchema = z.object({
  companyId: z.string().uuid(),
  targetRole: z.string().default("Software Development Engineer"),
  includeWeakTopics: z.boolean().default(true),
  count: z.number().int().min(3).max(10).default(5),
});
export type GenerateQuestionsRequest = z.infer<typeof GenerateQuestionsRequestSchema>;

export const GeneratedQuestionItemSchema = z.object({
  roundType: RoundTypeSchema,
  topicName: z.string(),
  questionText: z.string(),
  difficulty: DifficultySchema,
  expectedAnswerApproach: z.string(),
  rationale: z.string(), // Cites why this was chosen for the target company & round
});
export type GeneratedQuestionItem = z.infer<typeof GeneratedQuestionItemSchema>;

export const GeneratedQuestionSetOutputSchema = z.object({
  companyName: z.string(),
  targetRole: z.string(),
  isCompanySpecific: z.boolean(),
  notes: z.string(),
  questions: z.array(GeneratedQuestionItemSchema),
});
export type GeneratedQuestionSetOutput = z.infer<typeof GeneratedQuestionSetOutputSchema>;
