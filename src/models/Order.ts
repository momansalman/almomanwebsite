import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  productId?: string;
  productName: string;
  name: string; // Backwards-compatible alias
  price: number;
  quantity: number;
  total: number;
  packSize?: string;
  selectedSize?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled"
  | "Pending"
  | "Confirmed"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface IOrder extends Document {
  orderNumber: string;
  customer?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId; // Backwards-compatible alias
  customerName: string;
  customerPhone: string;
  userName?: string; // Backwards-compatible alias
  phone?: string; // Backwards-compatible alias
  userEmail?: string;
  items: IOrderItem[];
  subtotal: number;
  fulfillmentType: "pickup" | "delivery" | "Self-Pickup" | "Home Delivery";
  deliveryAddress?: string;
  shippingAddress?: string; // Backwards-compatible alias
  deliveryCharges: number;
  deliveryFee?: number; // Backwards-compatible alias
  totalAmount: number;
  orderStatus: OrderStatus;
  status: OrderStatus; // Backwards-compatible alias
  confirmationToken: string;
  invoicePdfUrl?: string;
  customerLocationLink?: string;
  paymentMethod?: string;
  notes?: string;
  recipientName?: string;
  recipientPhone?: string;
  orderedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, default: "" },
    productName: { type: String, required: true },
    name: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true },
    packSize: { type: String, default: "Standard Pack" },
    selectedSize: { type: String, default: "" },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userEmail: {
      type: String,
      default: "",
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderItem[]) => Array.isArray(v) && v.length > 0,
        message: "Order must contain at least one item.",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    fulfillmentType: {
      type: String,
      enum: ["pickup", "delivery", "Self-Pickup", "Home Delivery"],
      required: true,
      default: "delivery",
    },
    deliveryAddress: {
      type: String,
      default: "",
    },
    shippingAddress: {
      type: String,
      default: "",
    },
    deliveryCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
        "Pending",
        "Confirmed",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "pending",
      index: true,
    },
    status: {
      type: String,
      default: "pending",
    },
    confirmationToken: {
      type: String,
      required: true,
      index: true,
    },
    invoicePdfUrl: {
      type: String,
      default: "",
    },
    customerLocationLink: {
      type: String,
      default: "",
    },
    paymentMethod: {
      type: String,
      default: "Cash on Delivery",
    },
    notes: {
      type: String,
      default: "",
    },
    recipientName: {
      type: String,
      default: "",
    },
    recipientPhone: {
      type: String,
      default: "",
    },
    orderedBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure compatibility aliases and total calculations
OrderSchema.pre("save", function () {
  const doc = this as unknown as IOrder;
  if (!doc.customerName && (doc as any).userName) {
    doc.customerName = (doc as any).userName;
  }
  if (!doc.shippingAddress && doc.deliveryAddress) {
    doc.shippingAddress = doc.deliveryAddress;
  } else if (!doc.deliveryAddress && doc.shippingAddress) {
    doc.deliveryAddress = doc.shippingAddress;
  }

  // Sync deliveryCharges and deliveryFee
  if (doc.deliveryCharges === undefined && doc.deliveryFee !== undefined) {
    doc.deliveryCharges = doc.deliveryFee;
  } else if (doc.deliveryFee === undefined && doc.deliveryCharges !== undefined) {
    doc.deliveryFee = doc.deliveryCharges;
  }

  // Normalize orderStatus and status
  if (doc.orderStatus && !doc.status) {
    doc.status = doc.orderStatus;
  } else if (doc.status && !doc.orderStatus) {
    doc.orderStatus = doc.status;
  }

  // Calculate totalAmount if not set
  if (doc.subtotal !== undefined) {
    doc.totalAmount = doc.subtotal + (doc.deliveryCharges || 0);
  }
});

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
