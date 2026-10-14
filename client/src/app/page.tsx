"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import {
  Sparkles,
  Briefcase,
  Code2,
  FileText,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  BarChart3,
  Layers,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalQuestions: 0,
    resumesCount: 0,
    codingProfilesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (selectedCompanyId && user) {
      loadWeakTopics(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [compRes, qRes] = await Promise.all([
        api.get("/companies"),
        api.get("/questions"),
      ]);

      const compList = compRes.data.companies || [];
      setCompanies(compList);
      if (compList.length > 0) {
        setSelectedCompanyId(compList[0].id);
      }

      let resumesCount = 0;
      let profilesCount = 0;

      if (user) {
        try {
          const [resumesRes, profRes] = await Promise.all([
            api.get("/resumes"),
            api.get("/coding/profiles"),
          ]);
          resumesCount = (resumesRes.data.resumes || []).length;
          profilesCount = (profRes.data.profiles || []).length;
        } catch (e) {
          // Ignore if unauthenticated
        }
      }

      setStats({
        totalCompanies: compList.length,
        totalQuestions: (qRes.data.questions || []).length,
        resumesCount,
        codingProfilesCount: profilesCount,
      });
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadWeakTopics = async (companyId: string) => {
    try {
      const res = await api.get(`/coding/weak-topics?companyId=${companyId}`);
      setWeakTopics(res.data.weakTopics || []);
    } catch (err) {
      console.warn("Failed to load weak topics:", err);
    }
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="space-y-8">
      {/* Hero / Demo Flow Overview */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-slate-900 via-blue-950/60 to-slate-900 border border-blue-500/20 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Strategic Placement Preparation Engine
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Bridge Your Interview Gap With Data & AI
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
              We correlate actual company round frequencies with your solved Codeforces/LeetCode submissions to expose your precise weak topics, guide targeted practice, and generate bespoke interview questions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/companies"
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <Briefcase className="w-4 h-4" />
              Explore Companies
            </Link>
            <Link
              href="/ai-lab"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Launch AI Lab
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tracked Companies</span>
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalCompanies}</div>
          <p className="text-[11px] text-slate-400 mt-1">Google, Amazon, TCS, MS, Atlassian</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Interview Questions</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalQuestions}</div>
          <p className="text-[11px] text-slate-400 mt-1">Categorized by round & verified</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Coding Sync Profiles</span>
            <Code2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.codingProfilesCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Live Codeforces & LeetCode</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Managed Resumes</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.resumesCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">With extracted text versions</p>
        </div>
      </div>

      {/* The Core Innovation: Weak-Topic & Company Frequency Correlation Engine */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Target Company Weak-Topic Gap Analysis</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies interview topics that appear frequently for this company but have low solved counts in your coding tracker
            </p>
          </div>

          {/* Company Picker */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-medium text-slate-400 whitespace-nowrap">Target Company:</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.sector})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCompany && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Company Profile & Rounds */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base text-white">{selectedCompany.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {selectedCompany.sector}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {selectedCompany.description}
                </p>

                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Evaluation Rounds
                </p>
                <div className="space-y-2">
                  {selectedCompany.rounds.map((r: any) => (
                    <div
                      key={r.id}
                      className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-slate-200 capitalize">
                        {r.order}. {r.type.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-blue-400 font-semibold">
                        {r.questionCount} Questions
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <Link
                  href={`/companies?selected=${selectedCompany.id}`}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  View Company Questions
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right: Weak-Topics Ranked List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Identified Priority Topics for {selectedCompany.name}</span>
                <span>Gap Score</span>
              </div>

              {weakTopics.length > 0 ? (
                <div className="space-y-2.5">
                  {weakTopics.slice(0, 5).map((topic, idx) => (
                    <div
                      key={topic.topicId}
                      className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              idx === 0
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : idx === 1
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-sm text-white">
                            {topic.topicName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-400">
                            {topic.gapScore > 0 ? `+${topic.gapScore} Gap` : "Balanced"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-1">
                        <span className="text-[11px] text-slate-400">
                          {topic.recommendationNote}
                        </span>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span>
                            Company Asked:{" "}
                            <strong className="text-slate-200">{topic.companyFrequency}</strong>
                          </span>
                          <span>
                            You Solved:{" "}
                            <strong className="text-slate-200">{topic.studentSolvedCount}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400 text-sm">
                  <p>Sync your Codeforces/LeetCode handle to see your personalized weak topic radar!</p>
                  <Link
                    href="/coding"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Sync Profiles Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feature Exploration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/companies"
          className="group glass-panel p-6 rounded-2xl hover:border-blue-500/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
              Company Question Tracker
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Browse questions categorized by company, round, and topic tags. Upvote and mark questions that matched your interview.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-blue-400 gap-1">
            Browse Questions <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/resumes"
          className="group glass-panel p-6 rounded-2xl hover:border-indigo-500/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
              Resume Version Management
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Upload PDF resumes with automatic text extraction or use paste fallback. Manage tailored versions for specific target roles.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-indigo-400 gap-1">
            Manage Resumes <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/ai-lab"
          className="group glass-panel p-6 rounded-2xl hover:border-cyan-500/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              AI Review & Question Generator
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Audit your resume against rubrics and generate targeted interview questions grounded in company historical data and your weak topics.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-cyan-400 gap-1">
            Launch AI Engine <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
