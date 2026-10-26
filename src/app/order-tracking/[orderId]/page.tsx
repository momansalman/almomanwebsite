"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Truck,
  Building2,
  FileText,
  MessageCircle,
  PhoneCall,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Sparkles,
  MapPin,
  Share2,
  Edit3,
  XCircle,
  Lock,
  X,
  Check,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InvoiceViewer from "@/components/InvoiceViewer";
import { saveActiveOrder, updateActiveOrderStatus } from "@/lib/orderTrackingStorage";
import { validatePakistaniPhone } from "@/components/PhoneInput";

interface OrderDetail {
  id: string;
  orderNumber: string;
  orderStatus: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled" | string;
  rawStatus: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: "pickup" | "delivery" | "Self-Pickup" | "Home Delivery" | string;
  deliveryAddress?: string | null;
  notes?: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    total: number;
    packSize?: string;
  }>;
  subtotal: number;
  deliveryCharges: number;
  totalAmount: number;
  invoicePdfUrl: string;
  createdAt: string;
  updatedAt: string;
}

const STEPS = [
  { key: "pending", label: "Order Received", desc: "Sent to AL-MOMAN kitchen" },
  { key: "confirmed", label: "Order Confirmed", desc: "Approved by store owner" },
  { key: "preparing", label: "In Preparation", desc: "Hygienically blast freezing" },
  { key: "ready", label: "Ready for Delivery", desc: "Packaged & ready for pickup" },
  { key: "delivered", label: "Delivered", desc: "Fulfillment completed" },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit & Cancel Modals State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Form Fields
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Cancel Form Fields
  const [cancelReason, setCancelReason] = useState("Ordered by mistake");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchStatus = async (isBackground = false) => {
    let activeId = orderId;
    if (!activeId && typeof window !== "undefined") {
      const segments = window.location.pathname.split("/").filter(Boolean);
      activeId = segments[segments.length - 1];
    }
    if (!activeId) return;
    if (!isBackground) setIsRefreshing(true);

    try {
      const res = await fetch(`/api/orders/${activeId}/status`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load order status");
      }

      setOrder(data.order);
      setError(null);
      setLastUpdated(new Date());

      // Pre-populate edit fields
      if (data.order) {
        setEditName(data.order.customerName || "");
        setEditPhone(data.order.customerPhone || "");
        setEditAddress(data.order.deliveryAddress || "");
        setEditNotes(data.order.notes || "");
      }

      // Sync active order session to localStorage
      try {
        if (data.order.orderStatus === "cancelled" || data.order.orderStatus === "delivered") {
          updateActiveOrderStatus(data.order.id || activeId, data.order.orderStatus);
        } else {
          saveActiveOrder({
            orderId: data.order.id || activeId,
            orderNumber: data.order.orderNumber,
            customerName: data.order.customerName,
            customerPhone: data.order.customerPhone,
            totalAmount: data.order.totalAmount || data.order.subtotal,
            status: data.order.orderStatus,
            fulfillmentType: data.order.fulfillmentType,
            deliveryAddress: data.order.deliveryAddress,
            createdAt: data.order.createdAt,
          });
        }
      } catch {}
    } catch (err: any) {
      if (!isBackground) {
        setError(err.message || "Failed to retrieve order tracking info");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load + 3-second live auto-polling
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  // Determine current active step index (0 to 4)
  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "preparing":
        return 2;
      case "ready":
        return 3;
      case "delivered":
        return 4;
      default:
        return 0;
    }
  };

  const statusLower = (order?.orderStatus || "").toLowerCase();
  const isPending = statusLower === "pending";
  const isCancelled = statusLower === "cancelled";
  const isApproved = !isPending && !isCancelled; // confirmed, preparing, ready, delivered
  const isConfirmedOrHigher = getStepIndex(order?.orderStatus || "") >= 1;
  const currentStepIdx = order ? getStepIndex(order.orderStatus) : 0;
  const isDelivery = order ? (order.fulfillmentType || "").toLowerCase().includes("delivery") : true;

  // Handle in-app cancellation (only for pending orders)
  const handleConfirmCancel = async () => {
    if (!order) return;
    setActionLoading(true);
    setCancelError(null);

    const finalReason = cancelReason === "Other" && customCancelReason.trim()
      ? customCancelReason.trim()
      : cancelReason;

    try {
      const res = await fetch(`/api/orders/${order.id || orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: finalReason }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If order was approved in background while user was viewing
        if (data.isApproved && data.whatsappUrl) {
          window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
        }
        throw new Error(data.error || "Failed to cancel order.");
      }

      updateActiveOrderStatus(order.id || orderId, "cancelled");
      setCancelModalOpen(false);
      await fetchStatus();
    } catch (err: any) {
      setCancelError(err.message || "Could not cancel order.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle in-app edit details (only for pending orders)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (!editName.trim()) {
      setEditError("Full name is required.");
      return;
    }

    if (!validatePakistaniPhone(editPhone)) {
      setEditError("Please enter a valid Pakistani WhatsApp mobile number.");
      return;
    }

    if (isDelivery && !editAddress.trim()) {
      setEditError("Delivery address is required for Home Delivery.");
      return;
    }

    setActionLoading(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/orders/${order.id || orderId}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editName.trim(),
          customerPhone: editPhone.trim(),
          deliveryAddress: isDelivery ? editAddress.trim() : undefined,
          notes: editNotes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isApproved && data.whatsappUrl) {
          window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
        }
        throw new Error(data.error || "Failed to update order.");
      }

      setEditModalOpen(false);
      await fetchStatus();
    } catch (err: any) {
      setEditError(err.message || "Could not update order.");
    } finally {
      setActionLoading(false);
    }
  };

  // Build WhatsApp complete order slip link for sending to store owner (0337-1691006)
  const getWhatsAppOrderSlipLink = () => {
    if (!order) return "https://wa.me/923371691006";
    const isDeliveryMode = (order.fulfillmentType || "").toLowerCase().includes("delivery");
    const itemsText = (order.items || [])
      .map((it, idx) => `${idx + 1}. *${it.productName || "Item"}* x ${it.quantity} = Rs. ${Number(it.total || it.price * it.quantity).toLocaleString()}`)
      .join("\n");

    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const trackingUrl = `${origin}/order-tracking/${order.id || orderId}`;
    const invoiceUrl = `${origin}/api/orders/${order.id || orderId}/invoice`;

    const msg = `🍗 *NEW ORDER ALERT — AL-MOMAN SPECIAL FROZEN FOOD*
==========================================
📦 *Order ID:* #${order.orderNumber}
👤 *Customer Name:* ${order.customerName}
📞 *Customer WhatsApp:* ${order.customerPhone}
🚚 *Fulfillment:* ${isDeliveryMode ? "HOME DELIVERY" : "STORE SELF-PICKUP"}
${isDeliveryMode ? `📍 *Address:* ${order.deliveryAddress || "N/A"}\n` : `🏪 *Pickup Warehouse:* 556/A Model Town, Gujranwala\n`}==========================================
📋 *ORDER ITEMS:*
${itemsText}

💰 *Subtotal:* Rs. ${Number(order.subtotal || 0).toLocaleString()}
🛵 *Delivery:* ${isDeliveryMode ? "Pending / TBD via WhatsApp" : "Rs. 0 (Self Pickup)"}
💵 *Total Amount:* Rs. ${Number(order.totalAmount || order.subtotal || 0).toLocaleString()}${isDeliveryMode ? " + Delivery" : ""}
==========================================
📄 *In-App Invoice Viewer:*
${invoiceUrl}

🔗 *Live Tracking Link:*
${trackingUrl}
==========================================
Salam AL-MOMAN Store Owner! Please check and confirm this order.`;

    return `https://wa.me/923371691006?text=${encodeURIComponent(msg)}`;
  };

  const [promptedWhatsApp, setPromptedWhatsApp] = useState(false);

  useEffect(() => {
    if (order && !promptedWhatsApp && typeof window !== "undefined") {
      if (window.location.search.includes("sendWhatsApp=1")) {
        setPromptedWhatsApp(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        try {
          window.open(getWhatsAppOrderSlipLink(), "_blank", "noopener,noreferrer");
        } catch (e) {
          console.warn("Could not auto-open WhatsApp:", e);
        }
      }
    }
  }, [order, promptedWhatsApp]);

  // Build WhatsApp cancellation/change request link for approved orders
  const getAdminWhatsAppChangeLink = () => {
    if (!order) return "https://wa.me/923371691006";
    const msg = `Hello AL-MOMAN Store! I would like to request changes / cancellation for my approved order #${order.orderNumber}. Customer: ${order.customerName}, Phone: ${order.customerPhone}.`;
    return `https://wa.me/923371691006?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
          </Link>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Sync Active (Every 3s)</span>
            <button
              onClick={() => fetchStatus()}
              disabled={isRefreshing}
              title="Refresh status now"
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white">Loading Order Tracking...</h2>
            <p className="text-xs text-zinc-400">Connecting to AL-MOMAN Live Order Server</p>
          </div>
        ) : error ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 bg-rose-950 border border-rose-500 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Order Record Not Found</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">{error}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/track"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-xl text-xs uppercase tracking-wider transition"
              >
                Track by Phone Number
              </Link>
              <Link
                href="/"
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs uppercase tracking-wider transition"
              >
                Return to Menu
              </Link>
            </div>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Highlighted WhatsApp Order Dispatch Card */}
            {!isCancelled && (
              <div className="bg-gradient-to-r from-emerald-950/90 via-zinc-900 to-emerald-950/90 border-2 border-emerald-500/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0 text-emerald-400 mt-1">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-zinc-950 px-2.5 py-0.5 rounded-full">
                          Store WhatsApp Notice
                        </span>
                        <span className="text-xs text-emerald-400 font-mono font-bold">0337-1691006</span>
                      </div>
                      <h3 className="text-base font-black text-white">
                        Send Complete Order Slip to Store Owner
                      </h3>
                      <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
                        Aap 1-click se apna poora order bill, item list, delivery address aur tracking link direct AL-MOMAN Owner WhatsApp (<strong>0337-1691006</strong>) par send kar saktay hain.
                      </p>
                    </div>
                  </div>

                  <a
                    href={getWhatsAppOrderSlipLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 group cursor-pointer shrink-0"
                  >
                    <MessageCircle className="w-4 h-4 fill-zinc-950" />
                    <span>Send on WhatsApp (0337-1691006)</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </a>
                </div>
              </div>
            )}

            {/* Header Hero Card */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-400/60 bg-black shrink-0">
                    <img src="/brand-logo.png" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      Live Order Tracking
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-white font-mono">
                      #{order.orderNumber}
                    </h1>
                  </div>
                </div>

                {/* Dynamic Status Badge */}
                <div>
                  {statusLower === "cancelled" ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950 border border-rose-500/80 text-rose-300 text-xs font-black shadow-lg">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Order Cancelled</span>
                    </div>
                  ) : statusLower === "delivered" ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 text-xs font-black shadow-lg shadow-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Order Delivered (Completed)</span>
                    </div>
                  ) : statusLower === "ready" ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950 border border-purple-500 text-purple-300 text-xs font-black shadow-lg shadow-purple-950">
                      <Truck className="w-4 h-4 text-purple-400 animate-bounce" />
                      <span>Ready for Delivery / Pickup</span>
                    </div>
                  ) : statusLower === "preparing" ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950 border border-blue-500 text-blue-300 text-xs font-black shadow-lg shadow-blue-950">
                      <ChefHat className="w-4 h-4 text-blue-400 animate-pulse" />
                      <span>In Kitchen (Blast Freezing)</span>
                    </div>
                  ) : statusLower === "confirmed" ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950 border border-emerald-500/80 text-emerald-300 text-xs font-black shadow-lg shadow-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Order Confirmed & Approved</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/80 text-amber-300 text-xs font-black shadow-lg">
                      <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                      <span>Pending Owner Confirmation</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Status Banner */}
              <div className="mt-6 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                {statusLower === "cancelled" ? (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-950 border border-rose-500 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-rose-400">
                        This order has been cancelled.
                      </h3>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                        {order.notes && order.notes.includes("Cancel Reason:")
                          ? order.notes
                          : "This order was cancelled prior to kitchen preparation. You can place a new order anytime."}
                      </p>
                    </div>
                  </div>
                ) : statusLower === "delivered" ? (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-400 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-400">
                        Order Deliver Kar Diya Gaya Hai (Fulfillment Complete)!
                      </h3>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                        Aapka AL-MOMAN Frozen Food order kamyabi ke sath deliver ho chuka hai. Fresh & crispy frozen food enjoy karein aur dobara zaroor order karein!
                      </p>
                    </div>
                  </div>
                ) : statusLower === "ready" ? (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-purple-400">
                        Order Tayar Hai — Aap Delivery Le Saktay Hain!
                      </h3>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                        {isDelivery
                          ? "Aapka order bilkul pack ho chuka hai aur rider delivery ke liye dispatch ho chuka hai. Rider jald aapke address par pohanch raha hai."
                          : "Aapka order outlet par pack ho kar tayar hai. Aap AL-MOMAN Outlet (556/A Model Town, Gujranwala) se apna order pick kar saktay hain."}
                      </p>
                    </div>
                  </div>
                ) : statusLower === "preparing" ? (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-500 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-blue-400">
                        Order Kitchen Main Tayar Ho Raha Hai (In Preparation)!
                      </h3>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                        Hamare Gujranwala kitchen main aapka fresh order hygienic blast-freezing (-35°C) ke sath tayar kiya ja raha hai. Tayar hotay hi dispatch notification mil jaye gi.
                      </p>
                    </div>
                  </div>
                ) : statusLower === "confirmed" ? (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-400">
                        Store Owner Ne Aapka Order Confirm Kar Diya Hai!
                      </h3>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                        AL-MOMAN kitchen ne aapki request approve kar li hai. Authentic recipe & pure chicken ke sath order processing shuru ho chuki hai.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-500 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-amber-400">
                        Order Received — Awaiting Store Owner Approval
                      </h3>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                        Store owner ko aapka order WhatsApp & Admin portal par masool ho chuka hai. Admin ke status update karte hi yeh screen automatically refresh ho jaye gi!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Step Visual Progress Bar (Hidden if cancelled) */}
              {!isCancelled && (
                <div className="mt-8 pt-4">
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="hidden sm:block absolute top-1/2 left-6 right-6 h-1 bg-zinc-800 -translate-y-1/2" />
                    <div
                      className="hidden sm:block absolute top-1/2 left-6 h-1 bg-gradient-to-r from-emerald-500 to-amber-400 -translate-y-1/2 transition-all duration-700"
                      style={{
                        width: `${(currentStepIdx / (STEPS.length - 1)) * 90}%`,
                      }}
                    />

                    {/* Step Icons */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
                      {STEPS.map((step, idx) => {
                        const isCompleted = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div
                            key={step.key}
                            className={`flex sm:flex-col items-center sm:text-center gap-3 p-3 sm:p-2 rounded-2xl border sm:border-none transition ${
                              isCurrent
                                ? "bg-zinc-950 sm:bg-transparent border-emerald-500/60"
                                : "bg-zinc-950/40 sm:bg-transparent border-zinc-800/60"
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-all duration-500 ${
                                isCompleted
                                  ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/30 scale-105"
                                  : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                            </div>

                            <div>
                              <p
                                className={`text-xs font-bold ${
                                  isCompleted ? "text-white" : "text-zinc-500"
                                }`}
                              >
                                {step.label}
                              </p>
                              <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ORDER EDIT & CANCEL MANAGEMENT SECTION */}
            {isPending && (
              /* Case 1: Order is Pending - Direct Edit & Direct Cancel Allowed */
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between flex-wrap gap-4 shadow-lg">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Modify or Cancel Order
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Your order has not been approved yet. You can update your delivery address or cancel before kitchen prep begins.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edit Order</span>
                  </button>

                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Cancel Order</span>
                  </button>
                </div>
              </div>
            )}

            {isApproved && (
              /* Case 2: Order is Already Approved - Direct Cancel Locked; WhatsApp Contact Required */
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-600/40 flex items-center justify-between flex-wrap gap-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-500/60 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                      Order Approved &amp; Preparing — In-App Cancellation Locked
                    </h4>
                    <p className="text-xs text-zinc-300 mt-0.5 max-w-xl leading-relaxed">
                      This order is approved and currently being blast-frozen in our kitchen. To request an urgent cancellation or delivery change, please contact the store owner directly on WhatsApp.
                    </p>
                  </div>
                </div>

                <a
                  href={getAdminWhatsAppChangeLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs rounded-xl transition shadow-lg flex items-center gap-2 whitespace-nowrap ml-auto"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Request Cancel on WhatsApp</span>
                </a>
              </div>
            )}

            {isCancelled && (
              /* Case 3: Order is Cancelled - Option to re-order */
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between flex-wrap gap-4 text-xs">
                <div>
                  <p className="font-bold text-white">Looking for delicious frozen chicken snacks?</p>
                  <p className="text-zinc-400 mt-0.5">Explore our menu and place a fresh order anytime.</p>
                </div>
                <Link
                  href="/menu"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl transition shadow flex items-center gap-2"
                >
                  <span>Browse Fresh Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Embedded In-App Invoice Viewer (Zero Forced Auto-Download) */}
            <InvoiceViewer
              orderId={order.id || orderId}
              orderNumber={order.orderNumber}
              customerName={order.customerName}
              customerPhone={order.customerPhone}
              fulfillmentType={order.fulfillmentType}
              deliveryAddress={order.deliveryAddress}
              items={order.items}
              subtotal={order.subtotal}
              deliveryCharges={order.deliveryCharges}
              totalAmount={order.totalAmount}
              createdAt={order.createdAt}
            />

            {/* Direct WhatsApp Helpline Card */}
            <div className="p-4 bg-zinc-900 border border-emerald-600/50 rounded-2xl flex items-center justify-between transition group shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-white group-hover:text-emerald-300 transition block">
                    Direct WhatsApp Customer Support
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Need instant changes or delivery updates? Chat directly on 0337-1691006
                  </span>
                </div>
              </div>

              <a
                href={`https://wa.me/923371691006?text=${encodeURIComponent(
                  `Hello AL-MOMAN Frozen Chicken! Checking on my order #${order.orderNumber}. Customer Phone: ${order.customerPhone}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-black rounded-xl transition shadow flex items-center gap-1.5"
              >
                <span>Chat Now</span>
                <PhoneCall className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Order Details & Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Items Summary (2 Cols) */}
              <div className="md:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-emerald-400" />
                  Itemized Order Breakdown ({order.items.length} Items)
                </h3>

                <div className="divide-y divide-zinc-800">
                  {order.items.map((item, i) => (
                    <div key={i} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{item.productName}</p>
                        <p className="text-[11px] text-zinc-400">
                          Qty: {item.quantity} × Rs. {item.price.toLocaleString()}
                          {item.packSize && ` • ${item.packSize}`}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-400">
                        Rs. {item.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span className="text-zinc-200">Rs. {order.subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-zinc-400">
                    <span>Delivery Charges</span>
                    {isDelivery ? (
                      order.deliveryCharges > 0 ? (
                        <span className="text-zinc-200">Rs. {order.deliveryCharges.toLocaleString()}</span>
                      ) : (
                        <span className="text-amber-400 font-medium">Pending via WhatsApp</span>
                      )
                    ) : (
                      <span className="text-emerald-400 font-bold">FREE (Self-Pickup)</span>
                    )}
                  </div>

                  <div className="flex justify-between text-sm font-black pt-2 border-t border-zinc-800">
                    <span className="text-white">Total Amount</span>
                    <span className="text-emerald-400">
                      Rs. {order.totalAmount.toLocaleString()}
                      {isDelivery && (!order.deliveryCharges || order.deliveryCharges === 0) ? " + Delivery" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery / Pickup Details (1 Col) */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  {isDelivery ? <Truck className="w-4 h-4 text-emerald-400" /> : <Building2 className="w-4 h-4 text-emerald-400" />}
                  Fulfillment Information
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase font-bold block">Recipient Name</span>
                    <span className="font-bold text-zinc-200">{order.customerName}</span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase font-bold block">WhatsApp Contact</span>
                    <span className="font-mono text-zinc-200">{order.customerPhone}</span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase font-bold block">Fulfillment Mode</span>
                    <span className="font-bold uppercase text-emerald-400">
                      {isDelivery ? "Home Delivery" : "Self-Pickup"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase font-bold block">Address / Location</span>
                    <p className="text-zinc-300 leading-relaxed text-[11px] mt-0.5">
                      {order.deliveryAddress || "Store Pickup (556/A Model Town, Gujranwala)"}
                    </p>
                  </div>

                  {order.notes && (
                    <div className="pt-2 border-t border-zinc-800">
                      <span className="text-zinc-500 text-[10px] uppercase font-bold block">Special Notes</span>
                      <p className="text-zinc-300 text-[11px] mt-0.5">{order.notes}</p>
                    </div>
                  )}

                  {isDelivery && (
                    <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-[10px] text-amber-300 leading-relaxed">
                      <strong>Note:</strong> Delivery charges will be communicated directly via WhatsApp chat based on your distance.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* EDIT ORDER DETAILS MODAL (Only for Pending Orders) */}
      <AnimatePresence>
        {editModalOpen && order && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Edit Order Details</h3>
                    <p className="text-[11px] text-zinc-400">Order #{order.orderNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 pt-4 text-xs">
                {editError && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">WhatsApp / Phone Number *</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none transition"
                  />
                </div>

                {isDelivery && (
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">Delivery Address *</label>
                    <textarea
                      rows={2}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white focus:outline-none transition resize-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Special Delivery Notes</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Ring doorbell, call upon arrival"
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white focus:outline-none transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-zinc-950 font-black rounded-xl transition shadow flex items-center gap-1.5"
                  >
                    {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CANCEL ORDER CONFIRMATION MODAL (Only for Pending Orders) */}
      <AnimatePresence>
        {cancelModalOpen && order && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Cancel Order Confirmation</h3>
                    <p className="text-[11px] text-zinc-400">Order #{order.orderNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 pt-4 text-xs">
                {cancelError && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{cancelError}</span>
                  </div>
                )}

                <p className="text-zinc-300 leading-relaxed">
                  Are you sure you want to cancel this order? Since this order has not been approved yet, cancellation is instant and free of charge.
                </p>

                <div>
                  <label className="text-zinc-300 font-bold block mb-2">Please tell us the reason:</label>
                  <div className="space-y-2">
                    {[
                      "Ordered by mistake",
                      "Change of delivery address",
                      "Want to add more items",
                      "Change in mind",
                      "Other",
                    ].map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                          cancelReason === reason
                            ? "bg-rose-950/40 border-rose-600/70 text-white"
                            : "bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          value={reason}
                          checked={cancelReason === reason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="accent-rose-500"
                        />
                        <span className="font-medium">{reason}</span>
                      </label>
                    ))}
                  </div>

                  {cancelReason === "Other" && (
                    <input
                      type="text"
                      value={customCancelReason}
                      onChange={(e) => setCustomCancelReason(e.target.value)}
                      placeholder="Enter custom cancellation reason"
                      className="mt-2 w-full bg-zinc-950 border border-zinc-700 focus:border-rose-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none transition"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold transition"
                  >
                    Keep Order
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleConfirmCancel}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 text-white font-black rounded-xl transition shadow flex items-center gap-1.5"
                  >
                    {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Confirm Cancel</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
