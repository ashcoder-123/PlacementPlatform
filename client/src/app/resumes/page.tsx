"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Calendar,
  X,
  ArrowRight,
} from "lucide-react";

export default function ResumesPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // New Target Resume Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileTitle, setProfileTitle] = useState("");
  const [profileRole, setProfileRole] = useState("Software Development Engineer");

  // Version Upload State
  const [activeTab, setActiveTab] = useState<"pdf" | "paste">("pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  useEffect(() => {
    if (user) {
      loadResumes();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadResumes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/resumes");
      const list = res.data.resumes || [];
      setResumes(list);
      if (list.length > 0 && !selectedResumeId) {
        setSelectedResumeId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load resumes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/resumes", {
        title: profileTitle,
        targetRole: profileRole,
      });
      setIsProfileModalOpen(false);
      setProfileTitle("");
      await loadResumes();
      setSelectedResumeId(res.data.resume.id);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create resume profile");
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeId) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      if (activeTab === "pdf") {
        if (!selectedFile) {
          setUploadError("Please choose a PDF file to upload.");
          setUploading(false);
          return;
        }
        formData.append("file", selectedFile);
      } else {
        if (!pastedText.trim() || pastedText.trim().length < 20) {
          setUploadError("Please provide at least 20 characters of resume content.");
          setUploading(false);
          return;
        }
        formData.append("pastedText", pastedText);
      }

      await api.post(`/resumes/${selectedResumeId}/versions`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadSuccess("Version stored and parsed successfully!");
      setSelectedFile(null);
      setPastedText("");
      loadResumes();
    } catch (err: any) {
      setUploadError(
        err.response?.data?.error ||
          "Failed to upload or parse resume version."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm("Are you sure you want to delete this resume version?")) return;
    try {
      await api.delete(`/resumes/versions/${versionId}`);
      loadResumes();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete version");
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-white/[0.06] max-w-md mx-auto my-12">
        <FileText className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-5">
          Sign in to manage role-specific resumes and execute AI reviews.
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

  const activeResume = resumes.find((r) => r.id === selectedResumeId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Resume Hub
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Role-tailored versions with automatic text extraction and AI rubric scoring
          </p>
        </div>

        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-sm shadow-amber-500/20 transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Role Profile
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="p-10 text-center rounded-xl bg-zinc-900/20 border border-dashed border-white/[0.06]">
          <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Profiles Configured</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto mb-4">
            Add a target role profile (e.g., SDE 1, Frontend) to store version iterations.
          </p>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-semibold"
          >
            Create Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Target Profiles */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-1">
              Target Profiles
            </h3>
            <div className="space-y-2">
              {resumes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResumeId(r.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedResumeId === r.id
                      ? "bg-amber-400/10 border-amber-400/30 text-white font-medium"
                      : "bg-zinc-900/30 border-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-xs truncate text-white">{r.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      v{r.versions.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-400/80">{r.targetRole}</p>
                </button>
              ))}
            </div>

            {/* Upload New Version Card */}
            {activeResume && (
              <div className="p-4 rounded-xl bg-zinc-900/30 border border-white/[0.05] mt-6">
                <h4 className="text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  Add Version
                </h4>
                <p className="text-[11px] text-zinc-500 mb-3">
                  Target: <strong className="text-zinc-300">{activeResume.targetRole}</strong>
                </p>

                {/* Tab switch */}
                <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-lg mb-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("pdf")}
                    className={`py-1 rounded font-medium text-[11px] transition-colors ${
                      activeTab === "pdf"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    PDF Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("paste")}
                    className={`py-1 rounded font-medium text-[11px] transition-colors ${
                      activeTab === "paste"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Paste Text
                  </button>
                </div>

                {uploadError && (
                  <div className="p-2 mb-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {uploadError}
                  </div>
                )}

                {uploadSuccess && (
                  <div className="p-2 mb-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    {uploadSuccess}
                  </div>
                )}

                <form onSubmit={handleUploadVersion} className="space-y-3">
                  {activeTab === "pdf" ? (
                    <div>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-zinc-400 file:mr-2.5 file:py-1.5 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div>
                      <textarea
                        rows={4}
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste resume content here..."
                        className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 font-mono"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs disabled:opacity-50 transition-colors"
                  >
                    {uploading ? "Parsing..." : "Save Version"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Version History */}
          <div className="lg:col-span-2 space-y-3">
            {activeResume ? (
              <>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 font-medium">
                  <span>{activeResume.title} Iterations</span>
                  <span>{activeResume.versions.length} Version(s)</span>
                </div>

                {activeResume.versions.map((ver: any) => (
                  <div
                    key={ver.id}
                    className="p-4 rounded-xl bg-zinc-900/30 border border-white/[0.05] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/[0.04] flex items-center justify-center font-bold text-xs text-amber-400">
                          v{ver.versionNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white">
                              Version {ver.versionNumber}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              {ver.fileUrl ? "PDF" : "Text"}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(ver.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/ai-lab?resumeVersionId=${ver.id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          AI Review
                        </Link>
                        <button
                          onClick={() => handleDeleteVersion(ver.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete Version"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Extracted Text Snippet */}
                    <div className="p-3 rounded-lg bg-black/50 border border-white/[0.03]">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                        <span>Extracted Text ({ver.extractedText.length} chars)</span>
                      </div>
                      <pre className="text-[11px] text-zinc-400 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                        {ver.extractedText}
                      </pre>
                    </div>

                    {/* Latest Review badge if exists */}
                    {ver.reviews && ver.reviews.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-amber-400/20 flex items-center justify-between text-xs">
                        <span className="text-zinc-300 text-[11px]">
                          AI Evaluation Score:{" "}
                          <strong className="text-amber-400">
                            {ver.reviews[0].overallScore}/100
                          </strong>
                        </span>
                        <Link
                          href={`/ai-lab?resumeVersionId=${ver.id}`}
                          className="text-amber-400 hover:text-amber-300 text-[11px] font-medium flex items-center gap-1"
                        >
                          View Breakdown <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="p-8 text-center rounded-xl bg-zinc-900/20 text-zinc-500 text-xs">
                Select a target profile to view versions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121214] p-6 rounded-2xl border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                New Role Profile
              </h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Profile Title</label>
                <input
                  type="text"
                  value={profileTitle}
                  onChange={(e) => setProfileTitle(e.target.value)}
                  required
                  placeholder="e.g. SDE 1 Campus Resume"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Target Role</label>
                <input
                  type="text"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  required
                  placeholder="e.g. Software Development Engineer"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
