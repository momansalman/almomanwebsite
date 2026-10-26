"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  PhoneCall,
  MessageCircle,
  MapPin,
  Clock,
  Truck,
  Sparkles,
  Send,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const text = `Hello Al Moman Frozen Foods!\nName: ${formData.name}\nPhone: ${formData.phone}\nMessage: ${formData.message || "I would like to inquire about orders and delivery."}`;
    window.open(`https://wa.me/923371691006?text=${encodeURIComponent(text)}`, "_blank");
  };

  const FAQS = [
    {
      q: "How do I cook frozen samosas and rolls without thawing?",
      a: "Always deep-fry or air-fry straight from the freezer! Do NOT defrost them beforehand, as defrosting makes the pastry moist. Fry in moderately hot oil (170°C) for 4 to 5 minutes until crisp and golden brown.",
    },
    {
      q: "Where do you offer direct home delivery?",
      a: "We offer direct door-to-door temperature-controlled delivery across Model Town Gujranwala and adjoining sectors. For other areas or other cities, customers may arrange self-pickup or rider pickup from our warehouse.",
    },
    {
      q: "Can I order custom sizes for Samosa Patti and Roll Patti?",
      a: "Yes! In addition to our popular sizes (2.5\" × 7\", 3\" × 8\", 7\" × 7\"), we can accommodate specific custom cutting dimensions for bulk buyers and catering businesses.",
    },
    {
      q: "What payment methods are supported?",
      a: "We accept Cash on Delivery (COD), direct Bank Transfer, Easypaisa, and JazzCash. You receive an official itemized bill slip with each genuine order.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-black via-zinc-950 to-zinc-900 border-b border-zinc-800/80 py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Fast Delivery &amp; Warehouse Pickup
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Contact &amp; Delivery Information
          </h1>
          <p className="text-zinc-400 text-xs sm:text-base max-w-xl mx-auto leading-relaxed">
            Need catering samosas, quick home delivery, or custom patti dimensions? Get in touch with our team directly.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full space-y-16">
        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Phone Helpline */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition shadow-xl">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Direct Phone Call</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Speak directly with our store manager for urgent orders and inquiries.
              </p>
              <div className="text-lg font-black text-emerald-400 font-mono">0337-1691006</div>
            </div>
            <a
              href="tel:03371691006"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs text-center transition shadow-md shadow-emerald-950"
            >
              Call 0337-1691006 Now
            </a>
          </div>

          {/* Card 2: WhatsApp Chat */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition shadow-xl">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">WhatsApp Orders</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Send item lists, ask for live pricing, and share delivery location pin.
              </p>
              <div className="text-lg font-black text-emerald-400 font-mono">0337-1691006</div>
            </div>
            <a
              href="https://wa.me/923371691006?text=Hello%20Al%20Moman%20Frozen%20Foods"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs text-center transition flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" /> Open WhatsApp Chat
            </a>
          </div>

          {/* Card 3: Warehouse Pickup */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition shadow-xl">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Warehouse Location</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                556/A Model Town, Gujranwala, Punjab, Pakistan.
              </p>
              <div className="text-xs text-amber-400/90 font-medium">
                Open Daily: 9:00 AM – 10:00 PM
              </div>
            </div>
            <a
              href="https://maps.google.com/?q=556/A+Model+Town+Gujranwala"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold rounded-xl text-xs text-center transition flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" /> Open in Google Maps
            </a>
          </div>
        </div>

        {/* Quick Message Form & Delivery Policy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Quick WhatsApp Inquiry Form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-xl font-black text-white mb-1">
                Send an Instant Inquiry
              </h3>
              <p className="text-xs text-zinc-400">
                Type your inquiry below and we will automatically open WhatsApp with your message.
              </p>
            </div>

            <form onSubmit={handleSendWhatsApp} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Moman Salman"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">
                  Active Phone / WhatsApp Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0337-1691006"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Message or Order Inquiry</label>
                <textarea
                  rows={3}
                  placeholder="Tell us which items or bulk quantities you need..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
              >
                <Send className="w-4 h-4" /> Send Message via WhatsApp
              </button>
            </form>
          </div>

          {/* Delivery Policy & Cold Transport */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <Truck className="w-4 h-4" /> Safe Delivery Protocol
              </div>
              <h3 className="text-xl font-black text-white">
                How We Protect Frozen Freshness
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Because frozen food requires uninterrupted cold chain storage, every delivery is packaged in insulated thermal pouches to prevent softening during transit.
              </p>
              <ul className="space-y-3 text-xs text-zinc-400 pt-2">
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Speedy Local Dispatch:</strong> Dispatched immediately upon order confirmation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Turn-by-turn GPS:</strong> When placing an order in the cart, you can share your live GPS location for zero confusion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Custom Delivery Charges:</strong> Transparent fees calculated fairly by the store owner based on your exact sector.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs text-zinc-400">
              <strong className="text-white block mb-0.5">Need Bulk or Commercial Supply?</strong>
              Restaurants, cafes, school canteens, and caterers can contact us for special wholesale pricing on bulk packs.
            </div>
          </div>
        </div>

        {/* FAQs */}
        <section className="space-y-6 pt-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-emerald-400" /> Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Answers to common queries about cooking, delivery, and payments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-2 hover:border-zinc-700 transition"
              >
                <h4 className="font-extrabold text-sm text-white">{faq.q}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
