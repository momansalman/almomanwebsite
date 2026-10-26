import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { findOrderByIdOrNumber } from "@/lib/orderStore";
import { generateInvoice } from "@/lib/generateInvoice";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const download = req.nextUrl.searchParams.get("download") === "true";

    const order = await findOrderByIdOrNumber(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderNumber = order.orderNumber;
    const pdfPath = path.join(process.cwd(), "public", "invoices", `Invoice_${orderNumber}.pdf`);

    let pdfBuffer: Buffer;

    if (fs.existsSync(pdfPath)) {
      pdfBuffer = fs.readFileSync(pdfPath);
    } else {
      // Generate on-the-fly if file was cleared
      await generateInvoice({
        orderNumber,
        orderId: (order._id || order.id).toString(),
        customerName: order.customerName || order.userName || "Valued Customer",
        customerPhone: order.customerPhone || order.phone || "",
        fulfillmentType: order.fulfillmentType || "delivery",
        deliveryAddress: order.deliveryAddress || order.shippingAddress,
        items: order.items || [],
        subtotal: order.subtotal || 0,
        deliveryCharges: order.deliveryCharges || 0,
        totalAmount: order.totalAmount || order.subtotal || 0,
        createdAt: order.createdAt || new Date(),
      });

      if (fs.existsSync(pdfPath)) {
        pdfBuffer = fs.readFileSync(pdfPath);
      } else {
        return NextResponse.json({ error: "Invoice could not be generated." }, { status: 500 });
      }
    }

    const disposition = download
      ? `attachment; filename="AL-MOMAN-Invoice-${orderNumber}.pdf"`
      : `inline; filename="AL-MOMAN-Invoice-${orderNumber}.pdf"`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("Invoice streaming error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to stream invoice PDF" },
      { status: 500 }
    );
  }
}
