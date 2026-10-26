import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "products.json");

interface ProductData {
  id?: string;
  _id?: string;
  name: string;
  urduName?: string;
  category: string;
  price: number;
  packSize: string;
  description?: string;
  image?: string;
  inStock?: boolean;
  featured?: boolean;
  availableSizes?: string[];
  availableHeights?: string[];
  availableWidths?: string[];
  availablePackSizes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

function readLocalProducts(): ProductData[] {
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

function writeLocalProducts(products: ProductData[]) {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(products, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing local products.json:", err);
  }
}

// GET all products
export async function GET() {
  let dbProducts: ProductData[] | null = null;

  try {
    await connectToDatabase();
    const count = await Product.countDocuments();
    if (count === 0) {
      const local = readLocalProducts();
      if (local.length > 0) {
        // Seed mongo from local
        await Product.insertMany(
          local.map((p) => ({
            name: p.name,
            urduName: p.urduName || "",
            category: p.category,
            price: p.price,
            packSize: p.packSize,
            description: p.description || "",
            image: p.image || "",
            inStock: p.inStock ?? true,
            featured: p.featured ?? false,
            availablePackSizes: p.availablePackSizes || [],
          }))
        );
      }
    }
    const found = await Product.find().sort({ featured: -1, createdAt: -1 });
    if (found && found.length > 0) {
      dbProducts = found.map((p) => ({
        id: p._id.toString(),
        _id: p._id.toString(),
        name: p.name,
        urduName: p.urduName,
        category: p.category,
        price: p.price,
        packSize: p.packSize,
        description: p.description,
        image: p.image,
        inStock: p.inStock,
        featured: p.featured,
        availableSizes: p.availableSizes || [],
        availableHeights: p.availableHeights || [],
        availableWidths: p.availableWidths || [],
        availablePackSizes: (p as any).availablePackSizes || [],
      }));
    }
  } catch (error) {
    console.warn("MongoDB offline, using local products store:", error instanceof Error ? error.message : error);
  }

  const products = dbProducts && dbProducts.length > 0 ? dbProducts : readLocalProducts();
  return NextResponse.json({ products });
}

// POST: Add new product
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      urduName = "",
      category = "Samosas",
      price,
      packSize = "12 Pieces / Pack",
      description = "",
      image = "/products/chicken-samosa.jpg",
      inStock = true,
      featured = false,
      availableSizes = [],
      availableHeights = [],
      availableWidths = [],
      availablePackSizes = [],
    } = body;

    if (!name || price === undefined || !category) {
      return NextResponse.json(
        { error: "Product Name, Category, and Price are required" },
        { status: 400 }
      );
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json(
        { error: "Please enter a valid price" },
        { status: 400 }
      );
    }

    let createdId = `prod_${Date.now()}`;
    let dbItem = null;

    try {
      await connectToDatabase();
      dbItem = await Product.create({
        name: name.trim(),
        urduName: urduName.trim(),
        category: category.trim(),
        price: numPrice,
        packSize: packSize.trim(),
        description: description.trim(),
        image: image.trim(),
        inStock: Boolean(inStock),
        featured: Boolean(featured),
        availableSizes: Array.isArray(availableSizes) ? availableSizes : [],
        availableHeights: Array.isArray(availableHeights) ? availableHeights : [],
        availableWidths: Array.isArray(availableWidths) ? availableWidths : [],
        availablePackSizes: Array.isArray(availablePackSizes) ? availablePackSizes : [],
      });
      if (dbItem) {
        createdId = dbItem._id.toString();
      }
    } catch (err) {
      console.warn("MongoDB offline during product creation, persisting locally:", err);
    }

    const newProduct: ProductData = {
      id: createdId,
      _id: createdId,
      name: name.trim(),
      urduName: urduName.trim(),
      category: category.trim(),
      price: numPrice,
      packSize: packSize.trim(),
      description: description.trim(),
      image: image.trim(),
      inStock: Boolean(inStock),
      featured: Boolean(featured),
      availableSizes: Array.isArray(availableSizes) ? availableSizes : [],
      availableHeights: Array.isArray(availableHeights) ? availableHeights : [],
      availableWidths: Array.isArray(availableWidths) ? availableWidths : [],
      availablePackSizes: Array.isArray(availablePackSizes) ? availablePackSizes : [],
      createdAt: new Date().toISOString(),
    };

    // Update local JSON store
    const local = readLocalProducts();
    local.unshift(newProduct);
    writeLocalProducts(local);

    return NextResponse.json({
      message: "New product added successfully!",
      product: newProduct,
    });
  } catch (error: unknown) {
    console.error("Error creating product:", error);
    const message = error instanceof Error ? error.message : "Failed to add product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: Edit existing product / change price / details
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const targetId = body.id || body._id;

    if (!targetId) {
      return NextResponse.json(
        { error: "Product ID is required to edit" },
        { status: 400 }
      );
    }

    const numPrice = body.price !== undefined ? Number(body.price) : undefined;
    if (numPrice !== undefined && (isNaN(numPrice) || numPrice < 0)) {
      return NextResponse.json(
        { error: "Please enter a valid price" },
        { status: 400 }
      );
    }

    // Try updating in DB
    try {
      await connectToDatabase();
      const updatePayload: Partial<ProductData> = {};
      if (body.name !== undefined) updatePayload.name = body.name.trim();
      if (body.urduName !== undefined) updatePayload.urduName = body.urduName.trim();
      if (body.category !== undefined) updatePayload.category = body.category.trim();
      if (numPrice !== undefined) updatePayload.price = numPrice;
      if (body.packSize !== undefined) updatePayload.packSize = body.packSize.trim();
      if (body.description !== undefined) updatePayload.description = body.description.trim();
      if (body.image !== undefined) updatePayload.image = body.image.trim();
      if (body.inStock !== undefined) updatePayload.inStock = Boolean(body.inStock);
      if (body.featured !== undefined) updatePayload.featured = Boolean(body.featured);
      if (body.availableSizes !== undefined) updatePayload.availableSizes = Array.isArray(body.availableSizes) ? body.availableSizes : [];
      if (body.availableHeights !== undefined) updatePayload.availableHeights = Array.isArray(body.availableHeights) ? body.availableHeights : [];
      if (body.availableWidths !== undefined) updatePayload.availableWidths = Array.isArray(body.availableWidths) ? body.availableWidths : [];
      if (body.availablePackSizes !== undefined) updatePayload.availablePackSizes = Array.isArray(body.availablePackSizes) ? body.availablePackSizes : [];

      await Product.findByIdAndUpdate(targetId, updatePayload, { new: true });
    } catch (err) {
      console.warn("MongoDB update skipped/offline:", err);
    }

    // Update in local file store
    const local = readLocalProducts();
    let updatedItem: ProductData | null = null;

    const updatedList = local.map((item) => {
      if (item.id === targetId || item._id === targetId || item.name === body.oldName) {
        updatedItem = {
          ...item,
          name: body.name !== undefined ? body.name.trim() : item.name,
          urduName: body.urduName !== undefined ? body.urduName.trim() : item.urduName,
          category: body.category !== undefined ? body.category.trim() : item.category,
          price: numPrice !== undefined ? numPrice : item.price,
          packSize: body.packSize !== undefined ? body.packSize.trim() : item.packSize,
          description: body.description !== undefined ? body.description.trim() : item.description,
          image: body.image !== undefined ? body.image.trim() : item.image,
          inStock: body.inStock !== undefined ? Boolean(body.inStock) : item.inStock,
          featured: body.featured !== undefined ? Boolean(body.featured) : item.featured,
          availableSizes: body.availableSizes !== undefined ? (Array.isArray(body.availableSizes) ? body.availableSizes : []) : item.availableSizes,
          availableHeights: body.availableHeights !== undefined ? (Array.isArray(body.availableHeights) ? body.availableHeights : []) : item.availableHeights,
          availableWidths: body.availableWidths !== undefined ? (Array.isArray(body.availableWidths) ? body.availableWidths : []) : item.availableWidths,
          availablePackSizes: body.availablePackSizes !== undefined ? (Array.isArray(body.availablePackSizes) ? body.availablePackSizes : []) : item.availablePackSizes || [],
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return item;
    });

    writeLocalProducts(updatedList);

    return NextResponse.json({
      message: "Product updated successfully!",
      product: updatedItem || body,
    });
  } catch (error: unknown) {
    console.error("Error updating product:", error);
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Cut / remove product from menu
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let targetId = searchParams.get("id");

    if (!targetId) {
      try {
        const body = await req.json();
        targetId = body.id || body._id;
      } catch {
        // No body provided
      }
    }

    if (!targetId) {
      return NextResponse.json(
        { error: "Product ID is required to delete" },
        { status: 400 }
      );
    }

    // Try deleting from MongoDB
    try {
      await connectToDatabase();
      await Product.findByIdAndDelete(targetId);
    } catch (err) {
      console.warn("MongoDB delete skipped/offline:", err);
    }

    // Delete from local file store
    const local = readLocalProducts();
    const filtered = local.filter((item) => item.id !== targetId && item._id !== targetId);
    writeLocalProducts(filtered);

    return NextResponse.json({
      message: "Product removed from menu successfully!",
      id: targetId,
    });
  } catch (error: unknown) {
    console.error("Error deleting product:", error);
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
