import { NextRequest, NextResponse } from "next/server";
import { findOrdersByPhoneOrQuery } from "@/lib/orderStore";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query") || req.nextUrl.searchParams.get("q") || "";
    if (!query.trim()) {
      return NextResponse.json({ error: "Please enter an order number or phone number." }, { status: 400 });
    }

    const orders = await findOrdersByPhoneOrQuery(query);

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders: orders.map((o) => ({
        id: (o._id || o.id).toString(),
        orderNumber: o.orderNumber,
        customerName: o.customerName || o.userName,
        customerPhone: o.customerPhone || o.phone,
        orderStatus: o.orderStatus || o.status || "pending",
        totalAmount: o.totalAmount || o.subtotal,
        fulfillmentType: o.fulfillmentType,
        deliveryAddress: o.deliveryAddress || o.shippingAddress,
        itemCount: Array.isArray(o.items) ? o.items.length : 0,
        createdAt: o.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("Order lookup error:", err);
    return NextResponse.json({ error: "Failed to look up orders." }, { status: 500 });
  }
}
