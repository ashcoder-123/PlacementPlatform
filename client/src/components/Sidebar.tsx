"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Code2,
  BookOpen,
  Sparkles,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Companies", href: "/companies", icon: Building2 },
    { name: "Coding Tracker", href: "/coding", icon: Code2 },
    { name: "Resume Hub", href: "/resumes", icon: FileText },
    { name: "Resource Library", href: "/resources", icon: BookOpen },
    { name: "AI Prep Lab", href: "/ai-lab", icon: Sparkles },
  ];

  const NavContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06]">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-sm shadow-md shadow-amber-500/10 transition-transform group-hover:scale-105">
              P
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Placement<span className="text-amber-400 font-semibold">OS</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">
                Intelligence Engine
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
            Navigation
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-amber-400/10 text-amber-300 border border-amber-400/20 font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-amber-400"
                        : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />
                  <span>{link.name}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User info / Auth Section */}
      <div className="p-4 border-t border-white/[0.06]">
        {user ? (
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.05]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-200 truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-md transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center py-2 px-3 text-xs font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center py-2 px-3 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors shadow-sm shadow-amber-500/20"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 h-14 bg-[#0c0c0e]/90 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-xs">
            P
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            Placement<span className="text-amber-400">OS</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0c0c0e] border-r border-white/[0.06] transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {NavContent}
      </aside>

      {/* Desktop Fixed Side Navbar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 shrink-0 bg-[#0c0c0e] border-r border-white/[0.06]">
        {NavContent}
      </aside>
    </>
  );
}
