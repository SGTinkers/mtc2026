import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  createBillingPortalSession,
  cancelMySubscription,
  getMemberDashboard,
  getMemberDependants,
  getMemberPayments,
  updateSubscriptionAmount,
} from "~/lib/server-fns.js";
import { CreditCard, ExternalLink, Receipt, AlertTriangle, ArrowRight, ArrowUp, ArrowDown, XCircle } from "lucide-react";
import { SubscriptionStatusBadge } from "~/components/subscription-status-badge.js";
import { Button } from "~/components/ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog.js";

const PRESET_AMOUNTS = [5, 10, 20, 50];

export const Route = createFileRoute("/member/payments")({
  loader: async () => {
    const [payments, dashboard, depsData] = await Promise.all([
      getMemberPayments(),
      getMemberDashboard(),
      getMemberDependants().catch(() => ({ dependants: [] })),
    ]);
    return {
      payments,
      subscription: dashboard?.subscription ?? null,
      dependantsCount: depsData.dependants.length,
    };
  },
  component: MemberPaymentsPage,
});

function MemberPaymentsPage() {
  const { payments, subscription, dependantsCount } = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-5">
      {subscription &&
        subscription.paymentMethod === "stripe" &&
        subscription.stripeCustomerId && (
          <ActiveSubscriptionCard
            subscription={subscription}
            dependantsCount={dependantsCount}
          />
        )}

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

function ActiveSubscriptionCard({
  subscription,
  dependantsCount,
}: {
  subscription: NonNullable<
    Awaited<ReturnType<typeof getMemberDashboard>>
  >["subscription"];
  dependantsCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAmount = Number(subscription!.monthlyAmount);
  const currentPlanSlug = subscription!.planSlug;
  const effectiveAmount = isCustom ? Number(customAmount) || 0 : selectedAmount ?? 0;
  const newPlanSlug = effectiveAmount >= 20 ? "pintar_plus" : "pintar";
  const newPlanName = effectiveAmount >= 20 ? "Pintar Plus" : "Pintar";
  const isPlanChange = effectiveAmount > 0 && newPlanSlug !== currentPlanSlug;
  const isUpgrade = effectiveAmount > currentAmount;
  const isDowngrade = effectiveAmount > 0 && effectiveAmount < currentAmount;
  const isDowngradeBlocked =
    currentPlanSlug === "pintar_plus" &&
    newPlanSlug === "pintar" &&
    dependantsCount > 0;
  const hasValidAmount = effectiveAmount >= 5 && effectiveAmount !== currentAmount;

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { url } = await createBillingPortalSession();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!hasValidAmount || isDowngradeBlocked || updating) return;
    setUpdating(true);
    setError(null);
    try {
      await updateSubscriptionAmount({ data: { monthlyAmount: effectiveAmount } });
      setShowChangeForm(false);
      router.invalidate();
    } catch (err: any) {
      setError(err?.message || "Failed to update subscription");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelMySubscription();
      setShowCancelDialog(false);
      setShowCancelledModal(true);
    } catch (err: any) {
      setError(err?.message || "Failed to cancel subscription");
      setShowCancelDialog(false);
    } finally {
      setCancelling(false);
    }
  };

  const coverageEndFormatted = subscription!.coverageUntil
    ? new Date(subscription!.coverageUntil).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-xl border border-g1/20 bg-g1/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-g1/20">
          <CreditCard className="h-5 w-5 text-g1" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gd">
              {subscription!.planName}
            </span>
            <SubscriptionStatusBadge status={subscription!.status as "active"} />
          </div>
          <p className="mt-0.5 text-xs text-txt2">
            ${currentAmount.toFixed(2)}/month
          </p>
        </div>
      </div>
      {subscription!.status === "active" ? (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => setShowChangeForm(!showChangeForm)}
          >
            {showChangeForm ? "Cancel" : "Change Amount"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleManageSubscription}
            disabled={loading}
          >
            {loading ? "Redirecting…" : "Manage Card"}
            {!loading && <ExternalLink className="ml-1.5 h-3.5 w-3.5" />}
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          <Link to="/donate">
            <Button size="sm" className="w-full">
              Start a New Subscription
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {showChangeForm && (
        <div className="mt-4 border-t border-g1/10 pt-4">
          <p className="mb-3 text-xs font-medium text-txt2">
            Choose new monthly amount
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((val) => (
              <button
                key={val}
                onClick={() => {
                  setSelectedAmount(val);
                  setIsCustom(false);
                  setCustomAmount("");
                  setError(null);
                }}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${!isCustom && selectedAmount === val
                    ? "bg-gdeep text-gold ring-2 ring-gold/30"
                    : val === currentAmount
                      ? "bg-g1/10 text-g1 border border-g1/20"
                      : "bg-white text-gd border border-gray-200 hover:border-g1/30"
                  }`}
              >
                ${val}
                {val === currentAmount && (
                  <span className="block text-[10px] font-normal opacity-60">
                    current
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <span className="text-sm font-semibold text-gd">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setCustomAmount(val);
                setIsCustom(true);
                setSelectedAmount(null);
                setError(null);
              }}
              onFocus={() => {
                setIsCustom(true);
                setSelectedAmount(null);
              }}
              className="flex-1 bg-transparent text-sm font-semibold text-gd outline-none placeholder:font-normal placeholder:text-txt3"
            />
            <span className="text-[10px] text-txt3">/month</span>
          </div>

          {hasValidAmount && (
            <div
              className={`mt-3 rounded-lg p-3 ${isUpgrade
                  ? "bg-g1/10 border border-g1/20"
                  : "bg-amber-50 border border-amber-200"
                }`}
            >
              <div className="flex items-center gap-2">
                {isUpgrade ? (
                  <ArrowUp className="h-4 w-4 text-g1" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-amber-600" />
                )}
                <span
                  className={`text-xs font-semibold ${isUpgrade ? "text-g1" : "text-amber-700"}`}
                >
                  {isPlanChange
                    ? `${isUpgrade ? "Upgrade" : "Downgrade"} to ${newPlanName}`
                    : `${isUpgrade ? "Increase" : "Reduce"} to $${effectiveAmount}/mo`}
                </span>
              </div>
              {isPlanChange && (
                <p className="mt-1 text-[11px] text-txt2">
                  {subscription!.planName} → {newPlanName}
                  {isUpgrade
                    ? " · You'll be charged the prorated difference"
                    : ""}
                </p>
              )}
            </div>
          )}

          {isDowngradeBlocked && effectiveAmount > 0 && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700">
                You have {dependantsCount} dependant{dependantsCount > 1 ? "s" : ""}.
                Please remove all dependants before downgrading from Pintar Plus.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={!hasValidAmount || isDowngradeBlocked || updating}
            >
              {updating
                ? "Updating…"
                : hasValidAmount
                  ? `Confirm $${effectiveAmount}/mo`
                  : "Update"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowChangeForm(false);
                setSelectedAmount(null);
                setCustomAmount("");
                setIsCustom(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-3">
            <button
              onClick={() => setShowCancelDialog(true)}
              className="text-xs text-txt3 underline underline-offset-2 hover:text-red-500 transition-colors"
            >
              Or cancel subscription
            </button>
          </div>
        </div>
      )}

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel subscription?</DialogTitle>
            <DialogDescription className="text-sm text-txt2">
              You won't be charged again.
              {coverageEndFormatted && (
                <> Your benefits will remain active until{" "}
                <span className="font-semibold text-gd">{coverageEndFormatted}</span>.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling…" : "Yes, cancel"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCancelledModal}
        onOpenChange={(open) => {
          setShowCancelledModal(open);
          if (!open) router.invalidate();
        }}
      >
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center gap-3 py-2">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-family-heading)] text-lg">
                Subscription cancelled
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-relaxed text-txt2">
              Your subscription has been cancelled.
              {coverageEndFormatted && (
                <> Your coverage and benefits will remain active until{" "}
                <span className="font-semibold text-gd">{coverageEndFormatted}</span>.</>
              )}
            </p>
            <p className="text-xs text-txt3">
              You can start a new subscription anytime from this page.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
