"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Phone, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Navbar from "@/components/Navbar";
import GoogleAccountChooserModal from "@/components/GoogleAccountChooserModal";
import PhoneInput from "@/components/PhoneInput";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);

  const router = useRouter();
  const { setUser } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/90 rounded-3xl p-8 border border-zinc-800 shadow-2xl shadow-black/80">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-emerald-400 mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400/60 shadow-xl shadow-black mx-auto mb-3 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand-logo.png"
                alt="Al Moman Frozen Foods Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-black text-white">Customer Sign In</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Enter your name and phone number to sign in. No password required!
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsGoogleChooserOpen(true);
            }}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2.5 shadow-md cursor-pointer disabled:opacity-50 mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-500 font-bold">Or sign in with Name &amp; Phone</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Ali"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-zinc-500"
                />
              </div>
            </div>

            <PhoneInput
              value={phone}
              onChange={(val) => setPhone(val)}
              label="WhatsApp / Phone Number"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-sm shadow-xl shadow-emerald-950 transition flex items-center justify-center gap-2"
            >
              <span>{loading ? "Signing in..." : "Sign In & Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Frictionless Sign In • Your order receipt will be sent to your WhatsApp</span>
          </div>
        </div>
      </div>

      {/* Authentic Google Account Chooser Modal */}
      <GoogleAccountChooserModal
        isOpen={isGoogleChooserOpen}
        onClose={() => setIsGoogleChooserOpen(false)}
        onSuccess={() => {
          setIsGoogleChooserOpen(false);
          router.push("/");
        }}
      />
    </div>
  );
}
