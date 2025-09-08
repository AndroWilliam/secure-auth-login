/**
 * PDF Export Utility for User Management
 * 
 * Exports user data to PDF with proper formatting and pagination.
 * Client-side only to avoid SSR issues.
 */

import { UserRow } from '@/lib/admin/types';

export interface ExportOptions {
  title?: string;
}

export async function exportUsersPdf(rows: UserRow[], opts: ExportOptions = {}) {
  console.log('Starting PDF export with', rows.length, 'rows');
  
  // Dynamic imports to avoid SSR issues
  const jsPDFModule = await import('jspdf');
  await import('jspdf-autotable');
  
  // Handle both default and named exports
  const jsPDF = jsPDFModule.default || jsPDFModule;
  
  console.log('jsPDF loaded:', !!jsPDF);

  const title = opts.title || 'User Management Export';
  const timestamp = new Date().toLocaleString();
  
  // Create new PDF document
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Add title and timestamp
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${timestamp}`, 14, 26);
  
  // Prepare table data
  const tableData = rows.map((user, index) => [
    index + 1, // Row number
    user.full_name || 'No name',
    user.email,
    user.phone || 'N/A',
    user.role.charAt(0).toUpperCase() + user.role.slice(1),
    user.status.charAt(0).toUpperCase() + user.status.slice(1),
    new Date(user.created_at).toLocaleDateString()
  ]);

  // Table columns
  const columns = [
    '#',
    'Name', 
    'Email',
    'Phone',
    'Role',
    'Status',
    'Date Created'
  ];

  // Add table with autoTable
  (doc as any).autoTable({
    head: [columns],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'left',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 }, // #
      1: { cellWidth: 35 }, // Name
      2: { cellWidth: 50 }, // Email
      3: { cellWidth: 30 }, // Phone
      4: { halign: 'center', cellWidth: 20 }, // Role
      5: { halign: 'center', cellWidth: 20 }, // Status
      6: { halign: 'center', cellWidth: 25 }  // Date Created
    },
    margin: { top: 35, left: 12, right: 12 },
    didDrawPage: (data: any) => {
      // Add page numbers
      const pageCount = doc.getNumberOfPages();
      const currentPage = data.pageNumber;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }
  });

  // Generate filename with timestamp
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
  const fileName = `users_${dateStr}_${timeStr}.pdf`;

  // Save the PDF
  doc.save(fileName);
  
  return fileName;
}
