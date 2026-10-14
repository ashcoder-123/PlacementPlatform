"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  ThumbsUp,
  Award,
  Plus,
  ShieldCheck,
  ChevronDown,
  Layers,
  Sparkles,
  Building2,
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

      // Extract unique topics from questions or company data
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
      alert("Question submitted! It will appear with 'Student' status until verified by coordinator.");
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">Company Interview Tracker</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse real round-by-round interview experiences, upvote confirmed questions, and contribute your senior viva questions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.role === "admin" && (
            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all border border-amber-500/30"
            >
              <Building2 className="w-4 h-4 text-amber-200" />
              Add Company (Admin)
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
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Contribute Question
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions by keyword or topic..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Company Dropdown */}
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Round Type Dropdown */}
        <select
          value={selectedRoundType}
          onChange={(e) => setSelectedRoundType(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Rounds</option>
          <option value="online_test">Online Assessment (OA)</option>
          <option value="technical">Technical Round</option>
          <option value="hr">HR / Managerial Round</option>
        </select>

        {/* Difficulty Dropdown */}
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
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
            className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Questions Listing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing <strong className="text-white">{filteredQuestions.length}</strong> Questions
          </span>
          <span>Sorted: Verified first, then by upvotes</span>
        </div>

        {filteredQuestions.length > 0 ? (
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="glass-panel p-5 rounded-2xl hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {q.round.company.name}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 capitalize">
                      {q.round.type.replace("_", " ")} Round
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                      {q.topic.name}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                        q.difficulty === "easy"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : q.difficulty === "medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {q.difficulty}
                    </span>

                    {q.verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        Student Submission
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed font-normal">
                    {q.text}
                  </p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                    <span>Source: {q.source || "Campus Senior"}</span>
                    {q.submittedBy && <span>• Submitted by {q.submittedBy.name}</span>}
                  </div>
                </div>

                {/* Vote & Admin Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <button
                    onClick={() => handleVote(q.id, "upvote")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      q.userVote === "upvote"
                        ? "bg-blue-600/20 text-blue-400 border-blue-500/40"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {q.upvoteCount} Upvotes
                  </button>

                  <button
                    onClick={() => handleVote(q.id, "matched")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      q.userVote === "matched"
                        ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/40"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    {q.matchCount} Matched Mine
                  </button>

                  {user?.role === "admin" && (
                    <button
                      onClick={() => handleVerify(q.id, q.verified)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 transition-colors"
                      title="Admin Toggle Verification"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {q.verified ? "Unverify" : "Verify"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl glass-panel text-slate-400 text-sm">
            <p>No questions matched your current filter criteria.</p>
          </div>
        )}
      </div>

      {/* Contribute Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Submit Interview Question
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {submitError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Round
                </label>
                <select
                  value={modalRoundId}
                  onChange={(e) => setModalRoundId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Canonical Topic
                  </label>
                  <select
                    value={modalTopicId}
                    onChange={(e) => setModalTopicId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={modalDifficulty}
                    onChange={(e) => setModalDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Question Description
                </label>
                <textarea
                  rows={4}
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  required
                  placeholder="State the algorithmic problem, constraints, or behavioral scenario..."
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Source / Context
                </label>
                <input
                  type="text"
                  value={modalSource}
                  onChange={(e) => setModalSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500"
                  placeholder="e.g. Amazon On-Campus OA Dec 2025"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Add New Company (Admin)
              </h3>
              <button
                onClick={() => setIsCompanyModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {companyError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {companyError}
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="e.g. Uber, Adobe, Oracle, Cisco"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sector
                  </label>
                  <input
                    type="text"
                    value={companySector}
                    onChange={(e) => setCompanySector(e.target.value)}
                    required
                    placeholder="e.g. Fintech, Cloud, E-Commerce"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Roles Hired For
                  </label>
                  <input
                    type="text"
                    value={companyRoles}
                    onChange={(e) => setCompanyRoles(e.target.value)}
                    required
                    placeholder="Comma-separated roles"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Overview of hiring standards, culture, or eligibility..."
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Evaluation Rounds to Configure
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { id: "online_test", label: "Online Assessment (OA)" },
                    { id: "technical", label: "Technical Interview" },
                    { id: "hr", label: "HR / Culture Round" },
                  ].map((r) => {
                    const isChecked = roundTypes.includes(r.id);
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => {
                          if (isChecked) {
                            if (roundTypes.length > 1) {
                              setRoundTypes(roundTypes.filter((t) => t !== r.id));
                            }
                          } else {
                            setRoundTypes([...roundTypes, r.id]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          isChecked
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        {isChecked ? "✓ " : "+ "}
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCompany}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {addingCompany ? "Adding Company..." : "Create Company"}
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
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Companies...</div>}>
      <CompaniesContent />
    </React.Suspense>
  );
}
