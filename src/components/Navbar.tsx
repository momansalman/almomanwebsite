"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  User as UserIcon,
  LogOut,
  PhoneCall,
  MessageCircle,
  Sparkles,
  Menu,
  X,
  UtensilsCrossed,
  Star,
  Info,
  MapPin,
  Home as HomeIcon,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import AuthModal from "./AuthModal";
import OrderLookupModal from "./OrderLookupModal";
import Logo from "./Logo";
import { motion, AnimatePresence } from "framer-motion";
import {
  getActiveOrder,
  subscribeToActiveOrder,
  ActiveOrderSession,
} from "@/lib/orderTrackingStorage";

export default function Navbar() {
  const pathname = usePathname();
  const { user, fetchUser, logout } = useAuthStore();
  const { openCart, items, getTotal } = useCartStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orderLookupOpen, setOrderLookupOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<ActiveOrderSession | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchUser();
    setActiveOrder(getActiveOrder());

    const unsubscribe = subscribeToActiveOrder((session) => {
      setActiveOrder(session);
    });

    return () => unsubscribe();
  }, [fetchUser]);

  const itemCount = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const cartTotal = mounted ? getTotal() : 0;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923371691006";
  const displayPhone = "0337-1691006";
  const rawPhone = "03371691006";

  const NAV_LINKS = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Menu", href: "/menu", icon: UtensilsCrossed },
    { name: "Track Order", href: "/track", icon: Truck },
    { name: "Reviews", href: "/reviews", icon: Star },
    { name: "About Us", href: "/about", icon: Info },
    { name: "Contact", href: "/contact", icon: MapPin },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 shadow-lg shadow-black/40">
        {/* Top notification bar */}
        <div className="bg-black text-zinc-300 text-xs py-2 px-4 border-b border-zinc-900 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            100% Halal, Fresh &amp; Hygienic Frozen Food
          </span>

          <span className="hidden sm:inline text-zinc-700">•</span>

          {/* Direct Phone Call Link */}
          <a
            href={`tel:${rawPhone}`}
            className="flex items-center gap-1.5 text-zinc-200 hover:text-emerald-400 font-medium transition"
            title="Direct Phone Call"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            Call: <span className="font-bold text-white tracking-wide">{displayPhone}</span>
          </a>

          <span className="hidden sm:inline text-zinc-700">•</span>

          {/* Direct WhatsApp Chat Link */}
          <a
            href={`https://wa.me/${whatsappNumber}?text=Hello%20Al%20Moman%20Frozen%20Foods`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition underline"
            title="Direct WhatsApp Order"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            WhatsApp: {displayPhone}
          </a>

          <span className="hidden lg:inline text-zinc-700">•</span>

          {/* Admin Portal Direct Link */}
          <Link
            href="/admin/login"
            className="hidden lg:flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 font-medium transition text-xs"
            title="Owner & Admin Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Portal</span>
          </Link>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="shrink-0">
              <Logo size="md" />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                    isActive
                      ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shadow-sm"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <link.icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Active Live Order Pill (Desktop) */}
            {mounted && activeOrder && (
              <Link
                href={`/order-tracking/${activeOrder.orderId}`}
                className="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-xs font-bold hover:bg-emerald-900 transition shadow-lg shadow-emerald-950/40"
                title="View live order progress"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-zinc-300">#{activeOrder.orderNumber.slice(-4)}:</span>
                <span className="capitalize text-emerald-400 font-black">{activeOrder.status}</span>
              </Link>
            )}

            {/* Quick Track Order Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setOrderLookupOpen(true)}
              className="relative p-2 sm:p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white transition flex items-center gap-1.5 font-medium text-xs sm:text-sm shadow-md"
              title="Track Order Status"
              aria-label="Track Order"
            >
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span className="hidden sm:inline">Track</span>
              {mounted && activeOrder && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1.5 right-1.5" />
              )}
            </motion.button>

            {/* Call button on mobile */}
            <a
              href={`tel:${rawPhone}`}
              className="sm:hidden p-2 rounded-xl bg-zinc-900 text-emerald-400 border border-zinc-800 hover:bg-zinc-800 transition"
              title="Call Us"
            >
              <PhoneCall className="w-4 h-4" />
            </a>

            {/* Cart Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={openCart}
              className="relative p-2 sm:p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white transition flex items-center gap-1.5 font-medium text-xs sm:text-sm shadow-md"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="hidden md:inline font-mono text-emerald-400 font-bold text-xs pl-0.5">
                  • Rs. {cartTotal.toLocaleString()}
                </span>
              )}
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] sm:text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-lg shadow-rose-900/50 animate-pulse">
                  {itemCount}
                </span>
              )}
            </motion.button>

            {/* User Profile / Auth buttons */}
            {mounted && user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-zinc-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                    {user.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold">Customer Member</div>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-zinc-800">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setAuthModalOpen(true);
                  }}
                  className="text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl hover:bg-zinc-900 transition"
                >
                  Sign In
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthModalOpen(true);
                  }}
                  className="text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-zinc-950 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-md transition whitespace-nowrap"
                >
                  Sign Up
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-zinc-800/80 bg-zinc-950 px-4 py-4 space-y-3 overflow-hidden shadow-2xl"
            >
              {/* Active Order Card in Mobile Drawer */}
              {activeOrder && (
                <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <div>
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">
                        Active Order
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        #{activeOrder.orderNumber}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/order-tracking/${activeOrder.orderId}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black rounded-xl transition"
                  >
                    Track
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {NAV_LINKS.map((link) => {
                  const isActive =
                    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`p-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                        isActive
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
                      }`}
                    >
                      <link.icon className="w-4 h-4 text-emerald-400 shrink-0" />
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              {/* Admin Portal in Mobile Drawer */}
              <div className="pt-2 border-t border-zinc-800/80">
                <Link
                  href="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full p-3 rounded-2xl bg-zinc-900/90 border border-amber-600/40 text-amber-300 hover:text-white hover:bg-zinc-800 text-xs font-bold transition flex items-center justify-between shadow"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Admin &amp; Management Portal</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-black uppercase">
                    Owner Access
                  </span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Auth Modal Popup */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Order Lookup Modal */}
      <OrderLookupModal
        isOpen={orderLookupOpen}
        onClose={() => setOrderLookupOpen(false)}
      />
    </>
  );
}
