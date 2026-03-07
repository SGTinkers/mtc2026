import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getAuditLogs } from "~/lib/server-fns.js";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card.js";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table.js";
import { Badge } from "~/components/ui/badge.js";
import { Button } from "~/components/ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog.js";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/audit/")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ deps: { page } }) => getAuditLogs({ data: { page } }),
  component: AuditTrail,
});

const entityVariant: Record<string, "default" | "success" | "warning"> = {
  member: "default",
  payment: "success",
  subscription: "warning",
};

function formatDetails(action: string, newValue: unknown): string {
  if (!newValue || typeof newValue !== "object") return "—";
  const v = newValue as Record<string, unknown>;

  switch (action) {
    case "registered":
    case "self_registered":
      return [v.name, v.email].filter(Boolean).join(" — ");
    case "recorded":
      return [`$${v.amount}`, v.method].filter(Boolean).join(" via ");
    case "profile_updated": {
      const fields = Object.keys(v);
      return `Updated ${fields.join(", ")}`;
    }
    case "cancelled":
      return "Subscription cancelled";
    default: {
      const json = JSON.stringify(v);
      return json.length > 80 ? json.slice(0, 80) + "..." : json;
    }
  }
}

function PaginationControls({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  return (
    <div className="sticky -bottom-8 z-10 -mx-8 mt-4 flex items-center justify-between bg-background px-8 py-4">
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Link to="/admin/audit" search={{ page: page - 1 }} disabled={page <= 1}>
          <Button variant="outline" size="sm" disabled={page <= 1}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
        </Link>
        <Link to="/admin/audit" search={{ page: page + 1 }} disabled={page >= totalPages}>
          <Button variant="outline" size="sm" disabled={page >= totalPages}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function AuditTrail() {
  const { rows, total, page, pageSize } = Route.useLoaderData();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [selectedRow, setSelectedRow] = useState<(typeof rows)[number] | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Audit Trail</h2>
        <p className="text-sm text-muted-foreground">
          {total} total entries
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No audit log entries yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(row.createdAt), "dd MMM yyyy, h:mmaaa")}
                    </TableCell>
                    <TableCell>
                      {row.performerName ?? "System"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entityVariant[row.entityType] ?? "default"}>
                        {row.entityType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {row.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="max-w-xs cursor-pointer truncate text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedRow(row)}
                    >
                      {formatDetails(row.action, row.newValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaginationControls page={page} totalPages={totalPages} />

      <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Details</DialogTitle>
            <DialogDescription>
              {selectedRow?.action.replace(/_/g, " ")} — {selectedRow?.entityType}
            </DialogDescription>
          </DialogHeader>
          {selectedRow?.newValue && (
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm">
              {JSON.stringify(selectedRow.newValue, null, 2)}
            </pre>
          )}
          {selectedRow?.oldValue && (
            <>
              <p className="text-sm font-medium">Previous value</p>
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm">
                {JSON.stringify(selectedRow.oldValue, null, 2)}
              </pre>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
