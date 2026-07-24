import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(/token=([^;]+)/);
  if (!tokenMatch) return null;

  const payload = verifyToken(tokenMatch[1]);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, username: true, isVerified: true },
  });

  return user;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
}