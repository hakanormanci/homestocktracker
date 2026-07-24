import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, clearSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ message: "Logged out" });
}