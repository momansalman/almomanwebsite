import { NextRequest, NextResponse } from "next/server";
import { findOrderByIdOrNumber, updateOrderStatusById } from "@/lib/orderStore";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const order = await findOrderByIdOrNumber(id);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found with provided ID or Order Number." },
        { status: 404 }
      );
    }

    // Normalize status string to lowercase canonical enum
    const rawStatus = (order.orderStatus || order.status || "pending").toLowerCase();
    let canonicalStatus = "pending";
    if (rawStatus.includes("confirm")) canonicalStatus = "confirmed";
    else if (rawStatus.includes("prepar")) canonicalStatus = "preparing";
    else if (rawStatus.includes("ready") || rawStatus.includes("out")) canonicalStatus = "ready";
    else if (rawStatus.includes("deliver")) canonicalStatus = "delivered";
    else if (rawStatus.includes("cancel")) canonicalStatus = "cancelled";

    return NextResponse.json({
      success: true,
      order: {
        id: ((order as any)._id || order.id || "").toString(),
        orderNumber: order.orderNumber,
        orderStatus: canonicalStatus,
        rawStatus: order.orderStatus || order.status,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        fulfillmentType: order.fulfillmentType,
        deliveryAddress: order.deliveryAddress || order.shippingAddress,
        notes: order.notes,
        items: order.items,
        subtotal: order.subtotal,
        deliveryCharges: order.deliveryCharges ?? order.deliveryFee ?? 0,
        totalAmount: order.totalAmount,
        invoicePdfUrl: order.invoicePdfUrl,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching order status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve order status." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const body = await req.json();
    const { status, notes } = body;

    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "Order status is required." }, { status: 400 });
    }

    const rawStatus = status.toLowerCase().trim();
    let canonicalStatus = "pending";
    if (rawStatus.includes("confirm")) canonicalStatus = "confirmed";
    else if (rawStatus.includes("prepar")) canonicalStatus = "preparing";
    else if (rawStatus.includes("ready") || rawStatus.includes("out")) canonicalStatus = "ready";
    else if (rawStatus.includes("deliver")) canonicalStatus = "delivered";
    else if (rawStatus.includes("cancel")) canonicalStatus = "cancelled";
    else if (rawStatus.includes("pend")) canonicalStatus = "pending";
    else {
      canonicalStatus = rawStatus;
    }

    const result = await updateOrderStatusById(id, canonicalStatus, notes);

    return NextResponse.json({
      success: true,
      message: `Order status successfully updated to "${canonicalStatus}".`,
      orderStatus: canonicalStatus,
      order: result.order,
    });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update order status." },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

