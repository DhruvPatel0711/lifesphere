import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/rbac";
import { db } from "@/lib/db";
import { familyMembers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { errorResponse, user } = await requireRoleApi(["patient", "doctor", "admin"]);
    if (errorResponse) return errorResponse;

    const members = db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, user!.id))
      .all();

    return NextResponse.json({ familyMembers: members });
  } catch (error) {
    console.error("Fetch family members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
