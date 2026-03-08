"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Badge } from "~/components/ui/badge.js";
import { SubscriptionStatusBadge } from "~/components/subscription-status-badge.js";
import { Card, CardHeader, CardContent } from "~/components/ui/card.js";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "~/components/ui/table.js";
import { UserPlus, Search, X } from "lucide-react";
import { ExportMembersDialog } from "~/components/export-members-dialog.js";
import { ImportMembersDialog } from "~/components/import-members-dialog.js";
import { useNavigate } from "@tanstack/react-router";

type Member = {
  id: string;
  userName: string | null;
  userEmail: string | null;
  nric: string | null;
  planName: string | null;
  monthlyAmount: string | null;
  subStatus: any;
};

export function MembersListView({ members, statusFilter }: { members: Member[]; statusFilter?: string }) {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  const filtered = members.filter(
    (m) =>
      m.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
      m.userEmail?.toLowerCase().includes(searchText.toLowerCase()) ||
      m.nric?.includes(searchText || ""),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Members</h2>
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
              onClick={() => navigate({ to: "/admin/members", search: {} })}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or NRIC..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
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
              {filtered.map((m) => (
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
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {filtered.length > 0 && (
              <TableCaption className="text-left px-4 pb-2">
                Showing {filtered.length} of {members.length} members
              </TableCaption>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
