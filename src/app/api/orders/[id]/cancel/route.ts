import { NextRequest, NextResponse } from "next/server";
import { cancelOrderById, findOrderByIdOrNumber } from "@/lib/orderStore";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Customer requested cancellation";

    const order = await findOrderByIdOrNumber(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentStatus = (order.orderStatus || order.status || "").toLowerCase();

    // If order is already approved/confirmed, direct cancellation is blocked!
    if (currentStatus !== "pending") {
      const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923371691006";
      const message = `Hello AL-MOMAN Store! I would like to request cancellation for my approved order #${order.orderNumber}. Reason: ${reason}`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      return NextResponse.json(
        {
          success: false,
          isApproved: true,
          error: "This order has already been approved and is being prepared in the kitchen. In-app cancellation is locked. Please contact the store owner directly on WhatsApp.",
          whatsappUrl,
        },
        { status: 400 }
      );
    }

    // Otherwise, cancel pending order
    const result = await cancelOrderById(orderId, reason);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to cancel order" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} has been successfully cancelled.`,
      order: result.order,
    });
  } catch (err: any) {
    console.error("Cancel order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel order" },
      { status: 500 }
    );
  }
}
