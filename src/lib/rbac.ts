import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export type Role = "patient" | "doctor" | "admin";

/**
 * Get current authenticated user with DB role
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
 * Enforce specific role requirement for Page routes
 */
export async function requireRolePage(allowedRoles: Role[]) {
  const user = await requireAuthPage();
  if (!allowedRoles.includes(user.role as Role)) {
    redirect("/dashboard?error=AccessDenied");
  }
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
 * Enforce role requirement for API routes (returns 403 JSON if forbidden)
 */
export async function requireRoleApi(allowedRoles: Role[]) {
  const { errorResponse, user } = await requireAuthApi();
  if (errorResponse) return { errorResponse, user: null };

  if (!user || !allowedRoles.includes(user.role as Role)) {
    return {
      errorResponse: NextResponse.json(
        { error: `Forbidden: Requires one of [${allowedRoles.join(", ")}] roles` },
        { status: 403 }
      ),
      user: null,
    };
  }

  return { errorResponse: null, user };
}
