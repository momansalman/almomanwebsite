"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ProductCard, { ProductItem } from "@/components/ProductCard";
import Footer from "@/components/Footer";
import ReviewsSection from "@/components/ReviewsSection";
import Logo from "@/components/Logo";
import {
  Sparkles,
  ShoppingBag,
  Clock,
  ShieldCheck,
  Snowflake,
  Search,
  MessageCircle,
  PhoneCall,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const DEFAULT_CATEGORIES = [
  "Samosas",
  "Kebabs",
  "Rolls",
  "Pattis & Wrappers",
  "Patties",
  "Nuggets & Bites",
  "Parathas",
];

export default function Home() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923371691006";
  const displayPhone = "0337-1691006";
  const rawPhone = "03371691006";

  useEffect(() => {
    async function loadData() {
      try {
        const [resProd, resCat] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);

        const dataProd = await resProd.json();
        if (dataProd.products) {
          setProducts(dataProd.products);
        }

        const dataCat = await resCat.json();
        if (dataCat.categories && Array.isArray(dataCat.categories) && dataCat.categories.length > 0) {
          setCategories(dataCat.categories);
        }
      } catch (err) {
        console.error("Failed to fetch products or categories:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "All Items" ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.urduName && p.urduName.includes(searchQuery)) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-zinc-900 border-b border-zinc-800/80 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-emerald-500/40 text-emerald-400 text-xs sm:text-sm font-bold mb-8 shadow-lg shadow-black/50"
          >
            <Snowflake className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: "12s" }} />
            Freshly Prepared &amp; Blast Frozen for Pure Taste
          </motion.div>

          {/* Grand Centerpiece Logo in Middle of Website */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mb-8 flex justify-center"
          >
            <Logo size="hero" showText={true} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="max-w-2xl mx-auto text-sm sm:text-lg text-zinc-300 leading-relaxed mb-8"
          >
            Crispy Chicken Samosas, Melt-in-mouth Beef Kebabs, Crunchy Spring Rolls, and Bakery Patties. 100% Halal, hygienic, and ready to fry in 5 minutes.
          </motion.p>

          {/* Quick Call & WhatsApp highlight banner */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="inline-flex items-center justify-center gap-4 p-3 px-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl mb-8 text-xs sm:text-sm shadow-xl flex-wrap"
          >
            <span className="text-zinc-400 font-medium">Order Helpline:</span>
            <a
              href={`tel:${rawPhone}`}
              className="flex items-center gap-1.5 text-white font-extrabold hover:text-emerald-400 transition"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" /> {displayPhone}
            </a>
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <a
              href={`https://wa.me/${whatsappNumber}?text=Hello%20Al%20Moman%20Frozen%20Foods`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 font-extrabold hover:underline"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Order
            </a>
          </motion.div>


          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/menu"
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-2xl text-sm shadow-xl shadow-emerald-950 transition duration-200 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Explore Frozen Menu
            </Link>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              href={`https://wa.me/${whatsappNumber}?text=Hello%20Al%20Moman%20Frozen%20Foods,%20I%20would%20like%20to%20order%20frozen%20food.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-emerald-400 font-bold rounded-2xl text-sm transition flex items-center gap-2 shadow-lg"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp: {displayPhone}
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-20 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-900/95 p-5 rounded-2xl shadow-xl border border-zinc-800 hover:border-emerald-500/40 flex items-center gap-3.5 transition-colors"
          >
            <div className="p-3 bg-zinc-950 border border-zinc-800 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">100% Halal</h4>
              <p className="text-[11px] text-zinc-400">Pure &amp; hygienic meat</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-900/95 p-5 rounded-2xl shadow-xl border border-zinc-800 hover:border-teal-500/40 flex items-center gap-3.5 transition-colors"
          >
            <div className="p-3 bg-zinc-950 border border-zinc-800 text-teal-400 rounded-xl">
              <Snowflake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">Blast Frozen</h4>
              <p className="text-[11px] text-zinc-400">Locks in crisp taste</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-900/95 p-5 rounded-2xl shadow-xl border border-zinc-800 hover:border-amber-500/40 flex items-center gap-3.5 transition-colors"
          >
            <div className="p-3 bg-zinc-950 border border-zinc-800 text-amber-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">Ready in 5 Mins</h4>
              <p className="text-[11px] text-zinc-400">Pan-fry, air-fry or bake</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-900/95 p-5 rounded-2xl shadow-xl border border-zinc-800 hover:border-emerald-500/40 flex items-center gap-3.5 transition-colors"
          >
            <div className="p-3 bg-zinc-950 border border-zinc-800 text-emerald-400 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">Freezer Box</h4>
              <p className="text-[11px] text-zinc-400">Delivered icy cold</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Catalog & Filter Section */}
      <section id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> Guest Browsing Friendly
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Our Frozen Foods Catalog
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Browse products and add items to cart freely. Sign In is only required when placing an order!
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search samosa, kebab, roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-white placeholder-zinc-500"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {["All Items", ...categories].map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-emerald-600 text-zinc-950 font-black shadow-lg shadow-emerald-950"
                  : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 hover:text-white"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-zinc-400">Loading fresh frozen items...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/80 rounded-3xl border border-zinc-800 p-8">
            <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No items found</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Try searching for something else or pick a different category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id || product.id || product.name} product={product} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/50 text-emerald-400 font-extrabold text-sm transition shadow-lg"
          >
            <ShoppingBag className="w-4 h-4" /> View Complete Menu Catalog &amp; Custom Sizing →
          </Link>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <ReviewsSection />

      {/* Floating Call & WhatsApp Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {/* Call Button */}
        <motion.a
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.92 }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          href={`tel:${rawPhone}`}
          className="bg-zinc-900 hover:bg-zinc-800 text-emerald-400 p-3.5 rounded-full shadow-2xl transition flex items-center justify-center border-2 border-emerald-500/50"
          title={`Call ${displayPhone}`}
        >
          <PhoneCall className="w-6 h-6" />
        </motion.a>

        {/* WhatsApp Button */}
        <motion.a
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.92 }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          href={`https://wa.me/${whatsappNumber}?text=Hello%20Al%20Moman%20Frozen%20Foods`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 p-3.5 rounded-full shadow-2xl transition flex items-center justify-center border-2 border-zinc-950 shadow-emerald-950/80"
          title={`WhatsApp ${displayPhone}`}
        >
          <MessageCircle className="w-6 h-6" />
        </motion.a>
      </div>

      <Footer />
    </div>
  );
}
