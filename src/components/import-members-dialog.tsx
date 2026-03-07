"use client";

import { useState, useRef } from "react";
import { Button } from "~/components/ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog.js";
import { Upload } from "lucide-react";
import { importMembersCsv } from "~/lib/server-fns.js";
import { parseCsv } from "~/lib/csv.js";

export function ImportMembersDialog() {
  const [open, setOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<{ imported: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setResults(null);

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      
      if (rows.length === 0) {
        alert("The CSV file is empty or invalid.");
        return;
      }

      const result = await importMembersCsv({ data: { rows } });
      setResults({
        imported: result.importedCount,
        errors: result.errors,
      });

    } catch (error) {
      console.error("Import failed:", error);
      alert("An error occurred during import.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClose = () => {
    const wasSuccess = results && results.imported > 0;
    setOpen(false);
    setResults(null);
    if (wasSuccess) {
      window.location.reload();
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Members from CSV</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {!results ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file containing member data. Expected columns:
                  <br/>
                  <code className="bg-muted p-1 rounded mt-2 block overflow-x-auto text-xs whitespace-nowrap">
                    Name, Email, Phone, NRIC, DOB, Address, PostalCode, Plan, MonthlyAmount, Dependants
                  </code>
                </p>
                <div className="flex justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 hover:bg-muted/50 transition-colors">
                  <div className="text-center space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={isImporting}
                      />
                      <Button 
                        variant="secondary" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                      >
                        {isImporting ? "Processing..." : "Select CSV File"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 text-green-900 rounded-md">
                  Successfully imported {results.imported} members.
                </div>
                
                {results.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-900">Errors ({results.errors.length}):</h4>
                    <div className="max-h-40 overflow-y-auto bg-red-50 p-2 rounded-md border border-red-100">
                      <ul className="text-sm text-red-800 space-y-1">
                        {results.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <Button className="w-full" onClick={handleClose}>
                  Done
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
