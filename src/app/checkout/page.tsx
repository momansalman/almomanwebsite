"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PhoneInput, { validatePakistaniPhone } from "@/components/PhoneInput";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { saveActiveOrder } from "@/lib/orderTrackingStorage";
import {
  ShoppingBag,
  Truck,
  Building2,
  CheckCircle2,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  MapPin,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<"silent" | "whatsapp" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Autofill from user profile if logged in
  useEffect(() => {
    if (user?.name && !customerName) {
      setCustomerName(user.name);
    }
    if (user?.phone && !customerPhone) {
      setCustomerPhone(user.phone);
      setIsPhoneValid(validatePakistaniPhone(user.phone));
    }
    if (user?.address && !deliveryAddress) {
      setDeliveryAddress(user.address);
    }
  }, [user]);

  const subtotal = getTotal();
  const isDelivery = fulfillmentType === "delivery";

  // Common order submission logic for both Button 1 and Button 2
  const processOrderPlacement = async (interactiveWhatsApp: boolean) => {
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add items to proceed.");
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!validatePakistaniPhone(customerPhone)) {
      setErrorMessage(
        "Please provide a valid Pakistani WhatsApp mobile number (e.g. 03001234567 or +923001234567)."
      );
      return;
    }

    if (isDelivery && !deliveryAddress.trim()) {
      setErrorMessage("Please enter your complete delivery address.");
      return;
    }

    setSubmitting(true);
    setSubmitMode(interactiveWhatsApp ? "whatsapp" : "silent");

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: items.map((it) => ({
          productId: it.id,
          productName: it.name,
          price: it.price,
          quantity: it.quantity,
          total: it.price * it.quantity,
          packSize: it.packSize || "Standard Pack",
          selectedSize: it.selectedSize || "",
        })),
        subtotal,
        fulfillmentType,
        deliveryAddress: isDelivery ? deliveryAddress.trim() : null,
        notes: notes.trim(),
      };

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Order placement failed. Please try again.");
      }

      // 1. Store order ID & active tracking session in localStorage / cookies
      try {
        saveActiveOrder({
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          totalAmount: data.totalAmount || subtotal,
          status: data.orderStatus || "pending",
          fulfillmentType,
          deliveryAddress: isDelivery ? deliveryAddress.trim() : null,
        });
      } catch (saveErr) {
        console.warn("Storage sync notice:", saveErr);
      }

      // 2. Clear customer cart
      clearCart();

      // 3. If Button 2 ("Confirm & WhatsApp"), launch WhatsApp deep link in new tab
      if (interactiveWhatsApp && data.whatsappChatUrl) {
        try {
          window.open(data.whatsappChatUrl, "_blank", "noopener,noreferrer");
        } catch (e) {
          console.warn("Popup blocked, handling via tracking page:", e);
        }
      }

      // 4. Redirect customer to live order tracking page
      router.push(`/order-tracking/${data.orderId}${interactiveWhatsApp ? "?sendWhatsApp=1" : ""}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong while placing your order.");
      setSubmitting(false);
      setSubmitMode(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Breadcrumb Header */}
        <div className="mb-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full">
            Secure Checkout
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white mt-2">
            Review &amp; Place Your Order
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            AL-MOMAN Special Frozen Chicken Food • Fresh Blast-Frozen Guaranteed
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-2xl flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Your Cart is Currently Empty</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Select your favorite frozen items (Chicken Samosas, Shami Kebabs, Spring Rolls, Patties) before proceeding to checkout.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Details (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {errorMessage && (
                <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-2xl text-xs flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Customer Info Card */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-black text-white">Customer Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Muhammad Salman"
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                    />
                  </div>

                  {/* Mandatory PhoneInput with WhatsApp Helper Notice */}
                  <PhoneInput
                    value={customerPhone}
                    onChange={(val, valid) => {
                      setCustomerPhone(val);
                      setIsPhoneValid(valid);
                    }}
                    required
                  />
                </div>
              </div>

              {/* 2. Fulfillment Mode Card */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-black text-white">Fulfillment Mode</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("delivery")}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isDelivery
                        ? "bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/50"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Truck className={`w-5 h-5 ${isDelivery ? "text-emerald-400" : "text-zinc-500"}`} />
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                        Doorstep
                      </span>
                    </div>
                    <div>
                      <span className="font-black text-sm text-white block">Home Delivery</span>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">Cold blast dispatched</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType("pickup")}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      !isDelivery
                        ? "bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/50"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Building2 className={`w-5 h-5 ${!isDelivery ? "text-emerald-400" : "text-zinc-500"}`} />
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60">
                        Zero Fee
                      </span>
                    </div>
                    <div>
                      <span className="font-black text-sm text-white block">Self-Pickup</span>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">Collect at Gujranwala outlet</span>
                    </div>
                  </button>
                </div>

                {isDelivery ? (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Delivery Address <span className="text-amber-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="House / Flat #, Street #, Sector / Area, Gujranwala (or nearby)"
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                    />
                    <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-[11px] text-amber-300 font-medium leading-relaxed">
                      <strong>Note:</strong> Delivery charges will be calculated and communicated via WhatsApp chat based on your distance.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-xs space-y-1.5">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      Pickup Warehouse Location:
                    </span>
                    <p className="text-white font-medium">556/A Model Town, Gujranwala</p>
                    <p className="text-[11px] text-zinc-400">
                      Free pickup. Please bring your generated invoice or Order Number when collecting.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Special Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Ring the bell twice, call upon arrival"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Dual-Action Buttons (5 Cols) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h3 className="font-black text-white text-base">Order Review</h3>
                  <span className="text-xs text-zinc-400 font-bold">{items.length} Items</span>
                </div>

                {/* Items List */}
                <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-zinc-800/60 pr-1">
                  {items.map((it) => (
                    <div key={it.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <div className="pr-2">
                        <p className="font-bold text-white">{it.name}</p>
                        <p className="text-[11px] text-zinc-400">
                          {it.quantity} × Rs. {it.price.toLocaleString()}
                          {it.selectedSize && ` (${it.selectedSize})`}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-400 shrink-0">
                        Rs. {(it.price * it.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="pt-4 border-t border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span className="text-zinc-200 font-bold">Rs. {subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-zinc-400">
                    <span>Fulfillment</span>
                    <span className="font-bold text-zinc-200 uppercase">
                      {isDelivery ? "Home Delivery" : "Self-Pickup"}
                    </span>
                  </div>

                  <div className="flex justify-between text-zinc-400">
                    <span>Delivery Charges</span>
                    {isDelivery ? (
                      <span className="text-amber-400 font-medium">Pending via WhatsApp</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">FREE (Self-Pickup)</span>
                    )}
                  </div>

                  <div className="flex justify-between text-base font-black pt-3 border-t border-zinc-800 text-white">
                    <span>Total Amount</span>
                    <span className="text-emerald-400">
                      Rs. {subtotal.toLocaleString()}
                      {isDelivery ? " + Delivery" : ""}
                    </span>
                  </div>
                </div>

                {/* Dual-Action Checkout Buttons */}
                <div className="space-y-3 pt-3">
                  {/* Button 1: "Confirm Order" (Silent Direct Placement) */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => processOrderPlacement(false)}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-black rounded-xl text-sm transition shadow-xl shadow-emerald-950/80 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {submitting && submitMode === "silent" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        <span>Generating Invoice &amp; Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                        <span>Confirm Order</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </>
                    )}
                  </button>

                  {/* Button 2: "Confirm & WhatsApp" (Direct Placement + Interactive Chat) */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => processOrderPlacement(true)}
                    className="w-full py-3.5 px-4 bg-emerald-950 hover:bg-emerald-900 border-2 border-emerald-500/80 disabled:opacity-50 text-emerald-300 font-black rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {submitting && submitMode === "whatsapp" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span>Saving Order &amp; Opening WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span>Confirm &amp; WhatsApp</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-zinc-500 text-center leading-relaxed pt-1">
                    Both options securely place your order in our database, generate your official PDF invoice, and notify the owner via WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
