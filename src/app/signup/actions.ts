"use server";

import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export async function signUp(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !name) {
    throw new Error("Missing fields");
  }

  const existingUser = db.select().from(users).where(eq(users.email, email)).get();
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  }).run();

  redirect("/login");
}
