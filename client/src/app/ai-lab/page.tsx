"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import {
  Sparkles,
  FileCheck2,
  HelpCircle,
  RotateCw,
  Zap,
  Cpu,
  Info,
  CheckCircle2,
  AlertCircle,
  Terminal,
} from "lucide-react";

function AILabContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"resume" | "questions">("resume");

  // AI Engine Status State
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showGeminiHelp, setShowGeminiHelp] = useState(false);

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
    checkAIStatus();
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const checkAIStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await api.get("/ai/status");
      setAiStatus(res.data);
    } catch {
      setAiStatus({
        provider: "grounded_fallback",
        geminiConfigured: false,
        activeModel: "Local Grounded Engine",
        message: "Operating in local grounded mode.",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

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
      <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-white/[0.06] max-w-md mx-auto my-12">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-5">
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
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Prep Assistant
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Google Gemini Cloud AI & grounded interview question synthesis
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("resume")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === "resume"
                ? "bg-zinc-800 text-white font-semibold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
            Resume Audit
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === "questions"
                ? "bg-zinc-800 text-white font-semibold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            Question Generator
          </button>
        </div>
      </div>

      {/* AI Model / Gemini Status Card */}
      <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/[0.04] flex items-center justify-center">
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {aiStatus?.geminiConfigured ? "Google Gemini Connected" : "Local Grounded Engine"}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  aiStatus?.geminiConfigured
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    aiStatus?.geminiConfigured ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                {aiStatus?.geminiConfigured
                  ? `Model: ${aiStatus.activeModel}`
                  : "Gemini Key Not Set (Fallback Mode)"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {aiStatus?.message || "Checking Gemini AI availability..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowGeminiHelp(!showGeminiHelp)}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-colors"
          >
            {showGeminiHelp ? "Hide Guide" : "Gemini Setup"}
          </button>
          <button
            onClick={checkAIStatus}
            disabled={checkingStatus}
            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.04] transition-colors"
            title="Refresh AI Status"
          >
            <RotateCw className={`w-3.5 h-3.5 ${checkingStatus ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Collapsible Gemini Setup Helper */}
      {showGeminiHelp && (
        <div className="p-4 rounded-xl bg-black/60 border border-amber-400/20 space-y-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>How to configure Google Gemini Cloud AI:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 text-[11px] leading-relaxed">
            <li>
              Generate your free Gemini API key at{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 underline font-medium"
              >
                Google AI Studio (aistudio.google.com)
              </a>.
            </li>
            <li>
              Open <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-200">server/.env</code> and set:{" "}
              <code className="px-1 py-0.5 rounded bg-zinc-800 text-amber-300">GEMINI_API_KEY=&quot;your_key_here&quot;</code>
            </li>
            <li>
              (Optional) Customize model name in <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-200">server/.env</code>:{" "}
              <code className="px-1 py-0.5 rounded bg-zinc-800 text-amber-300">GEMINI_MODEL=&quot;gemini-1.5-flash&quot;</code> (or <code className="px-1 py-0.5 rounded bg-zinc-800 text-amber-300">gemini-2.5-flash</code>).
            </li>
            <li>
              Click <strong>&quot;Refresh AI Status&quot;</strong> above. Gemini will instantly take over all resume reviews and interview question generation!
            </li>
          </ol>
        </div>
      )}

      {/* TAB 1: AI RESUME REVIEW */}
      {activeTab === "resume" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Controls */}
          <div className="p-5 rounded-xl bg-zinc-900/30 border border-white/[0.05] space-y-4">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
              Audit Configuration
            </h3>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Target Resume Version
              </label>
              {flattenedVersions.length > 0 ? (
                <select
                  value={selectedVersionId}
                  onChange={(e) => setSelectedVersionId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500/50"
                >
                  {flattenedVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-red-400">
                  No resume versions found. Go to Resume Hub to upload one.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Target Job Description
              </label>
              <textarea
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description keywords..."
                className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {reviewError && (
              <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {reviewError}
              </div>
            )}

            <button
              onClick={handleRunResumeReview}
              disabled={reviewing || flattenedVersions.length === 0}
              className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-sm shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {reviewing ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Auditing Resume...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Run AI Audit
                </>
              )}
            </button>
          </div>

          {/* Results Presentation */}
          <div className="lg:col-span-2 space-y-4">
            {reviewResult ? (
              <div className="p-5 rounded-xl bg-zinc-900/30 border border-white/[0.05] space-y-5">
                {/* Overall Scores */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.04] text-center">
                    <div className="text-2xl font-bold text-amber-400">
                      {reviewResult.overallScore}
                      <span className="text-xs font-normal text-zinc-500">/100</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                      Overall Score
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.04] text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {reviewResult.keywordOverlapScore}%
                    </div>
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                      Keyword Overlap
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-3.5 rounded-lg bg-black/40 border border-white/[0.04] flex flex-col justify-center text-center sm:text-left">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      Engine
                    </span>
                    <span className="text-xs font-semibold text-zinc-300 truncate mt-0.5">
                      {reviewResult.modelUsed || (aiStatus?.geminiConfigured ? `Gemini (${aiStatus.activeModel})` : "Local Engine")}
                    </span>
                    <span className="text-[10px] text-emerald-400 mt-0.5">✓ Zod Validated</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-3.5 rounded-lg bg-zinc-950 border border-white/[0.04] text-xs text-zinc-300 leading-relaxed">
                  <p className="font-semibold text-white mb-1">Assessment:</p>
                  {reviewResult.summary}
                </div>

                {/* Section Scores */}
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
                    Rubric Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {reviewResult.sectionScores?.map((sec: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-black/30 border border-white/[0.04]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs text-white">
                            {sec.sectionName}
                          </span>
                          <span className="text-xs font-bold text-amber-400">
                            {sec.score}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {sec.feedback}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bullet Rewrites */}
                {reviewResult.suggestions?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
                      Weakest Bullets & Recommended Rewrites (Google XYZ Formula)
                    </h4>
                    <div className="space-y-2.5">
                      {reviewResult.suggestions.map((sug: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1.5 text-xs"
                        >
                          <div className="p-2 rounded bg-red-950/20 border border-red-500/20 text-red-300 text-[11px]">
                            <span className="font-semibold text-red-400 block mb-0.5">
                              Current Bullet:
                            </span>
                            &ldquo;{sug.original}&rdquo;
                          </div>

                          <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-[11px]">
                            <span className="font-semibold text-emerald-400 block mb-0.5">
                              Quantified XYZ Rewrite:
                            </span>
                            &ldquo;{sug.suggested}&rdquo;
                          </div>

                          <p className="text-[10px] text-zinc-500 italic">
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
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                      Missing ATS Keywords
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {reviewResult.missingKeywords.map((kw: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium"
                        >
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 text-center rounded-xl bg-zinc-900/20 border border-dashed border-white/[0.06] text-zinc-500 text-xs">
                Select a resume version and click &quot;Run AI Audit&quot; to review clarity, impact, and keyword overlap.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GROUNDED QUESTION GENERATOR */}
      {activeTab === "questions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Controls */}
          <div className="p-5 rounded-xl bg-zinc-900/30 border border-white/[0.05] space-y-4">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              Target Context
            </h3>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Target Company</label>
              <select
                value={genCompanyId}
                onChange={(e) => setGenCompanyId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500/50"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.sector})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Target Role</label>
              <input
                type="text"
                value={genRole}
                onChange={(e) => setGenRole(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
                placeholder="Software Development Engineer"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="includeWeak"
                checked={includeWeakTopics}
                onChange={(e) => setIncludeWeakTopics(e.target.checked)}
                className="rounded bg-zinc-950 border-zinc-800 text-amber-500 focus:ring-0"
              />
              <label htmlFor="includeWeak" className="text-xs text-zinc-300">
                Incorporate my identified weak topics
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Number of Questions</span>
                <span className="font-semibold text-white">{genCount}</span>
              </div>
              <input
                type="range"
                min={3}
                max={6}
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {genError && (
              <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {genError}
              </div>
            )}

            <button
              onClick={handleGenerateQuestions}
              disabled={generating}
              className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-sm shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {generating ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Generate Questions
                </>
              )}
            </button>
          </div>

          {/* Generated Question Output Cards */}
          <div className="lg:col-span-2 space-y-4">
            {questionSetResult ? (
              <div className="p-5 rounded-xl bg-zinc-900/30 border border-white/[0.05] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-white">
                      {questionSetResult.companyName} — {questionSetResult.targetRole}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {questionSetResult.notes}
                    </p>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 font-medium">
                    {questionSetResult.isCompanySpecific ? "Company Grounded" : "Practice Mode"}
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {questionSetResult.questions?.map((q: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-black/40 border border-white/[0.04] space-y-2"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-400">Q{idx + 1}.</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 capitalize">
                          {q.roundType.replace("_", " ")} Round
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-medium">
                          {q.topicName}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            q.difficulty === "easy"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : q.difficulty === "hard"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-200 leading-relaxed font-normal">
                        {q.questionText}
                      </p>

                      <div className="p-2.5 rounded bg-zinc-950 border border-white/[0.03] space-y-1 text-[11px] text-zinc-400">
                        <div>
                          <strong className="text-zinc-300">Expected Approach: </strong>
                          {q.expectedAnswerApproach}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          <strong>Rationale: </strong>
                          {q.rationale}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center rounded-xl bg-zinc-900/20 border border-dashed border-white/[0.06] text-zinc-500 text-xs">
                Select your target company and role, then generate grounded practice questions tailored to your weak topics.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AILabPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-zinc-500 text-xs">Loading AI Lab...</div>}>
      <AILabContent />
    </React.Suspense>
  );
}
