"use client";

import React, { useRef, useState } from "react";
import {
  FileText,
  Download,
  Share2,
  Printer,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Eye,
  Maximize2,
  Layers,
} from "lucide-react";
import Logo from "./Logo";

export interface InvoiceViewerProps {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  fulfillmentType?: string;
  deliveryAddress?: string | null;
  items?: Array<{
    productName?: string;
    name?: string;
    quantity: number;
    price: number;
    total: number;
    packSize?: string;
  }>;
  subtotal: number;
  deliveryCharges?: number;
  totalAmount: number;
  createdAt?: string;
  className?: string;
}

export default function InvoiceViewer({
  orderId,
  orderNumber,
  customerName,
  customerPhone,
  fulfillmentType = "delivery",
  deliveryAddress,
  items = [],
  subtotal,
  deliveryCharges = 0,
  totalAmount,
  createdAt,
  className = "",
}: InvoiceViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewMode, setViewMode] = useState<"pdf" | "digital">("pdf");
  const [copiedLink, setCopiedLink] = useState(false);

  const pdfUrl = `/api/orders/${orderId}/invoice#toolbar=0&navpanes=0`;
  const downloadUrl = `/api/orders/${orderId}/invoice?download=true`;

  const isDelivery = (fulfillmentType || "").toLowerCase().includes("delivery");
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })
    : new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });

  // Share to WhatsApp link
  const generateWhatsAppShareUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const invoiceLink = `${origin}/api/orders/${orderId}/invoice`;
    const trackingLink = `${origin}/track/${orderId}`;

    const text = `🍗 *AL-MOMAN Special Frozen Chicken Food — Sales Invoice*
Order #: *${orderNumber}*
Customer: *${customerName}*
Total Amount: *Rs. ${Number(totalAmount || subtotal).toLocaleString()}*

📄 View Official Invoice:
${invoiceLink}

🔴 Track Live Progress:
${trackingLink}`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // Trigger browser print on the embedded iframe
  const handlePrint = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  };

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl ${className}`}>
      {/* Top Header & View Switcher */}
      <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">Official Sales Invoice</h3>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-bold border border-zinc-700">
                #{orderNumber}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              AL-MOMAN Special Frozen Chicken Food • {formattedDate}
            </p>
          </div>
        </div>

        {/* View Switcher Toggle (Embedded PDF vs Digital Receipt) */}
        <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setViewMode("pdf")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "pdf"
                ? "bg-emerald-600 text-zinc-950 shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PDF Document</span>
          </button>
          <button
            onClick={() => setViewMode("digital")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "digital"
                ? "bg-emerald-600 text-zinc-950 shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Digital Slip</span>
          </button>
        </div>
      </div>

      {/* Embedded Viewport (Zero forced auto-download) */}
      <div className="relative bg-zinc-950 min-h-[480px] sm:min-h-[580px] flex flex-col justify-center">
        {viewMode === "pdf" ? (
          <div className="w-full h-[520px] sm:h-[620px] relative bg-zinc-950">
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              title={`AL-MOMAN Invoice ${orderNumber}`}
              className="w-full h-full border-0 rounded-b-none"
            />
          </div>
        ) : (
          /* Responsive Digital Slip Layout */
          <div className="p-6 sm:p-8 max-w-xl mx-auto w-full space-y-6 text-zinc-200">
            {/* Slip Header */}
            <div className="text-center space-y-2 border-b border-zinc-800 pb-5">
              <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border border-amber-400/80 mb-2">
                <img src="/brand-logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                AL-MOMAN Special Frozen Chicken Food
              </h2>
              <p className="text-xs text-amber-400 font-semibold">
                Premium Quality Frozen Poultry &amp; Cuts • 100% Halal
              </p>
              <p className="text-[11px] text-zinc-400">
                556/A Model Town, Gujranwala • WhatsApp: 0337-1691006
              </p>
            </div>

            {/* Slip Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Invoice #</span>
                <span className="font-mono text-emerald-400 font-bold">{orderNumber}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Date &amp; Time</span>
                <span className="text-zinc-300">{formattedDate}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Customer</span>
                <span className="text-white font-bold">{customerName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Fulfillment</span>
                <span className="text-emerald-300 font-bold uppercase">{fulfillmentType}</span>
              </div>
              {deliveryAddress && (
                <div className="col-span-2 pt-2 border-t border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Delivery Address</span>
                  <span className="text-zinc-300">{deliveryAddress}</span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-zinc-500 uppercase font-black px-2 pb-1 border-b border-zinc-800">
                <span>Item &amp; Pack</span>
                <span className="text-right">Total</span>
              </div>
              {items && items.length > 0 ? (
                items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-900 transition"
                  >
                    <div>
                      <span className="text-white font-medium block">
                        {it.productName || it.name}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {it.quantity} x Rs. {Number(it.price).toLocaleString()} {it.packSize ? `• ${it.packSize}` : ""}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-zinc-200">
                      Rs. {Number(it.total || it.price * it.quantity).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 text-center py-4">Standard Assorted Frozen Selection</p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span className="font-mono text-zinc-200 font-bold">Rs. {Number(subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Delivery Charges:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {isDelivery ? "Pending via WhatsApp" : "Rs. 0 (Self-Pickup)"}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-zinc-800">
                <span>Total Amount:</span>
                <span className="font-mono text-emerald-400">
                  Rs. {Number(totalAmount || subtotal).toLocaleString()} {isDelivery ? "+ Delivery" : ""}
                </span>
              </div>
            </div>

            {isDelivery && (
              <p className="text-[11px] text-amber-400/90 italic bg-amber-950/30 p-3 rounded-xl border border-amber-900/40 text-center">
                Note: Delivery charges will be calculated and communicated via WhatsApp chat based on distance.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Requirement C: Interactive Action Bar */}
      <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {/* Button 1: Share to WhatsApp */}
          <a
            href={generateWhatsAppShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs rounded-xl transition shadow-lg flex items-center gap-2"
            title="Share this invoice with customer or family on WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span>Share to WhatsApp</span>
          </a>

          {/* Button 2: Download PDF (User-initiated manual download only) */}
          <a
            href={downloadUrl}
            download={`AL-MOMAN-Invoice-${orderNumber}.pdf`}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 hover:border-zinc-600 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow"
            title="Download PDF to your device"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download PDF</span>
          </a>

          {/* Button 3: Print Invoice */}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 hover:border-zinc-600 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow"
            title="Print invoice or save as PDF"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>

        {/* View Fullscreen / Open in New Tab */}
        <a
          href={`/api/orders/${orderId}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-400 hover:text-emerald-400 font-medium transition flex items-center gap-1.5 ml-auto"
        >
          <span>Open Clean Tab</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
