"use server";

import { db } from "@/lib/db";
import { familyMembers } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addFamilyMember(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const relationship = formData.get("relationship") as string;
  const age = formData.get("age") ? parseInt(formData.get("age") as string) : null;
  const gender = (formData.get("gender") as string) || "";
  const allergies = (formData.get("allergies") as string) || "";
  const conditions = (formData.get("conditions") as string) || "";

  if (!name || !relationship) throw new Error("Name and Relationship are required");

  await db.insert(familyMembers).values({
    userId: session.user.id,
    name,
    relationship,
    age,
    gender,
    allergies,
    conditions,
  }).run();

  revalidatePath("/dashboard/family");
}

export async function deleteFamilyMember(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(familyMembers)
    .where(and(eq(familyMembers.id, id), eq(familyMembers.userId, session.user.id)))
    .run();

  revalidatePath("/dashboard/family");
}
