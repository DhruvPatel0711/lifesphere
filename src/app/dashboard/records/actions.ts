"use server";

import { db } from "@/lib/db";
import { medicalRecords } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";
import { logAudit } from "@/lib/audit";

export async function createRecord(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const doctor = (formData.get("doctor") as string) || "";
  const hospital = (formData.get("hospital") as string) || "";
  const date = formData.get("date") as string;
  const findings = formData.get("findings") as string;
  const notes = formData.get("notes") as string;
  const file = formData.get("file") as File | null;

  if (!title || !category) throw new Error("Missing required fields");

  let filePath = null;
  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const destination = path.join(uploadDir, uniqueName);
    
    await writeFile(destination, buffer);
    filePath = `/uploads/${uniqueName}`;
  }

  const inserted = await db.insert(medicalRecords).values({
    userId: session.user.id,
    title,
    category,
    doctor,
    hospital,
    date,
    findings,
    notes,
    filePath,
  }).returning().get();

  await logAudit({
    userId: session.user.id,
    recordId: inserted?.id,
    action: "CREATE",
    details: `Created medical record "${title}" (${category})`,
  });

  revalidatePath("/dashboard/records");
  redirect("/dashboard/records");
}

export async function updateRecord(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const doctor = (formData.get("doctor") as string) || "";
  const hospital = (formData.get("hospital") as string) || "";
  const date = formData.get("date") as string;
  const findings = formData.get("findings") as string;
  const notes = formData.get("notes") as string;

  if (!id || !title || !category) throw new Error("Missing required fields");

  await db.update(medicalRecords).set({
    title,
    category,
    doctor,
    hospital,
    date,
    findings,
    notes,
  }).where(and(eq(medicalRecords.id, id), eq(medicalRecords.userId, session.user.id))).run();

  await logAudit({
    userId: session.user.id,
    recordId: id,
    action: "UPDATE",
    details: `Updated medical record "${title}"`,
  });

  revalidatePath("/dashboard/records");
  redirect("/dashboard/records");
}

export async function deleteRecord(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Soft delete pattern (set deletedAt timestamp)
  await db
    .update(medicalRecords)
    .set({ deletedAt: new Date() })
    .where(and(eq(medicalRecords.id, id), eq(medicalRecords.userId, session.user.id)))
    .run();

  await logAudit({
    userId: session.user.id,
    recordId: id,
    action: "SOFT_DELETE",
    details: `Soft-deleted medical record ID ${id}`,
  });

  revalidatePath("/dashboard/records");
}
