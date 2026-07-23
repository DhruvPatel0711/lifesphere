import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { emergencyContacts, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { sendSosSms } from "@/lib/twilio";
import { createNotification } from "@/lib/notifications";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const lat = body.lat;
    const lng = body.lng;

    const user = db.select().from(users).where(eq(users.id, session.user.id)).get();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const contacts = db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.userId, session.user.id))
      .all();

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "No emergency contacts configured. Please add contacts first." },
        { status: 400 }
      );
    }

    const mapsUrl = lat && lng
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : "Location unavailable";

    const sosMessage = `🚨 EMERGENCY SOS ALERT 🚨\nUser: ${user.name || user.email}\nRequires Immediate Help!\nLocation: ${mapsUrl}\nTime: ${new Date().toLocaleString()}`;

    // 1. Dispatch Twilio SMS to all contacts
    const smsPromises = contacts.map(c => sendSosSms(c.phone, sosMessage));
    
    // 2. Dispatch Emails via nodemailer
    let emailSentCount = 0;
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      for (const contact of contacts) {
        if (contact.email) {
          try {
            await transporter.sendMail({
              from: `"LifeOS Emergency SOS" <${process.env.SMTP_EMAIL}>`,
              to: contact.email,
              subject: `🚨 EMERGENCY SOS: ${user.name || user.email}`,
              text: sosMessage,
              html: `
                <div style="background: #ef4444; color: #fff; padding: 24px; border-radius: 12px; font-family: sans-serif;">
                  <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY SOS BROADCAST</h1>
                  <p style="font-size: 16px; margin-top: 12px;"><strong>${user.name || user.email}</strong> has triggered an emergency distress signal.</p>
                  ${lat && lng ? `<p><a href="${mapsUrl}" style="background: #ffffff; color: #dc2626; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 12px;">Open Live GPS Location on Google Maps</a></p>` : "<p>Location coordinates were not provided.</p>"}
                  <p style="font-size: 12px; margin-top: 20px; opacity: 0.8;">Triggered at ${new Date().toLocaleString()}</p>
                </div>`,
            });
            emailSentCount++;
          } catch (e) {
            console.error("Failed to send SOS email to", contact.email, e);
          }
        }
      }
    }

    await Promise.all(smsPromises);

    // 3. Create In-App Notification
    await createNotification({
      userId: session.user.id,
      type: "emergency",
      title: "🚨 Emergency SOS Sent",
      message: `Distress alert dispatched to ${contacts.length} emergency contact(s).`,
    });

    return NextResponse.json({
      success: true,
      contactsNotified: contacts.length,
      emailsSent: emailSentCount,
      mapsUrl,
    });
  } catch (error) {
    console.error("SOS API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
