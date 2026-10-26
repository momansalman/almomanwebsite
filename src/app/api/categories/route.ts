import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";

export const dynamic = "force-dynamic";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "categories.json");

const DEFAULT_CATEGORIES = [
  "Samosas",
  "Kebabs",
  "Rolls",
  "Pattis & Wrappers",
  "Patties",
  "Nuggets & Bites",
  "Parathas",
  "Other Frozen Delights",
];

function readLocalCategories(): string[] {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading categories.json:", err);
  }
  return DEFAULT_CATEGORIES;
}

function writeLocalCategories(categories: string[]) {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(categories, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing categories.json:", err);
  }
}

// GET: List all categories
export async function GET() {
  try {
    let dbCategories: string[] | null = null;

    try {
      await connectToDatabase();
      const records = await Category.find({}).sort({ name: 1 });
      if (records && records.length > 0) {
        dbCategories = records.map((r) => r.name);
      }
    } catch {
      // MongoDB offline fallback
    }

    const categories = dbCategories && dbCategories.length > 0 ? dbCategories : readLocalCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    return NextResponse.json({ categories: readLocalCategories() });
  }
}

// POST: Add a new category
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const current = readLocalCategories();
    const exists = current.some((c) => c.toLowerCase() === name.toLowerCase());
    if (exists) {
      return NextResponse.json(
        { error: `Category "${name}" already exists` },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
      await Category.create({ name });
    } catch (err) {
      console.warn("MongoDB offline, saving category locally:", err);
    }

    const updated = [...current, name];
    writeLocalCategories(updated);

    return NextResponse.json({
      message: `Category "${name}" added successfully!`,
      categories: updated,
      newCategory: name,
    });
  } catch (err: unknown) {
    console.error("Failed to add category:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add category" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a category
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let name = searchParams.get("name") || "";

    if (!name) {
      try {
        const body = await req.json();
        name = body.name || "";
      } catch {}
    }

    name = name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Category name to delete is required" },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
      await Category.deleteOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    } catch (err) {
      console.warn("MongoDB offline, deleting category locally:", err);
    }

    const current = readLocalCategories();
    const updated = current.filter((c) => c.toLowerCase() !== name.toLowerCase());
    writeLocalCategories(updated);

    return NextResponse.json({
      message: `Category "${name}" deleted successfully!`,
      categories: updated,
    });
  } catch (err: unknown) {
    console.error("Failed to delete category:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete category" },
      { status: 500 }
    );
  }
}
