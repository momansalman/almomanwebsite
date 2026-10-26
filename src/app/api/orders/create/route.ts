import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import Order, { IOrderItem } from "@/models/Order";
import User, { PAKISTAN_PHONE_REGEX } from "@/models/User";
import { generateInvoice } from "@/lib/generateInvoice";
import {
  notifyStoreOwner,
  notifyCustomerOrderReceived,
  buildCustomerWhatsAppChatLink,
} from "@/lib/whatsappService";
import { syncOrderToExcel } from "@/lib/excelSync";
import { createOrderRecord } from "@/lib/orderStore";

function generateOrderNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `ALM-${yyyy}${mm}${dd}-${randomHex}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      customerName = name,
      phone,
      customerPhone = phone,
      items = [],
      fulfillmentType = "delivery",
      deliveryAddress = null,
      shippingAddress = deliveryAddress,
      deliveryCharges = 0,
      paymentMethod = "Cash on Delivery",
      notes = "",
    } = body;

    // 1. Validation
    if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
      return NextResponse.json(
        { error: "Customer full name is required." },
        { status: 400 }
      );
    }

    if (!customerPhone || typeof customerPhone !== "string") {
      return NextResponse.json(
        { error: "Active WhatsApp phone number is required." },
        { status: 400 }
      );
    }

    const cleanPhone = customerPhone.replace(/[\s-]/g, "");
    if (!PAKISTAN_PHONE_REGEX.test(cleanPhone)) {
      return NextResponse.json(
        {
          error:
            "Invalid Pakistani phone number. Please enter a valid number like 03001234567 or +923001234567.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Your order must contain at least one item." },
        { status: 400 }
      );
    }

    const normalizedFulfillment =
      (fulfillmentType || "").toLowerCase().includes("pickup") ? "pickup" : "delivery";

    const finalAddress =
      normalizedFulfillment === "delivery"
        ? (deliveryAddress || shippingAddress || "").trim()
        : "Store Self-Pickup (556/A Model Town, Gujranwala)";

    if (normalizedFulfillment === "delivery" && !finalAddress) {
      return NextResponse.json(
        { error: "Complete delivery address is required for Home Delivery." },
        { status: 400 }
      );
    }

    // 2. Format Items and calculate subtotal
    let subtotal = 0;
    const formattedItems: IOrderItem[] = items.map((it: any) => {
      const pName = it.productName || it.name || "Frozen Item";
      const pPrice = Number(it.price) || 0;
      const pQty = Math.max(1, Number(it.quantity) || 1);
      const pTotal = Number(it.total) || pPrice * pQty;
      subtotal += pTotal;

      return {
        productId: it.productId || it.id || "",
        productName: pName,
        name: pName,
        price: pPrice,
        quantity: pQty,
        total: pTotal,
        packSize: it.packSize || it.selectedSize || "Standard Pack",
        selectedSize: it.selectedSize || "",
      };
    });

    const parsedDeliveryCharges = normalizedFulfillment === "delivery" ? Number(deliveryCharges) || 0 : 0;
    const totalAmount = subtotal + parsedDeliveryCharges;

    // 3. Generate Unique Order ID & Confirmation Token
    const orderNumber = generateOrderNumber();
    const confirmationToken = crypto.randomBytes(24).toString("hex");

    // 5. Generate Server-Side PDF Invoice
    const invoicePdfUrl = await generateInvoice({
      orderNumber,
      orderId: "", // Will update or link via orderNumber
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      fulfillmentType: normalizedFulfillment,
      deliveryAddress: finalAddress,
      items: formattedItems,
      subtotal,
      deliveryCharges: parsedDeliveryCharges,
      totalAmount,
      createdAt: new Date(),
    });

    // 6. Save Order Record (MongoDB with automatic offline fallback)
    const { orderId, order: newOrder } = await createOrderRecord({
      orderNumber,
      confirmationToken,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      items: formattedItems,
      subtotal,
      fulfillmentType: normalizedFulfillment as "pickup" | "delivery",
      deliveryAddress: finalAddress,
      deliveryCharges: parsedDeliveryCharges,
      totalAmount,
      invoicePdfUrl,
      paymentMethod,
      notes,
    });

    // 7. Sync with Excel (for physical store records)
    try {
      await syncOrderToExcel(newOrder);
    } catch (err) {
      console.warn("Excel synchronization note:", err);
    }

    // 8. Fire WhatsApp Notifications (Owner & Customer)
    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const notificationPayload = {
      orderNumber: newOrder.orderNumber,
      orderId: newOrder._id.toString(),
      confirmationToken: newOrder.confirmationToken,
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      fulfillmentType: normalizedFulfillment as "pickup" | "delivery",
      deliveryAddress: finalAddress,
      items: formattedItems,
      subtotal: newOrder.subtotal,
      deliveryCharges: newOrder.deliveryCharges,
      totalAmount: newOrder.totalAmount,
      invoicePdfUrl: newOrder.invoicePdfUrl,
      paymentMethod,
      createdAt: newOrder.createdAt || new Date(),
      appBaseUrl,
    };

    // Await notification dispatches safely (timeout protected) so serverless does not abort prematurely
    try {
      await Promise.allSettled([
        notifyStoreOwner(notificationPayload),
        notifyCustomerOrderReceived(notificationPayload),
      ]);
    } catch (err) {
      console.error("WhatsApp dispatch error:", err);
    }

    // 9. Interactive WhatsApp Chat Link for Button 2
    const whatsappChatUrl = buildCustomerWhatsAppChatLink({
      orderNumber: newOrder.orderNumber,
      orderId: newOrder._id.toString(),
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      items: formattedItems,
      subtotal: newOrder.subtotal,
      deliveryCharges: newOrder.deliveryCharges,
      totalAmount: newOrder.totalAmount,
      fulfillmentType: newOrder.fulfillmentType,
      deliveryAddress: newOrder.deliveryAddress,
      paymentMethod,
      appBaseUrl,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: newOrder._id.toString(),
        orderNumber: newOrder.orderNumber,
        orderStatus: newOrder.orderStatus,
        subtotal: newOrder.subtotal,
        deliveryCharges: newOrder.deliveryCharges,
        totalAmount: newOrder.totalAmount,
        invoicePdfUrl: newOrder.invoicePdfUrl,
        whatsappChatUrl,
        confirmationToken: newOrder.confirmationToken,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process and confirm order." },
      { status: 500 }
    );
  }
}
