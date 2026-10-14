"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.token, res.data.user);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email: demoEmail, password: demoPass });
      login(res.data.token, res.data.user);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Quick login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
        <p className="text-sm text-slate-400 mt-1">
          Access your placement dashboard, weak-topic analytics & AI tools
        </p>
      </div>

      {/* Quick Demo Logins Box */}
      <div className="mb-6 p-4 rounded-xl border border-blue-500/30 bg-blue-950/20">
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2.5">
          🚀 One-Click Demo Access
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo("student@placement.edu", "Student@12345")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            Demo Student
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("admin@placement.edu", "Admin@12345")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/30 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Demo Admin
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl shadow-xl">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder="you@campus.edu"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {isLoading ? "Signing in..." : "Sign In"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          New here?{" "}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
            Create a student account
          </Link>
        </p>
      </div>
    </div>
  );
}
