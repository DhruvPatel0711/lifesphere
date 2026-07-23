import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { webauthnCredentials, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { generateChallenge } from "@/lib/webauthn";

export async function GET() {
  try {
    const challenge = generateChallenge();
    return NextResponse.json({ challenge });
  } catch (error) {
    console.error("WebAuthn auth options error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credentialId } = body;

    if (!credentialId) {
      return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
    }

    const cred = db
      .select()
      .from(webauthnCredentials)
      .where(eq(webauthnCredentials.credentialId, credentialId))
      .get();

    if (!cred) {
      return NextResponse.json({ error: "Passkey credential not found" }, { status: 404 });
    }

    const user = db.select().from(users).where(eq(users.id, cred.userId)).get();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("WebAuthn authenticate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
