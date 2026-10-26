import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword, signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { syncCustomerToExcel } from "@/lib/excelSync";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, password, address } = body;

    // 1. Name & Phone registration (primary customer flow)
    if (phone !== undefined || (name && !email && !password)) {
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

        const phoneVariants = [
          rawPhone,
          cleanPhoneDigits,
          `0${cleanPhoneDigits.slice(-10)}`,
          `+92${cleanPhoneDigits.slice(-10)}`,
          `92${cleanPhoneDigits.slice(-10)}`,
        ].filter(Boolean);

        matchedUser = await User.findOne({
          phone: { $in: phoneVariants },
          role: "user",
        });

        if (matchedUser) {
          if (matchedUser.name !== trimmedName) {
            matchedUser.name = trimmedName;
            await matchedUser.save();
          }
          userId = matchedUser._id.toString();
        } else {
          const newUser = await User.create({
            name: trimmedName,
            phone: rawPhone,
            email: "",
            password: "",
            address: address?.trim() || "",
            role: "user",
          });
          userId = newUser._id.toString();
          matchedUser = newUser;
        }
      } catch (dbErr) {
        console.warn("MongoDB offline during signup, saving locally & in Excel:", dbErr);
      }

      // Automatically sync customer to Excel in D: drive
      try {
        syncCustomerToExcel({
          id: userId,
          name: trimmedName,
          phone: rawPhone,
          email: matchedUser?.email || "N/A",
          address: address?.trim() || matchedUser?.address || "N/A",
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

      const response = NextResponse.json(
        {
          message: `Account created successfully! Welcome, ${trimmedName}.`,
          user: {
            id: userId,
            name: trimmedName,
            phone: rawPhone,
            email: matchedUser?.email || "",
            address: address?.trim() || matchedUser?.address || "",
            role: "user" as const,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 }
      );

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
    }

    // 2. Legacy email + password signup
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name and phone number are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    let userId = `USR-${Date.now()}`;
    const normalizedEmail = email.toLowerCase().trim();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const role = normalizedEmail === adminEmail ? "admin" : "user";
    const hashedPassword = await hashPassword(password);

    try {
      await connectToDatabase();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone?.trim() || "",
        address: address?.trim() || "",
        role,
      });
      userId = newUser._id.toString();
    } catch (dbErr) {
      console.warn("MongoDB offline during signup, saving locally & in Excel:", dbErr);
    }

    // Automatically sync customer to Excel in D: drive
    try {
      syncCustomerToExcel({
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || "",
        address: address?.trim() || "",
        role,
        createdAt: new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
      });
    } catch (excelErr) {
      console.warn("Excel customer sync warning:", excelErr);
    }

    const token = signToken({
      userId,
      email: normalizedEmail,
      role,
      name: name.trim(),
    });

    const response = NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: userId,
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || "",
          address: address?.trim() || "",
          role,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );

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
    console.error("Signup error:", error);
    const message = error instanceof Error ? error.message : "Failed to create account";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
