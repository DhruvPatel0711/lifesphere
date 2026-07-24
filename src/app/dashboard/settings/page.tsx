import { requireAuthPage } from "@/lib/rbac";
import PasskeySetupClient from "./PasskeySetupClient";
import TwoFactorSetup from "./TwoFactorSetup";
import FaceSetupClient from "./FaceSetupClient";
import ExportDataSection from "./ExportDataSection";

export default async function SettingsPage() {
  const user = await requireAuthPage();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account & Security Settings</h1>
          <p className="text-sm text-slate-500">Manage your WebAuthn passkeys, 2FA, biometric face sign-in, and data export</p>
        </div>
      </div>

      {/* Export Options */}
      <ExportDataSection />

      {/* WebAuthn Passkey Management */}
      <PasskeySetupClient />

      {/* Two-Factor Authentication (TOTP) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900 mb-2">Two-Factor Authentication (TOTP)</h4>
        <p className="text-xs text-slate-500 mb-4">Add an extra layer of security to your account with Google Authenticator or Authy.</p>
        <TwoFactorSetup isEnabled={false} />
      </div>

      {/* Face Login Management */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900 mb-2">Biometric Face Sign-In</h4>
        <p className="text-xs text-slate-500 mb-4">Enable facial recognition for instant biometric login.</p>
        <FaceSetupClient />
      </div>

      {/* Profile Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">person</span>
          Account Information
        </h2>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Name</span>
            <span className="font-medium">{user.name || "Not set"}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Account Created</span>
            <span className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
