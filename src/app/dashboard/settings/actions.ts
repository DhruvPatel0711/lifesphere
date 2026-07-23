"use server";

import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function setupFaceLogin(descriptorStr: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Validate descriptor is a valid array of 128 numbers
  let descriptor: number[];
  try {
    descriptor = JSON.parse(descriptorStr);
    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      throw new Error("Invalid descriptor");
    }
  } catch {
    throw new Error("Invalid face descriptor format");
  }

  await db.update(users)
    .set({
      faceDescriptor: descriptorStr,
      faceLoginEnabled: true,
    })
    .where(eq(users.id, session.user.id))
    .run();

  revalidatePath("/dashboard/settings");
}

export async function disableFaceLogin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.update(users)
    .set({
      faceDescriptor: null,
      faceLoginEnabled: false,
    })
    .where(eq(users.id, session.user.id))
    .run();

  revalidatePath("/dashboard/settings");
}
