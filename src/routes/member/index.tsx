import { createFileRoute } from "@tanstack/react-router";
import { getMemberDashboard } from "~/lib/server-fns.js";
import { Badge } from "~/components/ui/badge.js";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card.js";
import { ShieldCheck, ShieldAlert, ShieldX, Clock } from "lucide-react";

export const Route = createFileRoute("/member/")({
  loader: () => getMemberDashboard(),
  component: MemberDashboard,
});

const statusConfig = {
  active: {
    label: "Active",
    variant: "success" as const,
    icon: ShieldCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  grace: {
    label: "Grace Period",
    variant: "warning" as const,
    icon: ShieldAlert,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  lapsed: {
    label: "Lapsed",
    variant: "destructive" as const,
    icon: ShieldX,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  pending_payment: {
    label: "Pending Payment",
    variant: "warning" as const,
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  cancelled: {
    label: "Cancelled",
    variant: "secondary" as const,
    icon: ShieldX,
    color: "text-gray-600",
    bg: "bg-gray-50",
  },
};

function MemberDashboard() {
  const data = Route.useLoaderData();

  if (!data || !data.subscription) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ShieldX className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Active Subscription</h2>
        <p className="mt-2 text-muted-foreground">
          Please contact the mosque to set up your Skim Pintar subscription.
        </p>
      </div>
    );
  }

  const { subscription } = data;
  const config = statusConfig[subscription.status];
  const StatusIcon = config.icon;

  const coverageEnd = new Date(subscription.coverageUntil);
  const today = new Date();
  const daysLeft = Math.ceil(
    (coverageEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">My Coverage</h2>

      {/* Status Card */}
      <Card className={`mb-6 border-2 ${config.bg}`}>
        <CardContent className="flex items-center gap-6 p-8">
          <StatusIcon className={`h-16 w-16 ${config.color}`} />
          <div>
            <Badge variant={config.variant} className="mb-2 text-sm">
              {config.label}
            </Badge>
            <p className="text-lg font-semibold">
              {subscription.status === "active"
                ? `Covered until ${coverageEnd.toLocaleDateString()}`
                : subscription.status === "grace"
                  ? `Grace period — ${daysLeft} days remaining`
                  : `Coverage ended ${coverageEnd.toLocaleDateString()}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plan Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-medium">{subscription.planName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Monthly Amount</dt>
                <dd className="font-medium">
                  ${Number(subscription.monthlyAmount).toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Course Discount</dt>
                <dd className="font-medium">{subscription.courseDiscount}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Coverage Start</dt>
                <dd className="font-medium">{subscription.coverageStart}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Method</dt>
                <dd className="font-medium capitalize">
                  {subscription.paymentMethod}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Next Due</dt>
                <dd className="font-medium">
                  {coverageEnd.toLocaleDateString()}
                </dd>
              </div>
              {subscription.maxDependants !== null && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Dependant Slots</dt>
                  <dd className="font-medium">
                    Up to {subscription.maxDependants}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
