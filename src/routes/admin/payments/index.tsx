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
  TableCaption,
} from "~/components/ui/table.js";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

type PaymentsSearch = {
  page: number;
};

export const Route = createFileRoute("/admin/payments/")({
  validateSearch: (search: Record<string, unknown>): PaymentsSearch => ({
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getAllPayments({ data: { page: deps.page } }),
  component: PaymentsList,
});

function PaymentsList() {
  const { rows, total, page, pageSize } = Route.useLoaderData();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment History</h2>
          <p className="text-sm text-muted-foreground">{total} total payments</p>
        </div>
        <Link to="/admin/payments/new">
          <Button>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
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
                {rows.map((p) => (
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
              {rows.length > 0 && (
                <TableCaption className="text-left px-4 pb-2">
                  Showing {rows.length} of {total} payments
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
            <Link to="/admin/payments" search={{ page: page - 1 }} disabled={page <= 1}>
              <Button variant="outline" size="sm" disabled={page <= 1}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            </Link>
            <Link to="/admin/payments" search={{ page: page + 1 }} disabled={page >= totalPages}>
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
