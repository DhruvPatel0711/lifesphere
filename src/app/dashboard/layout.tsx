import DashboardLayoutClient from "@/components/DashboardLayoutClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check face verification state
  const user = db.select().from(users).where(eq(users.id, session.user.id!)).get();
  if (user?.faceLoginEnabled && user?.faceDescriptor) {
    const cookieStore = cookies();
    const faceVerified = cookieStore.get("face_verified")?.value;
    if (faceVerified !== session.user.id) {
      redirect("/verify-face");
    }
  }

  return (
    <DashboardLayoutClient user={session.user}>
      {children}
    </DashboardLayoutClient>
  );
}
