import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { syncCustomerToExcel } from "@/lib/excelSync";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let cleanEmail = (body.email || "").toString().trim().toLowerCase();
    let cleanName = (body.name || "Google User").toString().trim();
    const cleanPhone = (body.phone || "").toString().trim();

    // If Google Identity Services JWT credential is provided, decode payload
    if (body.credential && typeof body.credential === "string") {
      try {
        const parts = body.credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          if (payload.email) {
            cleanEmail = payload.email.toString().trim().toLowerCase();
          }
          if (payload.name) {
            cleanName = payload.name.toString().trim();
          }
        }
      } catch (jwtErr) {
        console.warn("Failed to decode Google GSI credential payload:", jwtErr);
      }
    }

    if (!cleanEmail) {
      return NextResponse.json(
        { error: "Google account email is required" },
        { status: 400 }
      );
    }

    let userId = `USR-G-${Date.now()}`;
    let matchedUser = null;

    try {
      await connectToDatabase();

      matchedUser = await User.findOne({ email: cleanEmail });
      if (matchedUser) {
        if (!matchedUser.name || matchedUser.name === "Google User") {
          matchedUser.name = cleanName;
        }
        await matchedUser.save();
        userId = matchedUser._id.toString();
      } else {
        const newUser = await User.create({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone || "0337-1691006",
          password: "",
          role: "user",
          address: "Model Town, Gujranwala",
        });
        userId = newUser._id.toString();
        matchedUser = newUser;
      }
    } catch (dbErr) {
      console.warn("MongoDB offline during Google login, proceeding with session:", dbErr);
    }

    const effectiveRole = "user" as const;

    // Sync to Excel
    try {
      syncCustomerToExcel({
        id: userId,
        name: cleanName,
        phone: matchedUser?.phone || cleanPhone || "Google Account",
        email: cleanEmail,
        address: matchedUser?.address || "Model Town, Gujranwala",
        role: effectiveRole,
        createdAt: new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
      });
    } catch (excelErr) {
      console.warn("Excel customer sync warning:", excelErr);
    }

    const userPayload = {
      id: userId,
      userId,
      name: cleanName,
      email: cleanEmail,
      phone: matchedUser?.phone || cleanPhone || "",
      address: matchedUser?.address || "",
      role: effectiveRole,
    };

    const token = await signToken(userPayload);
    const response = NextResponse.json(
      {
        message: "Signed in with Google successfully!",
        user: userPayload,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Google Auth API error:", error);
    const msg = error instanceof Error ? error.message : "Google authentication failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
