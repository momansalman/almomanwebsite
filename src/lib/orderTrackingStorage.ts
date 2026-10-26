/**
 * Order Tracking State Management & Session Preservation
 * Handles localStorage persistence, guest checkout sessions, recent order history,
 * and cross-component reactive updates via custom DOM events.
 */

export interface ActiveOrderSession {
  orderId: string;
  orderNumber: string;
  customerPhone: string;
  customerName: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled" | string;
  fulfillmentType?: string;
  deliveryAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_ACTIVE_KEY = "almoman_active_order_session";
const STORAGE_HISTORY_KEY = "almoman_recent_orders_history";
const EVENT_NAME = "almoman_order_session_changed";

/**
 * Saves or updates an active order in localStorage and recent order history.
 */
export function saveActiveOrder(session: Partial<ActiveOrderSession> & { orderId: string; orderNumber: string }): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getActiveOrder();
    const now = new Date().toISOString();

    const fullSession: ActiveOrderSession = {
      orderId: session.orderId,
      orderNumber: session.orderNumber,
      customerPhone: session.customerPhone || existing?.customerPhone || "",
      customerName: session.customerName || existing?.customerName || "Customer",
      totalAmount: session.totalAmount ?? existing?.totalAmount ?? 0,
      status: session.status || existing?.status || "pending",
      fulfillmentType: session.fulfillmentType || existing?.fulfillmentType || "delivery",
      deliveryAddress: session.deliveryAddress ?? existing?.deliveryAddress ?? null,
      createdAt: session.createdAt || existing?.createdAt || now,
      updatedAt: now,
    };

    // Save as current active order
    localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(fullSession));
    localStorage.setItem("almoman_last_order_id", fullSession.orderId);
    localStorage.setItem("almoman_last_order_num", fullSession.orderNumber);

    // Save into history array (up to 10 most recent orders)
    const history = getRecentOrders();
    const updatedHistory = [
      fullSession,
      ...history.filter((o) => o.orderId !== fullSession.orderId && o.orderNumber !== fullSession.orderNumber),
    ].slice(0, 10);

    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));

    // Also set a cookie so server/middleware can detect active session if needed
    document.cookie = `almoman_active_order=${encodeURIComponent(fullSession.orderId)}; path=/; max-age=604800; SameSite=Lax`;

    // Notify all active listeners across the page (Navbar, Badges, Modals)
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: fullSession }));
  } catch (err) {
    console.warn("Failed to persist order tracking session:", err);
  }
}

/**
 * Retrieves the currently active order.
 * If the order is already completed ("delivered" or "cancelled"), or older than 7 days, returns null.
 */
export function getActiveOrder(): ActiveOrderSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_KEY);
    if (!raw) return null;

    const session: ActiveOrderSession = JSON.parse(raw);
    const status = (session.status || "").toLowerCase();

    // If order was delivered or cancelled, it is no longer an "active" pending journey
    if (status === "delivered" || status === "cancelled") {
      return null;
    }

    // Check if session is older than 5 days
    const createdTime = new Date(session.createdAt).getTime();
    if (Date.now() - createdTime > 5 * 24 * 60 * 60 * 1000) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Updates status of the active order. Inactivates if delivered or cancelled.
 */
export function updateActiveOrderStatus(orderId: string, status: string): void {
  if (typeof window === "undefined") return;

  try {
    const current = getActiveOrder();
    if (current && (current.orderId === orderId || current.orderNumber === orderId)) {
      current.status = status;
      current.updatedAt = new Date().toISOString();

      if (status.toLowerCase() === "delivered" || status.toLowerCase() === "cancelled") {
        // Move to history and clear active session
        localStorage.removeItem(STORAGE_ACTIVE_KEY);
      } else {
        localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(current));
      }

      // Update entry in history array
      const history = getRecentOrders().map((item) => {
        if (item.orderId === orderId || item.orderNumber === orderId) {
          return { ...item, status, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));

      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: current }));
    }
  } catch (err) {
    console.warn("Failed to update active order status:", err);
  }
}

/**
 * Clears current active order (e.g., user explicitly dismisses or order is complete).
 */
export function clearActiveOrder(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_ACTIVE_KEY);
    document.cookie = "almoman_active_order=; path=/; max-age=0";
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));
  } catch {}
}

/**
 * Returns recent order history saved on this device.
 */
export function getRecentOrders(): ActiveOrderSession[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Subscribes to order session changes (returns unsubscribe function).
 */
export function subscribeToActiveOrder(callback: (session: ActiveOrderSession | null) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = () => {
    callback(getActiveOrder());
  };

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
