"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportUsersPdf } from "@/lib/export/usersPdf";
import { UserRow } from "@/lib/admin/types";

interface ExportUsersButtonProps {
  getAllRows: () => UserRow[];
  title?: string;
}

export function ExportUsersButton({ getAllRows, title }: ExportUsersButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const rows = getAllRows();
      
      if (rows.length === 0) {
        toast.error("Nothing to export");
        return;
      }

      const fileName = await exportUsersPdf(rows, { title });
      
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
