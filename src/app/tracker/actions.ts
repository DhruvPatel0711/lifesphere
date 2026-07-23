"use server";

import { db } from "@/lib/db";
import { healthEntries } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addWeightEntry(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const weightValue = parseFloat(formData.get("weight") as string);
  const dateStr = formData.get("date") as string;
  
  if (isNaN(weightValue) || !dateStr) throw new Error("Invalid input");

  await db.insert(healthEntries).values({
    userId: session.user.id,
    category: "weight",
    value: weightValue,
    recordedAt: new Date(dateStr),
  }).run();

  revalidatePath("/tracker");
}

export async function deleteWeightEntry(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(healthEntries).where(and(eq(healthEntries.id, id), eq(healthEntries.userId, session.user.id))).run();

  revalidatePath("/tracker");
}
