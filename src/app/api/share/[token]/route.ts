import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shareLinks, users, medicalRecords, medicines, healthEntries } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const shareRecord = db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.token, token))
      .get();

    if (!shareRecord) {
      return NextResponse.json({ error: "Share token invalid or expired" }, { status: 404 });
    }

    const expiresTime = shareRecord.expiresAt instanceof Date ? shareRecord.expiresAt.getTime() : Number(shareRecord.expiresAt);
    if (Date.now() > expiresTime) {
      return NextResponse.json({ error: "Share token invalid or expired" }, { status: 404 });
    }

    // Increment views
    await db
      .update(shareLinks)
      .set({ views: (shareRecord.views || 0) + 1 })
      .where(eq(shareLinks.id, shareRecord.id))
      .run();

    const user = db.select().from(users).where(eq(users.id, shareRecord.userId)).get();
    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const records = db.select().from(medicalRecords).where(and(eq(medicalRecords.userId, user.id), isNull(medicalRecords.deletedAt))).all();
    const meds = db.select().from(medicines).where(eq(medicines.userId, user.id)).all();
    const vitals = db.select().from(healthEntries).where(eq(healthEntries.userId, user.id)).all();

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        image: user.image,
      },
      records: records.map(r => ({ title: r.title, category: r.category, doctor: r.doctor, hospital: r.hospital, date: r.date, findings: r.findings })),
      medicines: meds.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, type: m.type, isActive: m.isActive })),
      vitals: vitals.slice(0, 10),
      expiresAt: new Date(shareRecord.expiresAt).toLocaleDateString(),
    });
  } catch (error) {
    console.error("Public share endpoint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
