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
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Calendar,
  ExternalLink,
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

      setUploadSuccess("New version stored and parsed successfully!");
      setSelectedFile(null);
      setPastedText("");
      loadResumes();
    } catch (err: any) {
      setUploadError(
        err.response?.data?.error ||
          "Failed to upload or parse resume version. For scanned PDFs, use the Paste Text tab."
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
      <div className="p-12 text-center glass-panel rounded-2xl max-w-lg mx-auto">
        <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Authentication Required</h2>
        <p className="text-sm text-slate-400 mt-2 mb-6">
          Please log in to manage your resume versions and run automated rubric reviews.
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

  const activeResume = resumes.find((r) => r.id === selectedResumeId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">Resume Version Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain role-tailored resume versions, extract text automatically via pdf-parse, and send to the AI Reviewer.
          </p>
        </div>

        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Target Role Profile
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl">
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Resume Profiles Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto mb-4">
            Create your first target role profile (e.g. SDE 1, Frontend Engineer, Data Analyst) to start version tracking.
          </p>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
          >
            Create Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Target Profiles */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Target Role Profiles
            </h3>
            <div className="space-y-2">
              {resumes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResumeId(r.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedResumeId === r.id
                      ? "bg-indigo-600/20 border-indigo-500/50 shadow-md text-white"
                      : "glass-panel border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm truncate">{r.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      v{r.versions.length}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-300 font-medium">{r.targetRole}</p>
                </button>
              ))}
            </div>

            {/* Upload New Version Card */}
            {activeResume && (
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 mt-6">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  Add New Version
                </h4>
                <p className="text-[11px] text-slate-400 mb-4">
                  Target: <strong className="text-white">{activeResume.targetRole}</strong>
                </p>

                {/* Tab switch */}
                <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg mb-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("pdf")}
                    className={`py-1.5 rounded-md font-medium transition-colors ${
                      activeTab === "pdf"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    PDF Upload (5MB)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("paste")}
                    className={`py-1.5 rounded-md font-medium transition-colors ${
                      activeTab === "paste"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Paste Text
                  </button>
                </div>

                {uploadError && (
                  <div className="p-2.5 mb-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {uploadError}
                  </div>
                )}

                {uploadSuccess && (
                  <div className="p-2.5 mb-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
                        className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-300 hover:file:bg-indigo-600/30 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Parsed with backend pdf-parse buffer extractor.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        rows={5}
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste resume content here for scanned or non-standard PDF formats..."
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
                  >
                    {uploading ? "Extracting & Storing..." : "Save Next Version"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Version History & Extracted Text */}
          <div className="lg:col-span-2 space-y-4">
            {activeResume ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>
                    Version History for <strong className="text-white">{activeResume.title}</strong>
                  </span>
                  <span>{activeResume.versions.length} Version(s)</span>
                </div>

                {activeResume.versions.map((ver: any) => (
                  <div
                    key={ver.id}
                    className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-sm text-indigo-400">
                          v{ver.versionNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              Version {ver.versionNumber}
                            </span>
                            {ver.fileUrl ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                PDF Uploaded
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                Pasted Text
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(ver.createdAt).toLocaleDateString()} at{" "}
                            {new Date(ver.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/ai-lab?resumeVersionId=${ver.id}`}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Rubric Review
                        </Link>
                        <button
                          onClick={() => handleDeleteVersion(ver.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Version"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Extracted Text Snippet */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                        <span className="font-medium text-slate-300">
                          Extracted Text Layer ({ver.extractedText.length} characters)
                        </span>
                        <span>Backend Parsed</span>
                      </div>
                      <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                        {ver.extractedText}
                      </pre>
                    </div>

                    {/* Latest Review badge if exists */}
                    {ver.reviews && ver.reviews.length > 0 && (
                      <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span className="text-slate-300">
                            Last AI Evaluation: Score{" "}
                            <strong className="text-white">
                              {ver.reviews[0].overallScore}/100
                            </strong>
                          </span>
                        </div>
                        <Link
                          href={`/ai-lab?resumeVersionId=${ver.id}`}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          View Breakdown & Rewrites →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="p-8 text-center glass-panel rounded-2xl text-slate-400 text-sm">
                Select or create a target profile to view versions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              New Target Role Profile
            </h3>
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Profile Title
                </label>
                <input
                  type="text"
                  value={profileTitle}
                  onChange={(e) => setProfileTitle(e.target.value)}
                  required
                  placeholder="e.g. SDE 1 Campus Resume"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Role
                </label>
                <input
                  type="text"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  required
                  placeholder="e.g. Software Development Engineer"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
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
