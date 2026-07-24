import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: true },
  });

  return NextResponse.json({
    groups: memberships.map((m) => ({
      ...m.group,
      role: m.role,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json(
      { error: "Group name is required" },
      { status: 400 }
    );
  }

  const group = await prisma.group.create({
    data: {
      name,
      createdById: user.id,
      members: {
        create: { userId: user.id, role: "ADMIN" },
      },
    },
  });

  return NextResponse.json({ group }, { status: 201 });
}