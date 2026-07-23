import { db } from "@/lib/db";
import { users, medicalRecords, medicines } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import FaceSetupClient from "./FaceSetupClient";
import TwoFactorSetup from "./TwoFactorSetup";
import PasskeySetupClient from "./PasskeySetupClient";
import { disableFaceLogin } from "./actions";
import ExportButtons from "@/components/ExportButtons";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = db.select().from(users).where(eq(users.id, session.user.id)).get();
  if (!user) redirect("/login");

  const records = db.select().from(medicalRecords).where(and(eq(medicalRecords.userId, session.user.id), isNull(medicalRecords.deletedAt))).all();
  const activeMeds = db.select().from(medicines).where(eq(medicines.userId, session.user.id)).all();

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Account Settings</h1>
          <p className="page-subtitle">Manage your security, passkeys, data export, and authentication preferences</p>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 border-b pb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">download</span>
          Export Personal Health Data
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Download a complete CSV archive of your medical records or generate a printable PDF summary report.
        </p>
        <ExportButtons
          user={user}
          records={records}
          medicines={activeMeds}
          variant="full"
        />
      </div>

      {/* Passkeys & Biometric Security */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 border-b pb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">key</span>
          Biometric Passkeys & Security
        </h2>
        <PasskeySetupClient />
      </div>

      {/* Face Verification */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 border-b pb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">face</span>
          Face Verification
        </h2>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Face Login</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xl">
              After signing in, verify your identity with facial recognition for extra security.
            </p>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-700">
            {user.faceLoginEnabled ? (
              <span className="text-green-600 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> Enabled</span>
            ) : (
              <span className="text-gray-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">cancel</span> Disabled</span>
            )}
          </div>
        </div>

        {user.faceLoginEnabled ? (
          <form action={disableFaceLogin}>
            <button className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-md font-medium text-sm hover:bg-red-100 transition-colors">
              Disable Face Verification
            </button>
          </form>
        ) : (
          <FaceSetupClient />
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 border-b pb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">security</span>
          Two-Factor Authentication (TOTP)
        </h2>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Authenticator App</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xl">
              Use Google Authenticator or any TOTP-compatible app to generate verification codes.
            </p>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-700">
            {user.twoFactorEnabled ? (
              <span className="text-green-600 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> Enabled</span>
            ) : (
              <span className="text-gray-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">cancel</span> Disabled</span>
            )}
          </div>
        </div>

        <TwoFactorSetup isEnabled={!!user.twoFactorEnabled} />
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4 border-b pb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">person</span>
          Account Information
        </h2>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Name</span>
            <span className="font-medium">{user.name || "Not set"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Role</span>
            <span className="font-medium capitalize">{user.role}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Account Created</span>
            <span className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
