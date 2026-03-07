import { createFileRoute } from "@tanstack/react-router";
import { getMemberDetail } from "~/lib/server-fns.js";
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

export const Route = createFileRoute("/admin/members/$id")({
  loader: ({ params }) => getMemberDetail({ data: params.id }),
  component: MemberDetail,
});

const statusVariant = {
  active: "success",
  pending_payment: "warning",
  grace: "warning",
  lapsed: "destructive",
  cancelled: "secondary",
} as const;

function MemberDetail() {
  const { member, subscription, dependants, payments } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{member.userName}</h2>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="font-medium">{member.userEmail}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Phone</dt>
              <dd className="font-medium">{member.userPhone || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">NRIC</dt>
              <dd className="font-medium">{member.nric || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Address</dt>
              <dd className="font-medium">{member.address || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Joined</dt>
              <dd className="font-medium">
                {new Date(member.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subscription</CardTitle>
              <Badge variant={statusVariant[subscription.status] ?? "secondary"}>
                {subscription.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted-foreground">Plan</dt>
                <dd className="font-medium">{subscription.planName}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Monthly Amount</dt>
                <dd className="font-medium">
                  ${Number(subscription.monthlyAmount).toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Payment Method</dt>
                <dd className="font-medium capitalize">{subscription.paymentMethod}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Coverage Start</dt>
                <dd className="font-medium">{subscription.coverageStart}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Coverage Until</dt>
                <dd className="font-medium">{subscription.coverageUntil}</dd>
              </div>
              {subscription.graceUntil && (
                <div>
                  <dt className="text-sm text-muted-foreground">Grace Until</dt>
                  <dd className="font-medium">{subscription.graceUntil}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Dependants */}
      {dependants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dependants ({dependants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>NRIC</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependants.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.nric}</TableCell>
                    <TableCell className="capitalize">
                      {d.relationship.replace("_", " ")}
                    </TableCell>
                    <TableCell>{d.phone || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">No payments recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${Number(p.amount).toFixed(2)}</TableCell>
                    <TableCell className="capitalize">
                      {p.method.replace("_", " ")}
                    </TableCell>
                    <TableCell>{p.periodMonth || "—"}</TableCell>
                    <TableCell>{p.reference || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
