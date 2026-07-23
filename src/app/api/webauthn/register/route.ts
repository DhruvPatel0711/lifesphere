import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateChallenge, savePasskey } from "@/lib/webauthn";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challenge = generateChallenge();

    return NextResponse.json({
      challenge,
      rp: { name: "LifeOS Health Portal", id: globalThis.location?.hostname || "localhost" },
      user: {
        id: session.user.id,
        name: session.user.email || "user",
        displayName: session.user.name || "User",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },  // ES256
        { type: "public-key", alg: -257 } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred",
      },
      timeout: 60000,
    });
  } catch (error) {
    console.error("WebAuthn register options error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { credentialId, publicKey, transports } = body;

    if (!credentialId || !publicKey) {
      return NextResponse.json({ error: "Invalid credential data" }, { status: 400 });
    }

    await savePasskey(session.user.id, credentialId, publicKey, transports);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WebAuthn register verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
