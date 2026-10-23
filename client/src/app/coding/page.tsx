"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import {
  Code2,
  RefreshCw,
  Plus,
  CheckCircle2,
  BarChart2,
  ArrowRight,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";

export default function CodingTrackerPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Sync state
  const [cfHandle, setCfHandle] = useState("");
  const [lcHandle, setLcHandle] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [syncError, setSyncError] = useState<string>("");

  // Manual problem modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualPlatform, setManualPlatform] = useState<"leetcode" | "gfg" | "codeforces">("leetcode");
  const [manualDifficulty, setManualDifficulty] = useState("medium");
  const [manualLink, setManualLink] = useState("");
  const [manualTopicId, setManualTopicId] = useState("");
  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadInitialData();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadWeakTopics();
    }
  }, [selectedCompanyId, user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [profRes, compRes, qRes] = await Promise.all([
        api.get("/coding/profiles"),
        api.get("/companies"),
        api.get("/questions"),
      ]);

      const profList = profRes.data.profiles || [];
      setProfiles(profList);
      setCompanies(compRes.data.companies || []);

      const qList = qRes.data.questions || [];
      const topicMap = new Map();
      qList.forEach((q: any) => {
        if (q.topic) topicMap.set(q.topic.id, q.topic.name);
      });
      const tList = Array.from(topicMap.entries()).map(([id, name]) => ({ id, name }));
      setTopics(tList);
      if (tList.length > 0) setManualTopicId(tList[0].id);

      const cf = profList.find((p: any) => p.platform === "codeforces");
      if (cf) setCfHandle(cf.handle);
      const lc = profList.find((p: any) => p.platform === "leetcode");
      if (lc) setLcHandle(lc.handle);

      await loadWeakTopics();
    } catch (err) {
      console.error("Coding tracker init error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadWeakTopics = async () => {
    try {
      const url = selectedCompanyId
        ? `/coding/weak-topics?companyId=${selectedCompanyId}`
        : "/coding/weak-topics";
      const res = await api.get(url);
      setWeakTopics(res.data.weakTopics || []);
    } catch (err) {
      console.warn("Error loading weak topics:", err);
    }
  };

  const handleSync = async (platform: "codeforces" | "leetcode", handle: string) => {
    if (!handle.trim()) {
      alert(`Please enter a valid ${platform} handle.`);
      return;
    }

    setSyncing(platform);
    setSyncMessage("");
    setSyncError("");

    try {
      const res = await api.post("/coding/profiles/sync", { platform, handle: handle.trim() });
      setSyncMessage(res.data.message || `Successfully synced ${platform} (${handle})`);
      await loadInitialData();
    } catch (err: any) {
      setSyncError(err.response?.data?.error || `Sync failed for ${platform}. Check username.`);
    } finally {
      setSyncing(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/coding/problems/manual", {
        platform: manualPlatform,
        title: manualTitle,
        difficulty: manualDifficulty,
        link: manualLink || undefined,
        topicIds: [manualTopicId],
      });

      setIsManualModalOpen(false);
      setManualTitle("");
      setManualLink("");
      alert("Manual problem recorded and topic gap recalculated!");
      await loadInitialData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to record problem");
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-white/[0.06] max-w-md mx-auto my-12">
        <Code2 className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-5">
          Connect your Codeforces or LeetCode handle to expose your weak topics.
        </p>
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Coding Tracker & Weak-Topic Radar
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real live syncing from LeetCode GraphQL & Codeforces API to compute your exact placement gap
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs border border-white/[0.06] transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          Log Custom Problem
        </button>
      </div>

      {syncMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {syncError && (
        <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Sync Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Codeforces */}
        <div className="p-5 rounded-xl bg-zinc-900/30 border border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">Codeforces</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Official API
              </span>
            </div>
            <RefreshCw
              className={`w-3.5 h-3.5 text-zinc-500 ${
                syncing === "codeforces" ? "animate-spin text-amber-400" : ""
              }`}
            />
          </div>
          <p className="text-xs text-zinc-400">
            Pulls verified AC submissions and categorizes them by topic.
          </p>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={cfHandle}
              onChange={(e) => setCfHandle(e.target.value)}
              placeholder="Codeforces username..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={() => handleSync("codeforces", cfHandle)}
              disabled={syncing === "codeforces"}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs disabled:opacity-50 transition-colors"
            >
              {syncing === "codeforces" ? "Syncing..." : "Sync CF"}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 pt-0.5">
            <span>Demo:</span>
            <button
              type="button"
              onClick={() => setCfHandle("tourist")}
              className="text-amber-400 hover:underline"
            >
              tourist
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setCfHandle("Petr")}
              className="text-amber-400 hover:underline"
            >
              Petr
            </button>
          </div>
        </div>

        {/* LeetCode */}
        <div className="p-5 rounded-xl bg-zinc-900/30 border border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">LeetCode</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                GraphQL Live
              </span>
            </div>
            <RefreshCw
              className={`w-3.5 h-3.5 text-zinc-500 ${
                syncing === "leetcode" ? "animate-spin text-amber-400" : ""
              }`}
            />
          </div>
          <p className="text-xs text-zinc-400">
            Queries cumulative problem tag stats directly from LeetCode GraphQL.
          </p>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={lcHandle}
              onChange={(e) => setLcHandle(e.target.value)}
              placeholder="LeetCode username..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={() => handleSync("leetcode", lcHandle)}
              disabled={syncing === "leetcode"}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs disabled:opacity-50 transition-colors"
            >
              {syncing === "leetcode" ? "Syncing..." : "Sync LC"}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 pt-0.5">
            <span>Demo:</span>
            <button
              type="button"
              onClick={() => setLcHandle("neal_wu")}
              className="text-amber-400 hover:underline"
            >
              neal_wu
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setLcHandle("lee215")}
              className="text-amber-400 hover:underline"
            >
              lee215
            </button>
          </div>
        </div>
      </div>

      {/* Weak-Topic Ranking */}
      <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/[0.06] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.04]">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              Target Company Gap Breakdown
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Ranked by: (Target Company Round Frequency) − (Your Solved Track). Highest gaps indicate immediate revision priority.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Benchmark:</span>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
            >
              <option value="">Global Placement Average</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {weakTopics.slice(0, 8).map((t, idx) => (
            <div
              key={t.topicId}
              className="p-3.5 rounded-xl bg-black/40 border border-white/[0.04] hover:border-white/[0.08] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center bg-zinc-800 text-zinc-300">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-medium text-xs text-white">{t.topicName}</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{t.recommendationNote}</p>
                </div>
              </div>

              <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end text-xs">
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">
                    Company Qs
                  </div>
                  <div className="font-semibold text-zinc-200 text-xs">{t.companyFrequency}</div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">
                    Solved
                  </div>
                  <div className="font-semibold text-emerald-400 text-xs">{t.studentSolvedCount}</div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">
                    Gap Score
                  </div>
                  <div className="font-bold text-amber-400 text-xs">+{t.gapScore}</div>
                </div>

                <Link
                  href={`/resources?topicId=${t.topicId}`}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.04] text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  Resources <ArrowRight className="w-3 h-3 text-amber-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Problem Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121214] p-6 rounded-2xl border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Record Problem Manually
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Problem Title</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  required
                  placeholder="e.g. Trapping Rain Water"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Platform</label>
                  <select
                    value={manualPlatform}
                    onChange={(e: any) => setManualPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                  >
                    <option value="leetcode">LeetCode</option>
                    <option value="gfg">GeeksforGeeks</option>
                    <option value="codeforces">Codeforces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Difficulty</label>
                  <select
                    value={manualDifficulty}
                    onChange={(e) => setManualDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Topic</label>
                <select
                  value={manualTopicId}
                  onChange={(e) => setManualTopicId(e.target.value)}
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
                <label className="block text-xs text-zinc-400 mb-1">Problem Link (Optional)</label>
                <input
                  type="url"
                  value={manualLink}
                  onChange={(e) => setManualLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
