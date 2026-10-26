import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "products.json");

function readLocalProducts() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = fs.readFileSync(DATA_FILE_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading local products.json:", err);
  }
  return [];
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  let product = null;

  // 1. Try DB
  try {
    await connectToDatabase();
    if (decodedId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(decodedId);
    }
    if (!product) {
      product = await Product.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${decodedId}$`, "i") } },
          { _id: decodedId.match(/^[0-9a-fA-F]{24}$/) ? decodedId : null },
        ],
      });
    }
  } catch (err) {
    console.warn("DB lookup error, checking local store:", err);
  }

  // 2. Fallback to local products.json
  if (!product) {
    const local = readLocalProducts();
    const found = local.find(
      (p: { id?: string; _id?: string; name: string }) =>
        p.id === decodedId ||
        p._id === decodedId ||
        p.name.toLowerCase() === decodedId.toLowerCase() ||
        p.name.toLowerCase().replace(/\s+/g, "-") === decodedId.toLowerCase()
    );
    if (found) {
      product = found;
    }
  }

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const result = {
    id: product._id?.toString() || product.id || product.name,
    _id: product._id?.toString() || product.id,
    name: product.name,
    urduName: product.urduName,
    category: product.category,
    price: product.price,
    packSize: product.packSize,
    description: product.description,
    image: product.image,
    inStock: product.inStock,
    featured: product.featured,
    availableSizes: product.availableSizes || [],
    availableHeights: product.availableHeights || [],
    availableWidths: product.availableWidths || [],
  };

  return NextResponse.json({ product: result });
}
