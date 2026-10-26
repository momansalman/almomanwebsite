import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import { getAdminSessionUser } from "@/lib/auth";
import { syncOrderToExcel, syncCustomerToExcel } from "@/lib/excelSync";

export async function POST(req: Request) {
  try {
    const session = await getAdminSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Admin authentication required" },
        { status: 403 }
      );
    }

    const {
      orderId,
      customerName,
      phone,
      email,
      shippingAddress,
      fulfillmentType = "Home Delivery",
      customerLocationLink,
      items,
      deliveryFee = 0,
      totalAmount,
      paymentMethod = "Cash on Delivery (COD)",
      notes,
    } = await req.json();

    if (!customerName || !phone) {
      return NextResponse.json(
        { error: "Customer name and phone number are required" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    const cleanOrderId = orderId || `ORD-${Date.now()}`;
    let savedOrder = null;

    try {
      await connectToDatabase();

      // Find or create a user profile for the customer
      let customerUser = await User.findOne({ phone });
      if (!customerUser) {
        customerUser = await User.findOne({ _id: session.userId });
      }

      const orderData = {
        user: customerUser ? customerUser._id : session.userId,
        userName: customerName,
        userEmail: email && email !== "N/A" ? email : "",
        phone,
        fulfillmentType,
        shippingAddress:
          fulfillmentType === "Self-Pickup"
            ? "Self-Pickup (556/A Model Town, Gujranwala)"
            : shippingAddress,
        items,
        totalAmount: Number(totalAmount) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        customerLocationLink: (customerLocationLink || "").toString(),
        paymentMethod,
        notes: notes || "",
        status: "Confirmed" as const,
        orderedBy: `Admin (${session.name || "Owner"})`,
      };

      savedOrder = await Order.create(orderData);
    } catch (dbErr) {
      console.warn("MongoDB offline, saving order to Excel/JSON:", dbErr);
    }

    // Sync to Excel files on D: Drive and project mirror
    try {
      syncOrderToExcel({
        id: cleanOrderId,
        customerName,
        customerEmail: email || "N/A",
        phone,
        fulfillmentType,
        shippingAddress:
          fulfillmentType === "Self-Pickup"
            ? "Self-Pickup (556/A Model Town, Gujranwala)"
            : shippingAddress,
        items,
        totalAmount: Number(totalAmount) || 0,
        paymentMethod,
        status: "Confirmed",
        notes: notes || "",
        createdAt: new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
      });

      syncCustomerToExcel({
        name: customerName,
        phone,
        email: email || "N/A",
        address: shippingAddress || "Model Town, Gujranwala",
        role: "customer",
        createdAt: new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
      });
    } catch (excelErr) {
      console.warn("Excel synchronization warning:", excelErr);
    }

    return NextResponse.json(
      {
        message: "Order slip & payment bill saved successfully!",
        orderId: cleanOrderId,
        order: savedOrder,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Admin order creation error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate order slip";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
