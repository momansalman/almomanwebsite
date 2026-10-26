"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewsSection from "@/components/ReviewsSection";
import { Star, ShieldCheck, HeartHandshake, Award, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-black via-zinc-950 to-zinc-900 border-b border-zinc-800/80 py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-bold mb-4 shadow-lg shadow-black/50"
          >
            <Sparkles className="w-3.5 h-3.5" /> 100% Genuine Customer Feedback
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Customer Ratings &amp; Reviews
          </h1>
          <p className="text-zinc-400 text-xs sm:text-base max-w-xl mx-auto leading-relaxed">
            See what our valued patrons in Gujranwala and across Pakistan say about the flavor, hygiene, and crispiness of Al Moman Frozen Foods.
          </p>

          {/* Highlights Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-10">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-xl font-black text-white block">5.0 / 5.0</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                Overall Rating
              </span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <span className="text-xl font-black text-white block">100%</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                Halal Certified
              </span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-center">
              <Award className="w-6 h-6 text-teal-400 mx-auto mb-1" />
              <span className="text-xl font-black text-white block">Blast Frozen</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                Zero Chemical Preservatives
              </span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-center">
              <HeartHandshake className="w-6 h-6 text-rose-400 mx-auto mb-1" />
              <span className="text-xl font-black text-white block">Verified</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                Authentic Reviews
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Reviews List & Interactive Modal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <ReviewsSection />
      </main>

      <Footer />
    </div>
  );
}
