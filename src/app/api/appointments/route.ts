import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/rbac";
import { db } from "@/lib/db";
import { appointments } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { errorResponse, user } = await requireRoleApi(["patient", "doctor", "admin"]);
    if (errorResponse) return errorResponse;

    const list = db
      .select()
      .from(appointments)
      .where(eq(appointments.userId, user!.id))
      .all();

    return NextResponse.json({ appointments: list });
  } catch (error) {
    console.error("Fetch appointments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
