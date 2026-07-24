import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { sendPushToGroup } from "@/lib/push";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { itemId } = await context.params;
  const { status, boughtNotes, cancelledReason } = await req.json();

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: item.groupId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = { status };

  if (status === "BOUGHT") {
    updateData.flag = "INACTIVE";
    updateData.boughtById = user.id;
    updateData.boughtAt = new Date();
    updateData.boughtNotes = boughtNotes || null;
  } else if (status === "CANCELLED") {
    if (!cancelledReason) {
      return NextResponse.json(
        { error: "Cancellation reason is required" },
        { status: 400 }
      );
    }
    updateData.flag = "INACTIVE";
    updateData.cancelledById = user.id;
    updateData.cancelledAt = new Date();
    updateData.cancelledReason = cancelledReason;
  } else if (status === "OVER" || status === "LOW") {
    updateData.flag = "ACTIVE";
  }

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: updateData,
    include: {
      addedBy: { select: { id: true, username: true } },
      boughtBy: { select: { id: true, username: true } },
      cancelledBy: { select: { id: true, username: true } },
    },
  });

  const group = await prisma.group.findUnique({ where: { id: item.groupId } });
  const statusMessages: Record<string, string> = {
    BOUGHT: "marked as BOUGHT",
    CANCELLED: "marked as CANCELLED",
    OVER: "changed status to OVER",
    LOW: "changed status to LOW",
  };
  sendPushToGroup(
    item.groupId,
    {
      title: `Home Stock Update: Group '${group?.name || "Unknown"}'`,
      body: `${user.username} ${statusMessages[status] || "updated"} '${item.name}'.`,
      url: "/app/shopping-list",
    },
    user.id
  );

  return NextResponse.json({ item: updated });
}