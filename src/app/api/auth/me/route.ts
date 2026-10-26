import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Fast-path for verified admin session: Zero latency!
    if (session.role === "admin") {
      return NextResponse.json({
        user: {
          id: session.userId || "admin_system_id",
          name: session.name || "Moman Salman (Admin)",
          email: session.email || "momansalman@almomanfoods.com",
          phone: session.phone || "03371691006",
          address: "556/A Model Town, Gujranwala",
          role: "admin",
        },
      });
    }

    let dbUser = null;
    try {
      if (session.userId && session.userId.length === 24) {
        await connectToDatabase();
        dbUser = await User.findById(session.userId).select("-password");
      }
    } catch {
      // MongoDB offline, fallback to token session
    }

    if (dbUser) {
      return NextResponse.json({
        user: {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email || "",
          phone: dbUser.phone || "",
          address: dbUser.address || "",
          role: dbUser.role,
          createdAt: dbUser.createdAt,
        },
      });
    }

    // Always fallback to verified session token
    return NextResponse.json({
      user: {
        id: session.userId,
        name: session.name,
        email: session.email || "",
        phone: session.phone || "",
        role: session.role,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
