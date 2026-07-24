import { requireAuthPage } from "@/lib/rbac";
import PasskeySection from "./PasskeySection";
import TwoFactorSection from "./TwoFactorSection";
import FaceLoginSection from "./FaceLoginSection";
import ExportDataSection from "./ExportDataSection";

export default async function SettingsPage() {
  const user = await requireAuthPage();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account & Security Settings</h1>
          <p className="text-sm text-gray-500">Manage your WebAuthn passkeys, 2FA, biometric face sign-in, and data export</p>
        </div>
      </div>

      {/* Export Options */}
      <ExportDataSection />

      {/* WebAuthn Passkey Management */}
      <PasskeySection />

      {/* Two-Factor Authentication (TOTP) */}
      <TwoFactorSection />

      {/* Face Login Management */}
      <FaceLoginSection />

      {/* Profile Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Account Created</span>
            <span className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
