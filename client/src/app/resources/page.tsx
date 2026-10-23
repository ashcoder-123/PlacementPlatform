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

      const qList = qRes.data.questions || [];
      const topicMap = new Map();
      qList.forEach((q: any) => {
        if (q.topic) topicMap.set(q.topic.id, q.topic.name);
      });
      const tList = Array.from(topicMap.entries()).map(([id, name]) => ({ id, name }));
      setTopics(tList);
      if (tList.length > 0 && !newTopicId) setNewTopicId(tList[0].id);

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
            : "Resource submitted for admin review.")
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
        return <Video className="w-3.5 h-3.5 text-zinc-400" />;
      case "course":
        return <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />;
      case "sheet":
        return <FileCode className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <Bookmark className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Resource Library
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Curated sheets, walkthroughs, and roadmaps mapped to placement topics
          </p>
        </div>

        {user && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-sm shadow-amber-500/20 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Share Resource
          </button>
        )}
      </div>

      {/* Recommended for You Banner based on Weak-Topics */}
      {user && topWeakTopics.length > 0 && recommendations.length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-amber-400/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-semibold text-white">
                Recommended For Your Weak Topics
              </h2>
            </div>
            <div className="text-[10px] text-zinc-500">
              Focus: <span className="text-amber-400">{topWeakTopics.map((t) => t.topicName).join(", ")}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((rec) => (
              <a
                key={rec.id}
                href={rec.url}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-lg bg-black/40 border border-white/[0.04] hover:border-amber-400/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-medium capitalize text-zinc-400">
                      {getTypeIcon(rec.type)}
                      {rec.type}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-zinc-500">
                      {rec.difficulty}
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                    {rec.title}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-white/[0.03] flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="truncate pr-2">
                    {rec.topics.map((t: any) => t.name).join(", ")}
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-amber-400 transition-colors shrink-0" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-wrap items-center gap-2.5">
        <select
          value={selectedTopicId}
          onChange={(e) => setSelectedTopicId(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
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
          className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
        >
          <option value="">All Formats</option>
          <option value="sheet">Curated Sheet</option>
          <option value="video">Video Walkthrough</option>
          <option value="article">Article / Primer</option>
          <option value="course">Complete Course</option>
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
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
            className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {resources.map((res) => (
          <div
            key={res.id}
            className="p-4 rounded-xl bg-zinc-900/30 border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-[11px] font-medium capitalize text-zinc-400">
                  {getTypeIcon(res.type)}
                  {res.type}
                </span>
                <div className="flex items-center gap-1.5">
                  {!res.verified && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Pending
                    </span>
                  )}
                  <span
                    className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      res.difficulty === "beginner"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : res.difficulty === "hard"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {res.difficulty}
                  </span>
                </div>
              </div>

              <h3 className="text-xs font-semibold text-white mb-2 leading-snug">
                {res.title}
              </h3>

              <div className="flex flex-wrap gap-1 mb-3">
                {res.topics.map((t: any) => (
                  <span
                    key={t.id}
                    className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              {/* Admin Moderation Actions */}
              {user?.role === "admin" && (
                <div className="mb-2 pt-2 pb-2 px-2.5 rounded-lg bg-zinc-950 border border-white/[0.04] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-zinc-500">Moderation:</span>
                  <div className="flex items-center gap-1.5">
                    {!res.verified ? (
                      <button
                        onClick={() => handleVerifyResource(res.id, true)}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-medium"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerifyResource(res.id, false)}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-xs">
                <span className="text-[10px] text-zinc-500">
                  {res.addedBy?.name || "Placement Cell"}
                </span>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-medium flex items-center gap-1 transition-colors border border-white/[0.04]"
                >
                  Access
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121214] p-6 rounded-2xl border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Share Resource
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-3.5">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Resource Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="e.g. Dynamic Programming Masterclass"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">URL Link</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Format</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                  >
                    <option value="sheet">Curated Sheet</option>
                    <option value="video">Video Walkthrough</option>
                    <option value="article">Article / Primer</option>
                    <option value="course">Complete Course</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Topic</label>
                <select
                  value={newTopicId}
                  onChange={(e) => setNewTopicId(e.target.value)}
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
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
                >
                  {user?.role === "admin" ? "Publish" : "Submit"}
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
    <React.Suspense fallback={<div className="p-8 text-center text-zinc-500 text-xs">Loading Resources...</div>}>
      <ResourcesContent />
    </React.Suspense>
  );
}
