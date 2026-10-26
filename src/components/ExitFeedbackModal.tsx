"use client";

import React, { useState, useEffect } from "react";
import { Star, X, CheckCircle2, Sparkles, Send } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_TAGS = [
  "Crispy & Fresh",
  "100% Halal Taste",
  "Super Fast Delivery",
  "Loved Samosa Patti",
  "Delicious Shami Kebabs",
  "Ready in 5 Mins",
];

const RATING_LABELS: Record<number, string> = {
  5: "⭐⭐⭐⭐⭐ Outstanding Quality & Delicious Taste!",
  4: "⭐⭐⭐⭐ Very Good Experience & Great Taste!",
  3: "⭐⭐⭐ Good Quality Frozen Food",
  2: "⭐⭐ Average Experience",
  1: "⭐ Needs Improvement",
};

export default function ExitFeedbackModal() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
    }
  }, [user, name]);

  useEffect(() => {
    // Listen for custom trigger event (e.g. from floating button or post-order)
    const handleCustomOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-rating-modal", handleCustomOpen);

    // Exit intent detection: triggers when user moves cursor towards top of browser
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 15) {
        const alreadyPrompted = sessionStorage.getItem("feedback_prompt_seen");
        if (!alreadyPrompted) {
          setIsOpen(true);
          sessionStorage.setItem("feedback_prompt_seen", "true");
        }
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("open-rating-modal", handleCustomOpen);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || user?.name || "Valued Customer";
    const finalComment = [selectedTag, comment.trim()].filter(Boolean).join(" - ") || "5-Star experience!";

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: finalName,
          rating,
          comment: finalComment,
          productName: "Storefront Experience",
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setIsOpen(false);
        }, 2200);
      }
    } catch (err) {
      console.error("Failed to submit rating:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-zinc-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
          >
            {/* Top gold glow bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              aria-label="Close feedback modal"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-950 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-950">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">Thank You So Much!</h3>
                <p className="text-sm text-zinc-300">
                  Your 5-star review has been recorded. We take immense pride in serving you pure Halal taste!
                </p>
                <div className="flex items-center justify-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400" />
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="text-center space-y-1.5 pt-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800/80 text-emerald-400 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" /> Rate Your Experience
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    How was your experience?
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Before you leave, please tap the stars below to share your rating with Al Moman Frozen Foods!
                  </p>
                </div>

                {/* Big Interactive Stars */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isFilled =
                        starVal <= (hoverRating || rating);
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(starVal)}
                          className="p-1 sm:p-2 rounded-xl hover:scale-125 transition-transform"
                          aria-label={`Rate ${starVal} Stars`}
                        >
                          <Star
                            className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                              isFilled
                                ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                : "text-zinc-700"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs font-bold text-amber-400 font-mono transition-all">
                    {RATING_LABELS[hoverRating || rating]}
                  </p>
                </div>

                {/* Quick Feedback Tags */}
                <div>
                  <span className="text-[11px] text-zinc-400 font-bold block mb-1.5">
                    Quick Tags (1-Tap):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                        className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                          selectedTag === tag
                            ? "bg-emerald-600 text-zinc-950 border-emerald-400 font-black scale-105"
                            : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Your Name {user?.name && <span className="text-emerald-400">(Logged In)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Optional Comment */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Comments or Feedback (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Crispy texture, delivery was great..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold transition flex-1"
                  >
                    Maybe Later
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs transition flex-[2] flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? "Submitting..." : `Submit ${rating}-Star Rating`}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
