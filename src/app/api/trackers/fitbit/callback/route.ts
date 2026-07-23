import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { healthEntries } from "@/drizzle/schema";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json().catch(() => ({}));
    const clientId = process.env.FITBIT_CLIENT_ID;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId === "your_fitbit_client_id") {
      // Dev-mode fallback simulation
      const mockSteps = Math.floor(4000 + Math.random() * 5000);
      const mockCalories = Math.floor(1800 + Math.random() * 600);

      await db.insert(healthEntries).values({
        userId: session.user.id,
        category: "steps",
        value: mockSteps,
        label: "Fitbit Live Sync (Simulated)",
        recordedAt: new Date(),
      }).run();

      await db.insert(healthEntries).values({
        userId: session.user.id,
        category: "calories",
        value: mockCalories,
        label: "Fitbit Live Sync (Simulated)",
        recordedAt: new Date(),
      }).run();

      return NextResponse.json({
        success: true,
        message: "Fitbit synced (Dev Mode Simulated)",
        steps: mockSteps,
        calories: mockCalories,
      });
    }

    // Exchange OAuth Code for Tokens with Fitbit API
    const authHeader = "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: `${req.nextUrl.origin}/dashboard/tracker`,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return NextResponse.json({ error: "Fitbit token exchange failed", details: errText }, { status: 400 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch Today's Activity Summary from Fitbit API
    const activityRes = await fetch("https://api.fitbit.com/1/user/-/activities/date/today.json", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!activityRes.ok) {
      return NextResponse.json({ error: "Failed to fetch Fitbit activity summary" }, { status: 400 });
    }

    const activityData = await activityRes.json();
    const steps = activityData.summary?.steps || 0;
    const calories = activityData.summary?.caloriesOut || 0;

    await db.insert(healthEntries).values({
      userId: session.user.id,
      category: "steps",
      value: steps,
      label: "Fitbit Live API",
      recordedAt: new Date(),
    }).run();

    await db.insert(healthEntries).values({
      userId: session.user.id,
      category: "calories",
      value: calories,
      label: "Fitbit Live API",
      recordedAt: new Date(),
    }).run();

    return NextResponse.json({
      success: true,
      steps,
      calories,
    });
  } catch (error) {
    console.error("Fitbit sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
