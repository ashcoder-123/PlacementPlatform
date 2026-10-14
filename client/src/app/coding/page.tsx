"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import {
  Code2,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  BarChart2,
  Layers,
  ArrowRight,
  TrendingDown,
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

      // Extract unique topics
      const qList = qRes.data.questions || [];
      const topicMap = new Map();
      qList.forEach((q: any) => {
        if (q.topic) topicMap.set(q.topic.id, q.topic.name);
      });
      const tList = Array.from(topicMap.entries()).map(([id, name]) => ({ id, name }));
      setTopics(tList);
      if (tList.length > 0) setManualTopicId(tList[0].id);

      // Set existing handles in input
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

    try {
      const res = await api.post("/coding/profiles/sync", { platform, handle: handle.trim() });
      setSyncMessage(res.data.message || `Successfully synced ${platform}`);
      await loadInitialData();
    } catch (err: any) {
      setSyncMessage(err.response?.data?.error || `Sync error for ${platform}`);
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
      alert("Manual problem successfully added and linked to your topic mastery radar!");
      await loadInitialData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to record problem");
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center glass-panel rounded-2xl max-w-lg mx-auto">
        <Code2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Authentication Required</h2>
        <p className="text-sm text-slate-400 mt-2 mb-6">
          Log in to connect your Codeforces or LeetCode handle and reveal your weak-topic gaps.
        </p>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
              <Code2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">Coding Tracker & Weak-Topic Intelligence</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Live sync Codeforces official API, LeetCode submissions, and custom entries mapped to canonical topics.
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add GFG / Custom Problem
        </button>
      </div>

      {syncMessage && (
        <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {syncMessage}
        </div>
      )}

      {/* Sync Platforms Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Codeforces Sync Box */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">Codeforces</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Official API
              </span>
            </div>
            <RefreshCw
              className={`w-4 h-4 text-slate-400 ${
                syncing === "codeforces" ? "animate-spin text-blue-400" : ""
              }`}
            />
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Fetches verified AC submissions with tags (e.g. dp, graphs, math) and maps to canonical topics.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={cfHandle}
              onChange={(e) => setCfHandle(e.target.value)}
              placeholder="Enter CF handle (e.g. tourist, ashwin_k)"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleSync("codeforces", cfHandle)}
              disabled={syncing === "codeforces"}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {syncing === "codeforces" ? "Syncing..." : "Sync CF"}
            </button>
          </div>
        </div>

        {/* LeetCode Sync Box */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">LeetCode</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                GraphQL & Fallback
              </span>
            </div>
            <RefreshCw
              className={`w-4 h-4 text-slate-400 ${
                syncing === "leetcode" ? "animate-spin text-amber-400" : ""
              }`}
            />
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Queries recent AC submissions with timeout safeguards and fallback demo caching.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={lcHandle}
              onChange={(e) => setLcHandle(e.target.value)}
              placeholder="Enter LeetCode username"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => handleSync("leetcode", lcHandle)}
              disabled={syncing === "leetcode"}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {syncing === "leetcode" ? "Syncing..." : "Sync LC"}
            </button>
          </div>
        </div>
      </div>

      {/* Weak-Topic Ranking Radar */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-rose-400" />
              Ranked Weak-Topic Gap Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Derived by: (Target Company Topic Frequency) − (Your Solved Share). Top gaps are recommended for immediate revision.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-400">Benchmark Against:</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
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

        <div className="space-y-3">
          {weakTopics.slice(0, 8).map((t, idx) => (
            <div
              key={t.topicId}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : idx <= 2
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                  }`}
                >
                  #{idx + 1}
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm">{t.topicName}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t.recommendationNote}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end text-xs">
                <div className="text-right">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">
                    Company Weight
                  </div>
                  <div className="font-bold text-white">{t.companyFrequency} Questions</div>
                </div>

                <div className="text-right">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">
                    You Solved
                  </div>
                  <div className="font-bold text-emerald-400">{t.studentSolvedCount} Solved</div>
                </div>

                <div className="text-right">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">
                    Gap Index
                  </div>
                  <div className="font-bold text-rose-400">+{t.gapScore}</div>
                </div>

                <Link
                  href={`/resources?topicId=${t.topicId}`}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  Learn
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Problem Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Log Solved Problem Manually
            </h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Problem Title
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  required
                  placeholder="e.g. Coin Change II"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={manualPlatform}
                    onChange={(e: any) => setManualPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="leetcode">LeetCode</option>
                    <option value="gfg">GeeksforGeeks</option>
                    <option value="codeforces">Codeforces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={manualDifficulty}
                    onChange={(e) => setManualDifficulty(e.target.value)}
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
                  Canonical Topic Tag
                </label>
                <select
                  value={manualTopicId}
                  onChange={(e) => setManualTopicId(e.target.value)}
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
                  Problem URL (Optional)
                </label>
                <input
                  type="url"
                  value={manualLink}
                  onChange={(e) => setManualLink(e.target.value)}
                  placeholder="https://practice.geeksforgeeks.org/..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                >
                  Save Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
