import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
import {
  regenerateExcelFiles,
  syncCustomerToExcel,
  syncOrderToExcel,
  getExcelSyncStatus,
} from "@/lib/excelSync";

export async function POST() {
  try {
    const session = await getAdminSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Admin unauthorized" }, { status: 401 });
    }

    // Try fetching live users from MongoDB if available
    try {
      await connectToDatabase();
      const users = await User.find().select("-password");
      for (const u of users) {
        syncCustomerToExcel({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          address: u.address || "",
          role: u.role,
          createdAt: u.createdAt ? new Date(u.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" }) : undefined,
        });
      }

      const orders = await Order.find().sort({ createdAt: -1 });
      for (const o of orders as any[]) {
        syncOrderToExcel({
          id: o._id.toString(),
          customerName: o.customerName || o.userName || "Customer",
          customerEmail: o.userEmail || "",
          phone: o.customerPhone || o.phone || "",
          fulfillmentType: o.fulfillmentType || "Home Delivery",
          shippingAddress: o.deliveryAddress || o.shippingAddress || "",
          items: (o.items || []).map((it: any) => ({
            name: it.productName || it.name || "Item",
            quantity: Number(it.quantity) || 1,
            price: Number(it.price) || 0,
            packSize: it.packSize || "",
            selectedSize: it.selectedSize,
          })),
          totalAmount: o.totalAmount || 0,
          paymentMethod: o.paymentMethod,
          status: o.orderStatus || o.status || "pending",
          notes: o.notes,
          createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" }) : undefined,
        });
      }
    } catch (dbErr) {
      console.warn("Database sync pass-through note:", dbErr);
    }

    const result = regenerateExcelFiles();

    return NextResponse.json({
      success: true,
      message: "Excel sheets successfully synchronized and saved to D: drive!",
      ...result,
    });
  } catch (error: unknown) {
    console.error("Excel sync error:", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getAdminSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Admin unauthorized" }, { status: 401 });
    }

    const status = getExcelSyncStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Status failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
