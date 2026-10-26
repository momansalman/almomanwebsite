"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard, { ProductItem } from "@/components/ProductCard";
import { Search, Sparkles, ShoppingBag, ArrowUpDown, Filter } from "lucide-react";
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

export default function MenuPage() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high" | "name">("featured");
  const [loading, setLoading] = useState(true);

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
        console.error("Failed to fetch menu items:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts = products
    .filter((p) => {
      const matchesCategory =
        selectedCategory === "All Items" ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.urduName && p.urduName.includes(searchQuery)) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Page Header */}
      <section className="bg-gradient-to-b from-black via-zinc-950 to-zinc-900 border-b border-zinc-800/80 py-12 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> 100% Halal Blast-Frozen Menu
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Our Frozen Foods Catalog
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto">
            Choose quantities, select custom Patti dimensions, and order directly to your door or via WhatsApp.
          </p>
        </div>
      </section>

      {/* Controls Bar: Search, Category Pills, Sort */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search samosas, kebabs, roll patti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-zinc-500"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-400 font-bold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" /> Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "featured" | "price-low" | "price-high" | "name")}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="featured">Featured / Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <span className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-emerald-400" /> Category:
          </span>
          {["All Items", ...categories].map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
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
          <div className="text-center py-24">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-zinc-400">Loading full frozen menu...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/80 rounded-3xl border border-zinc-800 p-8">
            <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No items found</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Try a different search keyword or category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id || product.id || product.name}
                product={product}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
