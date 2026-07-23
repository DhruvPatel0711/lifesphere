import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import FaceVerifyClient from "./FaceVerifyClient";

export default async function VerifyFacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = db.select().from(users).where(eq(users.id, session.user.id)).get();

  // If user doesn't have face verification enabled, skip straight to dashboard
  if (!user || !user.faceLoginEnabled || !user.faceDescriptor) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center sm:px-16">
          <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
          </div>
          <h3 className="text-xl font-semibold">Face Verification Required</h3>
          <p className="text-sm text-gray-500">
            Your account requires biometric verification. Please look at the camera to continue.
          </p>
        </div>
        <FaceVerifyClient userName={user.name || user.email} />
      </div>
    </div>
  );
}
