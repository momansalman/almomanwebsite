import { NextRequest, NextResponse } from "next/server";
import { findOrderByIdOrNumber } from "@/lib/orderStore";
import {
  notifyStoreOwner,
  notifyCustomerOrderReceived,
  notifyCustomerOrderConfirmed,
} from "@/lib/whatsappService";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await req.json().catch(() => ({}));
    const target = body.target || "both"; // 'owner' | 'customer' | 'both' | 'confirmed'

    const order = await findOrderByIdOrNumber(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const payload = {
      orderNumber: order.orderNumber,
      orderId: (order._id || order.id).toString(),
      confirmationToken: order.confirmationToken || "",
      customerName: order.customerName || order.userName || "Customer",
      customerPhone: order.customerPhone || order.phone || "",
      fulfillmentType: order.fulfillmentType,
      deliveryAddress: order.deliveryAddress || order.shippingAddress,
      items: order.items,
      subtotal: order.subtotal,
      deliveryCharges: order.deliveryCharges || 0,
      totalAmount: order.totalAmount || order.subtotal,
      invoicePdfUrl: order.invoicePdfUrl,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      appBaseUrl,
    };

    const results: any = {};

    if (target === "owner" || target === "both") {
      results.owner = await notifyStoreOwner(payload);
    }
    if (target === "customer" || target === "both") {
      results.customer = await notifyCustomerOrderReceived(payload);
    }
    if (target === "confirmed") {
      results.confirmed = await notifyCustomerOrderConfirmed(
        order.orderNumber,
        payload.customerPhone,
        payload.orderId,
        appBaseUrl
      );
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp dispatch executed",
      orderNumber: order.orderNumber,
      results,
    });
  } catch (err: any) {
    console.error("Manual WhatsApp trigger error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to trigger WhatsApp notification" },
      { status: 500 }
    );
  }
}
