import { signIn } from "@/auth";
import Link from "next/link";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export default function SignupPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl font-semibold">Sign Up</h3>
          <p className="text-sm text-gray-500">Create a new LifeOS account</p>
        </div>
        <div className="flex flex-col bg-gray-50 px-4 py-8 sm:px-16">
          <form
            action={async (formData) => {
              "use server";
              const name = formData.get("name") as string;
              const email = formData.get("email") as string;
              const password = formData.get("password") as string;

              if (!email || !password || !name) return redirect("/signup?error=MissingFields");

              try {
                // Check if user exists
                const existing = db.select().from(users).where(eq(users.email, email)).get();
                if (existing) {
                  return redirect("/signup?error=EmailExists");
                }

                // Create user
                const hashedPassword = await bcrypt.hash(password, 10);
                db.insert(users).values({
                  name,
                  email,
                  password: hashedPassword,
                }).run();

                // Auto-login
                await signIn("credentials", {
                  email,
                  password,
                  redirectTo: "/dashboard",
                });
              } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : "";
                if (msg.includes("NEXT_REDIRECT")) {
                  throw error; // Let Next.js handle redirect
                }
                console.error(error);
                redirect("/signup?error=Default");
              }
            }}
            className="flex flex-col space-y-4"
          >
            {searchParams?.error === "MissingFields" && (
              <div className="p-3 bg-red-100 border border-red-200 text-red-600 text-sm rounded-md text-center font-medium">
                Please fill in all fields.
              </div>
            )}
            {searchParams?.error === "EmailExists" && (
              <div className="p-3 bg-red-100 border border-red-200 text-red-600 text-sm rounded-md text-center font-medium">
                An account with this email already exists.
              </div>
            )}
            {searchParams?.error === "Default" && (
              <div className="p-3 bg-red-100 border border-red-200 text-red-600 text-sm rounded-md text-center font-medium">
                An error occurred during sign up.
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs text-gray-600 uppercase">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                required
                className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
              />
            </div>
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
            <button className="flex h-10 w-full items-center justify-center rounded-md border border-transparent bg-black text-sm font-medium text-white transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
              Sign Up
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button className="flex h-10 w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-500 pt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-gray-800 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
