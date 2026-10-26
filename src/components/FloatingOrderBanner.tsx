"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, ArrowRight, X, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getActiveOrder,
  subscribeToActiveOrder,
  ActiveOrderSession,
} from "@/lib/orderTrackingStorage";

export default function FloatingOrderBanner() {
  const pathname = usePathname();
  const [activeOrder, setActiveOrder] = useState<ActiveOrderSession | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setActiveOrder(getActiveOrder());

    const unsub = subscribeToActiveOrder((session) => {
      setActiveOrder(session);
      setDismissed(false); // Re-show on new updates
    });

    return () => unsub();
  }, []);

  // Don't show banner if user is already on tracking or checkout pages
  const isTrackingOrCheckout =
    pathname.startsWith("/order-tracking") ||
    pathname.startsWith("/track") ||
    pathname.startsWith("/checkout");

  if (!mounted || !activeOrder || dismissed || isTrackingOrCheckout) {
    return null;
  }

  const getStatusText = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "confirmed") return "Order Confirmed";
    if (s === "preparing") return "Preparing in Kitchen";
    if (s === "ready") return "Ready for Pickup / Out";
    return "Order Received";
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        aria-label="Active Order Tracking Banner"
        className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-40 max-w-md w-auto"
      >
        <div className="bg-zinc-900/95 backdrop-blur-md border-2 border-emerald-500/70 rounded-2xl p-3.5 sm:p-4 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 text-xs">
          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-white font-bold">
                  #{activeOrder.orderNumber}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                {getStatusText(activeOrder.status)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/order-tracking/${activeOrder.orderId}`}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl transition shadow flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Track Live</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
