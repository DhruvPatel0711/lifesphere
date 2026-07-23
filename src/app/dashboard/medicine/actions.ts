"use server";

import { db } from "@/lib/db";
import { medicines } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addMedicine(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const dosage = formData.get("dosage") as string;
  const type = formData.get("type") as string;
  const frequency = formData.get("frequency") as string;
  const purpose = formData.get("purpose") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const totalPills = parseInt(formData.get("totalPills") as string) || 30;
  
  // times should be a comma separated string from input
  const timesStr = formData.get("times") as string;
  let times: string[] = [];
  if (timesStr) {
    times = timesStr.split(",").map(t => t.trim()).filter(t => t);
  }

  if (!name || !dosage) throw new Error("Missing required fields");

  await db.insert(medicines).values({
    userId: session.user.id,
    name,
    dosage,
    type,
    frequency,
    times,
    purpose,
    startDate: startDate || null,
    endDate: endDate || null,
    totalPills,
    remaining: totalPills,
    isActive: true,
  }).run();

  revalidatePath("/dashboard/medicine");
}

export async function deleteMedicine(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(medicines)
    .where(and(eq(medicines.id, id), eq(medicines.userId, session.user.id)))
    .run();

  revalidatePath("/dashboard/medicine");
}

export async function toggleMedicineActive(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.update(medicines)
    .set({ isActive: !isActive })
    .where(and(eq(medicines.id, id), eq(medicines.userId, session.user.id)))
    .run();

  revalidatePath("/dashboard/medicine");
}
