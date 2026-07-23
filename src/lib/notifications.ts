import { db } from "@/lib/db";
import { notifications } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export interface CreateNotificationParams {
  userId: string;
  type: "appointment" | "emergency" | "security" | "system";
  title: string;
  message: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const inserted = db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      read: false,
    }).returning().get();
    return inserted;
  } catch (error) {
    console.error("[Notification Create Error]", error);
    return null;
  }
}

export async function getUserNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .all();
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  return db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .run();
}

export async function markAllNotificationsAsRead(userId: string) {
  return db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId))
    .run();
}
