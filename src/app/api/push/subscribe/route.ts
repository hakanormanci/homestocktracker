import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { endpoint, p256dh, auth } = await req.json();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "Push subscription data required" },
      { status: 400 }
    );
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth, userId: user.id },
    create: { endpoint, p256dh, auth, userId: user.id },
  });

  return NextResponse.json({ message: "Subscription saved" });
}