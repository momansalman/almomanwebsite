"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Minus, Check, ShoppingBag, Zap, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion } from "framer-motion";

export interface ProductItem {
  _id?: string;
  id?: string;
  name: string;
  urduName?: string;
  category: string;
  price: number;
  packSize: string;
  availablePackSizes?: string[];
  description: string;
  image: string;
  inStock?: boolean;
  availableSizes?: string[];
  availableHeights?: string[];
  availableWidths?: string[];
}

const categoryFallbacks: Record<string, string> = {
  Samosas: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
  Kebabs: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
  Rolls: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
  "Pattis & Wrappers": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
  Patties: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80",
  "Nuggets & Bites": "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80",
  Parathas: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80",
};

export default function ProductCard({ product }: { product: ProductItem }) {
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const { addItem } = useCartStore();

  const productId = product._id || product.id || product.name;

  // Multiple Pack Sizes (e.g. 250 gram, 500 gram, 1 kg)
  const hasMultiplePackSizes = Boolean(
    product.availablePackSizes && product.availablePackSizes.length > 0
  );

  const [selectedPackSize, setSelectedPackSize] = useState<string>(
    hasMultiplePackSizes && product.availablePackSizes && product.availablePackSizes.length > 0
      ? product.availablePackSizes[0]
      : product.packSize
  );

  // Check if product has direct dimension pair sizes (e.g. 2.5" × 7", 3" × 8")
  const hasDirectSizes = Boolean(product.availableSizes && product.availableSizes.length > 0);

  // Check if product has separate 2-dimensions (height & width)
  const has2Dimensions = Boolean(
    !hasDirectSizes &&
      ((product.availableHeights && product.availableHeights.length > 0) ||
        (product.availableWidths && product.availableWidths.length > 0))
  );

  const [selectedDirectSize, setSelectedDirectSize] = useState<string>(
    hasDirectSizes && product.availableSizes && product.availableSizes.length > 0
      ? product.availableSizes[0]
      : ""
  );

  const [selectedHeight, setSelectedHeight] = useState<string>(
    product.availableHeights && product.availableHeights.length > 0
      ? product.availableHeights[0]
      : ""
  );

  const [selectedWidth, setSelectedWidth] = useState<string>(
    product.availableWidths && product.availableWidths.length > 0
      ? product.availableWidths[0]
      : ""
  );

  const effectiveSize = hasDirectSizes
    ? selectedDirectSize
    : has2Dimensions
    ? [
        selectedWidth ? `${selectedWidth} (W)` : "",
        selectedHeight ? `${selectedHeight} (H)` : "",
      ]
        .filter(Boolean)
        .join(" × ")
    : "";

  const fallbackUrl =
    categoryFallbacks[product.category] ||
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80";

  const [imgSrc, setImgSrc] = useState(product.image || fallbackUrl);

  const handleAddToCart = () => {
    addItem({
      id: productId,
      name: product.name,
      price: product.price,
      packSize: selectedPackSize || product.packSize,
      image: imgSrc,
      selectedSize: effectiveSize || undefined,
      quantity: quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const totalPrice = product.price * quantity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-zinc-900/90 rounded-3xl border border-zinc-800 hover:border-emerald-500/50 shadow-lg shadow-black/40 hover:shadow-2xl hover:shadow-emerald-950/30 transition-all duration-300 flex flex-col overflow-hidden group"
    >
      {/* Product Image Link to Detail Page */}
      <Link
        href={`/products/${encodeURIComponent(productId)}`}
        className="relative h-48 sm:h-52 w-full bg-zinc-950 overflow-hidden block"
      >
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => {
              setImgSrc(fallbackUrl);
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-700">
            <ShoppingBag className="w-12 h-12" />
          </div>
        )}

        {/* Gradient shadow overlay for luxury look */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/20" />

        {/* Category tag */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-emerald-400 border border-zinc-700/60 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
          {product.category}
        </div>

        {/* Pack Size tag */}
        <div className="absolute bottom-3 right-3 bg-zinc-950/90 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2.5 py-1 rounded-lg font-mono">
          {selectedPackSize || product.packSize}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title Link to Detail Page */}
          <Link
            href={`/products/${encodeURIComponent(productId)}`}
            className="block group/title"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-extrabold text-white text-base group-hover/title:text-emerald-400 transition mb-1">
                {product.name}
              </h3>
              {product.urduName && (
                <span className="text-zinc-500 text-xs font-urdu shrink-0 mt-0.5">
                  {product.urduName}
                </span>
              )}
            </div>
          </Link>

          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
            {product.description}
          </p>

          {/* Multiple Pack Sizes / Weight Selector (e.g. 250 gram, 500 gram, 1 kg) */}
          {hasMultiplePackSizes && (
            <div className="mb-3 pt-2.5 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Select Pack / Weight:
                </span>
                <span className="text-amber-300 font-extrabold bg-amber-950/90 px-2 py-0.5 rounded border border-amber-800/80 font-mono text-xs">
                  {selectedPackSize}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.availablePackSizes?.map((pSize) => (
                  <motion.button
                    key={pSize}
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setSelectedPackSize(pSize)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all ${
                      selectedPackSize === pSize
                        ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-950 font-black scale-105"
                        : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    {pSize}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Option 1: Direct Dimension Pairs (e.g. 2.5" × 7", 3" × 8") */}
          {hasDirectSizes && (
            <div className="mb-3 pt-2.5 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Select Size (Dimensions):
                </span>
                <span className="text-emerald-400 font-extrabold bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-800/80 font-mono text-xs">
                  {selectedDirectSize}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.availableSizes?.map((size) => (
                  <motion.button
                    key={size}
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setSelectedDirectSize(size)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all ${
                      selectedDirectSize === size
                        ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-950 font-black scale-105"
                        : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Option 2: Fallback Height & Width Separate Selectors */}
          {has2Dimensions && (
            <div className="mb-3 pt-2.5 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] bg-zinc-950/80 px-2.5 py-1 rounded-xl border border-zinc-800">
                <span className="font-bold text-zinc-400 text-[10px]">Selected Size:</span>
                <span className="text-emerald-400 font-black font-mono text-xs">
                  {effectiveSize || "—"}
                </span>
              </div>

              {product.availableWidths && product.availableWidths.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-400 font-bold">Width:</span>
                  {product.availableWidths.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWidth(w)}
                      className={`px-2 py-0.5 text-[10px] rounded border font-mono font-bold transition ${
                        selectedWidth === w
                          ? "bg-teal-500 text-zinc-950 border-teal-400"
                          : "bg-zinc-950 text-zinc-300 border-zinc-800"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}

              {product.availableHeights && product.availableHeights.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-400 font-bold">Height:</span>
                  {product.availableHeights.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSelectedHeight(h)}
                      className={`px-2 py-0.5 text-[10px] rounded border font-mono font-bold transition ${
                        selectedHeight === h
                          ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                          : "bg-zinc-950 text-zinc-300 border-zinc-800"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price & Quantity & Actions */}
        <div className="pt-3 border-t border-zinc-800/80 mt-auto flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <div>
              <span className="text-[10px] text-zinc-500 block font-semibold uppercase">
                {quantity > 1 ? `Price (${quantity}x)` : "Price"}
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-400">
                Rs. {totalPrice.toLocaleString()}
              </div>
            </div>

            {/* Quantity Selector [-] 1 [+] and Add to Cart */}
            <div className="flex items-center gap-1.5">
              {/* Counter Controls */}
              <div className="flex items-center bg-zinc-950 border border-zinc-700/80 rounded-xl p-0.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold transition disabled:opacity-30"
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  title="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 sm:w-7 text-center font-black text-white text-xs select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold transition"
                  aria-label="Increase quantity"
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart button */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleAddToCart}
                className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                  added
                    ? "bg-emerald-500 text-zinc-950 scale-95"
                    : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-950"
                }`}
                title="Add chosen quantity to cart"
              >
                {added ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Added ({quantity})
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" /> Add
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Quick WhatsApp Order Button */}
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            href={`https://wa.me/923371691006?text=${encodeURIComponent(
              `Hello Al Moman Frozen Foods! I would like to order ${quantity}x ${product.name}${
                effectiveSize ? ` (Dimensions: ${effectiveSize})` : ""
              } (${product.packSize}) for total Rs. ${totalPrice}. Please confirm delivery.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-emerald-400 hover:text-emerald-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Quick Order ({quantity}x)
          </motion.a>

          {/* Details Link */}
          <Link
            href={`/products/${encodeURIComponent(productId)}`}
            className="text-[11px] text-zinc-400 hover:text-white text-center flex items-center justify-center gap-1 hover:underline pt-0.5"
          >
            View Frying &amp; Item Details <ArrowRight className="w-3 h-3 text-emerald-400" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
