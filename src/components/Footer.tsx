import React from "react";
import Link from "next/link";
import { PhoneCall, MapPin, Mail, ShieldCheck, MessageCircle } from "lucide-react";
import Logo from "./Logo";

export default function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923371691006";
  const displayPhone = "0337-1691006";
  const rawPhone = "03371691006";
  const contactEmail = "info@almomanfoods.com";

  return (
    <footer className="bg-black text-zinc-300 pt-16 pb-12 border-t border-zinc-800/80 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Logo size="md" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              100% Halal, premium quality homemade frozen foods prepared under the highest hygiene standards. Ready-to-cook convenience for your family.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> 100% Halal & Fresh Guaranteed
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Frozen Varieties
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>Crispy Chicken & Beef Samosas</li>
              <li>Spring Rolls & Vegetable Rolls</li>
              <li>Shami Kebabs & Chapli Kebabs</li>
              <li>Chicken Patties & Bakery Items</li>
              <li>Crispy Nuggets & Bites</li>
              <li>Homestyle Layered Parathas</li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Direct Contact & Orders
            </h4>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li>
                <a
                  href={`tel:${rawPhone}`}
                  className="flex items-center gap-2 hover:text-emerald-400 transition"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Direct Call: <strong className="text-white">{displayPhone}</strong>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=Hello%20Al%20Moman%20Frozen%20Foods`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-emerald-400 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    WhatsApp: <strong className="text-emerald-400">{displayPhone}</strong>
                  </span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Email: {contactEmail}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Warehouse Pickup:</span>
                  <span>556/A Model Town, Gujranwala</span>
                  <a
                    href="https://maps.google.com/?q=556/A+Model+Town+Gujranwala"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 mt-1 block hover:underline"
                  >
                    📍 Open in Google Maps Navigation →
                  </a>
                  <span className="text-[10px] text-amber-400/90 block mt-0.5">
                    *Home Delivery only in Model Town Gujranwala &amp; nearby areas. Out-of-city customers arrange self-pickup.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Website Pages
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition">
                  Storefront Home
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-emerald-400 transition font-bold text-emerald-400">
                  Full Menu Catalog
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-emerald-400 transition">
                  Verified Reviews
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition">
                  About Our Kitchen
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400 transition">
                  Contact &amp; Delivery Info
                </Link>
              </li>
              <li className="pt-2 border-t border-zinc-900">
                <Link href="/admin/login" className="text-zinc-500 hover:text-zinc-300 transition text-[11px]">
                  Store Owner Login →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Al Moman Frozen Foods. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Helpline & WhatsApp: <span className="text-emerald-400 font-bold">{displayPhone}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
