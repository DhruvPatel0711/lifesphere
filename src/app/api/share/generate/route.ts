import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { shareLinks } from "@/drizzle/schema";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(shareLinks).values({
      userId: session.user.id,
      token,
      expiresAt,
    }).run();

    return NextResponse.json({
      success: true,
      token,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    console.error("Generate share token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
