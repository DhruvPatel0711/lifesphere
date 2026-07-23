import { addMedicine } from "../actions";
import Link from "next/link";

export default function NewMedicinePage() {
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/medicine" className="text-gray-500 hover:text-black">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Add Medicine</h1>
      </div>

      <form action={addMedicine} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Medicine Name</label>
            <input id="name" name="name" required className="w-full border rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" placeholder="e.g. Lisinopril" />
          </div>
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">Type</label>
            <select id="type" name="type" required className="w-full border rounded-md px-3 py-2 bg-white focus:ring-red-500 focus:border-red-500">
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="syrup">Syrup</option>
              <option value="injection">Injection</option>
              <option value="drops">Drops</option>
              <option value="cream">Cream</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="dosage" className="text-sm font-medium">Dosage</label>
            <input id="dosage" name="dosage" required className="w-full border rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" placeholder="e.g. 10mg" />
          </div>
          <div className="space-y-2">
            <label htmlFor="frequency" className="text-sm font-medium">Frequency</label>
            <select id="frequency" name="frequency" required className="w-full border rounded-md px-3 py-2 bg-white focus:ring-red-500 focus:border-red-500">
              <option value="once_daily">Once Daily</option>
              <option value="twice_daily">Twice Daily</option>
              <option value="thrice_daily">Thrice Daily</option>
              <option value="once_weekly">Once Weekly</option>
              <option value="as_needed">As Needed</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="times" className="text-sm font-medium">Reminder Times (Comma separated)</label>
          <input id="times" name="times" className="w-full border rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" placeholder="e.g. 08:00, 20:00" />
          <p className="text-xs text-gray-500">Optional: Used for daily push notifications if enabled.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="totalPills" className="text-sm font-medium">Total Quantity</label>
            <input id="totalPills" name="totalPills" type="number" required defaultValue="30" className="w-full border rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
          </div>
          <div className="space-y-2">
            <label htmlFor="purpose" className="text-sm font-medium">Purpose (Optional)</label>
            <input id="purpose" name="purpose" className="w-full border rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" placeholder="e.g. Blood Pressure" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-medium">Start Date (Optional)</label>
            <input id="startDate" name="startDate" type="date" className="w-full border rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
          </div>
          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-medium">End Date (Optional)</label>
            <input id="endDate" name="endDate" type="date" className="w-full border rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
          </div>
        </div>

        <button type="submit" className="w-full bg-red-500 text-white font-medium rounded-md py-2.5 px-4 hover:bg-red-600 transition-colors">
          Save Medicine
        </button>
      </form>
    </div>
  );
}
