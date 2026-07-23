import { db } from "@/lib/db";
import { webauthnCredentials } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export function generateChallenge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

export async function getUserPasskeys(userId: string) {
  return db
    .select()
    .from(webauthnCredentials)
    .where(eq(webauthnCredentials.userId, userId))
    .all();
}

export async function savePasskey(userId: string, credentialId: string, publicKey: string, transports?: string) {
  return db
    .insert(webauthnCredentials)
    .values({
      userId,
      credentialId,
      publicKey,
      transports: transports || "internal",
    })
    .run();
}
