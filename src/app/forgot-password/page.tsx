"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setStep("code");
    } else {
      setError(data.error || "Something went wrong");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setStep("done");
    } else {
      setError(data.error || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl font-semibold">
            {step === "done" ? "Password Reset!" : "Forgot Password"}
          </h3>
          <p className="text-sm text-gray-500">
            {step === "email" && "Enter your email and we'll send a verification code."}
            {step === "code" && "Enter the 6-digit code sent to your email."}
            {step === "done" && "Your password has been successfully reset."}
          </p>
        </div>

        <div className="flex flex-col bg-gray-50 px-4 py-8 sm:px-16">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-600 text-sm rounded-md text-center font-medium">
              {error}
            </div>
          )}
          {message && step === "code" && (
            <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 text-sm rounded-md text-center font-medium">
              {message}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleSendCode} className="flex flex-col space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs text-gray-600 uppercase">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                />
              </div>
              <button disabled={loading} className="flex h-10 w-full items-center justify-center rounded-md bg-black text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleResetPassword} className="flex flex-col space-y-4">
              <div>
                <label className="block text-xs text-gray-600 uppercase">Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm text-center text-lg tracking-widest font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                />
              </div>
              <button disabled={loading} className="flex h-10 w-full items-center justify-center rounded-md bg-black text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {step === "done" && (
            <Link href="/login" className="flex h-10 w-full items-center justify-center rounded-md bg-black text-sm font-medium text-white hover:bg-gray-800 no-underline">
              Back to Sign In
            </Link>
          )}

          {step !== "done" && (
            <p className="text-center text-sm text-gray-500 pt-6">
              Remember your password?{" "}
              <Link href="/login" className="font-semibold text-gray-800 hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
