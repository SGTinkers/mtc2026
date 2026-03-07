import { createFileRoute } from "@tanstack/react-router";
import { getMemberPayments } from "~/lib/server-fns.js";
import { Receipt, XCircle } from "lucide-react";

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
          {payments.map((p) => {
            const isFailed = p.status === "failed";
            return (
              <div
                key={p.id}
                className={`flex items-center gap-4 rounded-xl border p-4 ${isFailed ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isFailed ? "bg-red-100" : "bg-g1/10"}`}>
                  {isFailed ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Receipt className="h-5 w-5 text-g1" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isFailed ? "text-red-700" : "text-gd"}`}>
                      ${Number(p.amount).toFixed(2)}
                      {isFailed && (
                        <span className="ml-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                          Failed
                        </span>
                      )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
