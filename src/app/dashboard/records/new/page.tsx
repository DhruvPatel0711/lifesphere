import { createRecord } from "../actions";
import Link from "next/link";

export default function NewRecordPage() {
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/records" className="text-gray-500 hover:text-black">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Add Medical Record</h1>
      </div>

      <form action={createRecord} className="space-y-6 bg-card p-6 rounded-lg border shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <input id="title" name="title" required className="w-full border rounded-md px-3 py-2" placeholder="e.g. Annual Blood Test" />
          </div>
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">Category</label>
            <select id="category" name="category" required className="w-full border rounded-md px-3 py-2 bg-white">
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
            <input id="doctor" name="doctor" className="w-full border rounded-md px-3 py-2" placeholder="Dr. Smith" />
          </div>
          <div className="space-y-2">
            <label htmlFor="hospital" className="text-sm font-medium">Hospital (Optional)</label>
            <input id="hospital" name="hospital" className="w-full border rounded-md px-3 py-2" placeholder="General Hospital" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium">Date</label>
          <input id="date" name="date" type="date" required className="w-full border rounded-md px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label htmlFor="findings" className="text-sm font-medium">Findings (Optional)</label>
          <textarea id="findings" name="findings" rows={3} className="w-full border rounded-md px-3 py-2" placeholder="Key takeaways from the result..."></textarea>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</label>
          <textarea id="notes" name="notes" rows={2} className="w-full border rounded-md px-3 py-2" placeholder="Any personal notes..."></textarea>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="file" className="text-sm font-medium">Upload File (PDF/Image)</label>
          <input id="file" name="file" type="file" accept=".pdf,image/*" className="w-full border rounded-md px-3 py-2 bg-white cursor-pointer" />
          <p className="text-xs text-gray-500">Supported formats: PDF, JPEG, PNG, WEBP.</p>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white font-medium rounded-md py-2 px-4 hover:bg-blue-700 transition-colors">
          Save Record
        </button>
      </form>
    </div>
  );
}
