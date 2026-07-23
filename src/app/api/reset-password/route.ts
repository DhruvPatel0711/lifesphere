import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, code, and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Find token
    const token = db.select().from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.email, email), eq(passwordResetTokens.code, code)))
      .get();

    if (!token) {
      return NextResponse.json({ error: "Invalid or missing verification code" }, { status: 400 });
    }

    // Check expiration
    if (Date.now() > token.expiresAt.getTime()) {
      db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, token.id)).run();
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
    }

    // Find user
    const user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.update(users).set({ password: hashedPassword }).where(eq(users.id, user.id)).run();

    // Delete used token
    db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, token.id)).run();

    return NextResponse.json({ message: "Password successfully reset. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
