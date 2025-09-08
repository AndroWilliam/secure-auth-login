/**
 * PDF Export Utility for User Management
 * 
 * Exports user data to PDF with proper formatting and pagination.
 * Client-side only to avoid SSR issues.
 */

import { UserRow } from '@/lib/admin/types';

export type User = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;      // "Admin" | "Moderator" | "Viewer" (string OK for now)
  status: string;    // "Active" | "Idle" | "Inactive"
  createdAt?: string | Date;
};

export interface ExportOptions {
  title?: string;
}

export async function exportUsersPdf(rows: UserRow[], opts: ExportOptions = {}) {
  console.log('Starting PDF export with', rows.length, 'rows');
  
  // Dynamic imports to avoid SSR issues
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  // Handle ESM/CJS interop + v3 API
  const autoTable =
    (autoTableMod as any).default ||
    (autoTableMod as any).autoTable ||
    autoTableMod;

  console.log('jsPDF loaded:', !!jsPDF);
  console.log('autoTable loaded:', !!autoTable);

  const title = opts.title || 'User Management Export';
  const ts = new Date();
  const tsLabel = ts.toLocaleString();

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.text(title, 40, 30);
  doc.setFontSize(10);
  doc.text(`Exported: ${tsLabel}`, 40, 46);

  const head = [["#", "Name", "Email", "Phone", "Role", "Status", "Date Created"]];
  const body = (rows || []).map((u, idx) => [
    String(idx + 1),
    u.full_name || "",
    u.email || "",
    u.phone || "",
    u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "",
    u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : "",
    u.created_at ? new Date(u.created_at).toLocaleDateString() : "",
  ]);

  // v3 style call: autoTable(doc, options)
  (autoTable as any)(doc, {
    head,
    body,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [30, 30, 30], textColor: 255 },
    margin: { top: 60, left: 40, right: 40, bottom: 40 },
    didDrawPage: (data: any) => {
      const page = doc.getNumberOfPages();
      doc.setFontSize(9);
      doc.text(`Page ${page}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 20);
    },
  });

  const pad = (n: number) => String(n).padStart(2, "0");
  const fname = `users_${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())}_${pad(ts.getHours())}-${pad(ts.getMinutes())}.pdf`;
  
  doc.save(fname);
  console.log('PDF saved as:', fname);
  
  return fname;
}
