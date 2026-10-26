import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { comparePassword, signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { syncCustomerToExcel } from "@/lib/excelSync";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, password } = body;

    // 1. Friction-free Customer Login by Name & Phone
    if (phone !== undefined || name !== undefined) {
      const trimmedName = (name || "").toString().trim();
      const rawPhone = (phone || "").toString().trim();
      const cleanPhoneDigits = rawPhone.replace(/[^0-9]/g, "");

      if (!trimmedName) {
        return NextResponse.json(
          { error: "Please enter your full name" },
          { status: 400 }
        );
      }

      if (!rawPhone || cleanPhoneDigits.length < 8) {
        return NextResponse.json(
          { error: "Please enter a valid phone number" },
          { status: 400 }
        );
      }

      let userId = `USR-${Date.now()}`;
      let matchedUser = null;

      try {
        await connectToDatabase();

        // Phone search variants
        const phoneVariants = [
          rawPhone,
          cleanPhoneDigits,
          `0${cleanPhoneDigits.slice(-10)}`,
          `+92${cleanPhoneDigits.slice(-10)}`,
          `92${cleanPhoneDigits.slice(-10)}`,
        ].filter(Boolean);

        matchedUser = await User.findOne({
          phone: { $in: phoneVariants },
        });

        if (matchedUser) {
          // Update name if changed
          if (matchedUser.name !== trimmedName) {
            matchedUser.name = trimmedName;
            await matchedUser.save();
          }
          userId = matchedUser._id.toString();
        } else {
          // Create new user with name & phone only
          const newUser = await User.create({
            name: trimmedName,
            phone: rawPhone,
            email: "",
            password: "",
            role: "user",
          });
          userId = newUser._id.toString();
          matchedUser = newUser;
        }
      } catch (dbErr) {
        console.warn("MongoDB offline during phone login, proceeding with session:", dbErr);
      }

      const effectiveRole = "user" as const;

      // Automatically sync customer to Excel in D: drive
      try {
        syncCustomerToExcel({
          id: userId,
          name: trimmedName,
          phone: rawPhone,
          email: matchedUser?.email || "N/A",
          address: matchedUser?.address || "556/A Model Town, Gujranwala",
          role: "user",
          createdAt: new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
        });
      } catch (excelErr) {
        console.warn("Excel customer sync warning:", excelErr);
      }

      const token = signToken({
        userId,
        name: trimmedName,
        phone: rawPhone,
        email: matchedUser?.email || "",
        role: "user",
      });

      const response = NextResponse.json({
        message: `Welcome, ${trimmedName}! Logged in successfully.`,
        user: {
          id: userId,
          name: trimmedName,
          phone: rawPhone,
          email: matchedUser?.email || "",
          address: matchedUser?.address || "556/A Model Town, Gujranwala",
          role: effectiveRole,
        },
      });

      response.cookies.set({
        name: TOKEN_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: false, // support HTTP local IP testing
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax",
      });

      return response;
    }

    // 2. Legacy / Password Login Fallback
    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter your name and phone number" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      message: "Logged in successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Failed to log in";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
