"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TwoFactorSetup({ isEnabled }: { isEnabled: boolean }) {
  const router = useRouter();
  const [setupMode, setSetupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");

  const handleStartSetup = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/2fa/setup");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetupMode(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start 2FA setup");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSetupMode(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm("Are you sure you want to disable Two-Factor Authentication?")) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/2fa/disable", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  if (isEnabled) {
    return (
      <div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded-md">{error}</div>
        )}
        <button
          onClick={handleDisable}
          disabled={loading}
          className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-md font-medium text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {loading ? "Disabling..." : "Disable 2FA"}
        </button>
      </div>
    );
  }

  if (!setupMode) {
    return (
      <div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded-md">{error}</div>
        )}
        <button
          onClick={handleStartSetup}
          disabled={loading}
          className="bg-black text-white px-5 py-2.5 rounded-md font-medium text-sm hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
          {loading ? "Setting up..." : "Set up 2FA"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-2">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded-md text-center">{error}</div>
      )}

      <div className="text-center mb-6">
        <h4 className="font-semibold mb-2">Scan this QR code with your authenticator app</h4>
        <p className="text-sm text-gray-500 mb-4">
          Use Google Authenticator, Authy, or any TOTP-compatible app.
        </p>

        {qrCode && (
          <div className="inline-block bg-white p-4 rounded-xl border shadow-sm">
            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-4 mb-6 text-center">
        <p className="text-xs text-gray-500 mb-1">Or enter this secret key manually:</p>
        <code className="text-sm font-mono font-bold text-gray-800 tracking-wider bg-gray-100 px-3 py-1 rounded select-all">
          {secret}
        </code>
      </div>

      <form onSubmit={handleEnable} className="flex flex-col items-center gap-4">
        <div className="w-full max-w-xs">
          <label className="block text-xs text-gray-600 uppercase mb-1 text-center">
            Enter the 6-digit code from your app
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black text-center text-xl tracking-[0.3em] font-mono"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSetupMode(false)}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Enable"}
          </button>
        </div>
      </form>
    </div>
  );
}
