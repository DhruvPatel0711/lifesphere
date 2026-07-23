/**
 * Client-Side Health Data Exporter (CSV & PDF)
 */

export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map(row =>
      headers
        .map(header => {
          const val = row[header] === null || row[header] === undefined ? "" : String(row[header]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printHealthReport(user: { name?: string; email?: string }, records: Array<{ title: string; category: string; doctor?: string; hospital?: string; date?: string }>, medicines: Array<{ name: string; dosage: string; frequency: string; type: string }>) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>LifeOS Comprehensive Health Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; color: #1e293b; }
        h1 { color: #2563eb; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        h2 { color: #0f172a; font-size: 16px; margin-top: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        th { background-color: #f1f5f9; font-weight: bold; }
        .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <h1>LifeOS — Personal Health Record Summary</h1>
      <p><strong>Generated For:</strong> ${user?.name || user?.email || "Patient"}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

      <h2>Medical Records Vault</h2>
      <table>
        <thead>
          <tr><th>Title</th><th>Category</th><th>Doctor</th><th>Hospital</th><th>Date</th></tr>
        </thead>
        <tbody>
          ${records.map(r => `<tr><td>${r.title}</td><td>${r.category}</td><td>${r.doctor || "-"}</td><td>${r.hospital || "-"}</td><td>${r.date || "-"}</td></tr>`).join("")}
        </tbody>
      </table>

      <h2>Active Prescription Medicines</h2>
      <table>
        <thead>
          <tr><th>Medicine Name</th><th>Dosage</th><th>Frequency</th><th>Type</th></tr>
        </thead>
        <tbody>
          ${medicines.map(m => `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.type}</td></tr>`).join("")}
        </tbody>
      </table>

      <div class="footer">Confidential Health Record Summary • Generated securely via LifeOS</div>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
