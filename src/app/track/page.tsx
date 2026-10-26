"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  Truck,
  Clock,
  CheckCircle2,
  Package,
  ArrowRight,
  AlertCircle,
  Sparkles,
  PhoneCall,
  MessageCircle,
} from "lucide-react";
import {
  getActiveOrder,
  getRecentOrders,
  ActiveOrderSession,
} from "@/lib/orderTrackingStorage";

export default function TrackLandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveOrderSession | null>(null);
  const [recentHistory, setRecentHistory] = useState<ActiveOrderSession[]>([]);

  useEffect(() => {
    setActiveSession(getActiveOrder());
    setRecentHistory(getRecentOrders());
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setSearching(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`/api/orders/lookup?query=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Order lookup failed.");
      }

      if (!data.orders || data.orders.length === 0) {
        setError("No orders found matching this order number or phone number.");
      } else {
        setResults(data.orders);
      }
    } catch (err: any) {
      setError(err.message || "Failed to find order.");
    } finally {
      setSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "confirmed") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/50">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Confirmed
        </span>
      );
    }
    if (s === "preparing") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-400 border border-blue-500/50">
          <Package className="w-3.5 h-3.5 text-blue-400" /> In Kitchen
        </span>
      );
    }
    if (s === "ready" || s === "out for delivery") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-950 text-purple-400 border border-purple-500/50">
          <Truck className="w-3.5 h-3.5 text-purple-400" /> Ready / Dispatched
        </span>
      );
    }
    if (s === "delivered") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
          Delivered
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-500/50">
        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" /> Pending Approval
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 text-xs font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AL-MOMAN Live Tracking Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Track Your Frozen Food Order
          </h1>

          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            Check the live kitchen and dispatch status of your samosas, rolls, and kebabs in real time.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <form onSubmit={handleSearch} className="space-y-4">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Search by Order Number or Mobile Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. ALM-20261019-XXXX or 03371691006"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-2xl px-5 py-4 text-sm text-white placeholder-zinc-500 focus:outline-none transition pr-32"
              />
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="absolute right-2 top-2 bottom-2 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-black text-xs rounded-xl transition flex items-center gap-2 shadow-lg"
              >
                {searching ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Tip: You can use your 11-digit WhatsApp phone number to find all recent orders placed with AL-MOMAN.
            </p>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Search Results */}
          {results && results.length > 0 && (
            <div className="mt-6 space-y-3 pt-6 border-t border-zinc-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Matching Orders ({results.length})
              </h3>
              <div className="space-y-2">
                {results.map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/order-tracking/${ord.id}`}
                    className="p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-850 border border-emerald-500/40 hover:border-emerald-500 transition group flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-black text-white group-hover:text-emerald-400 transition">
                          #{ord.orderNumber}
                        </span>
                        {getStatusBadge(ord.orderStatus)}
                      </div>
                      <p className="text-xs text-zinc-400">
                        {ord.customerName} • Rs. {Number(ord.totalAmount).toLocaleString()} • {ord.itemCount} items
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Order on this Device */}
        {activeSession && (
          <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  Active Order Found On This Device
                </span>
              </div>
              {getStatusBadge(activeSession.status)}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-mono text-lg font-black text-white">
                  #{activeSession.orderNumber}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Placed for {activeSession.customerName} • Total: Rs. {Number(activeSession.totalAmount).toLocaleString()}
                </p>
              </div>

              <Link
                href={`/order-tracking/${activeSession.orderId}`}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl transition shadow-lg flex items-center gap-2"
              >
                <span>Open Live Tracking</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Recent Orders History */}
        {recentHistory.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              Recent Order Sessions
            </h3>
            <div className="space-y-2">
              {recentHistory.map((h) => (
                <Link
                  key={h.orderId}
                  href={`/order-tracking/${h.orderId}`}
                  className="p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition flex items-center justify-between group text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-zinc-200 group-hover:text-emerald-400 transition">
                      #{h.orderNumber}
                    </span>
                    {getStatusBadge(h.status)}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 font-mono">
                      Rs. {Number(h.totalAmount).toLocaleString()}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Direct Helpline Assistance */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between flex-wrap gap-4 text-xs">
          <div>
            <p className="font-bold text-white">Can&apos;t find your order details?</p>
            <p className="text-zinc-400 mt-0.5">Contact AL-MOMAN customer support directly on WhatsApp.</p>
          </div>
          <a
            href="https://wa.me/923371691006?text=Hello%20AL-MOMAN%20Frozen%20Foods!%20Need%20help%20tracking%20my%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-zinc-800 hover:bg-emerald-950 hover:text-emerald-400 border border-zinc-700 hover:border-emerald-600 rounded-xl font-bold transition flex items-center gap-2 text-zinc-200"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>0337-1691006</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
