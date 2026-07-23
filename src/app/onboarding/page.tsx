import { auth } from "@/auth";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <OnboardingWizard user={session.user} />
    </div>
  );
}
