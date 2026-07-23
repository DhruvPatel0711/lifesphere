"use server";

import { db } from "@/lib/db";
import { emergencyContacts } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addEmergencyContact(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = (formData.get("email") as string) || "";
  const relationship = (formData.get("relationship") as string) || "Family";

  if (!name || !phone) throw new Error("Name and Phone are required");

  await db.insert(emergencyContacts).values({
    userId: session.user.id,
    name,
    phone,
    email,
    relationship,
  }).run();

  revalidatePath("/dashboard/emergency");
}

export async function deleteEmergencyContact(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(emergencyContacts)
    .where(and(eq(emergencyContacts.id, id), eq(emergencyContacts.userId, session.user.id)))
    .run();

  revalidatePath("/dashboard/emergency");
}
