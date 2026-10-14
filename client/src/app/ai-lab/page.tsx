"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import {
  Sparkles,
  FileCheck2,
  Briefcase,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Copy,
  Sliders,
  Send,
  Zap,
} from "lucide-react";

function AILabContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"resume" | "questions">("resume");

  // Tab 1: Resume Review State
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    searchParams.get("resumeVersionId") || ""
  );
  const [jobDescription, setJobDescription] = useState<string>(
    "Software Development Engineer (SDE 1) - Strong knowledge of Data Structures, Algorithms, distributed REST APIs with Node.js/TypeScript, PostgreSQL, and Redis caching."
  );
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [reviewError, setReviewError] = useState("");

  // Tab 2: Question Generator State
  const [companies, setCompanies] = useState<any[]>([]);
  const [genCompanyId, setGenCompanyId] = useState("");
  const [genRole, setGenRole] = useState("Software Development Engineer");
  const [includeWeakTopics, setIncludeWeakTopics] = useState(true);
  const [genCount, setGenCount] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [questionSetResult, setQuestionSetResult] = useState<any>(null);
  const [genError, setGenError] = useState("");

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      const [resumesRes, compRes] = await Promise.all([
        api.get("/resumes"),
        api.get("/companies"),
      ]);

      const rList = resumesRes.data.resumes || [];
      setResumes(rList);

      const allVersions = rList.flatMap((r: any) =>
        r.versions.map((v: any) => ({
          ...v,
          resumeTitle: r.title,
          targetRole: r.targetRole,
        }))
      );

      if (allVersions.length > 0 && !selectedVersionId) {
        setSelectedVersionId(allVersions[0].id);
      }

      const cList = compRes.data.companies || [];
      setCompanies(cList);
      if (cList.length > 0 && !genCompanyId) {
        setGenCompanyId(cList[0].id);
      }
    } catch (err) {
      console.error("AI Lab load error:", err);
    }
  };

  const handleRunResumeReview = async () => {
    if (!selectedVersionId) {
      alert("Please select a resume version to audit.");
      return;
    }

    setReviewing(true);
    setReviewError("");

    try {
      const res = await api.post(`/ai/resume-review/${selectedVersionId}`, {
        jobDescription,
      });
      setReviewResult(res.data.review);
    } catch (err: any) {
      setReviewError(err.response?.data?.error || "AI Resume Review failed");
    } finally {
      setReviewing(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!genCompanyId) {
      alert("Please choose a target company.");
      return;
    }

    setGenerating(true);
    setGenError("");

    try {
      const res = await api.post("/ai/generate-questions", {
        companyId: genCompanyId,
        targetRole: genRole,
        includeWeakTopics,
        count: genCount,
      });
      setQuestionSetResult(res.data);
    } catch (err: any) {
      setGenError(err.response?.data?.error || "Question generation failed");
    } finally {
      setGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center glass-panel rounded-2xl max-w-lg mx-auto">
        <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Sign In for AI Intelligence</h2>
        <p className="text-sm text-slate-400 mt-2 mb-6">
          Access the grounded question generator and rubric-based resume auditor.
        </p>
      </div>
    );
  }

  const flattenedVersions = resumes.flatMap((r) =>
    r.versions.map((v: any) => ({
      id: v.id,
      label: `${r.title} (v${v.versionNumber} - ${r.targetRole})`,
      extractedText: v.extractedText,
    }))
  );

  return (
    <div className="space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">AI Intelligence Lab</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Grounded company question synthesis and rubric-aligned resume auditing.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("resume")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === "resume"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            Resume Rubric Audit
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === "questions"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Grounded Question Gen
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: AI RESUME REVIEW                                        */}
      {/* ============================================================== */}
      {activeTab === "resume" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Controls */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-400" />
                Resume & Job Description Setup
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Target Resume Version
                </label>
                {flattenedVersions.length > 0 ? (
                  <select
                    value={selectedVersionId}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {flattenedVersions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-rose-400">
                    No resume versions found. Go to Resume Hub to upload or paste your resume.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Job Description (Optional)
                </label>
                <textarea
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste target role job description for keyword matching..."
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {reviewError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {reviewError}
                </div>
              )}

              <button
                onClick={handleRunResumeReview}
                disabled={reviewing || flattenedVersions.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {reviewing ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Auditing Rubric & Calculating Overlap...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run AI Resume Audit
                  </>
                )}
              </button>
            </div>

            {/* Results Presentation */}
            <div className="lg:col-span-2 space-y-4">
              {reviewResult ? (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                  {/* Overall Scores */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                      <div className="text-3xl font-extrabold text-blue-400">
                        {reviewResult.overallScore}
                        <span className="text-sm font-normal text-slate-400">/100</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mt-1">
                        Overall Score
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                      <div className="text-3xl font-extrabold text-indigo-400">
                        {reviewResult.keywordOverlapScore}%
                      </div>
                      <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mt-1">
                        Keyword Overlap
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Model Engine
                      </span>
                      <span className="text-xs font-bold text-slate-200 truncate mt-0.5">
                        {reviewResult.modelUsed || "Instruction-Tuned AI"}
                      </span>
                      <span className="text-[10px] text-emerald-400 mt-1">✓ Zod Validated</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-slate-300 leading-relaxed">
                    <p className="font-semibold text-white mb-1">Executive Assessment:</p>
                    {reviewResult.summary}
                  </div>

                  {/* Section Scores */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Rubric Criteria Breakdown
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {reviewResult.sectionScores?.map((sec: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-white">
                              {sec.sectionName}
                            </span>
                            <span className="text-xs font-extrabold text-blue-400">
                              {sec.score}/100
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {sec.feedback}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bullet Rewrites using XYZ Formula */}
                  {reviewResult.suggestions?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Weakest Bullets & Recommended Rewrites (Google XYZ Formula)
                      </h4>
                      <div className="space-y-3">
                        {reviewResult.suggestions.map((sug: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs"
                          >
                            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                              <span className="font-semibold text-rose-400 block mb-0.5">
                                Before (Weak Bullet):
                              </span>
                              &ldquo;{sug.original}&rdquo;
                            </div>

                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                              <span className="font-semibold text-emerald-400 block mb-0.5">
                                After (Quantified XYZ Impact):
                              </span>
                              &ldquo;{sug.suggested}&rdquo;
                            </div>

                            <p className="text-[11px] text-slate-400 italic">
                              Rationale: {sug.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Keywords */}
                  {reviewResult.missingKeywords?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Missing ATS Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {reviewResult.missingKeywords.map((kw: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-rose-300 border border-rose-500/30 font-medium"
                          >
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl glass-panel text-slate-400 text-sm">
                  <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p>Select a resume version and click &quot;Run AI Resume Audit&quot; to evaluate metrics, clarity, and ATS keyword overlap.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: GROUNDED QUESTION GENERATOR                             */}
      {/* ============================================================== */}
      {activeTab === "questions" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Controls */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Grounded Question Synthesis
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Company
                </label>
                <select
                  value={genCompanyId}
                  onChange={(e) => setGenCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.sector})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Role
                </label>
                <input
                  type="text"
                  value={genRole}
                  onChange={(e) => setGenRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  placeholder="Software Development Engineer"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="includeWeak"
                  checked={includeWeakTopics}
                  onChange={(e) => setIncludeWeakTopics(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0"
                />
                <label htmlFor="includeWeak" className="text-xs text-slate-300 font-medium">
                  Incorporate my identified weak topics
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Number of Questions</span>
                  <span className="font-bold text-white">{genCount}</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={6}
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {genError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {genError}
                </div>
              )}

              <button
                onClick={handleGenerateQuestions}
                disabled={generating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {generating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Querying Patterns & Synthesizing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Grounded Questions
                  </>
                )}
              </button>
            </div>

            {/* Generated Question Output Cards */}
            <div className="lg:col-span-2 space-y-4">
              {questionSetResult ? (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-white">
                        {questionSetResult.companyName} — {questionSetResult.targetRole}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {questionSetResult.notes}
                      </p>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                      {questionSetResult.isCompanySpecific
                        ? "Company Grounded"
                        : "General Practice"}
                    </span>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    {questionSetResult.questions?.map((q: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            Q{idx + 1}.
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 capitalize">
                            {q.roundType.replace("_", " ")} Round
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold">
                            {q.topicName}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              q.difficulty === "easy"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : q.difficulty === "hard"
                                ? "bg-rose-500/10 text-rose-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>

                        <p className="text-sm text-slate-200 leading-relaxed font-medium">
                          {q.questionText}
                        </p>

                        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-1.5 text-xs text-slate-300">
                          <div>
                            <strong className="text-cyan-400">Approach & Key Patterns: </strong>
                            {q.expectedAnswerApproach}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            <strong>Why Selected: </strong>
                            {q.rationale}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl glass-panel text-slate-400 text-sm">
                  <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p>Choose your target company and role, then generate questions grounded in historical round patterns and your weak topics.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AILabPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading AI Lab...</div>}>
      <AILabContent />
    </React.Suspense>
  );
}
