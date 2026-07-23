"use server";

import { db } from "@/lib/db";
import { appointments } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ChatOpenAI } from "@langchain/openai";
import { createNotification } from "@/lib/notifications";

export async function createAppointment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doctor = formData.get("doctor") as string;
  const specialty = (formData.get("specialty") as string) || "General Physician";
  const hospital = (formData.get("hospital") as string) || "";
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const notes = (formData.get("notes") as string) || "";

  if (!doctor || !date || !time) throw new Error("Missing required fields");

  await db.insert(appointments).values({
    userId: session.user.id,
    doctor,
    specialty,
    hospital,
    date,
    time,
    notes,
    status: "scheduled",
  }).run();

  await createNotification({
    userId: session.user.id,
    type: "appointment",
    title: "📅 Appointment Scheduled",
    message: `Upcoming visit with Dr. ${doctor} on ${date} at ${time}.`,
  });

  revalidatePath("/dashboard/appointments");
  redirect("/dashboard/appointments");
}

export async function generateAIPrep(appointmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const appointment = db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.userId, session.user.id)))
    .get();

  if (!appointment) throw new Error("Appointment not found");

  const chatModel = new ChatOpenAI({
    modelName: "llama-3.3-70b-versatile",
    openAIApiKey: process.env.GROQ_API_KEY,
    configuration: {
      baseURL: "https://api.groq.com/openai/v1",
    },
    temperature: 0.3,
  });

  const prompt = `Generate a concise doctor visit preparation checklist for an upcoming appointment:
  Doctor: ${appointment.doctor} (${appointment.specialty})
  Reason/Notes: ${appointment.notes || "Routine consultation"}

  Provide:
  1. 3 essential questions to ask the doctor.
  2. Documents/symptoms to bring or highlight.
  3. Key reminders before the visit.
  Keep it bulleted and under 200 words.`;

  const response = await chatModel.invoke([["human", prompt]]);
  const prepNotes = response.content.toString();

  await db
    .update(appointments)
    .set({ aiPrepNotes: prepNotes })
    .where(eq(appointments.id, appointmentId))
    .run();

  revalidatePath("/dashboard/appointments");
  return prepNotes;
}

export async function deleteAppointment(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.userId, session.user.id)))
    .run();

  revalidatePath("/dashboard/appointments");
}
