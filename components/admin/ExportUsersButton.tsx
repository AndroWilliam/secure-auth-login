"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportUsersPdf } from "@/lib/export/usersPdf";
import { UserRow } from "@/lib/admin/types";

interface ExportUsersButtonProps {
  getAllRows: () => Promise<UserRow[]>;
  title?: string;
}

export function ExportUsersButton({ getAllRows, title }: ExportUsersButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      console.log('Export button clicked');
      setIsExporting(true);
      
      console.log('Fetching all rows...');
      const rows = await getAllRows();
      console.log('Got rows:', rows.length);
      
      if (rows.length === 0) {
        toast.error("Nothing to export");
        return;
      }

      console.log('Calling exportUsersPdf...');
      const fileName = await exportUsersPdf(rows, { title });
      console.log('Export completed:', fileName);
      
      toast.success(`Exported ${rows.length} users to PDF`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export users to PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="border-gray-600 text-gray-300 hover:bg-gray-800"
      aria-label="Export users as PDF"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      {isExporting ? "Exporting..." : "Export to PDF"}
    </Button>
  );
}
