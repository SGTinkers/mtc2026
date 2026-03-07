import { createFileRoute } from "@tanstack/react-router";
import { getMemberSubscriptions } from "~/lib/server-fns.js";
import { Badge } from "~/components/ui/badge.js";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card.js";
import { ShieldCheck, ShieldAlert, ShieldX, Clock, Shield, Users, Check, Heart } from "lucide-react";
import { PINTAR_PERKS, PINTAR_PLUS_ALL_PERKS } from "~/lib/perks.js";

export const Route = createFileRoute("/member/")({
  loader: () => getMemberSubscriptions(),
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
  const allSubscriptions = data.subscriptions;
  const totalContributed = Number(data.totalContributed);

  if (!allSubscriptions?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ShieldX className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Active Skim</h2>
        <p className="mt-2 text-muted-foreground">
          Please contact the mosque to set up your Skim Pintar donation.
        </p>
      </div>
    );
  }

  const subscription = allSubscriptions[0]!;
  const pastSubscriptions = allSubscriptions.slice(1);
  const config = statusConfig[subscription.status];
  const StatusIcon = config.icon;

  const coverageEnd = new Date(subscription.coverageUntil);
  const today = new Date();
  const daysLeft = Math.ceil(
    (coverageEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  const formatDate = (d: Date) => d.toLocaleDateString("en-SG");

  return (
    <div>
      {/* Total Contributed */}
      {totalContributed > 0 && (
        <div
          className="member-total-reveal relative mb-6 overflow-hidden rounded-2xl p-6 text-center"
          style={{
            background:
              "linear-gradient(135deg, #FFFDF5 0%, #FEF3C7 100%)",
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20">
              <Heart size={20} className="text-gold fill-gold" />
            </div>
            <p className="text-sm font-medium text-gd/70">
              Total Contributed to Date
            </p>
            <p className="member-total-amount font-[family-name:var(--font-family-heading)] text-4xl font-bold text-gdeep">
              ${totalContributed.toFixed(2)}
            </p>
            <p className="text-xs text-gd/50">
              Jazakallahu khairan for your generosity
            </p>
          </div>
        </div>
      )}

      <h2 className="mb-6 text-2xl font-bold">My Skim Pintar</h2>

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
                ? `Active until ${formatDate(coverageEnd)}`
                : subscription.status === "grace"
                  ? `Grace period — ${daysLeft} days remaining`
                  : `Ended ${formatDate(coverageEnd)}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skim Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Skim Details</CardTitle>
            <Badge variant={config.variant}>
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Tier</dt>
              <dd className="mt-1 text-lg font-semibold">{subscription.planName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Monthly Contribution</dt>
              <dd className="mt-1 text-lg font-semibold">
                ${Number(subscription.monthlyAmount).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Start Date</dt>
              <dd className="mt-1 font-medium">{subscription.coverageStart}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Active Until</dt>
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
          </dl>
        </CardContent>
      </Card>

      {/* Your Perks */}
      {(() => {
        const isPintarPlus = subscription.planSlug === "pintar_plus";
        const perks = isPintarPlus ? PINTAR_PLUS_ALL_PERKS : PINTAR_PERKS;
        return (
          <div
            className="gift-shimmer-auto relative mt-6 overflow-hidden rounded-[24px] border border-white/10"
            style={{
              background:
                "linear-gradient(150deg, #032A21 0%, #085A44 60%, #0D7C5F 100%)",
            }}
          >
            <div className="gift-shimmer member-card-shimmer" />

            <div className="relative z-10 flex flex-col gap-5 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPintarPlus ? (
                    <Users size={18} className="text-gold" />
                  ) : (
                    <Shield size={18} className="text-mint" />
                  )}
                  <span className="font-[family-name:var(--font-family-heading)] text-lg font-bold text-white">
                    Your Perks
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    isPintarPlus
                      ? "bg-gold/20 text-gold"
                      : "bg-mint/20 text-mint"
                  }`}
                >
                  {subscription.planName}
                </span>
              </div>

              <div
                className={`h-px ${isPintarPlus ? "bg-gold/20" : "bg-mint/20"}`}
              />

              <div className="member-perk-stagger flex flex-col gap-2.5">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2.5">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        isPintarPlus ? "bg-gold/20" : "bg-mint/20"
                      }`}
                    >
                      <Check
                        size={12}
                        className={isPintarPlus ? "text-gold" : "text-mint"}
                      />
                    </div>
                    <span className="text-sm text-white">{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Past Donations */}
      {pastSubscriptions.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">Past Skims</h3>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Tier</th>
                    <th className="px-4 py-3 font-medium">Contribution</th>
                    <th className="px-4 py-3 font-medium">Period</th>
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
                        <Badge variant={statusConfig[sub.status].variant}>
                          {statusConfig[sub.status].label}
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
