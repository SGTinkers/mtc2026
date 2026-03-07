import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getMembers } from "~/lib/server-fns.js";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Badge } from "~/components/ui/badge.js";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card.js";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table.js";
import { UserPlus, Search } from "lucide-react";

export const Route = createFileRoute("/admin/members/")({
  loader: () => getMembers(),
  component: MembersList,
});

const statusVariant = {
  active: "success",
  pending_payment: "warning",
  grace: "warning",
  lapsed: "destructive",
  cancelled: "secondary",
} as const;

function MembersList() {
  const members = Route.useLoaderData();
  const [search, setSearch] = useState("");

  const filtered = members.filter(
    (m) =>
      m.userName?.toLowerCase().includes(search.toLowerCase()) ||
      m.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      m.nric?.includes(search),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Members</h2>
        <Link to="/admin/members/new">
          <Button>
            <UserPlus className="h-4 w-4" />
            Register Member
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or NRIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                <TableHead>Amount</TableHead>
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
                      <Badge variant={statusVariant[m.subStatus] ?? "secondary"}>
                        {m.subStatus.replace("_", " ")}
                      </Badge>
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
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
