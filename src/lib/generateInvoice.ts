import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface InvoiceItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
  packSize?: string;
}

export interface InvoiceData {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: "pickup" | "delivery" | "Self-Pickup" | "Home Delivery";
  deliveryAddress?: string | null;
  items: InvoiceItem[];
  subtotal: number;
  deliveryCharges?: number;
  totalAmount: number;
  createdAt?: Date | string;
}

/**
 * Generates an official "AL-MOMAN Special Frozen Chicken Food" sales invoice PDF using pdf-lib.
 * Saves the file to `public/invoices/` and returns the public URL.
 */
export async function generateInvoice(data: InvoiceData): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size: 595 x 842 pt
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette: Emerald & Gold
  const colorDarkGreen = rgb(0.04, 0.31, 0.23); // #0a4f3b
  const colorGold = rgb(0.85, 0.65, 0.13); // #d9a721
  const colorCharcoal = rgb(0.12, 0.12, 0.14); // #1f1f24
  const colorMuted = rgb(0.42, 0.44, 0.48); // #6b707b
  const colorLightBg = rgb(0.96, 0.97, 0.98); // #f5f7fa
  const colorBorder = rgb(0.85, 0.87, 0.9);

  let y = height - 40;

  // 1. Top Decorative Brand Bar
  page.drawRectangle({
    x: 0,
    y: height - 12,
    width: width,
    height: 12,
    color: colorDarkGreen,
  });
  page.drawRectangle({
    x: 0,
    y: height - 16,
    width: width,
    height: 4,
    color: colorGold,
  });

  // 2. Company Header
  y = height - 55;
  page.drawText("AL-MOMAN Special Frozen Chicken Food", {
    x: 40,
    y,
    size: 18,
    font: fontBold,
    color: colorDarkGreen,
  });

  y -= 15;
  page.drawText("Premium Quality Frozen Poultry & Cuts • 100% Halal Guaranteed", {
    x: 40,
    y,
    size: 9.5,
    font: fontOblique,
    color: colorGold,
  });

  y -= 13;
  page.drawText("Main Factory & Outlet: 556/A Model Town, Gujranwala | WhatsApp Helpline: 0337-1691006", {
    x: 40,
    y,
    size: 8,
    font: fontRegular,
    color: colorMuted,
  });

  // Top Right: Invoice Badge
  page.drawRectangle({
    x: width - 180,
    y: height - 90,
    width: 140,
    height: 48,
    color: colorLightBg,
    borderColor: colorBorder,
    borderWidth: 1,
  });
  page.drawText("OFFICIAL INVOICE", {
    x: width - 170,
    y: height - 58,
    size: 10,
    font: fontBold,
    color: colorDarkGreen,
  });
  page.drawText(`Invoice #: ${data.orderNumber}`, {
    x: width - 170,
    y: height - 72,
    size: 8,
    font: fontRegular,
    color: colorCharcoal,
  });
  const dateStr = data.createdAt ? new Date(data.createdAt).toLocaleString("en-PK") : new Date().toLocaleString("en-PK");
  page.drawText(`Date: ${dateStr}`, {
    x: width - 170,
    y: height - 83,
    size: 7.5,
    font: fontRegular,
    color: colorMuted,
  });

  // Divider
  y -= 20;
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 1,
    color: colorBorder,
  });

  // 3. Customer & Fulfillment Information Box
  y -= 18;
  const isDelivery = (data.fulfillmentType || "").toLowerCase().includes("delivery");
  const fulfillmentBadge = isDelivery ? "HOME DELIVERY" : "SELF PICKUP";

  page.drawRectangle({
    x: 40,
    y: y - 68,
    width: width - 80,
    height: 68,
    color: colorLightBg,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  // Customer column
  page.drawText("BILLED TO / CUSTOMER:", {
    x: 55,
    y: y - 16,
    size: 8.5,
    font: fontBold,
    color: colorDarkGreen,
  });
  page.drawText(`Name: ${data.customerName || "Valued Customer"}`, {
    x: 55,
    y: y - 30,
    size: 9.5,
    font: fontBold,
    color: colorCharcoal,
  });
  page.drawText(`WhatsApp / Phone: ${data.customerPhone}`, {
    x: 55,
    y: y - 44,
    size: 9,
    font: fontRegular,
    color: colorCharcoal,
  });
  page.drawText(`Order Reference ID: ${data.orderId}`, {
    x: 55,
    y: y - 58,
    size: 7.5,
    font: fontRegular,
    color: colorMuted,
  });

  // Fulfillment column
  page.drawText("FULFILLMENT MODE:", {
    x: 340,
    y: y - 16,
    size: 8.5,
    font: fontBold,
    color: colorDarkGreen,
  });
  page.drawText(fulfillmentBadge, {
    x: 340,
    y: y - 31,
    size: 11,
    font: fontBold,
    color: isDelivery ? rgb(0.1, 0.5, 0.3) : colorGold,
  });

  if (isDelivery) {
    const addressPreview = (data.deliveryAddress || "Address provided via WhatsApp").slice(0, 45);
    page.drawText(`Delivery To: ${addressPreview}`, {
      x: 340,
      y: y - 46,
      size: 8.5,
      font: fontRegular,
      color: colorCharcoal,
    });
  } else {
    page.drawText("Pickup Point: 556/A Model Town, Gujranwala", {
      x: 340,
      y: y - 46,
      size: 8.5,
      font: fontRegular,
      color: colorCharcoal,
    });
  }

  // 4. Itemized Table
  y -= 95;
  const tableX = 40;
  const tableWidth = width - 80;
  const colX = {
    sr: 50,
    item: 85,
    price: 330,
    qty: 420,
    total: 480,
  };

  // Table Header
  page.drawRectangle({
    x: tableX,
    y: y - 18,
    width: tableWidth,
    height: 22,
    color: colorDarkGreen,
  });

  page.drawText("#", { x: colX.sr, y: y - 12, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Item Name", { x: colX.item, y: y - 12, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Unit Price (PKR)", { x: colX.price, y: y - 12, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Qty", { x: colX.qty, y: y - 12, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Total (PKR)", { x: colX.total, y: y - 12, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });

  y -= 20;

  // Table Rows
  data.items.forEach((item, index) => {
    const rowY = y - (index * 24);
    const isEven = index % 2 === 0;

    if (isEven) {
      page.drawRectangle({
        x: tableX,
        y: rowY - 18,
        width: tableWidth,
        height: 22,
        color: rgb(0.98, 0.98, 0.99),
      });
    }

    page.drawLine({
      start: { x: tableX, y: rowY - 18 },
      end: { x: tableX + tableWidth, y: rowY - 18 },
      thickness: 0.5,
      color: colorBorder,
    });

    page.drawText(String(index + 1), {
      x: colX.sr,
      y: rowY - 12,
      size: 8.5,
      font: fontRegular,
      color: colorMuted,
    });

    const itemLabel = `${item.productName || "Item"}${item.packSize ? ` (${item.packSize})` : ""}`;
    page.drawText(itemLabel.slice(0, 38), {
      x: colX.item,
      y: rowY - 12,
      size: 8.5,
      font: fontBold,
      color: colorCharcoal,
    });

    page.drawText(`Rs. ${Number(item.price).toLocaleString()}`, {
      x: colX.price,
      y: rowY - 12,
      size: 8.5,
      font: fontRegular,
      color: colorCharcoal,
    });

    page.drawText(String(item.quantity), {
      x: colX.qty + 5,
      y: rowY - 12,
      size: 8.5,
      font: fontRegular,
      color: colorCharcoal,
    });

    page.drawText(`Rs. ${Number(item.total).toLocaleString()}`, {
      x: colX.total,
      y: rowY - 12,
      size: 8.5,
      font: fontBold,
      color: colorDarkGreen,
    });
  });

  y = y - (data.items.length * 24) - 15;

  // 5. Totals & Subtotal Calculation Box
  const summaryBoxWidth = 240;
  const summaryX = width - 40 - summaryBoxWidth;

  page.drawRectangle({
    x: summaryX,
    y: y - 75,
    width: summaryBoxWidth,
    height: 75,
    color: colorLightBg,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  // Subtotal row (bolded)
  page.drawText("Subtotal:", {
    x: summaryX + 15,
    y: y - 20,
    size: 10,
    font: fontBold,
    color: colorCharcoal,
  });
  page.drawText(`Rs. ${Number(data.subtotal).toLocaleString()}`, {
    x: summaryX + summaryBoxWidth - 95,
    y: y - 20,
    size: 10,
    font: fontBold,
    color: colorDarkGreen,
  });

  // Delivery Charges row
  page.drawText("Delivery Charges:", {
    x: summaryX + 15,
    y: y - 38,
    size: 9,
    font: fontRegular,
    color: colorCharcoal,
  });

  if (isDelivery) {
    if (data.deliveryCharges && data.deliveryCharges > 0) {
      page.drawText(`Rs. ${Number(data.deliveryCharges).toLocaleString()}`, {
        x: summaryX + summaryBoxWidth - 95,
        y: y - 38,
        size: 9,
        font: fontRegular,
        color: colorCharcoal,
      });
    } else {
      page.drawText("Pending / TBD via WhatsApp", {
        x: summaryX + summaryBoxWidth - 145,
        y: y - 38,
        size: 8,
        font: fontOblique,
        color: rgb(0.8, 0.4, 0.1),
      });
    }
  } else {
    page.drawText("FREE (Pickup)", {
      x: summaryX + summaryBoxWidth - 95,
      y: y - 38,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.6, 0.3),
    });
  }

  // Divider line
  page.drawLine({
    start: { x: summaryX + 10, y: y - 48 },
    end: { x: summaryX + summaryBoxWidth - 10, y: y - 48 },
    thickness: 1,
    color: colorBorder,
  });

  // Final Total Amount
  page.drawText("Total Payable:", {
    x: summaryX + 15,
    y: y - 65,
    size: 11,
    font: fontBold,
    color: colorDarkGreen,
  });
  const totalDisplay = isDelivery && (!data.deliveryCharges || data.deliveryCharges === 0)
    ? `Rs. ${Number(data.subtotal).toLocaleString()} + TBD`
    : `Rs. ${Number(data.totalAmount).toLocaleString()}`;

  page.drawText(totalDisplay, {
    x: summaryX + summaryBoxWidth - 110,
    y: y - 65,
    size: 11,
    font: fontBold,
    color: colorDarkGreen,
  });

  // 6. Conditional Fulfillment Section
  y -= 90;
  if (!isDelivery) {
    // Case A: Pickup
    page.drawRectangle({
      x: 40,
      y: y - 45,
      width: width - 80,
      height: 45,
      color: rgb(0.93, 0.98, 0.95),
      borderColor: rgb(0.1, 0.6, 0.3),
      borderWidth: 1,
    });
    page.drawText("SELF-PICKUP INSTRUCTIONS:", {
      x: 55,
      y: y - 18,
      size: 9,
      font: fontBold,
      color: colorDarkGreen,
    });
    page.drawText("Pickup Address: 556/A Model Town, Gujranwala. Please bring this invoice or order number for pickup.", {
      x: 55,
      y: y - 34,
      size: 8.5,
      font: fontRegular,
      color: colorCharcoal,
    });
  } else {
    // Case B: Delivery
    page.drawRectangle({
      x: 40,
      y: y - 48,
      width: width - 80,
      height: 48,
      color: rgb(1, 0.98, 0.93),
      borderColor: colorGold,
      borderWidth: 1,
    });
    page.drawText("HOME DELIVERY POLICY:", {
      x: 55,
      y: y - 18,
      size: 9,
      font: fontBold,
      color: rgb(0.7, 0.4, 0.05),
    });
    page.drawText("Note: Delivery charges will be calculated and communicated via WhatsApp chat.", {
      x: 55,
      y: y - 34,
      size: 8.5,
      font: fontBold,
      color: colorCharcoal,
    });
  }

  // 7. Footer & Security Watermark
  const footerY = 35;
  page.drawLine({
    start: { x: 40, y: footerY + 20 },
    end: { x: width - 40, y: footerY + 20 },
    thickness: 0.5,
    color: colorBorder,
  });

  page.drawText("AL-MOMAN Special Frozen Chicken Food — 100% Halal Certified Hand-Slaughtered Meat", {
    x: 40,
    y: footerY + 8,
    size: 7.5,
    font: fontBold,
    color: colorDarkGreen,
  });
  page.drawText("This is an electronically generated sales voucher valid without physical signature.", {
    x: 40,
    y: footerY - 2,
    size: 7,
    font: fontRegular,
    color: colorMuted,
  });
  page.drawText(`Confirmation Token: ${data.orderId.slice(-8)}`, {
    x: width - 180,
    y: footerY + 5,
    size: 7.5,
    font: fontRegular,
    color: colorMuted,
  });

  // Save PDF locally to public/invoices/
  const pdfBytes = await pdfDoc.save();
  const invoicesDir = path.join(process.cwd(), "public", "invoices");
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }

  const safeFileName = `Invoice_${data.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  const filePath = path.join(invoicesDir, safeFileName);
  fs.writeFileSync(filePath, Buffer.from(pdfBytes));

  return `/invoices/${safeFileName}`;
}
