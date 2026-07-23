import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import * as OTPAuth from "otpauth";

/**
 * POST /api/2fa/enable — Verify a TOTP code and enable 2FA.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const user = db.select().from(users).where(eq(users.id, session.user.id)).get();
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: "2FA setup not initialized. Run setup first." }, { status: 400 });
    }

    // Verify the code
    const totp = new OTPAuth.TOTP({
      issuer: "LifeOS",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      return NextResponse.json({ error: "Invalid authentication code" }, { status: 400 });
    }

    // Enable 2FA
    db.update(users)
      .set({ twoFactorEnabled: true })
      .where(eq(users.id, session.user.id))
      .run();

    return NextResponse.json({ message: "Two-Factor Authentication enabled successfully." });
  } catch (error) {
    console.error("2FA enable error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
