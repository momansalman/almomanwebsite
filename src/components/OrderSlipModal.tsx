"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  MessageCircle,
  Plus,
  Trash2,
  Check,
  Save,
  Receipt,
} from "lucide-react";

export interface SlipOrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  packSize: string;
  selectedSize?: string;
}

export interface SlipOrderData {
  id?: string;
  orderNumber?: string;
  customerName: string;
  phone: string;
  email?: string;
  shippingAddress: string;
  fulfillmentType: "Home Delivery" | "Self-Pickup";
  customerLocationLink?: string;
  items: SlipOrderItem[];
  deliveryFee: number;
  paymentMethod?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
}

interface ProductCatalogItem {
  id?: string;
  name: string;
  price: number;
  packSize: string;
  availableSizes?: string[];
  availableHeights?: string[];
  availableWidths?: string[];
}

interface OrderSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: SlipOrderData | null;
  productCatalog?: ProductCatalogItem[];
  onOrderSaved?: () => void;
}

export default function OrderSlipModal({
  isOpen,
  onClose,
  initialOrder,
  productCatalog = [],
  onOrderSaved,
}: OrderSlipModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"Home Delivery" | "Self-Pickup">("Home Delivery");
  const [customerLocationLink, setCustomerLocationLink] = useState("");
  const [items, setItems] = useState<SlipOrderItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(150);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery (COD)");
  const [notes, setNotes] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New item draft inputs
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState<string>("750");
  const [customItemPackSize, setCustomItemPackSize] = useState("12 Pieces / Pack");
  const [customItemSize, setCustomItemSize] = useState("");
  const [customItemQty, setCustomItemQty] = useState(1);

  useEffect(() => {
    if (initialOrder) {
      setCustomerName(initialOrder.customerName || "");
      setPhone(initialOrder.phone || "");
      setEmail(initialOrder.email || "");
      setShippingAddress(initialOrder.shippingAddress || "Model Town, Gujranwala");
      setFulfillmentType(initialOrder.fulfillmentType || "Home Delivery");
      setCustomerLocationLink(initialOrder.customerLocationLink || "");
      setItems(
        initialOrder.items && initialOrder.items.length > 0
          ? initialOrder.items
          : [
              {
                name: "Chicken Samosa",
                quantity: 2,
                price: 750,
                packSize: "12 Pieces / Pack",
                selectedSize: "Regular",
              },
            ]
      );
      setDeliveryFee(initialOrder.deliveryFee !== undefined ? initialOrder.deliveryFee : 150);
      setPaymentMethod(initialOrder.paymentMethod || "Cash on Delivery (COD)");
      setNotes(initialOrder.notes || "");
      setOrderNumber(
        initialOrder.orderNumber ||
          initialOrder.id ||
          `INV-${Math.floor(100000 + Math.random() * 900000)}`
      );
    } else {
      // Default blank bill template
      setCustomerName("");
      setPhone("");
      setEmail("");
      setShippingAddress("Model Town, Gujranwala");
      setFulfillmentType("Home Delivery");
      setCustomerLocationLink("");
      setItems([
        {
          name: "Chicken Samosa",
          quantity: 2,
          price: 750,
          packSize: "12 Pieces / Pack",
          selectedSize: "Regular",
        },
      ]);
      setDeliveryFee(150);
      setPaymentMethod("Cash on Delivery (COD)");
      setNotes("");
      setOrderNumber(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
    }
    setSavedSuccess(false);
  }, [initialOrder, isOpen]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const effectiveDeliveryFee = fulfillmentType === "Self-Pickup" ? 0 : Number(deliveryFee) || 0;
  const grandTotal = subtotal + effectiveDeliveryFee;

  // Add Item
  const handleAddItem = () => {
    let itemName = customItemName.trim();
    let itemPrice = Number(customItemPrice) || 0;
    let itemPack = customItemPackSize;

    if (selectedCatalogId) {
      const found = productCatalog.find((p) => p.id === selectedCatalogId);
      if (found) {
        itemName = found.name;
        itemPrice = found.price;
        itemPack = found.packSize;
      }
    }

    if (!itemName) {
      alert("Please specify product name or pick from catalog");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        name: itemName,
        quantity: Math.max(1, Number(customItemQty) || 1),
        price: itemPrice,
        packSize: itemPack,
        selectedSize: customItemSize.trim() || undefined,
      },
    ]);

    // Reset draft
    setSelectedCatalogId("");
    setCustomItemName("");
    setCustomItemSize("");
    setCustomItemQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity: newQty } : item))
    );
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, price: newPrice } : item))
    );
  };

  // 1-Click WhatsApp Format
  const handleSendWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, "");
    let targetPhone = cleanPhone;
    if (targetPhone.startsWith("0")) {
      targetPhone = "92" + targetPhone.slice(1);
    } else if (!targetPhone.startsWith("92") && targetPhone.length === 10) {
      targetPhone = "92" + targetPhone;
    }
    if (!targetPhone) {
      targetPhone = "923371691006";
    }

    const itemsText = items
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.name}* ${it.selectedSize ? `[Size: ${it.selectedSize}] ` : ""}(${it.packSize})\n   Qty: ${it.quantity} x Rs. ${it.price.toLocaleString()} = *Rs. ${(it.quantity * it.price).toLocaleString()}*`
      )
      .join("\n");

    const message = `🍗 *AL MOMAN FROZEN FOODS* 🍗
*OFFICIAL PAYMENT BILL & ORDER SLIP*
━━━━━━━━━━━━━━━━━━━━━
🧾 *Invoice #:* #${orderNumber}
📅 *Date:* ${new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
👤 *Customer:* ${customerName || "Valued Customer"}
📞 *Phone:* ${phone || "0337-1691006"}
${
  fulfillmentType === "Home Delivery"
    ? `🏠 *Delivery Address:* ${shippingAddress || "Model Town, Gujranwala"}${
        customerLocationLink ? `\n📍 *GPS Pin:* ${customerLocationLink}` : ""
      }`
    : `🏬 *Fulfillment:* Self-Pickup (556/A Model Town, Gujranwala)`
}
━━━━━━━━━━━━━━━━━━━━━
📦 *ORDER ITEMS:*
${itemsText}
━━━━━━━━━━━━━━━━━━━━━
💵 *Subtotal:* Rs. ${subtotal.toLocaleString()}
🚚 *Delivery Charges:* ${effectiveDeliveryFee === 0 ? "FREE" : `Rs. ${effectiveDeliveryFee.toLocaleString()}`}
💰 *GRAND TOTAL (Net Payable):* *Rs. ${grandTotal.toLocaleString()}*
💳 *Payment Mode:* ${paymentMethod}
${notes ? `📝 *Note:* ${notes}\n` : ""}━━━━━━━━━━━━━━━━━━━━━
📍 *Store Warehouse:* 556/A Model Town, Gujranwala
📞 *Helpline & WhatsApp:* 0337-1691006
_100% Halal Guaranteed • Blast Frozen Freshness_
_Thank you for choosing Al Moman Frozen Foods!_`;

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Save to DB & Excel
  const handleSaveOrder = async () => {
    if (!customerName.trim() || !phone.trim()) {
      alert("Please provide customer name and phone number");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least 1 item to the bill");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        orderId: orderNumber,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || "N/A",
        shippingAddress:
          fulfillmentType === "Self-Pickup"
            ? "Self-Pickup (556/A Model Town, Gujranwala)"
            : shippingAddress.trim() || "Model Town, Gujranwala",
        fulfillmentType,
        customerLocationLink: customerLocationLink.trim(),
        items,
        deliveryFee: effectiveDeliveryFee,
        totalAmount: grandTotal,
        paymentMethod,
        notes: notes.trim(),
      };

      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save order bill");

      setSavedSuccess(true);
      if (onOrderSaved) onOrderSaved();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving bill");
    } finally {
      setSaving(false);
    }
  };

  // Print Slip
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Container: Print-friendly styles enabled */}
      <div className="max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Order Slip &amp; Bill Generator
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-bold px-2 py-0.5 rounded-full">
                  Official Format
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Itemized customer invoice with custom delivery charges and 1-click WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-black rounded-xl transition shadow-lg shadow-emerald-950 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Bill Content */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6 flex-1 text-zinc-200">
          {/* THE OFFICIAL ORDER SLIP CARD (PRINTABLE) */}
          <div
            id="printable-order-slip"
            className="bg-white text-zinc-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-zinc-200 print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* Header: Brand Logo & Company Credentials */}
            <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b-2 border-zinc-900 gap-4 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full overflow-hidden bg-black border-2 border-amber-500 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand-logo.png"
                    alt="Al Moman Frozen Foods Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950">
                    AL MOMAN FROZEN FOODS
                  </h1>
                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    Pure Taste • 100% Halal Guaranteed • Blast Frozen
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    📍 556/A Model Town, Gujranwala | 📞 Helpline: 0337-1691006
                  </p>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="text-center sm:text-right bg-zinc-100 p-3 rounded-xl border border-zinc-300">
                <div className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">
                  Payment Bill &amp; Order Slip
                </div>
                <div className="text-base font-black font-mono text-emerald-800">
                  #{orderNumber}
                </div>
                <div className="text-[11px] text-zinc-600 font-medium">
                  {new Date().toLocaleDateString("en-PK", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>

            {/* Customer & Fulfillment Details (Editable in screen mode) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-xs border-b border-zinc-200">
              <div className="space-y-1.5">
                <div className="font-extrabold uppercase text-[10px] text-zinc-500 tracking-wider">
                  Customer Information
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-700 w-16">Name:</span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Full Name"
                    className="flex-1 px-2.5 py-1 bg-zinc-50 border border-zinc-300 rounded font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-700 w-16">Contact:</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0337-1691006"
                    className="flex-1 px-2.5 py-1 bg-zinc-50 border border-zinc-300 rounded font-mono font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-extrabold uppercase text-[10px] text-zinc-500 tracking-wider">
                  Delivery &amp; Fulfillment
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-700 w-16">Type:</span>
                  <select
                    value={fulfillmentType}
                    onChange={(e) =>
                      setFulfillmentType(e.target.value as "Home Delivery" | "Self-Pickup")
                    }
                    className="flex-1 px-2.5 py-1 bg-zinc-50 border border-zinc-300 rounded font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Home Delivery">Home Delivery (Gujranwala Nearby)</option>
                    <option value="Self-Pickup">Self-Pickup (556/A Model Town)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-700 w-16">Address:</span>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Delivery Address"
                    disabled={fulfillmentType === "Self-Pickup"}
                    className="flex-1 px-2.5 py-1 bg-zinc-50 border border-zinc-300 rounded text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600 disabled:bg-zinc-200"
                  />
                </div>
                {customerLocationLink && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-zinc-700 w-16">GPS Pin:</span>
                    <a
                      href={customerLocationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-bold underline truncate"
                    >
                      {customerLocationLink}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-4">
              <div className="font-extrabold uppercase text-[10px] text-zinc-500 tracking-wider mb-2">
                Order Items ({items.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-zinc-200 rounded-lg overflow-hidden">
                  <thead className="bg-zinc-100 text-zinc-800 uppercase font-black text-[10px] border-b border-zinc-300">
                    <tr>
                      <th className="px-3 py-2.5 w-8">#</th>
                      <th className="px-3 py-2.5">Item Description</th>
                      <th className="px-3 py-2.5">Pack / Size</th>
                      <th className="px-3 py-2.5 text-center w-20">Qty</th>
                      <th className="px-3 py-2.5 text-right w-24">Price (PKR)</th>
                      <th className="px-3 py-2.5 text-right w-28">Total (PKR)</th>
                      <th className="px-2 py-2.5 text-center w-8 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50">
                        <td className="px-3 py-2.5 font-bold text-zinc-500">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-zinc-900">
                          {item.name}
                          {item.selectedSize && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-mono font-bold">
                              Size: {item.selectedSize}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-600 text-[11px]">{item.packSize}</td>
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItemQty(idx, Math.max(1, parseInt(e.target.value) || 1))
                            }
                            className="w-14 text-center px-1 py-0.5 bg-zinc-100 border border-zinc-300 rounded font-bold text-zinc-900 print:border-none print:bg-transparent"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              handleUpdateItemPrice(idx, parseInt(e.target.value) || 0)
                            }
                            className="w-20 text-right px-1 py-0.5 bg-zinc-100 border border-zinc-300 rounded font-bold text-zinc-900 print:border-none print:bg-transparent"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right font-black text-zinc-950">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </td>
                        <td className="px-2 py-2.5 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-zinc-400 hover:text-rose-600 p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Add Item Bar (Visible in Screen, Hidden in Print) */}
            <div className="p-3.5 bg-zinc-100 border border-zinc-200 rounded-xl space-y-2.5 print:hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-zinc-700 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" /> + Add Item to Bill (4-5+ Items)
                </span>
                <span className="text-[10px] text-zinc-500">Pick from menu or enter custom item</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                {/* Catalog select */}
                <div className="sm:col-span-4">
                  <select
                    value={selectedCatalogId}
                    onChange={(e) => {
                      setSelectedCatalogId(e.target.value);
                      const found = productCatalog.find((p) => p.id === e.target.value);
                      if (found) {
                        setCustomItemName(found.name);
                        setCustomItemPrice(found.price.toString());
                        setCustomItemPackSize(found.packSize);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-900 font-medium"
                  >
                    <option value="">-- Choose from Menu Catalog --</option>
                    {productCatalog.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Rs. {p.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Item Name (if not catalog) */}
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="Or Custom Item Name"
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400"
                  />
                </div>

                {/* Size */}
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={customItemSize}
                    onChange={(e) => setCustomItemSize(e.target.value)}
                    placeholder="Size / Dimensions"
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400"
                  />
                </div>

                {/* Unit Price */}
                <div className="sm:col-span-1">
                  <input
                    type="number"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    placeholder="Price"
                    className="w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-900 font-bold"
                  />
                </div>

                {/* Qty */}
                <div className="sm:col-span-1">
                  <input
                    type="number"
                    min="1"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-900 font-bold text-center"
                  />
                </div>

                {/* Add button */}
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full h-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Billing Calculation & Custom Delivery Fee Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-300">
              {/* Delivery Fee Adjustment Controls */}
              <div className="space-y-3 print:hidden">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-amber-900">
                    🚚 Set Custom Delivery Charges (Store Owner Control):
                  </label>
                  <p className="text-[11px] text-amber-800">
                    Set delivery charges according to distance or promotions.
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {[0, 100, 150, 200, 250, 300].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setDeliveryFee(fee)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                          deliveryFee === fee
                            ? "bg-amber-600 text-white border-amber-700"
                            : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
                        }`}
                      >
                        {fee === 0 ? "Free (Rs. 0)" : `Rs. ${fee}`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-zinc-700">Custom PKR:</span>
                    <input
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-28 px-2.5 py-1 bg-white border border-zinc-300 rounded-lg text-zinc-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Payment Status / Mode:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs font-semibold"
                  >
                    <option value="Cash on Delivery (COD)">Cash on Delivery (COD - Unpaid)</option>
                    <option value="Paid via Online / Bank Transfer">Paid via Online / Bank Transfer</option>
                    <option value="Paid Cash at Warehouse">Paid Cash at Warehouse</option>
                  </select>
                </div>
              </div>

              {/* Total Summary Breakdown */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs space-y-2">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal ({items.length} items):</span>
                  <span className="font-bold text-zinc-900">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Delivery Charges ({fulfillmentType}):</span>
                  <span className="font-bold text-zinc-900">
                    {effectiveDeliveryFee === 0 ? "FREE" : `Rs. ${effectiveDeliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Payment Method:</span>
                  <span className="font-bold text-emerald-800">{paymentMethod}</span>
                </div>
                <div className="pt-2 border-t-2 border-zinc-900 flex justify-between items-baseline">
                  <span className="text-sm font-black text-zinc-950 uppercase">Grand Total (Net Payable):</span>
                  <span className="text-xl font-black text-emerald-700">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>

                <div className="pt-3 text-[10px] text-zinc-500 italic text-center">
                  *Official Computerized Invoice. Fresh frozen food is blast frozen to lock freshness.
                </div>
              </div>
            </div>

            {/* Official Signature & Verification Seal for Print */}
            <div className="hidden print:flex justify-between items-end pt-12 text-xs text-zinc-700">
              <div className="text-left">
                <div className="font-bold">Customer Confirmation:</div>
                <div className="w-40 border-b border-zinc-400 mt-8"></div>
              </div>
              <div className="text-right">
                <div className="font-bold">Authorized Signatory</div>
                <div className="font-black text-zinc-900">Al Moman Frozen Foods</div>
                <div className="w-40 border-b border-zinc-400 mt-8"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs border border-zinc-700 transition cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${saving ? "animate-spin" : "text-emerald-400"}`} />
              <span>{saving ? "Saving to Database & Excel..." : "Save to Database & Excel"}</span>
            </button>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Saved!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Invoice</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs shadow-xl shadow-emerald-950 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>1-Click Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
