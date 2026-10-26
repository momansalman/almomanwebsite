import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
import { getAdminSessionUser } from "@/lib/auth";
import { readRecords, CustomerRecord, OrderRecord } from "@/lib/excelSync";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAdminSessionUser();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Access Denied. Admin authentication required." },
        { status: 403 }
      );
    }

    let membersList: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      role: string;
      createdAt: unknown;
    }> = [];

    let ordersList: Array<{
      id: string;
      customer: string;
      email: string;
      phone: string;
      amount: number;
      status: string;
      fulfillmentType: string;
      date: unknown;
    }> = [];

    let totalMembers = 0;
    let totalOrders = 0;

    try {
      await connectToDatabase();

      const [members, dbTotalMembers, dbTotalOrders, orders] = await Promise.all([
        User.find()
          .select("-password")
          .sort({ createdAt: -1 })
          .lean(),
        User.countDocuments(),
        Order.countDocuments(),
        Order.find().sort({ createdAt: -1 }).limit(50).lean(),
      ]);

      membersList = members.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        email: m.email || "N/A",
        phone: m.phone || "N/A",
        address: m.address || "N/A",
        role: m.role,
        createdAt: m.createdAt,
      }));

      ordersList = orders.map((o: any) => ({
        id: o._id.toString(),
        customer: o.customerName || o.userName || "Customer",
        email: o.userEmail || "N/A",
        phone: o.customerPhone || o.phone || "N/A",
        amount: o.totalAmount,
        status: o.orderStatus || o.status || "pending",
        fulfillmentType: o.fulfillmentType || "Home Delivery",
        shippingAddress: o.deliveryAddress || o.shippingAddress || "",
        deliveryFee: o.deliveryCharges ?? o.deliveryFee ?? 0,
        customerLocationLink: o.customerLocationLink || "",
        items: o.items || [],
        paymentMethod: o.paymentMethod || "Cash on Delivery (COD)",
        notes: o.notes || "",
        date: o.createdAt,
      }));

      totalMembers = dbTotalMembers;
      totalOrders = dbTotalOrders;
    } catch {
      console.warn("MongoDB offline, reading members & orders from backup store");
      const localCustomers = readRecords<CustomerRecord>("customers_database.json");
      const localOrders = readRecords<OrderRecord>("orders_database.json");

      membersList = localCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email || "N/A",
        phone: c.phone || "N/A",
        address: c.address || "N/A",
        role: c.role || "user",
        createdAt: c.createdAt,
      }));

      ordersList = localOrders.map((o) => ({
        id: o.id,
        customer: o.customerName,
        email: o.customerEmail || "N/A",
        phone: o.phone || "N/A",
        amount: o.totalAmount || 0,
        status: o.status || "Pending",
        fulfillmentType: o.fulfillmentType || "Home Delivery",
        shippingAddress: o.shippingAddress || "",
        deliveryFee: 150,
        customerLocationLink: o.mapsLink || "",
        items: (o.itemsSummary || "").split(" | ").map((itemStr) => ({
          name: itemStr,
          quantity: 1,
          price: o.totalAmount || 0,
          packSize: "Pack",
        })),
        paymentMethod: o.paymentMethod || "Cash on Delivery (COD)",
        notes: o.notes || "",
        date: o.createdAt,
      }));

      totalMembers = membersList.length;
      totalOrders = ordersList.length;
    }

    const totalRevenue = ordersList.reduce((sum, order) => sum + (order.amount || 0), 0);

    return NextResponse.json({
      totalMembers,
      totalOrders,
      totalRevenue,
      members: membersList,
      recentOrders: ordersList,
    });
  } catch (error: unknown) {
    console.error("Admin members API error:", error);
    const message = error instanceof Error ? error.message : "Failed to load members data";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
