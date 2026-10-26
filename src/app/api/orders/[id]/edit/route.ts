import { NextRequest, NextResponse } from "next/server";
import { editOrderById, findOrderByIdOrNumber } from "@/lib/orderStore";
import { generateInvoice } from "@/lib/generateInvoice";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await req.json().catch(() => ({}));
    const { customerName, customerPhone, deliveryAddress, notes } = body;

    const order = await findOrderByIdOrNumber(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentStatus = (order.orderStatus || order.status || "").toLowerCase();

    // If order is already approved/confirmed, direct editing is blocked!
    if (currentStatus !== "pending") {
      const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923371691006";
      const message = `Hello AL-MOMAN Store! I would like to request changes for my approved order #${order.orderNumber}.`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      return NextResponse.json(
        {
          success: false,
          isApproved: true,
          error: "This order has already been approved. Modifications must be handled directly via WhatsApp with the store owner.",
          whatsappUrl,
        },
        { status: 400 }
      );
    }

    // Perform update
    const result = await editOrderById(orderId, {
      customerName,
      customerPhone,
      deliveryAddress,
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to update order" }, { status: 400 });
    }

    // Re-generate updated PDF invoice
    try {
      await generateInvoice({
        orderNumber: result.order.orderNumber,
        orderId: (result.order._id || result.order.id).toString(),
        customerName: result.order.customerName || result.order.userName,
        customerPhone: result.order.customerPhone || result.order.phone,
        fulfillmentType: result.order.fulfillmentType,
        deliveryAddress: result.order.deliveryAddress || result.order.shippingAddress,
        items: result.order.items || [],
        subtotal: result.order.subtotal || 0,
        deliveryCharges: result.order.deliveryCharges || 0,
        totalAmount: result.order.totalAmount || result.order.subtotal || 0,
        createdAt: result.order.createdAt || new Date(),
      });
    } catch (genErr) {
      console.warn("Invoice re-generation notice:", genErr);
    }

    return NextResponse.json({
      success: true,
      message: `Order #${result.order.orderNumber} has been updated successfully.`,
      order: result.order,
    });
  } catch (err: any) {
    console.error("Edit order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to edit order" },
      { status: 500 }
    );
  }
}
