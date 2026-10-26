"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingCartBar() {
  const { items, isCartOpen, openCart, getTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = getTotal();

  // Only show if there are items and cart drawer is currently closed
  if (totalCount === 0 || isCartOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 max-w-sm sm:max-w-md"
      >
        <button
          type="button"
          onClick={openCart}
          className="group flex items-center gap-3.5 bg-zinc-950/95 hover:bg-zinc-900 border-2 border-emerald-500/80 hover:border-emerald-400 p-2.5 sm:p-3 pr-4 sm:pr-5 rounded-2xl shadow-2xl shadow-emerald-950/60 backdrop-blur-md transition-all cursor-pointer text-left"
          title="Open Cart and View Total Bill"
          aria-label="View Shopping Cart"
        >
          {/* Animated Bag Icon with Count Badge */}
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-950/60 shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
            <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950 shadow">
              {totalCount}
            </span>
          </div>

          {/* Cart Info: Count & Total Bill */}
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Cart Total ({totalCount} {totalCount === 1 ? "item" : "items"})
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono tracking-tight leading-tight">
              Rs. {totalAmount.toLocaleString()}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-1 bg-emerald-500 text-zinc-950 px-3 py-1.5 rounded-xl font-black text-xs shrink-0 group-hover:bg-emerald-400 transition-colors shadow-sm ml-1">
            <span>View Cart</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
