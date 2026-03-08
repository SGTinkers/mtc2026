import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllPayments } from "~/lib/server-fns.js";
import { Button } from "~/components/ui/button.js";
import { Card, CardContent } from "~/components/ui/card.js";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from "~/components/ui/table.js";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admin/payments/")({
  loader: () => getAllPayments(),
  component: PaymentsList,
});

function PaymentsList() {
  const payments = Route.useLoaderData();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment History</h2>
        <Link to="/admin/payments/new">
          <Button>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No payments recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Member</TableHead>
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
                    <TableCell>
                      <div>
                        <div className="font-medium">{p.memberName}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.memberEmail}
                        </div>
                      </div>
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
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>Total ({payments.length})</TableCell>
                  <TableCell className="font-bold">
                    ${payments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)}
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
