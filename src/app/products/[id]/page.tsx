"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ProductItem } from "@/components/ProductCard";
import { useCartStore } from "@/store/useCartStore";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Zap,
  ShieldCheck,
  Snowflake,
  Flame,
  Clock,
  ArrowLeft,
  ChevronRight,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id ? decodeURIComponent(params.id as string) : "";

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedHeight, setSelectedHeight] = useState<string>("");
  const [selectedWidth, setSelectedWidth] = useState<string>("");

  const { addItem } = useCartStore();

  useEffect(() => {
    if (!rawId) return;

    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(rawId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.product) {
            setProduct(data.product);

            // Initialize size selections
            if (data.product.availableSizes && data.product.availableSizes.length > 0) {
              setSelectedSize(data.product.availableSizes[0]);
            }
            if (data.product.availableHeights && data.product.availableHeights.length > 0) {
              setSelectedHeight(data.product.availableHeights[0]);
            }
            if (data.product.availableWidths && data.product.availableWidths.length > 0) {
              setSelectedWidth(data.product.availableWidths[0]);
            }
          }
        }

        // Fetch related products
        const resAll = await fetch("/api/products");
        if (resAll.ok) {
          const dataAll = await resAll.json();
          if (dataAll.products) {
            const others = dataAll.products
              .filter((p: ProductItem) => (p._id || p.id || p.name) !== rawId)
              .slice(0, 4);
            setRelatedProducts(others);
          }
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [rawId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-zinc-400 font-medium">Loading delicious product details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center px-4">
          <ShoppingBag className="w-16 h-16 text-zinc-700 mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Item Not Found</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-md">
            The requested frozen item could not be found or has been removed from the catalog.
          </p>
          <Link
            href="/menu"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-sm transition"
          >
            Browse Full Menu
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const hasDirectSizes = Boolean(product.availableSizes && product.availableSizes.length > 0);
  const has2Dimensions = Boolean(
    !hasDirectSizes &&
      ((product.availableHeights && product.availableHeights.length > 0) ||
        (product.availableWidths && product.availableWidths.length > 0))
  );

  const effectiveSize = hasDirectSizes
    ? selectedSize
    : has2Dimensions
    ? [
        selectedWidth ? `${selectedWidth} (W)` : "",
        selectedHeight ? `${selectedHeight} (H)` : "",
      ]
        .filter(Boolean)
        .join(" × ")
    : "";

  const totalPrice = product.price * quantity;
  const productId = product._id || product.id || product.name;

  const handleAddToCart = () => {
    addItem({
      id: productId,
      name: product.name,
      price: product.price,
      packSize: product.packSize,
      image: product.image,
      selectedSize: effectiveSize || undefined,
      quantity: quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-emerald-400 transition">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <Link href="/menu" className="hover:text-emerald-400 transition">
            Menu Catalog
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <span className="text-zinc-500">{product.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <span className="text-white font-bold truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Back Link */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>

        {/* Product Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 pb-16 border-b border-zinc-800/80">
          {/* Left: Product Image Showcase */}
          <div className="space-y-4">
            <div className="relative aspect-square sm:aspect-[4/3] w-full rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image || "/products/chicken-samosa.jpg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/20" />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="bg-emerald-600/90 backdrop-blur-md text-zinc-950 text-xs font-black px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Halal
                </span>
                <span className="bg-black/80 backdrop-blur-md text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-zinc-700/60 shadow-lg flex items-center gap-1">
                  <Snowflake className="w-3.5 h-3.5" /> Blast Frozen
                </span>
              </div>

              <div className="absolute bottom-4 right-4 bg-zinc-950/90 backdrop-blur-md text-zinc-300 border border-zinc-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" />
                {product.packSize}
              </div>
            </div>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3 text-center">
                <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-white block">Ready in 5 Mins</span>
                <span className="text-[10px] text-zinc-400">Direct fry from freezer</span>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3 text-center">
                <Snowflake className="w-5 h-5 text-teal-400 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-white block">-18°C Storage</span>
                <span className="text-[10px] text-zinc-400">3-6 Months Life</span>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3 text-center">
                <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-white block">Super Crispy</span>
                <span className="text-[10px] text-zinc-400">Golden flaky crust</span>
              </div>
            </div>
          </div>

          {/* Right: Product Info, Dimensions, Quantity, Add to Cart */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              {/* Category & Availability */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider bg-emerald-950/70 border border-emerald-800/60 px-3 py-1 rounded-full">
                  {product.category}
                </span>
                <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Freshly Prepared In Stock
                </span>
              </div>

              {/* Title & Urdu Title */}
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                {product.name}
              </h1>
              {product.urduName && (
                <p className="text-lg text-emerald-400 font-urdu mb-4">{product.urduName}</p>
              )}

              {/* Description */}
              <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Sizing / Patti Dimensions */}
              {hasDirectSizes && (
                <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl mb-6 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Select Dimensions (Width × Height in Inches):
                    </span>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800 font-mono">
                      {selectedSize}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {product.availableSizes?.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedSize === size
                            ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg shadow-emerald-950/60 font-black scale-105"
                            : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">
                    *Handcrafted to exact cutting dimensions for commercial and household preparation.
                  </p>
                </div>
              )}

              {/* Fallback Separate Dimensions */}
              {has2Dimensions && (
                <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl mb-6 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Selected Size:</span>
                    <span className="text-emerald-400 font-black font-mono">{effectiveSize}</span>
                  </div>
                  {product.availableWidths && product.availableWidths.length > 0 && (
                    <div>
                      <span className="text-[11px] text-zinc-400 font-semibold block mb-1">
                        Width (Chorai):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {product.availableWidths.map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setSelectedWidth(w)}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
                              selectedWidth === w
                                ? "bg-teal-500 text-zinc-950 border-teal-400"
                                : "bg-zinc-950 text-zinc-300 border-zinc-800"
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.availableHeights && product.availableHeights.length > 0 && (
                    <div>
                      <span className="text-[11px] text-zinc-400 font-semibold block mb-1">
                        Height (Lambai):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {product.availableHeights.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setSelectedHeight(h)}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
                              selectedHeight === h
                                ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                                : "bg-zinc-950 text-zinc-300 border-zinc-800"
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Price Calculation Box */}
              <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block uppercase">
                      Unit Price
                    </span>
                    <span className="text-2xl font-black text-white">
                      Rs. {product.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-500 block">per {product.packSize}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-zinc-400 font-semibold block uppercase">
                      Total ({quantity}x)
                    </span>
                    <span className="text-3xl font-black text-emerald-400 font-mono">
                      Rs. {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Interactive Quantity Selector & Add to Cart Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-zinc-800/80">
                  {/* Quantity Counter */}
                  <div className="flex items-center justify-between bg-zinc-950 border border-zinc-700 rounded-2xl p-1.5 shadow-inner min-w-[130px]">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-30"
                      title="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black text-white text-base select-none px-2 font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                      title="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleAddToCart}
                    className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                      added
                        ? "bg-emerald-500 text-zinc-950"
                        : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-emerald-950"
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-5 h-5" /> Added ({quantity}x) to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" /> Add {quantity} to Cart (Rs.{" "}
                        {totalPrice.toLocaleString()})
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* 1-Click WhatsApp Direct Order */}
              <motion.a
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                href={`https://wa.me/923371691006?text=${encodeURIComponent(
                  `Hello Al Moman Frozen Foods! I would like to order ${quantity}x ${product.name}${
                    effectiveSize ? ` (Dimensions: ${effectiveSize})` : ""
                  } (${product.packSize}) for total Rs. ${totalPrice}. Please confirm delivery.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-emerald-400 hover:text-emerald-300 font-black rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Zap className="w-4 h-4 text-emerald-400" /> Instant Order via WhatsApp (Rs.{" "}
                {totalPrice.toLocaleString()})
              </motion.a>
            </div>
          </div>
        </div>

        {/* Detailed Food & Preparation Guides */}
        <section className="py-12 border-b border-zinc-800/80">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" /> Preparation &amp; Quality Guide
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Frying Instructions */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-700/80 text-amber-400 flex items-center justify-center mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white">
                Frying &amp; Cooking Method
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <strong>Do NOT thaw / Defrost:</strong> Always fry directly from the freezer to keep the pastry crispy and prevent oil absorption.
              </p>
              <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside pt-2">
                <li>
                  <strong>Deep Fry:</strong> Heat cooking oil to 170°C. Fry on medium flame for 4 to 5 minutes until rich golden.
                </li>
                <li>
                  <strong>Air Fryer:</strong> Lightly brush with vegetable oil, air fry at 180°C for 8 to 10 minutes.
                </li>
                <li>
                  <strong>Bake:</strong> Preheat oven to 190°C. Bake for 12 to 15 minutes.
                </li>
              </ul>
            </div>

            {/* 2. Storage Guidelines */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-950/80 border border-teal-700/80 text-teal-400 flex items-center justify-center mb-4">
                <Snowflake className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white">
                Storage &amp; Freezing
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Our food is blast-frozen at -35°C immediately after preparation to seal in natural moisture and pure flavor without chemical preservatives.
              </p>
              <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside pt-2">
                <li>Keep stored at -18°C in freezer.</li>
                <li>Shelf life: 3 to 6 months in freezer.</li>
                <li>Keep sealed in airtight freezer pouch.</li>
                <li>Do not refreeze once completely thawed.</li>
              </ul>
            </div>

            {/* 3. 100% Halal Guarantee */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white">
                100% Halal Purity Assurance
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We take immense pride in strictly adhering to traditional Islamic Halal standards and food safety hygiene.
              </p>
              <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside pt-2">
                <li>100% Hand-slaughtered Halal chicken &amp; beef.</li>
                <li>Hygienic kitchen with food-grade stainless prep surfaces.</li>
                <li>Pure whole spices ground in-house.</li>
                <li>Zero artificial colors, animal fat, or MSG.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Related Products Recommendation */}
        {relatedProducts.length > 0 && (
          <section className="py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-white">You Might Also Like</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Discover more fresh frozen favorites from our kitchen
                </p>
              </div>
              <Link
                href="/menu"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
              >
                View Full Menu →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => {
                const relId = rel._id || rel.id || rel.name;
                return (
                  <Link
                    key={relId}
                    href={`/products/${encodeURIComponent(relId)}`}
                    className="bg-zinc-900/80 rounded-2xl border border-zinc-800 hover:border-emerald-500/50 p-4 transition group flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-40 rounded-xl overflow-hidden bg-zinc-950 mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rel.image || "/products/chicken-samosa.jpg"}
                          alt={rel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">
                        {rel.category}
                      </span>
                      <h4 className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition mb-1">
                        {rel.name}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-1">{rel.packSize}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <span className="font-black text-emerald-400 text-sm">
                        Rs. {rel.price.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white transition">
                        View Details →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
