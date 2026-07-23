import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import * as OTPAuth from "otpauth";
import * as QRCode from "qrcode";

/**
 * GET /api/2fa/setup — Generate a TOTP secret and QR code for the authenticated user.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = db.select().from(users).where(eq(users.id, session.user.id)).get();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a new random secret
    const secret = new OTPAuth.Secret({ size: 20 });

    // Store secret (not yet enabled — user must verify a code first)
    db.update(users)
      .set({ twoFactorSecret: secret.base32 })
      .where(eq(users.id, session.user.id))
      .run();

    // Create TOTP instance
    const totp = new OTPAuth.TOTP({
      issuer: "LifeOS",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });

    const uri = totp.toString();

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(uri);

    return NextResponse.json({
      secret: secret.base32,
      uri,
      qrCode: qrDataUrl,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
