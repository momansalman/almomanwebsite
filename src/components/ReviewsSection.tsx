"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  ShieldCheck,
  MessageSquarePlus,
  X,
  CheckCircle2,
  Sparkles,
  Quote,
  ThumbsUp,
  Award,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export interface ReviewItem {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  productName?: string;
  verifiedCustomer?: boolean;
  createdAt?: string;
}

const POPULAR_ITEMS = [
  "Chicken Samosa",
  "Beef Chapli Kebab",
  "Crispy Spring Rolls",
  "Chicken Patties",
  "Aloo Samosa",
  "Crispy Chicken Nuggets",
  "Layered Parathas",
  "Overall Taste & Packaging",
];

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "REV-1001",
    userName: "Moman Salman",
    rating: 5,
    comment:
      "Al Moman Frozen Foods blast freezing lock preserves 100% authentic crispiness and flavor. Freshly prepared, fully halal, and hygienic packaging.",
    productName: "Signature Frozen Delights",
    verifiedCustomer: true,
    createdAt: "2026-10-08T12:00:00.000Z",
  },
];

export default function ReviewsSection() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState("");
  const [productName, setProductName] = useState(POPULAR_ITEMS[0]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      if (data.reviews && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (e) {
      console.warn("Failed to load reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (user?.name && !userName) {
      setUserName(user.name);
    }
  }, [user, userName]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) {
      setErrorMsg("Please provide your name and review comments.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userName.trim(),
          rating,
          comment: comment.trim(),
          productName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post review");

      setSuccessMsg(true);
      fetchReviews();
      setTimeout(() => {
        setSuccessMsg(false);
        setModalOpen(false);
        setComment("");
      }, 1800);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error posting review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-800/80">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Award className="w-3.5 h-3.5" />
            Verified Customer Feedback
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Loved for Freshness &amp; Taste
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl">
            Real reviews from our customers in Model Town Gujranwala and beyond enjoying blast-frozen samosas, kebabs, and rolls.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setModalOpen(true);
              setSuccessMsg(false);
              setErrorMsg(null);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-emerald-950 transition cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Leave a Review</span>
          </button>
        </div>
      </div>

      {/* Trust Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-sm font-black text-white">5.0 Star Rating</p>
          <p className="text-[11px] text-zinc-400">Authentic Taste</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
          <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto mb-1">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-sm font-black text-white">100% Halal</p>
          <p className="text-[11px] text-zinc-400">Pure Ingredients</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
          <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center mx-auto mb-1">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-sm font-black text-white">Blast Frozen</p>
          <p className="text-[11px] text-zinc-400">Crispiness Preserved</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
          <div className="w-6 h-6 rounded-full bg-purple-950 text-purple-400 flex items-center justify-center mx-auto mb-1">
            <ThumbsUp className="w-4 h-4" />
          </div>
          <p className="text-sm font-black text-white">Direct Delivery</p>
          <p className="text-[11px] text-zinc-400">Fast &amp; Fresh</p>
        </div>
      </div>

      {/* Interactive In-Page 5-Star Rating Card */}
      <div className="mb-12 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-800 text-emerald-400 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" /> Instant Rating (Tap Stars)
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Rate Your Experience with Al Moman Frozen Foods
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              {user?.name ? (
                <span>
                  Logged in as <strong className="text-emerald-400">{user.name}</strong>. Tap the stars below to share your review!
                </span>
              ) : (
                "Click the stars below to rate our crispiness, taste, and hygiene in 1 click!"
              )}
            </p>
          </div>

          {/* Big Interactive Stars & Rating Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 shrink-0">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => {
                    setRating(s);
                    setModalOpen(true);
                  }}
                  className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  title={`Rate ${s} Stars`}
                >
                  <Star
                    className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                      s <= (hoverRating || rating)
                        ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                        : "text-zinc-700 hover:text-amber-400"
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-950 transition whitespace-nowrap cursor-pointer"
            >
              ★ Give {rating}-Star Review
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading customer reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800">
          <Quote className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Be the First to Review!</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
            Have you enjoyed our samosas, patties, or kebabs? Share your feedback with other customers.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl"
          >
            Write a Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition space-y-4"
            >
              <div className="space-y-3">
                {/* Rating & Product Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  {rev.productName && (
                    <span className="text-[10px] bg-zinc-950 border border-zinc-800 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                      {rev.productName}
                    </span>
                  )}
                </div>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              {/* Author & Verification badge */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                <div>
                  <h4 className="font-bold text-white text-xs">{rev.userName}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified Customer</span>
                  </div>
                </div>
                {rev.createdAt && (
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(rev.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write a Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl my-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400">
                  <Star className="w-5 h-5 fill-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Write Customer Review</h3>
                  <p className="text-[11px] text-zinc-400">Share your taste experience</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-950 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Thank You for Your Review!</h4>
                <p className="text-xs text-zinc-400">
                  Your feedback has been published to our storefront.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-[11px]">
                    {errorMsg}
                  </div>
                )}

                {/* Rating Stars */}
                <div>
                  <label className="block font-bold text-zinc-300 mb-1.5">
                    Your Rating (1 to 5 Stars) *
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        className="p-1 hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= (hoverRating || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-700"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-amber-400">
                      {hoverRating || rating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Moman Salman / Fatima Tariq"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Item ordered */}
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Product / Item Enjoyed
                  </label>
                  <select
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {POPULAR_ITEMS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Feedback */}
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Your Review &amp; Experience *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="How was the taste, crispiness, and blast frozen quality?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
