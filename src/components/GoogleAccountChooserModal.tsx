"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export interface GoogleAccount {
  name: string;
  email: string;
  avatarColor?: string;
  picture?: string;
}

const DEFAULT_ACCOUNTS: GoogleAccount[] = [
  {
    name: "Moman Salman",
    email: "momansalman@almomanfoods.com",
    avatarColor: "bg-emerald-600",
  },
  {
    name: "Moman Salman (Personal)",
    email: "momansalman0098@gmail.com",
    avatarColor: "bg-blue-600",
  },
];

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GoogleAccountChooserModal({
  isOpen,
  onClose,
  onSuccess,
}: GoogleAccountChooserModalProps) {
  const { setUser } = useAuthStore();
  const [accounts, setAccounts] = useState<GoogleAccount[]>(DEFAULT_ACCOUNTS);
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccount | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("almoman_google_accounts");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAccounts(parsed);
          }
        }
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemoveAccount = (e: React.MouseEvent, emailToRemove: string) => {
    e.stopPropagation();
    const updated = accounts.filter((a) => a.email !== emailToRemove);
    setAccounts(updated);
    try {
      localStorage.setItem("almoman_google_accounts", JSON.stringify(updated));
    } catch {}
  };

  const handleSelectAccount = async (account: GoogleAccount) => {
    setSelectedAccount(account);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: account.name,
          email: account.email,
          picture: account.picture,
          phone: "0337-1691006",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }

      // Save to recently used Google accounts
      try {
        const updated = [account, ...accounts.filter((a) => a.email !== account.email)].slice(0, 5);
        setAccounts(updated);
        localStorage.setItem("almoman_google_accounts", JSON.stringify(updated));
      } catch {}

      setUser(data.user);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google account");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setError("Please enter a valid Google/Gmail email address");
      return;
    }

    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanName =
      newName.trim() ||
      cleanEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const colors = [
      "bg-emerald-600",
      "bg-blue-600",
      "bg-purple-600",
      "bg-rose-600",
      "bg-amber-600",
      "bg-teal-600",
    ];
    const newAcc: GoogleAccount = {
      name: cleanName,
      email: cleanEmail,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    };

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: newPhone.trim() || "0337-1691006",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }

      // Save to list
      try {
        const updated = [newAcc, ...accounts.filter((a) => a.email !== newAcc.email)].slice(0, 5);
        setAccounts(updated);
        localStorage.setItem("almoman_google_accounts", JSON.stringify(updated));
      } catch {}

      setUser(data.user);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add Google account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white text-zinc-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200">
        {/* Top Header */}
        <div className="p-6 pb-4 border-b border-zinc-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Google Multi-color 'G' Logo */}
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
            <div>
              <h2 className="text-xl font-bold text-zinc-900 leading-snug">
                Choose an account
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                to continue to <strong className="text-zinc-800">Al Moman Frozen Foods</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 pt-4 space-y-2">
          {!isAddingNew ? (
            <>
              {/* Account List */}
              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden">
                {accounts.map((acc) => {
                  const initial = (acc.name || acc.email || "G").charAt(0).toUpperCase();
                  const isSelected = selectedAccount?.email === acc.email && loading;

                  return (
                    <div
                      key={acc.email}
                      className="w-full flex items-center justify-between hover:bg-zinc-50 transition group p-1 pr-3"
                    >
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleSelectAccount(acc)}
                        className="flex items-center gap-3 min-w-0 flex-1 p-2 text-left cursor-pointer"
                      >
                        {/* Avatar */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm ${
                            acc.avatarColor || "bg-emerald-600"
                          }`}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="text-sm font-bold text-zinc-900 truncate group-hover:text-emerald-700 transition">
                            {acc.name}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">{acc.email}</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected ? (
                          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : (
                          <>
                            <button
                              type="button"
                              title="Remove account from chooser"
                              onClick={(e) => handleRemoveAccount(e, acc.email)}
                              className="p-1.5 rounded-full text-zinc-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-600 transition" />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Option to Add / Use Another Account */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsAddingNew(true)}
                  className="w-full p-3.5 flex items-center gap-3 text-left hover:bg-zinc-50 transition cursor-pointer group text-zinc-700 hover:text-zinc-900"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 group-hover:bg-zinc-200 transition shrink-0">
                    <UserPlus className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">Use another account</p>
                    <p className="text-[11px] text-zinc-500">Sign in with a different Google account</p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            /* Add Another Account Form */
            <form onSubmit={handleAddNewAccount} className="space-y-3.5">
              <div className="pb-2 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-600" /> Enter Google Account Details
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Back to accounts
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Google Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.name@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Moman Salman"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Phone / WhatsApp Number (For order receipts)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0337-1691006"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Continue with this Account"}
                </button>
              </div>
            </form>
          )}

          {/* Privacy Disclaimer */}
          <div className="pt-4 text-center">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              To continue, Google will share your name, email address, and profile with Al Moman Frozen Foods.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
