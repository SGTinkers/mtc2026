import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  getMemberDependants,
  addDependant,
  removeDependant,
  updateSubscriptionAmount,
} from "~/lib/server-fns.js";
import { Plus, X, Users, Heart, UserPlus, Shield, ArrowUp, Info, Check, PartyPopper, ChevronDown, ChevronUp } from "lucide-react";
import { DatePicker } from "~/components/ui/date-picker.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog.js";
import { PINTAR_PLUS_ALL_PERKS } from "~/lib/perks.js";

export const Route = createFileRoute("/member/dependants")({
  loader: () => getMemberDependants(),
  component: DependantsPage,
});

const relationshipLabels: Record<string, string> = {
  spouse: "Spouse",
  child: "Child",
  parent: "Parent",
  in_law: "Parent-in-law",
  sibling: "Sibling",
};

function DependantsPage() {
  const { dependants: deps, canAdd, canUpgrade, memberId } = Route.useLoaderData();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedDeps, setExpandedDeps] = useState<Set<string>>(new Set());

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!memberId) return;
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      await addDependant({
        data: {
          memberId,
          name: form.get("name") as string,
          dob: (form.get("dob") as string) || undefined,
          relationship: form.get("relationship") as
            | "spouse"
            | "child"
            | "parent"
            | "in_law"
            | "sibling",
        },
      });
      setShowForm(false);
      router.invalidate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add dependant",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemoving(id);
    await removeDependant({ data: id });
    router.invalidate();
    setRemoving(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-family-heading)] text-xl font-bold text-gd lg:text-2xl">
          Family Members
        </h2>
        {canAdd && !showForm && deps.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-g1 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-g2"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      {/* No subscription */}
      {!memberId && (
        <EmptyState
          icon={<Shield className="h-8 w-8 text-txt3" />}
          title="No active subscription"
          desc="Contact the mosque to get started."
        />
      )}

      {/* Plan doesn't support dependants */}
      {memberId && !canAdd && deps.length === 0 && (
        <UpgradePrompt canUpgrade={canUpgrade} onUpgraded={() => router.invalidate()} />
      )}

      {/* Can add but no deps yet */}
      {memberId && canAdd && deps.length === 0 && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 py-10 cursor-pointer transition-all hover:border-g1/40"
        >
          <UserPlus className="h-8 w-8 text-txt3" />
          <div className="text-center">
            <p className="text-sm font-semibold text-gd">
              Add your first family member
            </p>
            <p className="mt-0.5 text-xs text-txt2">
              Extend your coverage to loved ones
            </p>
          </div>
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-g1/20 bg-white p-5">
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gd/70">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="e.g. Siti binte Ahmad"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gd placeholder-txt3 outline-none transition-all focus:border-g1 focus:ring-2 focus:ring-g1/10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gd/70">
                Date of Birth
              </label>
              <DatePicker
                name="dob"
                placeholder="Pick a date"
                className="h-auto rounded-xl border-gray-200 px-4 py-3 text-gd hover:bg-white focus-visible:border-g1 focus-visible:ring-g1/10"
                captionLayout="dropdown"
                fromYear={1930}
                toYear={new Date().getFullYear()}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gd/70">
                Relationship <span className="text-red-400">*</span>
              </label>
              <select
                name="relationship"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gd outline-none transition-all focus:border-g1 focus:ring-2 focus:ring-g1/10"
              >
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="in_law">Parent-in-law</option>
                <option value="sibling">Sibling</option>
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-g1 py-3 text-sm font-bold text-white transition-all hover:bg-g2 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Member"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-txt2 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of dependants */}
      {deps.length > 0 && (
        <div className="flex flex-col gap-3">
          {deps.map((d) => {
            const isExpanded = expandedDeps.has(d.id);
            const hasDetails = d.dob || d.nric || d.phone;
            return (
              <div
                key={d.id}
                className="rounded-xl border border-gray-200 bg-white"
              >
                <div
                  className={`flex items-center gap-3 p-4 ${hasDetails ? "cursor-pointer" : ""}`}
                  onClick={() => {
                    if (!hasDetails) return;
                    setExpandedDeps((prev) => {
                      const next = new Set(prev);
                      if (next.has(d.id)) next.delete(d.id);
                      else next.add(d.id);
                      return next;
                    });
                  }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-g1/10">
                    <Heart className="h-5 w-5 text-g1" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gd">{d.name}</p>
                    <p className="text-xs text-txt3">
                      {relationshipLabels[d.relationship] || d.relationship}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasDetails && (
                      isExpanded
                        ? <ChevronUp className="h-4 w-4 text-txt3" />
                        : <ChevronDown className="h-4 w-4 text-txt3" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(d.id);
                      }}
                      disabled={removing === d.id}
                      className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-txt3 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {isExpanded && hasDetails && (
                  <div className="grid gap-x-6 gap-y-2 border-t border-gray-100 px-4 py-3 text-sm sm:grid-cols-3">
                    {d.dob && (
                      <div>
                        <span className="text-xs text-txt3">Date of Birth</span>
                        <p className="text-gd">
                          {new Date(d.dob).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                    {d.nric && (
                      <div>
                        <span className="text-xs text-txt3">NRIC</span>
                        <p className="text-gd">{d.nric}</p>
                      </div>
                    )}
                    {d.phone && (
                      <div>
                        <span className="text-xs text-txt3">Phone</span>
                        <p className="text-gd">{d.phone}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const UPGRADE_AMOUNTS = [20, 30, 50];

function UpgradePrompt({
  canUpgrade,
  onUpgraded,
}: {
  canUpgrade: boolean;
  onUpgraded: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;
  const isValid = effectiveAmount >= 20;

  const handleUpgrade = async () => {
    if (!isValid || upgrading) return;
    setUpgrading(true);
    setError(null);
    try {
      await updateSubscriptionAmount({ data: { monthlyAmount: effectiveAmount } });
      setSuccessAmount(effectiveAmount);
      setShowForm(false);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to upgrade");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Users className="h-8 w-8 text-txt3" />
      </div>
      <p className="mt-4 text-sm font-semibold text-gd">
        Family coverage not included
      </p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-txt2">
        Contribute $20/mo or more to unlock{" "}
        <Dialog>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-0.5 font-semibold text-g1 decoration-dotted underline underline-offset-2 hover:text-g2">
              Skim Pintar Plus
              <Info className="inline h-3 w-3" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-[family-name:var(--font-family-heading)]">
                <Users className="h-5 w-5 text-gold" />
                Skim Pintar Plus
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-txt2">
              As a thank you for contributing $20/mo or more, your coverage extends to your immediate family.
            </p>
            <div className="flex flex-col gap-2.5">
              {PINTAR_PLUS_ALL_PERKS.map((perk) => (
                <div key={perk} className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15">
                    <Check className="h-3 w-3 text-gold" />
                  </div>
                  <span className="text-sm text-gd">{perk}</span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        {" "}and add family members to your coverage.
      </p>

      {canUpgrade && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 flex items-center gap-1.5 rounded-lg bg-g1 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-g2"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          Contribute More
        </button>
      )}

      {canUpgrade && showForm && (
        <div className="mt-5 w-full max-w-xs px-4">
          <p className="mb-2 text-xs font-medium text-txt2">
            Choose monthly contribution (min $20)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {UPGRADE_AMOUNTS.map((val) => (
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
                  : "bg-gray-50 text-gd border border-gray-200 hover:border-g1/30"
                  }`}
              >
                ${val}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
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
                setError(null);
              }}
              onFocus={() => setIsCustom(true)}
              className="flex-1 bg-transparent text-sm font-semibold text-gd outline-none placeholder:font-normal placeholder:text-txt3"
            />
            <span className="text-[10px] text-txt3">/month</span>
          </div>
          {isCustom && effectiveAmount > 0 && effectiveAmount < 20 && (
            <p className="mt-1.5 text-[11px] text-amber-600">
              Minimum $20/mo for family coverage
            </p>
          )}
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleUpgrade}
              disabled={!isValid || upgrading}
              className="flex-1 rounded-lg bg-g1 py-2.5 text-xs font-bold text-white transition-all hover:bg-g2 disabled:opacity-50"
            >
              {upgrading ? "Contributing…" : `Contribute $${effectiveAmount}/mo`}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-medium text-txt2 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={showSuccess}
        onOpenChange={(open) => {
          setShowSuccess(open);
          if (!open) onUpgraded();
        }}
      >
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-g1/15">
              <PartyPopper className="h-8 w-8 text-g1" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-family-heading)] text-xl">
                Jazakumullahu Khairan!
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-relaxed text-txt2">
              Your contribution has been updated to{" "}
              <span className="font-semibold text-gd">${successAmount}/mo</span>.
              You're now on{" "}
              <span className="font-semibold text-g1">Skim Pintar Plus</span>{" "}
              — you can start adding your family members.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        {icon}
      </div>
      <p className="mt-4 text-sm font-semibold text-gd">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-txt2">{desc}</p>
    </div>
  );
}
