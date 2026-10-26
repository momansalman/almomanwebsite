"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Phone, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Navbar from "@/components/Navbar";
import PhoneInput from "@/components/PhoneInput";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { setUser } = useAuthStore();

  const handleSignup = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setUser(data.user);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 py-10">
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
            <h1 className="text-2xl font-black text-white">Join as Member</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Enter your name and phone number to sign in or register instantly. No password required!
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
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
              <span>{loading ? "Registering..." : "Continue to Store"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Frictionless Sign In • Your order receipt will be sent to your WhatsApp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
