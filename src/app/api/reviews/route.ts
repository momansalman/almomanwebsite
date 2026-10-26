import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Review from "@/models/Review";
import { getSessionUser } from "@/lib/auth";
import { readRecords } from "@/lib/excelSync";
import fs from "fs";
import path from "path";

interface ReviewJsonRecord {
  id: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  productName?: string;
  verifiedCustomer: boolean;
  status: "approved" | "pending";
  createdAt: string;
}

const LOCAL_REVIEWS_FILE = "reviews_database.json";

function getReviewsFromLocal(): ReviewJsonRecord[] {
  try {
    const list = readRecords<ReviewJsonRecord>(LOCAL_REVIEWS_FILE);
    if (list && list.length > 0) return list;
  } catch {}

  // Fallback direct file read
  try {
    const fallbackPath = path.join(process.cwd(), "Customer_Data", LOCAL_REVIEWS_FILE);
    if (fs.existsSync(fallbackPath)) {
      const data = fs.readFileSync(fallbackPath, "utf-8");
      return JSON.parse(data);
    }
  } catch {}
  return [];
}

function saveReviewsToLocal(reviews: ReviewJsonRecord[]) {
  const dirs = [
    path.join("D:", "Al Moman Customer Data"),
    path.join(process.cwd(), "Customer_Data"),
  ];

  const jsonStr = JSON.stringify(reviews, null, 2);
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, LOCAL_REVIEWS_FILE), jsonStr, "utf-8");
    } catch (e) {
      console.warn("Could not write reviews to", dir, e);
    }
  }
}

export async function GET() {
  try {
    try {
      await connectToDatabase();
      const reviews = await Review.find({ status: "approved" })
        .sort({ createdAt: -1 })
        .lean();
      if (reviews && reviews.length > 0) {
        return NextResponse.json({
          reviews: reviews.map((r) => ({
            id: r._id.toString(),
            userName: r.userName,
            rating: r.rating,
            comment: r.comment,
            productName: r.productName,
            verifiedCustomer: r.verifiedCustomer,
            createdAt: r.createdAt,
          })),
        });
      }
    } catch (dbErr) {
      console.warn("MongoDB offline, falling back to local reviews:", dbErr);
    }

    const localList = getReviewsFromLocal().filter((r) => r.status === "approved");
    return NextResponse.json({ reviews: localList });
  } catch (err: unknown) {
    console.error("Reviews GET error:", err);
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const { userName, rating, comment, productName } = await req.json();

    const authorName = (userName || session?.name || "").toString().trim();
    const numericRating = Math.min(5, Math.max(1, Number(rating) || 5));
    const cleanComment = (comment || "").toString().trim();

    if (!authorName) {
      return NextResponse.json({ error: "Please provide your name" }, { status: 400 });
    }

    if (!cleanComment) {
      return NextResponse.json({ error: "Please write your review feedback" }, { status: 400 });
    }

    const reviewId = `REV-${Date.now()}`;
    const newRecord: ReviewJsonRecord = {
      id: reviewId,
      userName: authorName,
      userEmail: session?.email || "N/A",
      rating: numericRating,
      comment: cleanComment,
      productName: (productName || "Overall Experience").toString().trim(),
      verifiedCustomer: true,
      status: "approved",
      createdAt: new Date().toISOString(),
    };

    // Save to Mongo if available
    try {
      await connectToDatabase();
      await Review.create({
        user: session?.userId,
        userName: authorName,
        userEmail: session?.email,
        rating: numericRating,
        comment: cleanComment,
        productName: newRecord.productName,
        verifiedCustomer: true,
        status: "approved",
      });
    } catch (dbErr) {
      console.warn("MongoDB review create warning:", dbErr);
    }

    // Always save to JSON database
    const localList = getReviewsFromLocal();
    localList.unshift(newRecord);
    saveReviewsToLocal(localList);

    return NextResponse.json(
      { message: "Thank you! Your review has been posted successfully.", review: newRecord },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Reviews POST error:", error);
    const msg = error instanceof Error ? error.message : "Failed to post review";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
