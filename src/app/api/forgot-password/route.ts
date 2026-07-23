import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { sendVerificationEmail, generateCode } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return NextResponse.json({ message: "If an account exists, a verification code has been sent." });
    }

    // Generate 6-digit code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing tokens for this email
    db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email)).run();

    // Store new token
    db.insert(passwordResetTokens).values({
      email,
      code,
      expiresAt,
    }).run();

    // Send email (or log in dev mode)
    await sendVerificationEmail(email, code, "reset");

    return NextResponse.json({ message: "If an account exists, a verification code has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
