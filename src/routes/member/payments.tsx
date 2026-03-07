import { createFileRoute } from "@tanstack/react-router";
import { getMemberPayments } from "~/lib/server-fns.js";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/member/payments")({
  loader: () => getMemberPayments(),
  component: MemberPaymentsPage,
});

function MemberPaymentsPage() {
  const payments = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-[family-name:var(--font-family-heading)] text-xl font-bold text-gd lg:text-2xl">
        Payment History
      </h2>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Receipt className="h-12 w-12 text-txt3" />
          <p className="mt-4 text-sm text-txt2">No payments recorded yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-g1/10">
                <Receipt className="h-5 w-5 text-g1" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gd">
                    ${Number(p.amount).toFixed(2)}
                  </span>
                  <span className="text-xs text-txt3">
                    {new Date(p.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs capitalize text-txt2">
                    {p.method.replace("_", " ")}
                  </span>
                  {p.periodMonth && (
                    <>
                      <span className="text-xs text-txt3">&middot;</span>
                      <span className="text-xs text-txt3">
                        {p.periodMonth}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
