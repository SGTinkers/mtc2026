import { createFileRoute } from "@tanstack/react-router";
import { getMemberSubscriptions } from "~/lib/server-fns.js";
import { Badge } from "~/components/ui/badge.js";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card.js";

export const Route = createFileRoute("/member/subscription")({
  loader: () => getMemberSubscriptions(),
  component: SubscriptionPage,
});

const statusVariant = {
  active: "success",
  pending_payment: "warning",
  grace: "warning",
  lapsed: "destructive",
  cancelled: "secondary",
} as const;

function SubscriptionPage() {
  const allSubscriptions = Route.useLoaderData();

  if (!allSubscriptions?.length) {
    return (
      <div>
        <h2 className="mb-6 text-2xl font-bold">Subscription</h2>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No active subscription found. Contact the mosque to get started.
          </CardContent>
        </Card>
      </div>
    );
  }

  const subscription = allSubscriptions[0]!;
  const pastSubscriptions = allSubscriptions.slice(1);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Subscription</h2>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Badge variant={statusVariant[subscription.status]}>
              {subscription.status.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Plan</dt>
              <dd className="mt-1 text-lg font-semibold">{subscription.planName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Monthly Amount</dt>
              <dd className="mt-1 text-lg font-semibold">
                ${Number(subscription.monthlyAmount).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Payment Method</dt>
              <dd className="mt-1 font-medium capitalize">
                {subscription.paymentMethod}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Course Discount</dt>
              <dd className="mt-1 font-medium">{subscription.courseDiscount}%</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Coverage Start</dt>
              <dd className="mt-1 font-medium">{subscription.coverageStart}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Coverage Until</dt>
              <dd className="mt-1 font-medium">{subscription.coverageUntil}</dd>
            </div>
            {subscription.graceUntil && (
              <div>
                <dt className="text-sm text-muted-foreground">Grace Until</dt>
                <dd className="mt-1 font-medium text-amber-600">
                  {subscription.graceUntil}
                </dd>
              </div>
            )}
            {subscription.maxDependants !== null && (
              <div>
                <dt className="text-sm text-muted-foreground">Max Dependants</dt>
                <dd className="mt-1 font-medium">{subscription.maxDependants}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {pastSubscriptions.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">Past Subscriptions</h3>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Coverage</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastSubscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{sub.planName}</td>
                      <td className="px-4 py-3">
                        ${Number(sub.monthlyAmount).toFixed(2)}/mo
                      </td>
                      <td className="px-4 py-3">
                        {sub.coverageStart} — {sub.coverageUntil}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[sub.status]}>
                          {sub.status.replace("_", " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
