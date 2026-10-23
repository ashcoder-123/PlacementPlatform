"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import {
  Sparkles,
  Building2,
  Code2,
  FileText,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Layers,
  ChevronRight,
  Target,
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
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Placement Overview
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time readiness telemetry and target company gap analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/companies"
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 border border-white/[0.06] transition-colors"
          >
            Companies
          </Link>
          <Link
            href="/ai-lab"
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold shadow-sm shadow-amber-500/20 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Launch AI Lab
          </Link>
        </div>
      </div>

      {/* Minimal KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium tracking-wide uppercase">Companies</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.totalCompanies}</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Tracked for placement</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium tracking-wide uppercase">Questions</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.totalQuestions}</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Curated round patterns</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium tracking-wide uppercase">Coding Sync</span>
            <Code2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.codingProfilesCount}</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Active platforms</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium tracking-wide uppercase">Resumes</span>
            <FileText className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.resumesCount}</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Parsed versions</span>
          </div>
        </div>
      </div>

      {/* Target Company Gap Analysis */}
      <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Target Company Weakness Radar</h2>
              <p className="text-[11px] text-zinc-400">Gaps between company interview frequency and your solved track</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Target:</span>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCompany && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
            {/* Left: Selected Company Quick Info */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.04] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">{selectedCompany.name}</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {selectedCompany.sector}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                  {selectedCompany.description}
                </p>

                <div className="mt-4 pt-3 border-t border-white/[0.04]">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block mb-2">
                    Interview Rounds
                  </span>
                  <div className="space-y-1.5">
                    {selectedCompany.rounds.map((r: any) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-zinc-900/60 border border-white/[0.03]"
                      >
                        <span className="text-zinc-300 capitalize text-[11px]">
                          {r.type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-amber-400 font-medium">
                          {r.questionCount} Qs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.04]">
                <Link
                  href={`/companies?selected=${selectedCompany.id}`}
                  className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-white/[0.04]"
                >
                  View Round Questions <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right: Weak Topics */}
            <div className="lg:col-span-2 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 font-medium">
                <span>Priority Focus Topics</span>
                <span>Gap Status</span>
              </div>

              {weakTopics.length > 0 ? (
                <div className="space-y-2">
                  {weakTopics.slice(0, 4).map((topic, idx) => (
                    <div
                      key={topic.topicId}
                      className="p-3 rounded-xl bg-black/40 border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center bg-zinc-800 text-zinc-300">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-xs text-white">
                            {topic.topicName}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            topic.gapScore > 0 ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {topic.gapScore > 0 ? `+${topic.gapScore} Gap` : "Prepared"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1">
                        <span className="truncate pr-2">{topic.recommendationNote}</span>
                        <div className="flex items-center gap-2 shrink-0 text-[10px]">
                          <span>Asked: <strong className="text-zinc-300">{topic.companyFrequency}</strong></span>
                          <span>Solved: <strong className="text-zinc-300">{topic.studentSolvedCount}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-black/30 border border-dashed border-white/[0.06] text-zinc-400 text-xs">
                  <p>Sync your Codeforces or LeetCode profile to reveal your weak topics.</p>
                  <Link
                    href="/coding"
                    className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-medium text-amber-400 hover:text-amber-300"
                  >
                    Sync Profiles <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Minimal Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/companies"
          className="p-5 rounded-xl bg-zinc-900/30 border border-white/[0.05] hover:border-amber-400/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
              Company Question Bank
            </h3>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Search questions filtered by hiring round, difficulty, and frequency.
          </p>
        </Link>

        <Link
          href="/resumes"
          className="p-5 rounded-xl bg-zinc-900/30 border border-white/[0.05] hover:border-amber-400/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
              Resume Versions
            </h3>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Upload and review multiple resume versions tailored for specific roles.
          </p>
        </Link>

        <Link
          href="/ai-lab"
          className="p-5 rounded-xl bg-zinc-900/30 border border-white/[0.05] hover:border-amber-400/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
              AI Prep Assistant
            </h3>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Resume scoring against company patterns and custom mock questions.
          </p>
        </Link>
      </div>
    </div>
  );
}
