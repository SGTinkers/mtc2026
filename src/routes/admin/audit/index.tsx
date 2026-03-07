import { useState, useRef, useEffect, useCallback } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getAuditLogs, searchUsersForAudit } from "~/lib/server-fns.js";
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
import { Combobox } from "~/components/ui/combobox.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog.js";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { DatePicker } from "~/components/ui/date-picker.js";

type AuditSearch = {
  page: number;
  entityType?: string;
  action?: string;
  user?: string;
  fromDate?: string;
  toDate?: string;
};

export const Route = createFileRoute("/admin/audit/")({
  validateSearch: (search: Record<string, unknown>): AuditSearch => ({
    page: Number(search.page) || 1,
    entityType: (search.entityType as string) || undefined,
    action: (search.action as string) || undefined,
    user: (search.user as string) || undefined,
    fromDate: (search.fromDate as string) || undefined,
    toDate: (search.toDate as string) || undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getAuditLogs({ data: deps }),
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

function PaginationControls({
  page,
  totalPages,
  filters,
}: {
  page: number;
  totalPages: number;
  filters: Omit<AuditSearch, "page">;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="sticky -bottom-8 z-10 -mx-8 mt-4 flex items-center justify-between bg-background px-8 py-4">
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Link to="/admin/audit" search={{ ...filters, page: page - 1 }} disabled={page <= 1}>
          <Button variant="outline" size="sm" disabled={page <= 1}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
        </Link>
        <Link to="/admin/audit" search={{ ...filters, page: page + 1 }} disabled={page >= totalPages}>
          <Button variant="outline" size="sm" disabled={page >= totalPages}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function MultiSelect({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: readonly string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (value: string) => {
    const next = new Set(selected);
    next.has(value) ? next.delete(value) : next.add(value);
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-h-10 w-full cursor-pointer items-center gap-1 rounded-md border border-input bg-white px-3 py-1.5 text-sm ring-offset-background transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex flex-1 flex-wrap gap-1">
            {selected.size === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {[...selected].map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
              >
                {v.replace(/_/g, " ")}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-primary/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                />
              </span>
            ))}
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white py-1 shadow-md">
            {options.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selected.has(opt)}
                  onChange={() => toggle(opt)}
                  className="h-4 w-4 rounded border-gray-300 accent-primary"
                />
                {opt.replace(/_/g, " ")}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ENTITY_TYPES = ["member", "payment", "subscription"] as const;
const ACTIONS = [
  "registered",
  "self_registered",
  "recorded",
  "profile_updated",
  "cancelled",
  "resubscribed",
  "cancelled_for_resubscription",
] as const;

function FilterBar() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  type AuditUser = { id: string; name: string | null; email: string };

  const [entityTypes, setEntityTypes] = useState<Set<string>>(new Set(search.entityType?.split(",").filter(Boolean) ?? []));
  const [actions, setActions] = useState<Set<string>>(new Set(search.action?.split(",").filter(Boolean) ?? []));
  const [selectedUser, setSelectedUser] = useState<AuditUser | null>(
    search.user ? { id: "", name: search.user, email: "" } : null,
  );
  const [fromDate, setFromDate] = useState(search.fromDate ?? "");
  const [toDate, setToDate] = useState(search.toDate ?? "");

  const handleSearchUsers = useCallback(
    (query: string) => searchUsersForAudit({ data: query }),
    [],
  );

  const activeCount = [search.entityType, search.action, search.user, search.fromDate, search.toDate].filter(Boolean).length;

  const applyFilters = () => {
    setOpen(false);
    navigate({
      to: "/admin/audit",
      search: {
        page: 1,
        entityType: entityTypes.size > 0 ? [...entityTypes].join(",") : undefined,
        action: actions.size > 0 ? [...actions].join(",") : undefined,
        user: selectedUser?.name || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      },
    });
  };

  const clearFilters = () => {
    setEntityTypes(new Set());
    setActions(new Set());
    setSelectedUser(null);
    setFromDate("");
    setToDate("");
    setOpen(false);
    navigate({ to: "/admin/audit", search: { page: 1 } });
  };

  return (
    <div className="mb-4 flex items-center gap-2">
      <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpen(true)}>
        <Filter className="mr-1.5 h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <Badge variant="default" className="ml-1.5 text-xs">
            {activeCount}
          </Badge>
        )}
      </Button>
      {activeCount > 0 && (
        <Button size="sm" variant="ghost" onClick={clearFilters}>
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Audit Logs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">User</label>
              <Combobox
                onSearch={handleSearchUsers}
                value={selectedUser}
                onSelect={setSelectedUser}
                getOptionValue={(u) => u.id}
                getOptionLabel={(u) => u.name || u.email}
                renderOption={(u) => (
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                )}
                placeholder="Search by name or email..."
              />
            </div>
            <MultiSelect
              label="Entity type"
              placeholder="All entities"
              options={ENTITY_TYPES}
              selected={entityTypes}
              onChange={setEntityTypes}
            />
            <MultiSelect
              label="Action"
              placeholder="All actions"
              options={ACTIONS}
              selected={actions}
              onChange={setActions}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">From date</label>
                <DatePicker value={fromDate} onChange={setFromDate} placeholder="Start date" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">To date</label>
                <DatePicker value={toDate} onChange={setToDate} placeholder="End date" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
              <Button size="sm" onClick={applyFilters}>
                Apply filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditTrail() {
  const { rows, total, page, pageSize } = Route.useLoaderData();
  const search = Route.useSearch();
  const { page: _, ...filters } = search;
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

      <FilterBar />

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

      <PaginationControls page={page} totalPages={totalPages} filters={filters} />

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
