import { db } from "@/lib/db";
import { medicines } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { deleteMedicine, toggleMedicineActive } from "./actions";

export default async function MedicinePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const meds = db.select().from(medicines).where(eq(medicines.userId, session.user.id)).all();

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Medicines & Reminders</h1>
          <p className="text-gray-500 mt-1">Track your active prescriptions and daily dosage.</p>
        </div>
        <Link href="/dashboard/medicine/new" className="bg-red-500 text-white px-5 py-2.5 rounded-md font-medium text-sm hover:bg-red-600 transition-colors shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span> Add Medicine
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {meds.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-3 block">medication</span>
            <p className="text-gray-500 font-medium text-lg">No active medicines found.</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Add your daily prescriptions to get reminders.</p>
            <Link href="/dashboard/medicine/new" className="text-red-500 font-medium hover:underline">
              Add a medicine
            </Link>
          </div>
        ) : (
          meds.map((med) => (
            <div key={med.id} className={`border rounded-xl p-5 bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow ${!med.isActive ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-slate-900 leading-tight">{med.name}</h3>
                <span className="text-xs font-semibold bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-full whitespace-nowrap">{med.type}</span>
              </div>
              
              <div className="text-sm mb-4 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100 flex-grow">
                <p className="flex gap-2"><span className="font-semibold text-slate-700 w-20">Dosage:</span> <span className="text-slate-600">{med.dosage}</span></p>
                <p className="flex gap-2"><span className="font-semibold text-slate-700 w-20">Frequency:</span> <span className="text-slate-600 capitalize">{med.frequency.replace('_', ' ')}</span></p>
                {med.times && med.times.length > 0 && (
                   <p className="flex gap-2"><span className="font-semibold text-slate-700 w-20">Times:</span> <span className="text-slate-600">{med.times.join(', ')}</span></p>
                )}
                <p className="flex gap-2"><span className="font-semibold text-slate-700 w-20">Remaining:</span> <span className={`${med.remaining < 5 ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{med.remaining} / {med.totalPills}</span></p>
              </div>

              <div className="flex items-center space-x-4 mt-auto pt-4 border-t border-slate-100">
                <form action={async () => {
                  "use server";
                  await toggleMedicineActive(med.id, med.isActive);
                }} className="flex-1">
                  <button className="text-sm font-medium text-slate-600 hover:text-red-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">{med.isActive ? 'pause_circle' : 'play_circle'}</span> 
                    {med.isActive ? 'Pause' : 'Resume'}
                  </button>
                </form>
                
                <form action={async () => {
                  "use server";
                  await deleteMedicine(med.id);
                }}>
                  <button className="text-sm font-medium text-slate-600 hover:text-red-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
