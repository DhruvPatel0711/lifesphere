import { db } from "@/lib/db";
import { medicalRecords } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { updateRecord } from "../../actions";
import Link from "next/link";

export default async function EditRecordPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const record = db.select().from(medicalRecords).where(and(eq(medicalRecords.id, params.id), eq(medicalRecords.userId, session.user.id))).get();

  if (!record) {
    redirect("/records");
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/records" className="text-gray-500 hover:text-black">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Edit Medical Record</h1>
      </div>

      <form action={updateRecord} className="space-y-6 bg-card p-6 rounded-lg border shadow-sm">
        <input type="hidden" name="id" value={record.id} />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <input id="title" name="title" required defaultValue={record.title} className="w-full border rounded-md px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">Category</label>
            <select id="category" name="category" required defaultValue={record.category} className="w-full border rounded-md px-3 py-2 bg-white">
              <option value="Lab Result">Lab Result</option>
              <option value="Prescription">Prescription</option>
              <option value="Visit Note">Visit Note</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="doctor" className="text-sm font-medium">Doctor (Optional)</label>
            <input id="doctor" name="doctor" defaultValue={record.doctor || ""} className="w-full border rounded-md px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label htmlFor="hospital" className="text-sm font-medium">Hospital (Optional)</label>
            <input id="hospital" name="hospital" defaultValue={record.hospital || ""} className="w-full border rounded-md px-3 py-2" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium">Date</label>
          <input id="date" name="date" type="date" required defaultValue={record.date || ""} className="w-full border rounded-md px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label htmlFor="findings" className="text-sm font-medium">Findings (Optional)</label>
          <textarea id="findings" name="findings" rows={3} defaultValue={record.findings || ""} className="w-full border rounded-md px-3 py-2"></textarea>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</label>
          <textarea id="notes" name="notes" rows={2} defaultValue={record.notes || ""} className="w-full border rounded-md px-3 py-2"></textarea>
        </div>

        <button type="submit" className="w-full bg-primary text-primary-foreground font-medium rounded-md py-2 px-4 hover:bg-primary/90">
          Update Record
        </button>
      </form>
    </div>
  );
}
