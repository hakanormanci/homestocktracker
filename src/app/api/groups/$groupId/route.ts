import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { groupId } = await context.params;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({ group });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { groupId } = await context.params;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { name } = await req.json();
  const group = await prisma.group.update({
    where: { id: groupId },
    data: { name },
  });

  return NextResponse.json({ group });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { groupId } = await context.params;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  await prisma.group.delete({ where: { id: groupId } });
  return NextResponse.json({ message: "Group deleted" });
}