import { db } from "@/lib/db";
import { healthEntries } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { addWeightEntry, deleteWeightEntry } from "./actions";
import { Activity, Plus, Trash2 } from "lucide-react";

export default async function TrackerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const entries = db.select()
    .from(healthEntries)
    .where(and(eq(healthEntries.userId, session.user.id), eq(healthEntries.category, "weight")))
    .orderBy(desc(healthEntries.recordedAt))
    .all();

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600" /> Vitals & Weight Tracker
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Log daily weight measurements and track historical trends.
        </p>
      </div>

      <form action={addWeightEntry} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        <div className="space-y-1.5 flex-1 w-full">
          <label htmlFor="weight" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Weight (kg)</label>
          <input id="weight" name="weight" type="number" step="0.1" required className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950" placeholder="e.g. 70.5" />
        </div>
        <div className="space-y-1.5 flex-1 w-full">
          <label htmlFor="date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date</label>
          <input id="date" name="date" type="date" required className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
        <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 px-6 text-sm transition shadow-sm flex items-center justify-center gap-1.5">
          <Plus className="w-4 h-4" /> Log Entry
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Weight History</h2>
        {entries.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-sm">
            No weight entries logged yet. Add your first measurement above.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Weight</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{entry.recordedAt.toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{entry.value} kg</td>
                    <td className="px-6 py-4 text-right">
                      <form action={async () => {
                        "use server";
                        await deleteWeightEntry(entry.id);
                      }}>
                        <button className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 ml-auto">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
