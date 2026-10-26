import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAdminSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAdminSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "master";

    let fileName = "Al_Moman_Master_Database.xlsx";
    if (type === "customers") fileName = "Al_Moman_Customers.xlsx";
    if (type === "orders") fileName = "Al_Moman_Orders.xlsx";

    const primaryPath = path.join("D:\\Al Moman Customer Data", fileName);
    const mirrorPath = path.join(process.cwd(), "Customer_Data", fileName);

    let filePath = primaryPath;
    if (!fs.existsSync(filePath)) {
      filePath = mirrorPath;
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Excel file ${fileName} not generated yet. Please run sync first.` },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Excel download error:", error);
    const message = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
