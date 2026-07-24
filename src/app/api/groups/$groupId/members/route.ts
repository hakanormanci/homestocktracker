import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(
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

  const { username } = await req.json();
  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUser.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "User already in group" },
      { status: 409 }
    );
  }

  const newMember = await prisma.groupMember.create({
    data: { groupId, userId: targetUser.id, role: "MEMBER" },
    include: { user: { select: { id: true, username: true } } },
  });

  return NextResponse.json({ member: newMember }, { status: 201 });
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

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  if (!username) {
    return NextResponse.json(
      { error: "Username query param required" },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.groupMember.deleteMany({
    where: { groupId, userId: targetUser.id },
  });

  return NextResponse.json({ message: "Member removed" });
}