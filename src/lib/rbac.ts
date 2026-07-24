/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export type Role = "user" | "admin";

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = db.select().from(users).where(eq(users.id, session.user.id)).get();
  return user || null;
}

/**
 * Enforce authentication for Page routes (redirects to /login)
 */
export async function requireAuthPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Enforce authentication for Page routes (Unified User Access)
 */
export async function requireRolePage(allowedRoles?: string[]) {
  const user = await requireAuthPage();
  return user;
}

/**
 * Enforce authentication for API routes (returns 401 JSON)
 */
export async function requireAuthApi() {
  const user = await getCurrentUser();
  if (!user) {
    return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }
  return { errorResponse: null, user };
}

/**
 * Enforce authentication for API routes (Unified User Access)
 */
export async function requireRoleApi(allowedRoles?: string[]) {
  const { errorResponse, user } = await requireAuthApi();
  if (errorResponse) return { errorResponse, user: null };
  return { errorResponse: null, user };
}
