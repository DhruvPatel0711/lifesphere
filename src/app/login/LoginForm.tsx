"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";

export default function LoginForm({ errorParams }: { errorParams?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    errorParams === "CredentialsSignin"
      ? "Invalid email or password."
      : errorParams
        ? "An error occurred during sign in."
        : ""
  );

  const handlePasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setError("");

    try {
      if (!window.PublicKeyCredential) {
        throw new Error("Passkeys are not supported in this browser.");
      }

      const res = await fetch("/api/webauthn/authenticate");
      if (!res.ok) throw new Error("Failed to initialize Passkey login.");
      const options = await res.json();

      const challengeBuffer = new TextEncoder().encode(options.challenge);

      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: challengeBuffer,
          timeout: 60000,
          userVerification: "preferred",
        },
      })) as PublicKeyCredential | null;

      if (!credential) throw new Error("Passkey sign-in cancelled.");

      const authRes = await fetch("/api/webauthn/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: credential.id }),
      });

      const authData = await authRes.json();
      if (authData.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        throw new Error(authData.error || "Passkey verification failed.");
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Passkey sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center sm:px-16">
        <h3 className="text-xl font-semibold">Sign In</h3>
        <p className="text-sm text-gray-500">Use your email and password or passkey to sign in</p>
      </div>

      <div className="flex flex-col bg-gray-50 px-4 py-8 sm:px-16">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-600 text-sm rounded-md text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordLogin} className="flex flex-col space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs text-gray-600 uppercase">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              autoComplete="email"
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs text-gray-600 uppercase">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
            />
          </div>
          <button disabled={loading} className="flex h-10 w-full items-center justify-center rounded-md border border-transparent bg-black text-sm font-medium text-white transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50">
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="text-right mt-2">
          <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-black hover:underline">
            Forgot password?
          </Link>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handlePasskeyLogin}
            type="button"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-100 focus:outline-none"
          >
            <KeyRound size={18} /> Sign in with Biometric Passkey
          </button>

          <button onClick={handleGoogleLogin} type="button" className="flex h-10 w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 pt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-gray-800 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </>
  );
}
