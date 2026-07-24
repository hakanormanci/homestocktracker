import webPush from "web-push";
import { prisma } from "./db";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey && publicKey.length > 10) {
    webPush.setVapidDetails("mailto:admin@homestock.app", publicKey, privateKey);
    vapidConfigured = true;
    return true;
  }
  return false;
}

export async function sendPushToGroup(
  groupId: string,
  payload: { title: string; body: string; url?: string },
  excludeUserId?: string
) {
  if (!ensureVapidConfigured()) {
    console.warn("VAPID keys not configured, skipping push");
    return;
  }

  const memberships = await prisma.groupMember.findMany({
    where: {
      groupId,
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
    include: {
      user: {
        include: { pushSubscriptions: true },
      },
    },
  });

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: "/icons/icon-192.png",
    data: { url: payload.url || "/app/shopping-list" },
  });

  for (const member of memberships) {
    for (const sub of member.user.pushSubscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notificationPayload
        );
      } catch (error) {
        console.error("Push failed for", sub.endpoint, error);
        if ((error as Record<string, unknown>).statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }
  }
}