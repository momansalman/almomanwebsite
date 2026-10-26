import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getSessionUser } from "@/lib/auth";
import { syncOrderToExcel } from "@/lib/excelSync";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in or sign up to place your order." },
        { status: 401 }
      );
    }

    const {
      items,
      totalAmount,
      shippingAddress,
      phone,
      buyerPhone,
      recipientName,
      buyerName,
      isOrderingForOther,
      paymentMethod,
      notes,
      fulfillmentType = "Home Delivery",
      customerLocationLink,
      deliveryFee = 0,
    } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    if (fulfillmentType === "Home Delivery" && !shippingAddress) {
      return NextResponse.json(
        { error: "Delivery address is required for Home Delivery" },
        { status: 400 }
      );
    }

    const finalAddress =
      fulfillmentType === "Self-Pickup"
        ? "Self-Pickup (556/A Model Town, Gujranwala)"
        : shippingAddress;

    const callerName = session.name || buyerName || "Customer";
    const targetRecipient = (recipientName || "").toString().trim() || callerName;
    const isDifferentRecipient =
      Boolean(isOrderingForOther) || (Boolean(recipientName) && targetRecipient.toLowerCase() !== callerName.toLowerCase());

    const recordedCustomerName = isDifferentRecipient
      ? `${targetRecipient} (Ordered by ${callerName})`
      : targetRecipient;

    const combinedNotes = isDifferentRecipient
      ? `[Recipient / Gift for: ${targetRecipient}] Placed by: ${callerName} (Phone: ${buyerPhone || phone}). ${notes || ""}`.trim()
      : (notes || "");

    let orderId = `ORD-${Date.now()}`;
    let createdOrder = null;

    try {
      await connectToDatabase();
      const newOrder: any = await Order.create({
        orderNumber: orderId,
        confirmationToken: Math.random().toString(36).substring(2, 15),
        customer: session.userId,
        user: session.userId,
        customerName: recordedCustomerName,
        userName: recordedCustomerName,
        customerPhone: phone,
        userEmail: session.email,
        phone,
        fulfillmentType,
        deliveryAddress: finalAddress,
        shippingAddress: finalAddress,
        items,
        subtotal: totalAmount,
        totalAmount,
        deliveryCharges: Number(deliveryFee) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        customerLocationLink: (customerLocationLink || "").toString(),
        paymentMethod: paymentMethod || "Cash on Delivery (COD)",
        notes: combinedNotes,
        recipientName: targetRecipient,
        recipientPhone: phone,
        orderedBy: callerName,
        orderStatus: "pending",
        status: "Pending",
      });
      orderId = newOrder._id.toString();
      createdOrder = newOrder;
    } catch (dbErr) {
      console.warn("MongoDB offline, saving order locally & in Excel:", dbErr);
    }

    // Automatically sync order and customer into Excel in D: drive
    try {
      syncOrderToExcel({
        id: orderId,
        customerName: recordedCustomerName,
        customerEmail: session.email,
        phone,
        fulfillmentType,
        shippingAddress: finalAddress,
        items,
        totalAmount,
        paymentMethod: paymentMethod || "Cash on Delivery (COD)",
        status: "Pending",
        notes: combinedNotes,
        createdAt: new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
      });
    } catch (excelErr) {
      console.warn("Excel order sync warning:", excelErr);
    }

    // If order was placed for someone else, record recipient in customers Excel sheet too
    if (isDifferentRecipient && targetRecipient && targetRecipient !== callerName) {
      try {
        const { syncCustomerToExcel } = await import("@/lib/excelSync");
        syncCustomerToExcel({
          id: `RECP-${Date.now()}`,
          name: targetRecipient,
          phone,
          email: "N/A",
          address: finalAddress,
          role: "customer",
          createdAt: new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
        });
      } catch (custErr) {
        console.warn("Recipient customer sync warning:", custErr);
      }
    }

    return NextResponse.json(
      {
        message: "Order placed successfully!",
        orderId,
        order: createdOrder || { id: orderId, status: "Pending" },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Order creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to place order";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const orders =
      session.role === "admin"
        ? await Order.find().sort({ createdAt: -1 })
        : await Order.find({ user: session.userId }).sort({ createdAt: -1 });

    return NextResponse.json({ orders });
  } catch (error: unknown) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
