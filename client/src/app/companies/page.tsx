"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import {
  Building2,
  Search,
  CheckCircle2,
  ThumbsUp,
  Award,
  Plus,
  ShieldCheck,
  ChevronDown,
  Layers,
  Sparkles,
  X,
} from "lucide-react";

function CompaniesContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [companies, setCompanies] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    searchParams.get("selected") || ""
  );
  const [selectedRoundType, setSelectedRoundType] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // New Question Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRoundId, setModalRoundId] = useState("");
  const [modalTopicId, setModalTopicId] = useState("");
  const [modalText, setModalText] = useState("");
  const [modalDifficulty, setModalDifficulty] = useState("medium");
  const [modalSource, setModalSource] = useState("On-Campus Interview 2026");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Admin New Company Modal State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companySector, setCompanySector] = useState("Product & Technology");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyRoles, setCompanyRoles] = useState("Software Development Engineer, SDE Intern");
  const [roundTypes, setRoundTypes] = useState<string[]>(["online_test", "technical", "hr"]);
  const [addingCompany, setAddingCompany] = useState(false);
  const [companyError, setCompanyError] = useState("");

  // Topics for modal & filter
  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [selectedCompanyId, selectedRoundType, selectedDifficulty]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, qRes] = await Promise.all([
        api.get("/companies"),
        api.get("/questions"),
      ]);
      const compList = compRes.data.companies || [];
      setCompanies(compList);
      setQuestions(qRes.data.questions || []);

      const qList = qRes.data.questions || [];
      const topicMap = new Map();
      qList.forEach((q: any) => {
        if (q.topic) topicMap.set(q.topic.id, q.topic.name);
      });
      setTopics(Array.from(topicMap.entries()).map(([id, name]) => ({ id, name })));
    } catch (err) {
      console.error("Load companies error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const params: any = {};
      if (selectedCompanyId) params.companyId = selectedCompanyId;
      if (selectedRoundType) params.roundType = selectedRoundType;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;

      const res = await api.get("/questions", { params });
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error("Error loading questions:", err);
    }
  };

  const handleVote = async (questionId: string, kind: "upvote" | "matched") => {
    if (!user) {
      alert("Please log in to vote or endorse questions.");
      return;
    }
    try {
      await api.post(`/questions/${questionId}/vote`, { kind });
      loadQuestions();
    } catch (err: any) {
      alert(err.response?.data?.error || "Vote failed");
    }
  };

  const handleVerify = async (questionId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/questions/${questionId}/verify`, { verified: !currentStatus });
      loadQuestions();
    } catch (err: any) {
      alert(err.response?.data?.error || "Admin verification failed");
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      await api.post("/questions", {
        roundId: modalRoundId,
        topicId: modalTopicId,
        text: modalText,
        difficulty: modalDifficulty,
        source: modalSource,
      });

      setIsModalOpen(false);
      setModalText("");
      loadQuestions();
      alert("Question submitted successfully!");
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== "admin") return;
    setAddingCompany(true);
    setCompanyError("");

    try {
      const rounds = roundTypes.map((t, idx) => ({
        type: t,
        order: idx + 1,
        description: `${t.replace("_", " ")} Round`,
      }));

      await api.post("/companies", {
        name: companyName.trim(),
        sector: companySector.trim(),
        description: companyDescription.trim() || undefined,
        rolesHiredFor: companyRoles.split(",").map((r) => r.trim()).filter(Boolean),
        rounds,
      });

      setIsCompanyModalOpen(false);
      setCompanyName("");
      setCompanyDescription("");
      alert(`Company '${companyName}' successfully created!`);
      loadData();
    } catch (err: any) {
      setCompanyError(err.response?.data?.error || "Failed to create company");
    } finally {
      setAddingCompany(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (!searchTerm) return true;
    return (
      q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.round.company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Company Question Bank
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verified interview questions curated by rounds, topics, and difficulties
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs border border-white/[0.06] transition-colors"
            >
              + Add Company
            </button>
          )}

          {user && (
            <button
              onClick={() => {
                if (companies.length > 0 && companies[0].rounds.length > 0) {
                  setModalRoundId(companies[0].rounds[0].id);
                }
                if (topics.length > 0) {
                  setModalTopicId(topics[0].id);
                }
                setIsModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-sm shadow-amber-500/20 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Contribute Question
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-wrap items-center gap-2.5">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions or topics..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedRoundType}
          onChange={(e) => setSelectedRoundType(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
        >
          <option value="">All Rounds</option>
          <option value="online_test">OA Round</option>
          <option value="technical">Technical Round</option>
          <option value="hr">HR Round</option>
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {(selectedCompanyId || selectedRoundType || selectedDifficulty || searchTerm) && (
          <button
            onClick={() => {
              setSelectedCompanyId("");
              setSelectedRoundType("");
              setSelectedDifficulty("");
              setSearchTerm("");
            }}
            className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Questions Listing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 font-medium">
          <span>{filteredQuestions.length} Questions</span>
          <span>Ranked by verifications & community signals</span>
        </div>

        {filteredQuestions.length > 0 ? (
          <div className="space-y-2.5">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-zinc-900/30 border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-xs px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                      {q.round.company.name}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 capitalize">
                      {q.round.type.replace("_", " ")}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-400 border border-white/[0.04]">
                      {q.topic.name}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        q.difficulty === "easy"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : q.difficulty === "medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {q.difficulty}
                    </span>

                    {q.verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                        Student Note
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-200 leading-relaxed font-normal pt-1">
                    {q.text}
                  </p>

                  <div className="text-[10px] text-zinc-500 flex items-center gap-2 pt-0.5">
                    <span>Source: {q.source || "Interviewee"}</span>
                    {q.submittedBy && <span>• {q.submittedBy.name}</span>}
                  </div>
                </div>

                {/* Vote & Admin Actions */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.04]">
                  <button
                    onClick={() => handleVote(q.id, "upvote")}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      q.userVote === "upvote"
                        ? "bg-amber-400/15 text-amber-300 border-amber-400/30"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {q.upvoteCount}
                  </button>

                  <button
                    onClick={() => handleVote(q.id, "matched")}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      q.userVote === "matched"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <Award className="w-3 h-3 text-emerald-400" />
                    Matched ({q.matchCount})
                  </button>

                  {user?.role === "admin" && (
                    <button
                      onClick={() => handleVerify(q.id, q.verified)}
                      className="p-1.5 rounded-lg text-xs text-amber-400 hover:bg-amber-400/10 border border-amber-400/20"
                      title="Verify"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-zinc-900/20 border border-dashed border-white/[0.06] text-zinc-500 text-xs">
            No questions matched the active criteria.
          </div>
        )}
      </div>

      {/* Contribute Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121214] p-6 rounded-2xl border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Contribute Question
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitError && (
              <div className="p-2.5 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitQuestion} className="space-y-3.5">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Target Round</label>
                <select
                  value={modalRoundId}
                  onChange={(e) => setModalRoundId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                >
                  {companies.flatMap((c) =>
                    c.rounds.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {c.name} - Round {r.order} ({r.type.replace("_", " ")})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Topic</label>
                  <select
                    value={modalTopicId}
                    onChange={(e) => setModalTopicId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Difficulty</label>
                  <select
                    value={modalDifficulty}
                    onChange={(e) => setModalDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Question Details</label>
                <textarea
                  rows={3}
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  required
                  placeholder="Problem statement or interview question..."
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Source / Note</label>
                <input
                  type="text"
                  value={modalSource}
                  onChange={(e) => setModalSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500"
                  placeholder="e.g. 2026 On-Campus"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Add Company Modal */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121214] p-6 rounded-2xl border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Add Company
              </h3>
              <button
                onClick={() => setIsCompanyModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {companyError && (
              <div className="p-2.5 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {companyError}
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-3.5">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="e.g. Google, Stripe, Databricks"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Sector</label>
                  <input
                    type="text"
                    value={companySector}
                    onChange={(e) => setCompanySector(e.target.value)}
                    required
                    placeholder="e.g. Cloud, FinTech"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Roles Hired For</label>
                  <input
                    type="text"
                    value={companyRoles}
                    onChange={(e) => setCompanyRoles(e.target.value)}
                    required
                    placeholder="e.g. SDE I, SDE Intern"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Interview patterns or overview..."
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCompany}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs disabled:opacity-50"
                >
                  {addingCompany ? "Saving..." : "Create Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-zinc-500 text-xs">Loading Companies...</div>}>
      <CompaniesContent />
    </React.Suspense>
  );
}
