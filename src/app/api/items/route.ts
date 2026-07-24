import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { sendPushToGroup } from "@/lib/push";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  const flag = searchParams.get("flag");

  if (!groupId) {
    return NextResponse.json(
      { error: "groupId is required" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { groupId };
  if (flag) where.flag = flag;

  const items = await prisma.item.findMany({
    where,
    include: {
      addedBy: { select: { id: true, username: true } },
      boughtBy: { select: { id: true, username: true } },
      cancelledBy: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { groupId, name, quantity, description, priority, status } =
    await req.json();

  if (!groupId || !name || !quantity) {
    return NextResponse.json(
      { error: "groupId, name, and quantity are required" },
      { status: 400 }
    );
  }

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const item = await prisma.item.create({
    data: {
      groupId,
      name,
      quantity,
      description: description || null,
      priority: priority || "MEDIUM",
      status: status || "OVER",
      flag: "ACTIVE",
      addedById: user.id,
    },
    include: {
      addedBy: { select: { id: true, username: true } },
    },
  });

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  sendPushToGroup(
    groupId,
    {
      title: `Home Stock Update: Group '${group?.name || "Unknown"}'`,
      body: `${user.username} added '${name} (${quantity})' to the list.`,
      url: "/app/shopping-list",
    },
    user.id
  );

  return NextResponse.json({ item }, { status: 201 });
}