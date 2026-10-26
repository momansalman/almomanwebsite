import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "almoman_secret_key_default_2026";
const TOKEN_COOKIE_NAME = "almoman_token";
const ADMIN_COOKIE_NAME = "almoman_admin_token";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface TokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: "user" | "admin" | "customer";
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getAdminSessionUser(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  // Check dedicated admin token first
  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (adminToken) {
    const verified = verifyToken(adminToken);
    if (verified && verified.role === "admin") return verified;
  }
  // Fallback to customer token if it has admin role
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (token) {
    const verified = verifyToken(token);
    if (verified && verified.role === "admin") return verified;
  }
  return null;
}

export { TOKEN_COOKIE_NAME, ADMIN_COOKIE_NAME };

