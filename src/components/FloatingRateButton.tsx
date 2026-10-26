"use client";

import React from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

export default function FloatingRateButton() {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-rating-modal"));
    }
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      onClick={handleClick}
      className="fixed bottom-6 left-6 z-40 bg-zinc-900/95 hover:bg-zinc-800 text-amber-400 border-2 border-amber-500/60 shadow-2xl shadow-black/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 text-xs font-black transition cursor-pointer backdrop-blur-md"
      title="Give 5-Star Rating"
      aria-label="Rate Al Moman Frozen Foods"
    >
      <Star className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
      <span className="hidden sm:inline text-white">Rate Us</span>
      <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/80 font-mono">
        5★
      </span>
    </motion.button>
  );
}
