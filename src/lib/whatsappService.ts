import fs from "fs";
import path from "path";

/**
 * WhatsApp Notification Engine for AL-MOMAN Special Frozen Chicken Food
 * Supports WhatsApp Cloud API, UltraMsg, Wasapi/Webhook Gateway, Twilio, and structured audit logs.
 */

export interface WhatsAppNotificationPayload {
  orderNumber: string;
  orderId: string;
  confirmationToken: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: "pickup" | "delivery" | "Self-Pickup" | "Home Delivery" | string;
  deliveryAddress?: string | null;
  items?: Array<{
    productName?: string;
    name?: string;
    quantity: number;
    price: number;
    total: number;
    packSize?: string;
  }>;
  subtotal: number;
  deliveryCharges?: number;
  totalAmount: number;
  invoicePdfUrl?: string;
  paymentMethod?: string;
  createdAt?: string | Date;
  appBaseUrl?: string;
}

export interface DispatchAuditRecord {
  id: string;
  timestamp: string;
  recipientRole: "owner" | "customer";
  recipientPhone: string;
  orderNumber: string;
  orderId: string;
  provider: "meta_cloud_api" | "ultramsg" | "webhook_gateway" | "twilio" | "dev_simulated";
  status: "delivered" | "failed" | "simulated";
  statusCode?: number;
  error?: string;
  messagePreview: string;
}

const STORE_OWNER_PHONE =
  process.env.STORE_OWNER_WHATSAPP ||
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
  "923371691006";

const AUDIT_LOG_FILE = path.join(process.cwd(), "public", "logs", "whatsapp_audit.json");

/**
 * Normalizes phone number to international E.164 digits without '+'
 * e.g., 03371691006 -> 923371691006
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  let cleaned = (phone || "").replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.substring(1);
  if (cleaned.startsWith("00")) cleaned = cleaned.substring(2);
  if (cleaned.startsWith("03")) cleaned = "92" + cleaned.substring(1);
  if (cleaned.startsWith("3") && cleaned.length === 10) cleaned = "92" + cleaned;
  return cleaned;
}

/**
 * Records structured audit log to disk and console
 */
function recordAuditLog(record: DispatchAuditRecord) {
  try {
    const dir = path.dirname(AUDIT_LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let logs: DispatchAuditRecord[] = [];
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, "utf-8"));
      } catch {}
    }

    logs.unshift(record);
    if (logs.length > 100) logs = logs.slice(0, 100);

    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.warn("[WHATSAPP AUDIT LOG ERROR]:", err);
  }

  // Structured console log
  const logPrefix = record.status === "failed" ? "❌ [WHATSAPP ERROR]" : "✅ [WHATSAPP DISPATCH]";
  console.log(`${logPrefix} [${record.provider}] to +${record.recipientPhone} (Order: #${record.orderNumber}): ${record.status}`);
  if (record.error) console.error("  Reason:", record.error);
}

/**
 * Builds interactive customer deep link for Button 2 ("Confirm & WhatsApp")
 * or manual WhatsApp dispatch with complete itemized order slip.
 */
export function buildCustomerWhatsAppChatLink(
  arg1: string | Partial<WhatsAppNotificationPayload>,
  arg2?: string
): string {
  const ownerPhone = normalizePhoneForWhatsApp(STORE_OWNER_PHONE);

  if (typeof arg1 === "string") {
    const orderNumber = arg1;
    const customerPhone = arg2 || "";
    const message = `Hello AL-MOMAN Frozen Chicken! I have placed order #${orderNumber}. My phone number is ${customerPhone}. Please review and confirm my order.`;
    return `https://wa.me/${ownerPhone}?text=${encodeURIComponent(message)}`;
  }

  const payload = arg1;
  const baseUrl = payload.appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const trackingLink = `${baseUrl}/order-tracking/${payload.orderId || payload.orderNumber}`;
  const invoiceLink = `${baseUrl}/api/orders/${payload.orderId || payload.orderNumber}/invoice`;
  const isDelivery = (payload.fulfillmentType || "").toLowerCase().includes("delivery");
  const itemsList = buildItemsSummary(payload.items);

  const message = `🍗 *NEW ORDER ALERT — AL-MOMAN SPECIAL FROZEN FOOD*
==========================================
📦 *Order ID:* #${payload.orderNumber}
👤 *Customer Name:* ${payload.customerName || "Customer"}
📞 *WhatsApp / Phone:* ${payload.customerPhone || "N/A"}
🚚 *Fulfillment:* ${isDelivery ? "HOME DELIVERY" : "STORE SELF-PICKUP"}
${isDelivery ? `📍 *Delivery Address:* ${payload.deliveryAddress || "N/A"}\n` : `🏪 *Pickup Warehouse:* 556/A Model Town, Gujranwala\n`}💳 *Payment Method:* ${payload.paymentMethod || "Cash on Delivery (COD)"}
==========================================
📋 *ITEMS ORDERED:*
${itemsList}

💰 *Subtotal:* Rs. ${Number(payload.subtotal || 0).toLocaleString()}
🛵 *Delivery Charges:* ${isDelivery ? "Pending / TBD via WhatsApp" : "Rs. 0 (Self Pickup)"}
💵 *Total Amount:* Rs. ${Number(payload.totalAmount || payload.subtotal || 0).toLocaleString()}${isDelivery ? " + Delivery" : ""}
==========================================
📄 *In-App Sales Invoice:*
${invoiceLink}

🔗 *Live Order Tracking:*
${trackingLink}
==========================================
Salam AL-MOMAN Store Owner! Please check and confirm this order.`;

  return `https://wa.me/${ownerPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds standardized itemized summary text for WhatsApp
 */
function buildItemsSummary(items: WhatsAppNotificationPayload["items"]): string {
  if (!items || !items.length) return "• Standard Frozen Food Selection";
  return items
    .map((it, idx) => {
      const name = it.productName || it.name || "Frozen Item";
      const pack = it.packSize ? ` (${it.packSize})` : "";
      return `${idx + 1}. *${name}*${pack} x ${it.quantity} = Rs. ${Number(it.total || it.price * it.quantity).toLocaleString()}`;
    })
    .join("\n");
}

/**
 * Requirement B: Standardized Order Confirmation WhatsApp Notification to Store Owner
 */
export async function notifyStoreOwner(
  payload: WhatsAppNotificationPayload
): Promise<{ success: boolean; mode: string; error?: string }> {
  const baseUrl = payload.appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const confirmLink = `${baseUrl}/api/orders/confirm?orderId=${payload.orderId}&token=${payload.confirmationToken}`;
  const trackingLink = `${baseUrl}/track/${payload.orderId}`;
  const invoiceLink = `${baseUrl}/api/orders/${payload.orderId}/invoice`;
  const isDelivery = (payload.fulfillmentType || "").toLowerCase().includes("delivery");
  const timeFormatted = payload.createdAt
    ? new Date(payload.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })
    : new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });

  const itemsList = buildItemsSummary(payload.items);

  const messageText = `🍗 *NEW ORDER ALERT — AL-MOMAN SPECIAL FROZEN FOOD*
==========================================
📦 *Order ID:* #${payload.orderNumber}
🕒 *Time:* ${timeFormatted}
👤 *Customer Name:* ${payload.customerName}
📞 *WhatsApp / Phone:* ${payload.customerPhone}
🚚 *Fulfillment Mode:* ${isDelivery ? "HOME DELIVERY" : "STORE SELF-PICKUP"}
${isDelivery ? `📍 *Delivery Address:* ${payload.deliveryAddress || "N/A"}\n` : `🏪 *Pickup Warehouse:* 556/A Model Town, Gujranwala\n`}💳 *Payment Method:* ${payload.paymentMethod || "Cash on Delivery (COD)"}
==========================================
📋 *ITEMIZED ORDER BREAKDOWN:*
${itemsList}

💰 *Subtotal:* Rs. ${Number(payload.subtotal).toLocaleString()}
🛵 *Delivery Charges:* ${isDelivery ? "Pending / TBD via WhatsApp" : "Rs. 0 (Self Pickup)"}
💵 *Total Amount:* Rs. ${Number(payload.totalAmount || payload.subtotal).toLocaleString()}${isDelivery ? " + Delivery" : ""}
==========================================
⚡ *1-CLICK APPROVAL FOR OWNER:*
Click below to instantly mark order as CONFIRMED and notify customer:
👉 ${confirmLink}

📄 *In-App Invoice Viewer:*
${invoiceLink}

🔗 *Live Order Tracking:*
${trackingLink}
==========================================`;

  return await dispatchWhatsAppMessage({
    to: STORE_OWNER_PHONE,
    message: messageText,
    role: "owner",
    orderNumber: payload.orderNumber,
    orderId: payload.orderId,
  });
}

/**
 * Requirement B: Standardized Order Received WhatsApp Notification to Customer
 */
export async function notifyCustomerOrderReceived(
  payload: WhatsAppNotificationPayload
): Promise<{ success: boolean; mode: string; error?: string }> {
  const baseUrl = payload.appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const trackingLink = `${baseUrl}/track/${payload.orderId}`;
  const invoiceLink = `${baseUrl}/api/orders/${payload.orderId}/invoice`;
  const isDelivery = (payload.fulfillmentType || "").toLowerCase().includes("delivery");
  const itemsList = buildItemsSummary(payload.items);

  const messageText = `Assalam-o-Alaikum *${payload.customerName}*! 🍗✨
Thank you for ordering with *AL-MOMAN Special Frozen Chicken Food*.

Your order *#${payload.orderNumber}* has been successfully received by our kitchen.

==========================================
📋 *YOUR ORDER DETAILS:*
${itemsList}

💵 *Subtotal:* Rs. ${Number(payload.subtotal).toLocaleString()}
💳 *Payment:* ${payload.paymentMethod || "Cash on Delivery (COD)"}
🚚 *Fulfillment:* ${isDelivery ? "Home Delivery" : "Store Self-Pickup"}
==========================================
${isDelivery
  ? `🛵 *Delivery Charges Note:* Delivery charges are calculated based on your location and will be communicated directly via WhatsApp.`
  : `🏪 *Pickup Warehouse:* 556/A Model Town, Gujranwala. Please show order #${payload.orderNumber} at pickup.`}

📄 *View Your Official Invoice:*
${invoiceLink}

🔴 *Track Live Kitchen & Delivery Progress:*
${trackingLink}

Helpline / WhatsApp: 0337-1691006`;

  return await dispatchWhatsAppMessage({
    to: payload.customerPhone,
    message: messageText,
    role: "customer",
    orderNumber: payload.orderNumber,
    orderId: payload.orderId,
  });
}

/**
 * Requirement B: Standardized Order Confirmed WhatsApp Notification to Customer
 */
export async function notifyCustomerOrderConfirmed(
  orderNumber: string,
  customerPhone: string,
  orderId: string,
  appBaseUrl?: string
): Promise<{ success: boolean; mode: string; error?: string }> {
  const baseUrl = appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const trackingLink = `${baseUrl}/track/${orderId}`;
  const invoiceLink = `${baseUrl}/api/orders/${orderId}/invoice`;

  const messageText = `🎉 *Great News! Order Confirmed* 🍗✨
Your order *#${orderNumber}* has been officially accepted and confirmed by *AL-MOMAN Special Frozen Chicken Food*!

Our kitchen is hygienically blast-freezing your fresh batches at -35°C to preserve authentic flavor and nutrition.

🔴 *Live Order Tracking:*
${trackingLink}

📄 *In-App Sales Invoice:*
${invoiceLink}

📞 *Helpline & WhatsApp Support:*
0337-1691006`;

  return await dispatchWhatsAppMessage({
    to: customerPhone,
    message: messageText,
    role: "customer",
    orderNumber,
    orderId,
  });
}

/**
 * Multi-Provider Server-Side WhatsApp Dispatch Engine
 * Priority order:
 * 1. Meta WhatsApp Cloud API
 * 2. UltraMsg WhatsApp API
 * 3. Custom Webhook / Wasapi Gateway
 * 4. Twilio WhatsApp
 * 5. Persistent Simulated Dispatch (Development / Fallback)
 */
async function dispatchWhatsAppMessage({
  to,
  message,
  role,
  orderNumber,
  orderId,
}: {
  to: string;
  message: string;
  role: "owner" | "customer";
  orderNumber: string;
  orderId: string;
}): Promise<{ success: boolean; mode: string; error?: string }> {
  const normalizedTo = normalizePhoneForWhatsApp(to);
  const auditId = `wa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Meta WhatsApp Cloud API
  const metaToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (metaToken && metaPhoneId) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: normalizedTo,
          type: "text",
          text: { preview_url: true, body: message },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const resText = await res.text();
      if (res.ok) {
        recordAuditLog({
          id: auditId,
          timestamp: new Date().toISOString(),
          recipientRole: role,
          recipientPhone: normalizedTo,
          orderNumber,
          orderId,
          provider: "meta_cloud_api",
          status: "delivered",
          statusCode: res.status,
          messagePreview: message.substring(0, 100),
        });
        return { success: true, mode: "meta_cloud_api" };
      }

      recordAuditLog({
        id: auditId,
        timestamp: new Date().toISOString(),
        recipientRole: role,
        recipientPhone: normalizedTo,
        orderNumber,
        orderId,
        provider: "meta_cloud_api",
        status: "failed",
        statusCode: res.status,
        error: resText,
        messagePreview: message.substring(0, 100),
      });
    } catch (err: any) {
      console.warn("Meta Cloud API dispatch error:", err.message);
    }
  }

  // 2. UltraMsg WhatsApp API
  const ultraInstance = process.env.ULTRAMSG_INSTANCE_ID;
  const ultraToken = process.env.ULTRAMSG_TOKEN;
  if (ultraInstance && ultraToken) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const params = new URLSearchParams();
      params.append("token", ultraToken);
      params.append("to", `+${normalizedTo}`);
      params.append("body", message);

      const res = await fetch(`https://api.ultramsg.com/${ultraInstance}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const resText = await res.text();
      if (res.ok) {
        recordAuditLog({
          id: auditId,
          timestamp: new Date().toISOString(),
          recipientRole: role,
          recipientPhone: normalizedTo,
          orderNumber,
          orderId,
          provider: "ultramsg",
          status: "delivered",
          statusCode: res.status,
          messagePreview: message.substring(0, 100),
        });
        return { success: true, mode: "ultramsg" };
      }

      recordAuditLog({
        id: auditId,
        timestamp: new Date().toISOString(),
        recipientRole: role,
        recipientPhone: normalizedTo,
        orderNumber,
        orderId,
        provider: "ultramsg",
        status: "failed",
        statusCode: res.status,
        error: resText,
        messagePreview: message.substring(0, 100),
      });
    } catch (err: any) {
      console.warn("UltraMsg dispatch error:", err.message);
    }
  }

  // 3. Custom Webhook Gateway / Wasapi
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL || process.env.WHATSAPP_GATEWAY_URL;
  if (webhookUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.WHATSAPP_API_KEY ? { "x-api-key": process.env.WHATSAPP_API_KEY } : {}),
        },
        body: JSON.stringify({
          to: normalizedTo,
          message,
          orderNumber,
          orderId,
          role,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        recordAuditLog({
          id: auditId,
          timestamp: new Date().toISOString(),
          recipientRole: role,
          recipientPhone: normalizedTo,
          orderNumber,
          orderId,
          provider: "webhook_gateway",
          status: "delivered",
          statusCode: res.status,
          messagePreview: message.substring(0, 100),
        });
        return { success: true, mode: "webhook_gateway" };
      }
    } catch (err: any) {
      console.warn("Webhook gateway dispatch error:", err.message);
    }
  }

  // 4. Twilio WhatsApp
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM;
  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");
      const bodyParams = new URLSearchParams();
      bodyParams.append("From", twilioFrom);
      bodyParams.append("To", `whatsapp:+${normalizedTo}`);
      bodyParams.append("Body", message);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams.toString(),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        recordAuditLog({
          id: auditId,
          timestamp: new Date().toISOString(),
          recipientRole: role,
          recipientPhone: normalizedTo,
          orderNumber,
          orderId,
          provider: "twilio",
          status: "delivered",
          statusCode: res.status,
          messagePreview: message.substring(0, 100),
        });
        return { success: true, mode: "twilio" };
      }
    } catch (err: any) {
      console.warn("Twilio WhatsApp dispatch error:", err.message);
    }
  }

  // 5. Simulated / Dev Logging Fallback
  recordAuditLog({
    id: auditId,
    timestamp: new Date().toISOString(),
    recipientRole: role,
    recipientPhone: normalizedTo,
    orderNumber,
    orderId,
    provider: "dev_simulated",
    status: "simulated",
    statusCode: 200,
    messagePreview: message.substring(0, 100),
  });

  return { success: true, mode: "dev_simulated" };
}
