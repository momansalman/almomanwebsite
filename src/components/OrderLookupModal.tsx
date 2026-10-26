"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  ExternalLink,
  Phone,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getActiveOrder,
  getRecentOrders,
  ActiveOrderSession,
} from "@/lib/orderTrackingStorage";

interface OrderLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderLookupModal({ isOpen, onClose }: OrderLookupModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveOrderSession | null>(null);
  const [recentHistory, setRecentHistory] = useState<ActiveOrderSession[]>([]);

  useEffect(() => {
    if (isOpen) {
      setActiveSession(getActiveOrder());
      setRecentHistory(getRecentOrders());
      setSearchResults(null);
      setSearchError(null);
    }
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setSearching(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const res = await fetch(`/api/orders/lookup?query=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lookup failed. Please check your query.");
      }

      if (!data.orders || data.orders.length === 0) {
        setSearchError("No orders found matching this order number or phone number.");
      } else {
        setSearchResults(data.orders);
      }
    } catch (err: any) {
      setSearchError(err.message || "Failed to find order.");
    } finally {
      setSearching(false);
    }
  };

  const navigateToOrder = (orderId: string) => {
    onClose();
    router.push(`/order-tracking/${orderId}`);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "confirmed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/50">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Confirmed
        </span>
      );
    }
    if (s === "preparing") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-500/50">
          <Package className="w-3 h-3 text-blue-400" /> In Kitchen
        </span>
      );
    }
    if (s === "ready" || s === "out for delivery") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-500/50">
          <Truck className="w-3 h-3 text-purple-400" /> Out for Delivery
        </span>
      );
    }
    if (s === "delivered") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
          Delivered
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/50">
        <Clock className="w-3 h-3 text-amber-400 animate-spin" /> Pending Approval
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Track Your Order</h3>
                <p className="text-xs text-zinc-400">AL-MOMAN Frozen Foods Live Tracking</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 block">
                Order Number or Mobile / WhatsApp Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. ALM-20261019-XXXX or 03371691006"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition pr-24"
                />
                <button
                  type="submit"
                  disabled={searching || !query.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                >
                  {searching ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      Find
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Enter your order ID from SMS/WhatsApp or the phone number used at checkout.
              </p>
            </form>

            {/* Search Error */}
            {searchError && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Search Results ({searchResults.length})
                </h4>
                <div className="space-y-2">
                  {searchResults.map((ord) => (
                    <button
                      key={ord.id}
                      onClick={() => navigateToOrder(ord.id)}
                      className="w-full text-left p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-850 border border-emerald-500/40 hover:border-emerald-500 transition group flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-black text-white group-hover:text-emerald-400 transition">
                            #{ord.orderNumber}
                          </span>
                          {getStatusBadge(ord.orderStatus)}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {ord.customerName} • Rs. {Number(ord.totalAmount).toLocaleString()} • {ord.itemCount} items
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Currently Active Order Session on This Device */}
            {activeSession && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                      Active Order on This Device
                    </span>
                  </div>
                  {getStatusBadge(activeSession.status)}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm font-black text-white">
                      #{activeSession.orderNumber}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {activeSession.customerName} • Rs. {Number(activeSession.totalAmount).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => navigateToOrder(activeSession.orderId)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-black rounded-xl transition shadow flex items-center gap-1.5"
                  >
                    <span>View Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Recent Orders on this Device */}
            {recentHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Recent Orders on this Device
                </h4>
                <div className="space-y-1.5">
                  {recentHistory.map((h) => (
                    <button
                      key={h.orderId}
                      onClick={() => navigateToOrder(h.orderId)}
                      className="w-full text-left p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-300">
                          #{h.orderNumber}
                        </span>
                        {getStatusBadge(h.status)}
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Rs. {Number(h.totalAmount).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3.5 border-t border-zinc-800 bg-zinc-950/60 text-center text-[11px] text-zinc-500">
            Need urgent assistance? WhatsApp helpline:{" "}
            <a
              href="https://wa.me/923371691006"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 font-bold hover:underline"
            >
              0337-1691006
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
