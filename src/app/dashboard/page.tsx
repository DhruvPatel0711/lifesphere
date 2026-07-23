import { auth } from "@/auth";
import Link from "next/link";
import { Activity, Droplet, Dumbbell, Pill, ArrowUpRight, Flame, Heart } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good {getGreetingTime()}, {session?.user?.name?.split(' ')[0] || 'User'} 👋
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-lg">
              Here is your daily health overview, active prescriptions, and vitals summary.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/60 shadow-inner">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Health Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-400">85</span>
                <span className="text-xs font-semibold text-slate-400">/100</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
              <Heart className="w-6 h-6 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/tracker"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Droplet className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Log Water</span>
        </Link>

        <Link
          href="/dashboard/ai-fitness"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-300 transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Dumbbell className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Start Workout</span>
        </Link>

        <Link
          href="/dashboard/medicine"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-red-300 transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Pill className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Take Meds</span>
        </Link>

        <Link
          href="/dashboard/ai-symptom"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Triage</span>
        </Link>
      </div>

      {/* Activity & Nutrition Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Rings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Daily Activity</h3>
              <p className="text-xs text-slate-400">Movement and calorie goals</p>
            </div>
            <Link href="/dashboard/analytics" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl flex items-center justify-center mb-2 font-bold">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">4,200</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Steps</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-orange-50 dark:bg-orange-950/40 text-orange-600 rounded-2xl flex items-center justify-center mb-2 font-bold">
                <Flame className="w-6 h-6" />
              </div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">320</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kcal</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-2xl flex items-center justify-center mb-2 font-bold">
                <Droplet className="w-6 h-6" />
              </div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">1.2L</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Water</span>
            </div>
          </div>
        </div>

        {/* Nutrition Macros */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Nutrition Macros</h3>
              <p className="text-xs text-slate-400">Daily intake progress</p>
            </div>
            <Link href="/dashboard/ai-nutrition" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Meal Plan <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400">Protein</span>
                <span className="text-slate-900 dark:text-white">54g / 84g</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full w-[64%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400">Carbs</span>
                <span className="text-slate-900 dark:text-white">120g / 200g</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[60%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400">Fats</span>
                <span className="text-slate-900 dark:text-white">45g / 60g</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-[75%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
