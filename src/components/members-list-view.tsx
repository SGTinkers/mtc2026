"use client";

import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Badge } from "~/components/ui/badge.js";
import { SubscriptionStatusBadge } from "~/components/subscription-status-badge.js";
import { Card, CardContent } from "~/components/ui/card.js";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "~/components/ui/table.js";
import { UserPlus, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ExportMembersDialog } from "~/components/export-members-dialog.js";
import { ImportMembersDialog } from "~/components/import-members-dialog.js";

type Member = {
  id: string;
  userName: string | null;
  userEmail: string | null;
  nric: string | null;
  planName: string | null;
  monthlyAmount: string | null;
  subStatus: any;
};

export function MembersListView({
  rows,
  total,
  page,
  pageSize,
  statusFilter,
  searchText,
}: {
  rows: Member[];
  total: number;
  page: number;
  pageSize: number;
  statusFilter?: string;
  searchText: string;
}) {
  const navigate = useNavigate();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [localSearch, setLocalSearch] = useState(searchText);

  const currentFilters = {
    status: statusFilter,
    search: searchText || undefined,
  };

  function submitSearch() {
    const trimmed = localSearch.trim();
    navigate({
      to: "/admin/members",
      search: { page: 1, status: statusFilter, search: trimmed || undefined },
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Members</h2>
          <p className="text-sm text-muted-foreground">{total} total members</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportMembersDialog />
          <ExportMembersDialog />
          <Link to="/admin/members/new">
            <Button>
              <UserPlus className="h-4 w-4" />
              Register Member
            </Button>
          </Link>
        </div>
      </div>

      {statusFilter && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-sm">
            Status: {statusFilter.replace("_", " ")}
            <button
              type="button"
              onClick={() => navigate({ to: "/admin/members", search: { page: 1 } })}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or NRIC..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitSearch()}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No members found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monthly Contribution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.userName}</TableCell>
                    <TableCell>{m.userEmail}</TableCell>
                    <TableCell>{m.planName ?? "—"}</TableCell>
                    <TableCell>
                      {m.monthlyAmount ? `$${Number(m.monthlyAmount).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>
                      {m.subStatus ? (
                        <SubscriptionStatusBadge status={m.subStatus} />
                      ) : (
                        <Badge variant="outline">No sub</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/admin/members/$id"
                        params={{ id: m.id }}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {rows.length > 0 && (
                <TableCaption className="text-left px-4 pb-2">
                  Showing {rows.length} of {total} members
                </TableCaption>
              )}
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="sticky bottom-0 z-10 -mx-8 mt-4 flex items-center justify-between bg-background px-8 py-4">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Link to="/admin/members" search={{ ...currentFilters, page: page - 1 }} disabled={page <= 1}>
              <Button variant="outline" size="sm" disabled={page <= 1}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            </Link>
            <Link to="/admin/members" search={{ ...currentFilters, page: page + 1 }} disabled={page >= totalPages}>
              <Button variant="outline" size="sm" disabled={page >= totalPages}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
