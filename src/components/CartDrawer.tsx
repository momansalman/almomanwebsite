"use client";

import React, { useState } from "react";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Truck,
  MapPin,
  Clock,
  MessageCircle,
  Building2,
  Phone,
  Sparkles,
  Copy,
  Check,
  Navigation,
  User as UserIcon,
  Gift,
  Star,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import PhoneInput, { validatePakistaniPhone } from "./PhoneInput";
import AuthModal from "./AuthModal";
import { motion } from "framer-motion";
import { saveActiveOrder } from "@/lib/orderTrackingStorage";

interface LastOrderDetails {
  id: string;
  fulfillmentType: "Home Delivery" | "Self-Pickup";
  phone: string;
  buyerPhone?: string;
  recipientName: string;
  buyerName?: string;
  isOrderingForOther?: boolean;
  address: string;
  customerLocationLink?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    packSize: string;
    selectedSize?: string;
  }>;
  total: number;
}

export default function CartDrawer() {
  const router = useRouter();
  const { items, isCartOpen, closeCart, updateQuantity, removeItem, clearCart, getTotal } =
    useCartStore();
  const { user } = useAuthStore();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<"Home Delivery" | "Self-Pickup">("Home Delivery");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [customerLocation, setCustomerLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    mapsLink: string;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isOrderingForOther, setIsOrderingForOther] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [savedRecipients, setSavedRecipients] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState<LastOrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRedirecting, setAutoRedirecting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleDetectGPSLocation = () => {
    setLocationError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("GPS location detection is not supported on this device/browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const mapsLink = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

        setCustomerLocation({
          lat,
          lng,
          accuracy,
          mapsLink,
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setLocationError("Location permission denied. Please allow location access in your browser or type your address manually.");
        } else if (err.code === 2) {
          setLocationError("Position unavailable. Please ensure GPS / Location is turned on on your mobile device.");
        } else {
          setLocationError("Unable to detect location. Please type your delivery address manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const copyWarehouseAddress = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("556/A Model Town, Gujranwala");
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2500);
    }
  };

  const estimatedDeliveryDate = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  React.useEffect(() => {
    if (user?.phone && !phone) setPhone(user.phone);
    if (user?.address && !address) setAddress(user.address);
    if (user?.name && !recipientName) setRecipientName(user.name);
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("almoman_saved_recipients");
        if (stored) setSavedRecipients(JSON.parse(stored));
      } catch {}
    }
  }, [user, phone, address, recipientName]);

  if (!isCartOpen) return null;

  const total = getTotal();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923371691006";
  const displayPhone = "0337-1691006";

  const handleStartCheckout = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (user.phone && !phone) setPhone(user.phone);
    if (user.address && !address) setAddress(user.address);
    if (user.name && !recipientName) setRecipientName(user.name);
    setIsCheckingOut(true);
  };

  const handlePlaceOrder = async (interactiveWhatsApp: boolean = false) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!validatePakistaniPhone(phone)) {
      setError("Please provide a valid Pakistani WhatsApp phone number (03XXXXXXXXX or +923XXXXXXXXX).");
      return;
    }

    if (fulfillmentType === "Home Delivery" && !address.trim()) {
      setError("Please provide your full delivery address for Home Delivery.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const effectiveAddress =
      fulfillmentType === "Self-Pickup"
        ? "Self-Pickup (556/A Model Town, Gujranwala)"
        : address;

    const callerName = user.name || "Customer";
    const effectiveRecipient = isOrderingForOther && recipientName.trim()
      ? recipientName.trim()
      : (recipientName.trim() || callerName);

    const effectivePhone = isOrderingForOther && recipientPhone.trim()
      ? recipientPhone.trim()
      : phone;

    try {
      const orderPayload = {
        customerName: effectiveRecipient,
        customerPhone: effectivePhone,
        items: items.map((i) => ({
          productId: i.productId || i.id,
          productName: i.name,
          price: i.price,
          quantity: i.quantity,
          total: i.price * i.quantity,
          packSize: i.packSize,
          selectedSize: i.selectedSize,
        })),
        subtotal: total,
        fulfillmentType: fulfillmentType === "Self-Pickup" ? "pickup" : "delivery",
        deliveryAddress: fulfillmentType === "Home Delivery" ? effectiveAddress : null,
        shippingAddress: effectiveAddress,
        notes,
        paymentMethod: "Cash on Delivery",
      };

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit order");
      }

      // Store active tracking session
      try {
        saveActiveOrder({
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          customerName: effectiveRecipient,
          customerPhone: effectivePhone,
          totalAmount: data.totalAmount || total,
          status: data.orderStatus || "pending",
          fulfillmentType: fulfillmentType === "Home Delivery" ? "delivery" : "pickup",
          deliveryAddress: fulfillmentType === "Home Delivery" ? effectiveAddress : null,
        });
      } catch (storeErr) {
        console.warn("Storage sync notice:", storeErr);
      }

      clearCart();
      setIsCheckingOut(false);
      closeCart();

      // If Button 2 ("Confirm & WhatsApp"), open WhatsApp chat deep link
      if (interactiveWhatsApp && data.whatsappChatUrl) {
        window.open(data.whatsappChatUrl, "_blank", "noopener,noreferrer");
      }

      // Redirect to Order Tracking page
      router.push(`/order-tracking/${data.orderId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  };

  const buildWhatsAppUrl = (orderInfo: LastOrderDetails | null) => {
    if (!orderInfo) return `https://wa.me/${whatsappNumber}`;

    const itemsSummary = orderInfo.items
      .map(
        (i) =>
          `• ${i.quantity}x ${i.name} ${i.selectedSize ? `[Size: ${i.selectedSize}] ` : ""}(${i.packSize}) - Rs. ${(i.price * i.quantity).toLocaleString()}`
      )
      .join("\n");

    const fulfillmentDetails =
      orderInfo.fulfillmentType === "Self-Pickup"
        ? `🏬 *Fulfillment:* Self-Pickup (Warehouse)\n*Warehouse Address:* 556/A Model Town, Gujranwala\n📍 *Google Maps Pin:* https://maps.google.com/?q=556/A+Model+Town+Gujranwala\n🚗 *Live Navigation:* Click link above for turn-by-turn directions.\n*Note:* Please confirm pickup timing with us.`
        : `🏠 *Fulfillment:* Home Delivery\n*Delivery Address:* ${orderInfo.address}${
            orderInfo.customerLocationLink
              ? `\n📍 *Customer Live GPS Pin (Rider Direct Link):* ${orderInfo.customerLocationLink}\n🚗 *Live Turn-by-Turn Navigation for Rider:* Click link above`
              : ""
          }\n*Coverage Notice:* Home Delivery is only available in Model Town Gujranwala & nearby areas. (Out-of-city customers arrange self-pickup or cargo).\n*Note:* Please confirm order & delivery timing details.`;

    const isGiftOrOther =
      orderInfo.isOrderingForOther ||
      (orderInfo.recipientName && orderInfo.recipientName.toLowerCase() !== (orderInfo.buyerName || user?.name || "").toLowerCase());

    const recipientDetails = isGiftOrOther
      ? `*Recipient / Order Placed For:* ${orderInfo.recipientName} 🎁\n*Placed By Account:* ${orderInfo.buyerName || user?.name || "Customer"}${orderInfo.buyerPhone && orderInfo.buyerPhone !== orderInfo.phone ? ` (${orderInfo.buyerPhone})` : ""}\n*Delivery / Receiver Contact:* ${orderInfo.phone}`
      : `*Customer:* ${orderInfo.recipientName || user?.name || "Customer"}\n*Phone:* ${orderInfo.phone}`;

    const message = `*Hello Al Moman Frozen Foods!* 🍗\n\nI have placed an order on your website:\n\n*Order ID:* #${orderInfo.id}\n${recipientDetails}\n${fulfillmentDetails}\n\n*Items Ordered:*\n${itemsSummary}\n\n*Total Amount:* Rs. ${orderInfo.total.toLocaleString()} (Cash on Delivery)\n\nPlease confirm my order. Thank you!`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const buildDirectCartWhatsAppUrl = () => {
    const itemsSummary = items
      .map(
        (i) =>
          `• ${i.quantity}x ${i.name} ${i.selectedSize ? `[Size: ${i.selectedSize}] ` : ""}(${i.packSize}) - Rs. ${(i.price * i.quantity).toLocaleString()}`
      )
      .join("\n");

    const message = `*Hello Al Moman Frozen Foods!* 🍗\n\nI would like to order the following frozen items:\n\n${itemsSummary}\n\n*Total Amount:* Rs. ${total.toLocaleString()}\n\n*Warehouse Pickup:* 556/A Model Town, Gujranwala\n📍 *Google Maps Pin:* https://maps.google.com/?q=556/A+Model+Town+Gujranwala\n*Delivery Notice:* Home Delivery is only available in Model Town Gujranwala & nearby areas. Out-of-city customers arrange self-pickup or private cargo.\n\nPlease confirm order details and timing. Thank you!`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCart}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="w-screen max-w-full sm:max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col text-zinc-100"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-black text-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h2 className="font-black text-lg">Your Frozen Food Cart</h2>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Success State */}
            {lastOrder ? (
              <div className="p-6 text-center my-auto overflow-y-auto">
                <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white mb-1">
                  Order Successfully Placed!
                </h3>
                <p className="text-xs text-zinc-400 mb-2">
                  Your order has been recorded:
                  <span className="font-mono font-bold block text-emerald-400 text-base mt-0.5">
                    #{lastOrder.id}
                  </span>
                </p>

                {/* Specific Notice depending on fulfillment type */}
                {lastOrder.fulfillmentType === "Self-Pickup" ? (
                  <div className="bg-zinc-900 border border-emerald-500/50 rounded-2xl p-4 mb-4 text-left text-xs space-y-3 shadow-lg shadow-black/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                        <Building2 className="w-4 h-4 shrink-0" /> Self-Pickup (Warehouse)
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                        Auto-Location
                      </span>
                    </div>

                    <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-extrabold text-xs">
                            556/A Model Town, Gujranwala
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Warehouse pickup location pinned &amp; ready for navigation.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <a
                          href="https://maps.google.com/?q=556/A+Model+Town+Gujranwala"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-lg text-xs transition shadow-md"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Open Google Maps
                        </a>
                        <button
                          type="button"
                          onClick={copyWarehouseAddress}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold rounded-lg text-xs transition"
                        >
                          {copiedAddress ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Address Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-zinc-400" /> Copy for Ride / Careem
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      💡 <strong>Automated Location:</strong> No need to request location manually — click the button above to launch live Google Maps navigation. This link is also attached to your WhatsApp order receipt!
                    </p>
                  </div>
                ) : (
                  <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-4 mb-4 text-left text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                      <Clock className="w-4 h-4 shrink-0" /> Home Delivery (Model Town Gujranwala &amp; Nearby)
                    </div>
                    <p className="text-zinc-300">
                      Standard delivery time is <strong>2 Days</strong>. Home Delivery is strictly available in <strong>Model Town, Gujranwala and nearby areas</strong>.
                    </p>
                    <p className="text-amber-400/90 text-[11px] font-semibold">
                      *Out-of-city customers must arrange private transport/cargo or choose self-pickup from our warehouse (556/A Model Town, Gujranwala).
                    </p>
                  </div>
                )}

                {autoRedirecting && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-2xl text-xs text-center text-emerald-300 font-bold mb-4 flex items-center justify-center gap-2 animate-pulse">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Automatically opening WhatsApp with pre-filled order receipt...</span>
                  </div>
                )}

                {/* Post-Order 5-Star Rating Card */}
                <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-500/50 rounded-2xl p-4 mb-4 text-center space-y-2 shadow-lg shadow-black/80">
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" /> Rate Your Order Experience
                  </div>
                  <p className="text-white font-extrabold text-xs">
                    Please give us 5 stars if you enjoyed ordering today!
                  </p>
                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new Event("open-rating-modal"));
                        }}
                        className="p-1 hover:scale-125 transition-transform"
                        title={`Rate ${s} Stars`}
                      >
                        <Star className="w-7 h-7 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new Event("open-rating-modal"));
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                  >
                    Tap to Leave Full 5-Star Review →
                  </button>
                </div>

                {/* Recipient Order Summary Card */}
                <div className="p-3 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-left text-xs space-y-1.5 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Order Placed For:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">{lastOrder.recipientName}</span>
                  </div>
                  {lastOrder.buyerName && lastOrder.buyerName !== lastOrder.recipientName && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Ordered By Account:</span>
                      <span className="text-zinc-300">{lastOrder.buyerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Receiver Contact:</span>
                    <span className="text-zinc-300">{lastOrder.phone}</span>
                  </div>
                  {lastOrder.customerLocationLink && (
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-zinc-800">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" /> Live GPS Pin:
                      </span>
                      <a
                        href={lastOrder.customerLocationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 underline font-semibold"
                      >
                        Open Maps
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  <a
                    href={buildWhatsAppUrl(lastOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-sm shadow-xl shadow-emerald-950 transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Confirm on WhatsApp ({displayPhone})
                  </a>

                  {/* Multi-Order Helper: Place Another Order under different name */}
                  <button
                    type="button"
                    onClick={() => {
                      setLastOrder(null);
                      setIsCheckingOut(false);
                      setIsOrderingForOther(true);
                      setRecipientName("");
                      setRecipientPhone("");
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/50 text-emerald-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" /> Place Another Order (For Someone Else)
                  </button>

                  <button
                    onClick={() => {
                      setLastOrder(null);
                      closeCart();
                    }}
                    className="w-full py-2 text-xs font-bold text-zinc-400 hover:text-white"
                  >
                    Back to Store
                  </button>
                </div>
              </div>
            ) : items.length === 0 ? (
              /* Empty Cart State */
              <div className="p-8 text-center my-auto">
                <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 text-zinc-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Your Cart is Empty</h3>
                <p className="text-xs text-zinc-400 mb-6">
                  Explore our samosas, kebabs, rolls, and patties to add fresh frozen food!
                </p>
                <button
                  onClick={closeCart}
                  className="px-6 py-2.5 bg-emerald-600 text-zinc-950 text-xs font-black rounded-xl hover:bg-emerald-500 transition"
                >
                  Browse Products
                </button>
              </div>
            ) : isCheckingOut ? (
              /* Checkout Form (Gated to Logged In Users) */
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
                  <h3 className="font-extrabold text-white text-base">Select Order Option</h3>
                  <button
                    onClick={() => setIsCheckingOut(false)}
                    className="text-xs font-bold text-emerald-400 hover:underline"
                  >
                    Back to Items
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl mb-4 text-xs">
                  <p className="font-bold text-white">Ordering as: {user?.name}</p>
                  <p className="text-[11px] text-zinc-400">{user?.email}</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePlaceOrder(false);
                  }}
                  className="space-y-4"
                >
                  {/* Two Fulfillment Options */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">
                      Fulfillment Method (Delivery or Self-Pickup)
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Option 1: Home Delivery */}
                      <button
                        type="button"
                        onClick={() => setFulfillmentType("Home Delivery")}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                          fulfillmentType === "Home Delivery"
                            ? "bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/40"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <Truck
                            className={`w-4 h-4 ${
                              fulfillmentType === "Home Delivery"
                                ? "text-emerald-400"
                                : "text-zinc-500"
                            }`}
                          />
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                              fulfillmentType === "Home Delivery"
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                                : "bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            2 Days
                          </span>
                        </div>
                        <span className="font-bold text-xs text-white block">Home Delivery</span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">Doorstep cold delivery</span>
                      </button>

                      {/* Option 2: Self-Pickup */}
                      <button
                        type="button"
                        onClick={() => setFulfillmentType("Self-Pickup")}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                          fulfillmentType === "Self-Pickup"
                            ? "bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/40"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <Building2
                            className={`w-4 h-4 ${
                              fulfillmentType === "Self-Pickup"
                                ? "text-emerald-400"
                                : "text-zinc-500"
                            }`}
                          />
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                              fulfillmentType === "Self-Pickup"
                                ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/40"
                                : "bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            Gujranwala
                          </span>
                        </div>
                        <span className="font-bold text-xs text-white block">Self-Pickup</span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">556/A Model Town</span>
                      </button>
                    </div>
                  </div>

                  {/* Clarification Alert Box based on Selected Option */}
                  {fulfillmentType === "Home Delivery" ? (
                    <div className="p-3 bg-zinc-900 border border-amber-500/40 rounded-2xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-amber-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          Delivery Time: 2 Days
                        </span>
                        <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                          Coverage Limited
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Home Delivery is available <strong>only in Model Town, Gujranwala and nearby areas</strong>.
                      </p>
                      <div className="p-2 bg-amber-950/60 rounded-xl border border-amber-600/50 text-[11px] text-amber-300 leading-normal">
                        <strong>⚠️ Out-of-City Customers:</strong> Store delivery is not provided outside Gujranwala nearby areas. Customers must arrange their own private cargo/transport or choose warehouse self-pickup.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-zinc-900 border border-emerald-500/40 rounded-2xl text-xs space-y-2.5">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          Warehouse Pickup Location
                        </span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                          Automated Navigation
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-zinc-200 leading-relaxed">
                        Warehouse Address: <strong className="text-white">556/A Model Town, Gujranwala</strong>
                      </p>

                      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                        <a
                          href="https://maps.google.com/?q=556/A+Model+Town+Gujranwala"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs font-bold rounded-lg transition"
                        >
                          <Navigation className="w-3 h-3 text-emerald-400" /> Open in Google Maps
                        </a>
                        <button
                          type="button"
                          onClick={copyWarehouseAddress}
                          className="inline-flex items-center gap-1.5 py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition"
                        >
                          {copiedAddress ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-zinc-400" /> Copy Address
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[10px] text-zinc-400">
                        *Google Maps location link will be automatically attached to your WhatsApp order receipt upon submission.
                      </p>
                    </div>
                  )}

                  {/* Recipient / Ordering For Someone Else Section */}
                  <div className="p-3.5 bg-zinc-900 border border-zinc-700/80 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-zinc-200">
                        Receiver / Recipient Name *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !isOrderingForOther;
                          setIsOrderingForOther(nextState);
                          if (!nextState && user?.name) {
                            setRecipientName(user.name);
                          }
                        }}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5 text-emerald-400" />
                        {isOrderingForOther ? "Ordering for Myself" : "Ordering for Someone Else?"}
                      </button>
                    </div>

                    {/* Quick Recipient Selection Chips */}
                    {(savedRecipients.length > 0 || (user?.name && isOrderingForOther)) && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-zinc-400 font-semibold mr-1">Quick Select:</span>
                        {user?.name && (
                          <button
                            type="button"
                            onClick={() => {
                              setRecipientName(user.name);
                              setIsOrderingForOther(false);
                            }}
                            className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                              recipientName === user.name && !isOrderingForOther
                                ? "bg-emerald-950 text-emerald-300 border-emerald-600 font-bold"
                                : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                            }`}
                          >
                            Myself ({user.name})
                          </button>
                        )}
                        {savedRecipients.map((saved) => (
                          <button
                            key={saved}
                            type="button"
                            onClick={() => {
                              setRecipientName(saved);
                              setIsOrderingForOther(true);
                            }}
                            className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                              recipientName === saved
                                ? "bg-emerald-950 text-emerald-300 border-emerald-600 font-bold"
                                : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                            }`}
                          >
                            {saved}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder={isOrderingForOther ? "Receiver's Name (e.g. Fatima Baji, Uncle Tariq)" : "Your Full Name"}
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-zinc-500"
                      />
                    </div>

                    {isOrderingForOther && (
                      <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Delivering to a Relative, Friend, or Neighbor</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          This order will be registered in <strong className="text-white">{recipientName || "their"}</strong> name. Your WhatsApp (<strong className="text-zinc-200">{user?.name || "you"}</strong>) will still receive confirmation.
                        </p>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                            Alternative Receiver Phone (Optional)
                          </label>
                          <input
                            type="tel"
                            placeholder="e.g. 0300-1234567 (if different from yours)"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-zinc-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone input */}
                  {/* Phone input with Mandatory WhatsApp Helper Notice */}
                  <PhoneInput
                    value={phone}
                    onChange={(val) => setPhone(val)}
                    label="Phone / WhatsApp Number"
                    required
                  />

                  {/* Delivery address (only required for Home Delivery) */}
                  {fulfillmentType === "Home Delivery" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-zinc-300">
                          Delivery Address (Model Town Guj &amp; Nearby) *
                        </label>
                        <span className="text-[10px] text-amber-400 font-semibold">
                          Nearby Areas Only
                        </span>
                      </div>
                      <textarea
                        required
                        rows={2}
                        placeholder="House #, Street #, Model Town / Nearby Area, Gujranwala"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-zinc-500"
                      />

                      {/* GPS Live Location Capture Card */}
                      <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                            Rider Live GPS Pin (1-Click)
                          </span>
                          {customerLocation ? (
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-2.5 h-2.5 text-emerald-400" /> GPS Locked
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-500">Optional</span>
                          )}
                        </div>

                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Click below to attach your exact live location pin so our rider reaches your doorstep without calling for directions.
                        </p>

                        {customerLocation ? (
                          <div className="p-2.5 bg-emerald-950/40 border border-emerald-700/60 rounded-lg text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-emerald-300 font-medium">
                              <span className="flex items-center gap-1 text-[11px]">
                                <MapPin className="w-3 h-3 text-emerald-400" /> Lat {customerLocation.lat.toFixed(4)}, Lng {customerLocation.lng.toFixed(4)}
                              </span>
                              <button
                                type="button"
                                onClick={handleDetectGPSLocation}
                                disabled={locating}
                                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                              >
                                Re-detect
                              </button>
                            </div>
                            <a
                              href={customerLocation.mapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 underline block truncate"
                            >
                              {customerLocation.mapsLink}
                            </a>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleDetectGPSLocation}
                            disabled={locating}
                            className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-850 border border-emerald-600/50 hover:border-emerald-500 rounded-lg text-xs font-bold text-emerald-400 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                          >
                            {locating ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                <span>Locating Your Device via GPS...</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Share My Current GPS Location</span>
                              </>
                            )}
                          </button>
                        )}

                        {locationError && (
                          <p className="text-[10px] text-amber-400 bg-amber-950/50 p-2 rounded border border-amber-900/60 leading-tight">
                            {locationError}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>No delivery address required (Self-Pickup from Warehouse: 556/A Model Town, Gujranwala).</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Special Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Call before arrival"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-zinc-500"
                    />
                  </div>

                  <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 text-xs space-y-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span>Subtotal ({items.length} items)</span>
                      <span className="text-zinc-200">Rs. {total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Method</span>
                      <span className="text-emerald-400 font-bold">
                        {fulfillmentType === "Home Delivery"
                          ? "Home Delivery (Gujranwala Nearby)"
                          : "Self-Pickup (556/A Model Town)"}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-zinc-800">
                      <span>Total to Pay (COD)</span>
                      <span className="text-emerald-400">Rs. {total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Dual-Action Checkout Buttons */}
                  <div className="space-y-2.5 pt-2">
                    {/* Button 1: "Confirm Order" (Silent Direct Placement) */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handlePlaceOrder(false)}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                      <span>{submitting ? "Placing Order..." : "Confirm Order"}</span>
                    </button>

                    {/* Button 2: "Confirm & WhatsApp" (Direct Placement + Interactive Chat) */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handlePlaceOrder(true)}
                      className="w-full py-3.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/80 disabled:opacity-50 text-emerald-300 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>{submitting ? "Opening WhatsApp..." : "Confirm & WhatsApp"}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Items List */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">

                  {/* Automated Estimated Delivery Date Notice */}
                  <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Estimated Delivery: <strong className="text-white">{estimatedDeliveryDate}</strong></span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded">
                      Standard 2 Days
                    </span>
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-zinc-900/90 rounded-2xl border border-zinc-800"
                    >
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 bg-black"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-zinc-400">{item.packSize}</span>
                          {item.selectedSize && (
                            <span className="text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.5 rounded font-mono font-bold">
                              Size: {item.selectedSize}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-black text-emerald-400 mt-1">
                          Rs. {item.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="text-zinc-400 hover:text-rose-400"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="text-zinc-400 hover:text-emerald-400"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Footer / Checkout Button & Direct WhatsApp Button */}
                <div className="p-5 border-t border-zinc-800 bg-black space-y-3">
                  <div className="flex items-center justify-between text-base font-black text-white">
                    <span>Total Amount:</span>
                    <span className="text-xl text-emerald-400">Rs. {total.toLocaleString()}</span>
                  </div>


                  {!user && (
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-amber-600/40 text-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Please Sign In or Sign Up to place your order.</span>
                    </div>
                  )}

                  <button
                    onClick={handleStartCheckout}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition"
                  >
                    <span>{user ? "Proceed to Checkout" : "Sign In to Checkout"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Direct WhatsApp Quick Order Link */}
                  <a
                    href={buildDirectCartWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Direct Order on WhatsApp ({displayPhone})
                  </a>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Auth Modal Triggered from Cart */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode="login"
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          setIsCheckingOut(true);
        }}
      />
    </>
  );
}
