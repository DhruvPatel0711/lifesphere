import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// In-memory rate-limiter for face verification attempts (max 3 attempts / 5 mins)
const attemptsMap = new Map<string, { count: number; resetTime: number }>();

function checkFaceRateLimit(key: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 3;

  const record = attemptsMap.get(key);
  if (!record || now > record.resetTime) {
    attemptsMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateKey = `face_rate_${session.user.id}`;
    if (!checkFaceRateLimit(rateKey)) {
      return NextResponse.json(
        { error: "Too many face verification attempts. Please wait 5 minutes before trying again." },
        { status: 429 }
      );
    }

    const { descriptor, livenessVerified } = await req.json();
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return NextResponse.json({ error: "Invalid face descriptor" }, { status: 400 });
    }

    if (livenessVerified === false) {
      return NextResponse.json(
        { verified: false, message: "Anti-spoofing alert: Static photo detected. Frame motion requirement failed." },
        { status: 400 }
      );
    }

    const user = db.select().from(users).where(eq(users.id, session.user.id)).get();
    if (!user || !user.faceLoginEnabled || !user.faceDescriptor) {
      return NextResponse.json({ error: "Face verification not enabled for this account" }, { status: 400 });
    }

    const storedDescriptor = JSON.parse(user.faceDescriptor) as number[];
    if (storedDescriptor.length !== 128) {
      return NextResponse.json({ error: "Stored face data is corrupted" }, { status: 500 });
    }

    // Euclidean distance (same threshold as legacy Python backend)
    let sum = 0;
    for (let i = 0; i < 128; i++) {
      sum += Math.pow(storedDescriptor[i] - descriptor[i], 2);
    }
    const distance = Math.sqrt(sum);

    const THRESHOLD = 0.45;
    if (distance > THRESHOLD) {
      return NextResponse.json(
        { verified: false, message: "Face does not match. Please try again." },
        { status: 403 }
      );
    }

    // Set a session cookie to mark face as verified
    const response = NextResponse.json({ verified: true, message: "Face verified successfully." });
    response.cookies.set("face_verified", session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours — re-verify after this
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Face verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
