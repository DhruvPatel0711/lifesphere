import { db } from "@/lib/db";
import { medicalRecords, medicines } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { deleteRecord } from "./actions";
import Link from "next/link";
import ExportButtons from "@/components/ExportButtons";

export default async function RecordsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const records = db
    .select()
    .from(medicalRecords)
    .where(and(eq(medicalRecords.userId, session.user.id), isNull(medicalRecords.deletedAt)))
    .all();

  const activeMeds = db.select().from(medicines).where(eq(medicines.userId, session.user.id)).all();

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <p className="text-gray-500 mt-1">Manage and view your uploaded medical documents.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons
            user={session.user}
            records={records}
            medicines={activeMeds}
            variant="compact"
          />
          <Link href="/dashboard/records/new" className="bg-blue-600 text-white px-5 py-2.5 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span> Add Record
          </Link>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {records.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-3 block">folder_open</span>
            <p className="text-gray-500 font-medium text-lg">No medical records found.</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Upload your first lab result, prescription, or scan to get started.</p>
            <Link href="/dashboard/records/new" className="text-blue-600 font-medium hover:underline">
              Upload a record
            </Link>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="border rounded-xl p-5 bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-slate-900 leading-tight">{record.title}</h3>
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full whitespace-nowrap">{record.category}</span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4 font-medium">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span> 
                {record.date ? new Date(record.date).toLocaleDateString() : 'No date'}
              </p>
              
              {(record.doctor || record.hospital) && (
                <div className="text-sm mb-4 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100 flex-grow">
                  {record.doctor && <p className="flex gap-2"><span className="font-semibold text-slate-700 w-16">Doctor:</span> <span className="text-slate-600">{record.doctor}</span></p>}
                  {record.hospital && <p className="flex gap-2"><span className="font-semibold text-slate-700 w-16">Hospital:</span> <span className="text-slate-600">{record.hospital}</span></p>}
                </div>
              )}
              
              {!record.doctor && !record.hospital && <div className="flex-grow"></div>}

              {record.filePath && (
                <a href={record.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-50 p-2.5 rounded-lg border border-blue-100/50 transition-colors mb-4 font-medium">
                  <span className="material-symbols-outlined text-[20px]">description</span> View Attachment
                </a>
              )}
              
              <div className="flex items-center space-x-4 mt-auto pt-4 border-t border-slate-100">
                <Link href={`/dashboard/records/${record.id}/edit`} className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                </Link>
                <form action={async () => {
                  "use server";
                  await deleteRecord(record.id);
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
