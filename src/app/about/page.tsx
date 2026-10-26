"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import {
  ShieldCheck,
  Snowflake,
  Sparkles,
  Award,
  CheckCircle2,
  PhoneCall,
  ShoppingBag,
  Layers,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-black via-zinc-950 to-zinc-900 border-b border-zinc-800/80 py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="mb-6 flex justify-center">
            <Logo size="hero" showText={false} />
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Handcrafted Heritage &amp; Hygiene
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            About Al Moman Frozen Foods
          </h1>
          <p className="text-zinc-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Delivering authentic Pakistani homemade flavors, pure Halal meat, and blast-frozen convenience to Pakistani households and food businesses since inception.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full space-y-16">
        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
              Our Vision &amp; Promise
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Pure Ingredients. Zero Compromise on Taste &amp; Hygiene.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              At <strong>Al Moman Frozen Foods</strong>, we believe every family deserves restaurant-quality snacks without the hassle of hours in the kitchen. From crispy Chicken Samosas to succulent Shami Kebabs and flaky bakery Patties, our recipes are inspired by time-tested family traditions.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Every single batch is made in our spotless Gujranwala kitchen using food-grade equipment, fresh ground whole spices, and strictly hand-slaughtered Halal meat.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" /> What Sets Us Apart
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>100% Halal Guaranteed:</strong> Pure chicken and beef prepared in Islamic tradition.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>-35°C Blast Freezing:</strong> Locks in moisture and natural taste without artificial chemical preservatives.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Custom Patti Dimensions:</strong> Samosa Patti and Roll Patti manufactured to custom inch measurements (2.5&quot; × 7&quot;, 3&quot; × 8&quot;).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>5-Minute Frying:</strong> Cook straight from the freezer without defrosting.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Our Quality Standards</h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Engineered for safety, fresh flavor, and culinary excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Halal &amp; Safe Meat</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Selected from trusted local suppliers. No mechanical deboning, no questionable binders, no harmful fillers.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center mx-auto mb-2">
                <Snowflake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Blast Freezing Tech</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Rapid temperature drop preserves the cellular integrity of dough and meat, resulting in unmatched crispiness upon frying.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Commercial Supply</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We supply catering services, bakeries, cafes, and wholesale buyers with consistent dimensions and bulk pricing.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Bar */}
        <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-black border border-emerald-800/60 rounded-3xl p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Ready to Taste the Al Moman Difference?
          </h2>
          <p className="text-zinc-300 text-xs sm:text-sm max-w-xl mx-auto">
            Browse our full catalog, pick your desired pack quantities, and order with 1-click WhatsApp delivery.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/menu"
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-950"
            >
              <ShoppingBag className="w-4 h-4" /> Browse Menu Catalog
            </Link>
            <a
              href="https://wa.me/923371691006?text=Hello%20Al%20Moman%20Frozen%20Foods"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold rounded-xl text-sm transition flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" /> WhatsApp Us (0337-1691006)
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
