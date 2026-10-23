"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import { Sparkles, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

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
    <div className="max-w-sm mx-auto my-12">
      <div className="text-center mb-6">
        <div className="inline-flex p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 mb-3">
          <Sparkles className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">Sign In</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Access your preparation dashboard & analytics
        </p>
      </div>

      {/* Quick Demo Logins Box */}
      <div className="mb-4 p-3 rounded-xl border border-white/[0.06] bg-zinc-900/30">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          One-Click Demo Access
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo("student@placement.edu", "Student@12345")}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-white/[0.04] transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            Student Demo
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("admin@placement.edu", "Admin@12345")}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-white/[0.04] transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Admin Demo
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/[0.06] shadow-xl">
        {error && (
          <div className="mb-3.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 text-xs"
              placeholder="you@campus.edu"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 text-xs"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-sm shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            {isLoading ? "Signing in..." : "Sign In"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-500">
          New student?{" "}
          <Link href="/register" className="text-amber-400 hover:text-amber-300 font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
