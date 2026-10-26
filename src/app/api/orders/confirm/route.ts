import { NextRequest, NextResponse } from "next/server";
import { confirmOrderByIdAndToken } from "@/lib/orderStore";
import { notifyCustomerOrderConfirmed } from "@/lib/whatsappService";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");
    const token = searchParams.get("token");

    if (!orderId || !token) {
      return new NextResponse(renderHtmlTemplate({
        title: "Invalid Confirmation Link",
        badge: "Error",
        badgeColor: "bg-red-500/20 text-red-400 border-red-500/50",
        heading: "Missing Parameters",
        description: "The confirmation link you clicked is incomplete or corrupted.",
        orderNumber: "N/A",
        status: "Error",
        isSuccess: false,
      }), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const result = await confirmOrderByIdAndToken(orderId, token);

    if (!result.success || !result.order) {
      const is403 = result.statusCode === 403;
      return new NextResponse(renderHtmlTemplate({
        title: is403 ? "Unauthorized Action" : "Order Not Found",
        badge: is403 ? "Security Alert" : "404",
        badgeColor: is403 ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-red-500/20 text-red-400 border-red-500/50",
        heading: is403 ? "Invalid Confirmation Token" : "Order Record Not Found",
        description: is403
          ? "This 1-click confirmation link has an invalid or expired security token."
          : `No order found matching ID: ${orderId}.`,
        orderNumber: "N/A",
        status: is403 ? "Unauthorized" : "Not Found",
        isSuccess: false,
      }), {
        status: result.statusCode || 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    const order = result.order;

    // Send follow-up WhatsApp to customer
    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    try {
      await notifyCustomerOrderConfirmed(
        order.orderNumber,
        order.customerPhone,
        (order._id || order.id).toString(),
        appBaseUrl
      );
    } catch (err) {
      console.error("Error sending confirmed WhatsApp to customer:", err);
    }

    const wasAlreadyConfirmed = (order.orderStatus || "").toLowerCase() === "confirmed" && Boolean(order.confirmedPreviously);

    // Return responsive, mobile-friendly landing page
    return new NextResponse(renderHtmlTemplate({
      title: "Order Confirmed — AL-MOMAN",
      badge: "STORE OWNER APPROVAL",
      badgeColor: "bg-emerald-950 text-emerald-400 border-emerald-600/60",
      heading: `Order #${order.orderNumber} has been marked as CONFIRMED.`,
      description: wasAlreadyConfirmed
        ? "This order was already approved previously. The customer has received their notification."
        : "The customer has been automatically notified on WhatsApp that their order has been accepted and is being prepared.",
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      totalAmount: `Rs. ${Number(order.totalAmount || order.subtotal).toLocaleString()}`,
      fulfillmentType: order.fulfillmentType,
      status: "CONFIRMED",
      isSuccess: true,
      orderId: order._id.toString(),
    }), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (err: any) {
    console.error("Error in confirmation endpoint:", err);
    return new NextResponse(renderHtmlTemplate({
      title: "System Exception",
      badge: "Server Error",
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/50",
      heading: "Server Exception Occurred",
      description: err?.message || "An unexpected error occurred while confirming this order.",
      orderNumber: "N/A",
      status: "Error",
      isSuccess: false,
    }), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}

interface TemplateParams {
  title: string;
  badge: string;
  badgeColor: string;
  heading: string;
  description: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: string;
  fulfillmentType?: string;
  status: string;
  isSuccess: boolean;
  orderId?: string;
}

function renderHtmlTemplate(p: TemplateParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/brand-logo.png">
  <style>
    @keyframes pulse-subtle {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.03); }
    }
    .pulse-card { animation: pulse-subtle 3s infinite ease-in-out; }
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-white">
  <div class="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
    
    <!-- Top accent bar -->
    <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500"></div>

    <!-- Brand Emblem -->
    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400/80 mx-auto mt-2 mb-4 bg-black shadow-lg shadow-emerald-950/50">
      <img src="/brand-logo.png" alt="AL-MOMAN Logo" class="w-full h-full object-cover">
    </div>

    <!-- Badge -->
    <span class="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${p.badgeColor} mb-3">
      ${p.badge}
    </span>

    <!-- Status Icon -->
    <div class="w-14 h-14 ${p.isSuccess ? "bg-emerald-950 border-emerald-500 text-emerald-400" : "bg-red-950 border-red-500 text-red-400"} border rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
      ${p.isSuccess ? `
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
        </svg>
      ` : `
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      `}
    </div>

    <h1 class="text-xl sm:text-2xl font-black text-white leading-snug mb-2">
      ${p.heading}
    </h1>

    <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
      ${p.description}
    </p>

    ${p.isSuccess ? `
      <!-- Order Summary Card -->
      <div class="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 text-left space-y-2 mb-6 text-xs text-zinc-300">
        <div class="flex justify-between pb-2 border-b border-zinc-800">
          <span class="text-zinc-500 font-bold">Order #:</span>
          <span class="font-mono text-emerald-400 font-black">${p.orderNumber}</span>
        </div>
        ${p.customerName ? `
          <div class="flex justify-between">
            <span class="text-zinc-500">Customer:</span>
            <span class="font-bold text-white">${p.customerName}</span>
          </div>
        ` : ""}
        ${p.customerPhone ? `
          <div class="flex justify-between">
            <span class="text-zinc-500">Phone:</span>
            <span class="font-mono text-zinc-200">${p.customerPhone}</span>
          </div>
        ` : ""}
        ${p.totalAmount ? `
          <div class="flex justify-between">
            <span class="text-zinc-500">Total:</span>
            <span class="font-bold text-amber-400">${p.totalAmount}</span>
          </div>
        ` : ""}
        ${p.fulfillmentType ? `
          <div class="flex justify-between">
            <span class="text-zinc-500">Mode:</span>
            <span class="font-bold uppercase text-emerald-300">${p.fulfillmentType}</span>
          </div>
        ` : ""}
      </div>
    ` : ""}

    <!-- Action Buttons -->
    <div class="space-y-2">
      ${p.orderId ? `
        <a href="/order-tracking/${p.orderId}" class="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950">
          View Live Customer Tracking
        </a>
      ` : ""}
      <a href="/admin" class="block w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition border border-zinc-700">
        Go to Admin Portal
      </a>
    </div>

    <div class="mt-6 text-[10px] text-zinc-600">
      AL-MOMAN Special Frozen Chicken Food • Automated WhatsApp Confirmation
    </div>
  </div>
</body>
</html>`;
}
