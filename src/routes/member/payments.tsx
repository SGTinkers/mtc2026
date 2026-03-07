import { createFileRoute } from "@tanstack/react-router";
import { getMemberPayments } from "~/lib/server-fns.js";
import { Card, CardContent } from "~/components/ui/card.js";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table.js";

export const Route = createFileRoute("/member/payments")({
  loader: () => getMemberPayments(),
  component: MemberPaymentsPage,
});

function MemberPaymentsPage() {
  const payments = Route.useLoaderData();

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Payment History</h2>

      <Card>
        <CardContent className="pt-6">
          {payments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No payments recorded yet.
            </p>
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
