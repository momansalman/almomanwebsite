import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ admin: null }, { status: 401 });
  }
  return NextResponse.json({ admin });
}
