"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, User as UserIcon, AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { useAdminStore } from "@/store/useAdminStore";
import Image from "next/image";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAdmin } = useAdminStore();

  const performLogin = async (u: string, p: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Admin authentication failed");
      }

      if (data.admin) {
        setAdmin(data.admin);
      }
      window.location.href = "/admin";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Access denied");
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(username, password);
  };

  const handleQuickOwnerFill = () => {
    setUsername("momansalman");
    setPassword("momansalman0098");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Dedicated Admin Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400/60 shrink-0 bg-black shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand-logo.png"
              alt="Al Moman Frozen Foods Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-black text-xs sm:text-sm tracking-wide text-white block">
              AL MOMAN FROZEN FOODS
            </span>
            <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
              Admin &amp; Management Portal
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full bg-zinc-900/95 rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-2xl shadow-black/90">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-emerald-400 mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Storefront
          </Link>

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400/60 shadow-xl shadow-black mx-auto mb-3 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand-logo.png"
                alt="Al Moman Frozen Foods Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
              Store Owner & Admin Portal
            </span>
            <h1 className="text-2xl font-black text-white mt-2">Admin Login</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Sign in with store owner credentials to access member records, menu items, and customer orders.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Admin Username or Phone
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="momansalman, admin, or 03371691006"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Admin Password or PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter admin password or PIN"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-sm shadow-xl shadow-emerald-950 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? "Verifying Credentials..." : "Sign In to Admin Portal"}
            </button>
          </form>

          {/* Quick Helper for Owner */}
          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <button
              type="button"
              onClick={handleQuickOwnerFill}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition"
            >
              <KeyRound className="w-3.5 h-3.5" /> Quick Fill Owner Login
            </button>

            <Link href="/login" className="text-zinc-500 hover:text-zinc-400">
              Customer Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
