"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import {
  BookOpen,
  Sparkles,
  ExternalLink,
  Plus,
  Filter,
  Video,
  FileCode,
  GraduationCap,
  Bookmark,
  CheckCircle2,
  Clock,
  Check,
  X,
} from "lucide-react";

function ResourcesContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [resources, setResources] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [topWeakTopics, setTopWeakTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    searchParams.get("topicId") || ""
  );
  const [topics, setTopics] = useState<any[]>([]);

  // Add Resource Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState("sheet");
  const [newDifficulty, setNewDifficulty] = useState("medium");
  const [newTopicId, setNewTopicId] = useState("");

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    loadResources();
  }, [selectedType, selectedDifficulty, selectedTopicId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resListRes, qRes] = await Promise.all([
        api.get("/resources"),
        api.get("/questions"),
      ]);

      setResources(resListRes.data.resources || []);

      // Extract topics
      const qList = qRes.data.questions || [];
      const topicMap = new Map();
      qList.forEach((q: any) => {
        if (q.topic) topicMap.set(q.topic.id, q.topic.name);
      });
      const tList = Array.from(topicMap.entries()).map(([id, name]) => ({ id, name }));
      setTopics(tList);
      if (tList.length > 0 && !newTopicId) setNewTopicId(tList[0].id);

      // If user is logged in, load weak-topic recommendations
      if (user) {
        try {
          const recRes = await api.get("/resources/recommendations");
          setRecommendations(recRes.data.recommended || []);
          setTopWeakTopics(recRes.data.topWeakTopics || []);
        } catch (e) {
          console.warn("Could not load recommendations:", e);
        }
      }
    } catch (err) {
      console.error("Resources error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const params: any = {};
      if (selectedType) params.type = selectedType;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (selectedTopicId) params.topicId = selectedTopicId;

      const res = await api.get("/resources", { params });
      setResources(res.data.resources || []);
    } catch (err) {
      console.error("Filter error:", err);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/resources", {
        title: newTitle,
        url: newUrl,
        type: newType,
        difficulty: newDifficulty,
        topicIds: [newTopicId],
      });

      setIsModalOpen(false);
      setNewTitle("");
      setNewUrl("");
      alert(
        res.data?.message ||
          (user?.role === "admin"
            ? "Resource published successfully!"
            : "Resource submitted for admin review. It will be visible once approved.")
      );
      loadResources();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add resource");
    }
  };

  const handleVerifyResource = async (id: string, verified: boolean) => {
    try {
      const res = await api.patch(`/resources/${id}/verify`, { verified });
      alert(res.data?.message || (verified ? "Resource approved!" : "Resource rejected."));
      setResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, verified } : r))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update resource verification");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-rose-400" />;
      case "course":
        return <GraduationCap className="w-4 h-4 text-indigo-400" />;
      case "sheet":
        return <FileCode className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bookmark className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-600/10 border border-cyan-500/20 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">Curated Resource Library</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hand-picked sheets, videos, primers and interview courses mapped to canonical placement topics.
          </p>
        </div>

        {user && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Share Resource
          </button>
        )}
      </div>

      {/* Recommended for You Banner based on Weak-Topics */}
      {user && topWeakTopics.length > 0 && recommendations.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Recommended For You (Matching Your Weak Topics)
              </h2>
            </div>
            <div className="text-[11px] text-cyan-300">
              Targeting:{" "}
              <strong>
                {topWeakTopics.map((t) => t.topicName).join(", ")}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((rec) => (
              <a
                key={rec.id}
                href={rec.url}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-slate-800 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold capitalize text-slate-300">
                      {getTypeIcon(rec.type)}
                      {rec.type}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-cyan-400">
                      {rec.difficulty}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {rec.title}
                  </h4>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px] text-indigo-300 font-medium">
                    {rec.topics.map((t: any) => t.name).join(", ")}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-3">
        <select
          value={selectedTopicId}
          onChange={(e) => setSelectedTopicId(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Resource Formats</option>
          <option value="sheet">Curated Sheet / Checklist</option>
          <option value="video">Lecture / Walkthrough Video</option>
          <option value="article">Article & Primer</option>
          <option value="course">Full Academic Course</option>
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="medium">Intermediate</option>
          <option value="hard">Advanced</option>
        </select>

        {(selectedTopicId || selectedType || selectedDifficulty) && (
          <button
            onClick={() => {
              setSelectedTopicId("");
              setSelectedType("");
              setSelectedDifficulty("");
            }}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((res) => (
          <div
            key={res.id}
            className={`glass-panel p-5 rounded-2xl border ${
              !res.verified
                ? "border-amber-500/40 bg-amber-950/10 shadow-lg shadow-amber-950/20"
                : "border-slate-800 hover:border-slate-700"
            } transition-all flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold capitalize text-slate-300">
                  {getTypeIcon(res.type)}
                  {res.type}
                </span>
                <div className="flex items-center gap-1.5">
                  {!res.verified && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                  )}
                  {res.verified && user?.role === "admin" && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      res.difficulty === "beginner"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : res.difficulty === "hard"
                        ? "bg-rose-500/10 text-rose-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {res.difficulty}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-2 leading-snug">
                {res.title}
              </h3>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {res.topics.map((t: any) => (
                  <span
                    key={t.id}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              {/* Admin Moderation Actions */}
              {user?.role === "admin" && (
                <div className="mb-3 pt-2 pb-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Moderation:</span>
                  <div className="flex items-center gap-2">
                    {!res.verified ? (
                      <button
                        onClick={() => handleVerifyResource(res.id, true)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-[11px] flex items-center gap-1 border border-emerald-500/30 transition-all"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerifyResource(res.id, false)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 font-medium text-[11px] flex items-center gap-1 border border-slate-700 transition-all"
                        title="Revoke public approval"
                      >
                        <X className="w-3 h-3" /> Revoke
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Added by {res.addedBy?.name || "Placement Cell"}
                </span>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  Access Resource
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              Share Placement Resource
            </h3>
            <form onSubmit={handleAddResource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resource Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="e.g. Striver's SDE Sheet 2026"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL Link
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Format
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="sheet">Curated Sheet</option>
                    <option value="video">Video Walkthrough</option>
                    <option value="article">Article / Primer</option>
                    <option value="course">Complete Course</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Canonical Topic
                </label>
                <select
                  value={newTopicId}
                  onChange={(e) => setNewTopicId(e.target.value)}
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

              {user?.role !== "admin" && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Student submissions undergo review by placement coordinators before becoming visible to the campus.
                  </span>
                </div>
              )}

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
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-600/20"
                >
                  {user?.role === "admin" ? "Publish Resource" : "Submit for Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Resources...</div>}>
      <ResourcesContent />
    </React.Suspense>
  );
}
