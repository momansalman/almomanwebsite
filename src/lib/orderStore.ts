import fs from "fs";
import path from "path";
import crypto from "crypto";
import { connectToDatabase } from "./mongodb";
import Order, { IOrder, IOrderItem } from "@/models/Order";
import User from "@/models/User";

const LOCAL_ORDERS_FILE = path.join(process.cwd(), "src", "data", "orders.json");

function getLocalOrders(): any[] {
  try {
    if (!fs.existsSync(LOCAL_ORDERS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(LOCAL_ORDERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: any[]) {
  try {
    const dir = path.dirname(LOCAL_ORDERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local orders JSON fallback:", err);
  }
}

export async function createOrderRecord(orderData: {
  orderNumber: string;
  confirmationToken: string;
  customerName: string;
  customerPhone: string;
  items: IOrderItem[];
  subtotal: number;
  fulfillmentType: "pickup" | "delivery";
  deliveryAddress: string | null;
  deliveryCharges: number;
  totalAmount: number;
  invoicePdfUrl: string;
  paymentMethod?: string;
  notes?: string;
}): Promise<{ orderId: string; order: any }> {
  try {
    await connectToDatabase();

    // Find or create User
    let userDoc = await User.findOne({ phone: orderData.customerPhone });
    if (!userDoc) {
      userDoc = await User.create({
        name: orderData.customerName,
        phone: orderData.customerPhone,
        role: "customer",
        addresses: orderData.deliveryAddress ? [orderData.deliveryAddress] : [],
      });
    }

    const newOrder: any = await Order.create({
      orderNumber: orderData.orderNumber,
      confirmationToken: orderData.confirmationToken,
      customer: userDoc._id,
      user: userDoc._id,
      customerName: orderData.customerName,
      userName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      phone: orderData.customerPhone,
      items: orderData.items,
      subtotal: orderData.subtotal,
      fulfillmentType: orderData.fulfillmentType,
      deliveryAddress: orderData.deliveryAddress || undefined,
      shippingAddress: orderData.deliveryAddress || "",
      deliveryCharges: orderData.deliveryCharges,
      deliveryFee: orderData.deliveryCharges,
      totalAmount: orderData.totalAmount,
      orderStatus: "pending",
      status: "pending",
      invoicePdfUrl: orderData.invoicePdfUrl,
      paymentMethod: orderData.paymentMethod || "Cash on Delivery",
      notes: orderData.notes || "",
    });

    return { orderId: newOrder._id.toString(), order: newOrder };
  } catch (mongoErr) {
    console.warn("MongoDB connection offline. Storing order in robust local datastore:", mongoErr);

    const fallbackId = `ord_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const fallbackOrder = {
      _id: fallbackId,
      id: fallbackId,
      ...orderData,
      orderStatus: "pending",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existing = getLocalOrders();
    existing.unshift(fallbackOrder);
    saveLocalOrders(existing);

    return { orderId: fallbackId, order: fallbackOrder };
  }
}

export async function findOrderByIdOrNumber(identifier: string): Promise<any | null> {
  const cleanId = (identifier || "").replace(/^#/, "").trim();
  try {
    await connectToDatabase();
    let order = null;
    if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(cleanId).lean();
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: cleanId }).lean();
    }
    if (!order) {
      order = await Order.findOne({ _id: cleanId }).lean();
    }
    if (order) return order;
  } catch (err) {
    console.warn("MongoDB read offline, checking local orders fallback:", err);
  }

  // Fallback to local store
  const localOrders = getLocalOrders();
  const matched = localOrders.find(
    (o) =>
      o.id === cleanId ||
      o._id === cleanId ||
      o.orderNumber === cleanId ||
      (o.id && cleanId && o.id.slice(-6).toLowerCase() === cleanId.slice(-6).toLowerCase()) ||
      (o.orderNumber && cleanId && o.orderNumber.toLowerCase().includes(cleanId.toLowerCase()))
  );
  return matched || null;
}

export async function confirmOrderByIdAndToken(orderId: string, token: string): Promise<{
  success: boolean;
  order?: any;
  error?: string;
  statusCode?: number;
}> {
  try {
    await connectToDatabase();
    let order: any = null;
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: orderId });
    }

    if (order) {
      if (order.confirmationToken !== token) {
        return { success: false, error: "Invalid confirmation token", statusCode: 403 };
      }
      order.orderStatus = "confirmed";
      order.status = "confirmed";
      await order.save();
      return { success: true, order };
    }
  } catch (err) {
    console.warn("MongoDB confirm offline, updating local fallback:", err);
  }

  // Local fallback
  const localOrders = getLocalOrders();
  const idx = localOrders.findIndex(
    (o) => o.id === orderId || o._id === orderId || o.orderNumber === orderId
  );
  if (idx === -1) {
    return { success: false, error: "Order not found", statusCode: 404 };
  }

  const order = localOrders[idx];
  if (order.confirmationToken !== token) {
    return { success: false, error: "Invalid confirmation token", statusCode: 403 };
  }

  order.orderStatus = "confirmed";
  order.status = "confirmed";
  order.updatedAt = new Date().toISOString();
  localOrders[idx] = order;
  saveLocalOrders(localOrders);

  return { success: true, order };
}

export async function findOrdersByPhoneOrQuery(query: string): Promise<any[]> {
  const clean = query.trim();
  const digitsOnly = clean.replace(/[^\d]/g, "");

  try {
    await connectToDatabase();
    const orConditions: any[] = [
      { orderNumber: { $regex: clean, $options: "i" } },
    ];
    if (digitsOnly.length >= 7) {
      orConditions.push({ customerPhone: { $regex: digitsOnly.slice(-9), $options: "i" } });
      orConditions.push({ phone: { $regex: digitsOnly.slice(-9), $options: "i" } });
    }
    if (clean.match(/^[0-9a-fA-F]{24}$/)) {
      orConditions.push({ _id: clean });
    }

    const orders = await Order.find({ $or: orConditions }).sort({ createdAt: -1 }).limit(10).lean();
    if (orders && orders.length > 0) {
      return orders;
    }
  } catch (err) {
    console.warn("MongoDB query offline, checking local orders fallback:", err);
  }

  // Fallback to local store
  const localOrders = getLocalOrders();
  return localOrders.filter((o) => {
    const numMatch = (o.orderNumber || "").toLowerCase().includes(clean.toLowerCase());
    const idMatch = (o.id || o._id || "").toString().toLowerCase().includes(clean.toLowerCase());
    const phone = (o.customerPhone || o.phone || "").replace(/[^\d]/g, "");
    const phoneMatch = digitsOnly.length >= 7 && phone.includes(digitsOnly.slice(-9));
    return numMatch || idMatch || phoneMatch;
  }).slice(0, 10);
}

export async function cancelOrderById(
  orderId: string,
  reason?: string
): Promise<{ success: boolean; order?: any; error?: string; isApproved?: boolean }> {
  try {
    await connectToDatabase();
    let order: any = null;
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: orderId });
    }

    if (order) {
      const currentStatus = (order.orderStatus || order.status || "").toLowerCase();
      if (currentStatus !== "pending") {
        return {
          success: false,
          isApproved: true,
          error: "This order has already been approved by the store admin. Direct in-app cancellation is locked.",
          order,
        };
      }

      order.orderStatus = "cancelled";
      order.status = "cancelled";
      if (reason) {
        order.notes = order.notes ? `${order.notes} | Cancel Reason: ${reason}` : `Cancel Reason: ${reason}`;
      }
      await order.save();
      return { success: true, order };
    }
  } catch (err) {
    console.warn("MongoDB cancel offline, checking local orders fallback:", err);
  }

  // Local fallback
  const localOrders = getLocalOrders();
  const idx = localOrders.findIndex(
    (o) => o.id === orderId || o._id === orderId || o.orderNumber === orderId
  );
  if (idx === -1) {
    return { success: false, error: "Order not found" };
  }

  const order = localOrders[idx];
  const currentStatus = (order.orderStatus || order.status || "").toLowerCase();
  if (currentStatus !== "pending") {
    return {
      success: false,
      isApproved: true,
      error: "This order has already been approved by the store admin. Direct in-app cancellation is locked.",
      order,
    };
  }

  order.orderStatus = "cancelled";
  order.status = "cancelled";
  if (reason) {
    order.notes = order.notes ? `${order.notes} | Cancel Reason: ${reason}` : `Cancel Reason: ${reason}`;
  }
  order.updatedAt = new Date().toISOString();
  localOrders[idx] = order;
  saveLocalOrders(localOrders);

  return { success: true, order };
}

export async function editOrderById(
  orderId: string,
  updateData: {
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    notes?: string;
  }
): Promise<{ success: boolean; order?: any; error?: string; isApproved?: boolean }> {
  try {
    await connectToDatabase();
    let order: any = null;
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: orderId });
    }

    if (order) {
      const currentStatus = (order.orderStatus || order.status || "").toLowerCase();
      if (currentStatus !== "pending") {
        return {
          success: false,
          isApproved: true,
          error: "This order has already been approved by the store admin. Direct modifications are locked.",
          order,
        };
      }

      if (updateData.customerName) order.customerName = updateData.customerName.trim();
      if (updateData.customerPhone) order.customerPhone = updateData.customerPhone.trim();
      if (updateData.deliveryAddress) {
        order.deliveryAddress = updateData.deliveryAddress.trim();
        order.shippingAddress = updateData.deliveryAddress.trim();
      }
      if (updateData.notes !== undefined) order.notes = updateData.notes.trim();

      await order.save();
      return { success: true, order };
    }
  } catch (err) {
    console.warn("MongoDB edit offline, checking local orders fallback:", err);
  }

  // Local fallback
  const localOrders = getLocalOrders();
  const idx = localOrders.findIndex(
    (o) => o.id === orderId || o._id === orderId || o.orderNumber === orderId
  );
  if (idx === -1) {
    return { success: false, error: "Order not found" };
  }

  const order = localOrders[idx];
  const currentStatus = (order.orderStatus || order.status || "").toLowerCase();
  if (currentStatus !== "pending") {
    return {
      success: false,
      isApproved: true,
      error: "This order has already been approved by the store admin. Direct modifications are locked.",
      order,
    };
  }

  if (updateData.customerName) order.customerName = updateData.customerName.trim();
  if (updateData.customerPhone) order.customerPhone = updateData.customerPhone.trim();
  if (updateData.deliveryAddress) {
    order.deliveryAddress = updateData.deliveryAddress.trim();
    order.shippingAddress = updateData.deliveryAddress.trim();
  }
  if (updateData.notes !== undefined) order.notes = updateData.notes.trim();

  order.updatedAt = new Date().toISOString();
  localOrders[idx] = order;
  saveLocalOrders(localOrders);

  return { success: true, order };
}

export async function updateOrderStatusById(
  orderId: string,
  newStatus: string,
  notes?: string
): Promise<{ success: boolean; order?: any; error?: string }> {
  const cleanId = (orderId || "").replace(/^#/, "").trim();
  const normalized = (newStatus || "pending").toLowerCase();

  try {
    await connectToDatabase();
    let order: any = null;
    if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(cleanId);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: cleanId });
    }
    if (!order) {
      order = await Order.findOne({ _id: cleanId });
    }

    if (order) {
      order.orderStatus = normalized;
      order.status = normalized;
      if (notes !== undefined) {
        order.notes = notes;
      }
      await order.save();
    }
  } catch (err) {
    console.warn("MongoDB updateOrderStatus offline, updating local datastore:", err);
  }

  // Update in local orders.json
  const localOrders = getLocalOrders();
  const idx = localOrders.findIndex(
    (o) =>
      o.id === cleanId ||
      o._id === cleanId ||
      o.orderNumber === cleanId ||
      (o.id && cleanId && o.id.slice(-6).toLowerCase() === cleanId.slice(-6).toLowerCase()) ||
      (o.orderNumber && cleanId && o.orderNumber.toLowerCase().includes(cleanId.toLowerCase()))
  );

  let updatedOrder = null;
  if (idx !== -1) {
    localOrders[idx].orderStatus = normalized;
    localOrders[idx].status = normalized;
    if (notes !== undefined) {
      localOrders[idx].notes = notes;
    }
    localOrders[idx].updatedAt = new Date().toISOString();
    updatedOrder = localOrders[idx];
    saveLocalOrders(localOrders);
  }

  // Update in Excel and customer data backup store
  try {
    const { updateOrderStatusInExcel } = await import("./excelSync");
    updateOrderStatusInExcel(cleanId, normalized);
  } catch (e) {
    console.warn("Excel order status update notice:", e);
  }

  return { success: true, order: updatedOrder };
}



