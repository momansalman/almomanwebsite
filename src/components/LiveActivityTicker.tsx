"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Activity {
  customer: string;
  location: string;
  item: string;
  timeAgo: string;
}

const ACTIVITIES: Activity[] = [
  { customer: "Hamza K.", location: "Model Town, Gujranwala", item: "2x Chicken Samosa", timeAgo: "2 mins ago" },
  { customer: "Zainab A.", location: "Satellite Town, Gujranwala", item: "1x Beef Kebab & 1x Spring Rolls", timeAgo: "5 mins ago" },
  { customer: "Usman M.", location: "DC Colony, Gujranwala", item: "3x Chicken Patties", timeAgo: "9 mins ago" },
  { customer: "Fatima S.", location: "Cantt, Gujranwala", item: "1x Chapli Kebab & 1x Paratha", timeAgo: "14 mins ago" },
  { customer: "Bilal T.", location: "Wapda Town, Gujranwala", item: "2x Nuggets (Family Pack)", timeAgo: "18 mins ago" },
  { customer: "Ayesha R.", location: "Peoples Colony, Gujranwala", item: "2x Aloo Samosa & 1x Spring Rolls", timeAgo: "24 mins ago" },
];

export default function LiveActivityTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    // Show first notification after 4 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Rotate every 16 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ACTIVITIES.length);
        setIsVisible(true);
      }, 800);
    }, 16000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isDismissed]);

  if (isDismissed || !isVisible) return null;

  const current = ACTIVITIES[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.95 }}
        transition={{ type: "spring", damping: 22, stiffness: 240 }}
        className="fixed bottom-24 left-4 z-40 max-w-xs sm:max-w-sm"
      >
      <div className="bg-zinc-900/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-3 sm:p-3.5 shadow-2xl shadow-black/80 flex items-center gap-3">
        {/* Pulse Icon */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-zinc-950" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/60">
              Verified Order
            </span>
            <span className="text-[10px] text-zinc-500">• {current.timeAgo}</span>
          </div>
          <p className="text-xs font-bold text-white truncate mt-0.5">
            {current.customer} <span className="text-zinc-400 font-normal">from {current.location}</span>
          </p>
          <p className="text-[11px] text-emerald-300 font-medium truncate">
            Ordered <strong className="text-white">{current.item}</strong>
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="text-zinc-500 hover:text-zinc-300 p-1 shrink-0"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  </AnimatePresence>
  );
}
