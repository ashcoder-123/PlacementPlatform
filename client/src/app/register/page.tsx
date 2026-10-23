"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import { UserPlus, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState("Computer Science");
  const [graduationYear, setGraduationYear] = useState(2026);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
        branch,
        graduationYear: Number(graduationYear),
      });
      login(res.data.token, res.data.user);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto my-10">
      <div className="text-center mb-6">
        <div className="inline-flex p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 mb-3">
          <UserPlus className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">Create Profile</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Begin your targeted placement preparation
        </p>
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
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 text-xs"
              placeholder="Candidate Name"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Campus Email
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

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Branch / Dept
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Grad Year
              </label>
              <input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                min={2020}
                max={2035}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>
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
              minLength={6}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 text-xs"
              placeholder="Min 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-sm shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            {isLoading ? "Creating Profile..." : "Register"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-500">
          Already registered?{" "}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
