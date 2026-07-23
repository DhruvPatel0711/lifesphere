"use client";

import React, { useState } from "react";
import { KeyRound, CheckCircle2, ShieldCheck } from "lucide-react";

export default function PasskeySetupClient() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCreatePasskey() {
    setLoading(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn / Passkeys are not supported in this browser environment.");
      }

      // Fetch options
      const res = await fetch("/api/webauthn/register");
      if (!res.ok) throw new Error("Failed to initialize Passkey creation.");

      const options = await res.json();

      // Convert challenge string to BufferSource
      const challengeBuffer = new TextEncoder().encode(options.challenge);
      const userIdBuffer = new TextEncoder().encode(options.user.id);

      const credential = (await navigator.credentials.create({
        publicKey: {
          rp: options.rp,
          user: {
            id: userIdBuffer,
            name: options.user.name,
            displayName: options.user.displayName,
          },
          challenge: challengeBuffer,
          pubKeyCredParams: options.pubKeyCredParams,
          authenticatorSelection: options.authenticatorSelection,
          timeout: options.timeout,
        },
      })) as PublicKeyCredential | null;

      if (!credential) throw new Error("Passkey creation cancelled.");

      const credId = credential.id;
      const rawId = Buffer.from(new Uint8Array(credential.rawId)).toString("base64url");

      // Verify on backend
      const saveRes = await fetch("/api/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: credId,
          publicKey: rawId,
          transports: "internal",
        }),
      });

      if (!saveRes.ok) throw new Error("Failed to save Passkey credential.");

      setSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to set up Passkey.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mt-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600" /> WebAuthn / Passkey Authentication
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Register your Touch ID, Face ID, or Hardware Security Key to sign in instantly without passwords.
          </p>
        </div>
        <button
          onClick={handleCreatePasskey}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
        >
          {loading ? "Registering..." : "Add Passkey"}
        </button>
      </div>

      {success && (
        <div className="mt-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs p-2.5 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          Passkey registered successfully! You can now use your biometric passkey to sign in.
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 bg-red-50 text-red-700 border border-red-200 text-xs p-2.5 rounded-lg flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-600 flex-shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
