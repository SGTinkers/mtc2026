import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  getMemberDashboard,
  updateMemberProfile,
  addDependant,
  getMemberDependants,
} from "~/lib/server-fns.js";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Users,
  Shield,
  UserPlus,
  Sparkles,
  Heart,
  Calendar,
  HandHeart,
} from "lucide-react";
import { DatePicker } from "~/components/ui/date-picker.js";
import { ScanDocumentButton } from "~/components/scan-document-button.js";

export const Route = createFileRoute("/member/")({
  loader: async () => {
    const dashboard = await getMemberDashboard();
    let dependantsData: Awaited<ReturnType<typeof getMemberDependants>> | null =
      null;
    if (dashboard?.subscription) {
      dependantsData = await getMemberDependants();
    }
    return { dashboard, dependantsData };
  },
  component: MemberDashboard,
});

// ─── Perk definitions ───

const PINTAR_PERKS = [
  "Free funeral services",
  "Ritual bathing & shrouding",
  "Burial & transport",
  "10% discount on religious courses",
];

const PINTAR_PLUS_PERKS = [
  "Free funeral services for you & family",
  "Ritual bathing & shrouding",
  "Burial & transport for all covered members",
  "Coverage for household members",
  "Coverage for parents-in-law",
  "20% discount on religious courses",
];

// ─── Main component ───

function MemberDashboard() {
  const { dashboard: data, dependantsData } = Route.useLoaderData();

  if (!data?.subscription) {
    return <NoSubscription />;
  }

  if (!data.member.nric) {
    return (
      <OnboardingWizard data={data as DashboardData & { subscription: NonNullable<DashboardData["subscription"]> }} dependantsData={dependantsData} />
    );
  }

  return <Dashboard data={data as DashboardData & { subscription: NonNullable<DashboardData["subscription"]> }} />;
}

// ─── No subscription state ───

function NoSubscription() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <ShieldX className="h-8 w-8 text-txt3" />
      </div>
      <h2 className="mt-4 font-[family-name:var(--font-family-heading)] text-xl font-bold text-gd">
        No Active Subscription
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-txt2">
        Please contact the mosque to set up your Skim Pintar subscription.
      </p>
    </div>
  );
}

// ─── Onboarding Wizard ───

type DashboardData = NonNullable<Awaited<ReturnType<typeof getMemberDashboard>>>;
type DependantsResult = Awaited<ReturnType<typeof getMemberDependants>>;

function OnboardingWizard({
  data,
  dependantsData,
}: {
  data: DashboardData & { subscription: NonNullable<DashboardData["subscription"]> };
  dependantsData: DependantsResult | null;
}) {
  const router = useRouter();
  const isPintarPlus = data.subscription.planSlug === "pintar_plus";
  const totalSteps = isPintarPlus ? 4 : 3;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Personal details form state
  const [form, setForm] = useState({
    name: data.member.name || "",
    nric: "",
    dob: "",
    phone: data.member.phone || "",
    address: data.member.address || "",
    postalCode: data.member.postalCode || "",
  });

  // Family members state
  const [addedMembers, setAddedMembers] = useState<
    Array<{ name: string; dob: string; relationship: string }>
  >([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    dob: "",
    relationship: "",
  });
  const [addingMember, setAddingMember] = useState(false);

  const perks = isPintarPlus ? PINTAR_PLUS_PERKS : PINTAR_PERKS;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateMemberProfile({
        data: {
          name: form.name,
          nric: form.nric,
          dob: form.dob,
          phone: form.phone,
          address: form.address,
          postalCode: form.postalCode,
        },
      });
      setStep(step + 1);
    } catch {
      // Could show error but keep it simple
    } finally {
      setSaving(false);
    }
  };

  const handleAddFamilyMember = async () => {
    if (!addForm.name || !addForm.relationship || !dependantsData?.subscriptionId)
      return;
    setAddingMember(true);
    try {
      await addDependant({
        data: {
          subscriptionId: dependantsData.subscriptionId,
          name: addForm.name,
          dob: addForm.dob || undefined,
          relationship: addForm.relationship as
            | "spouse"
            | "child"
            | "parent"
            | "in_law"
            | "sibling",
        },
      });
      setAddedMembers([...addedMembers, { ...addForm }]);
      setAddForm({ name: "", dob: "", relationship: "" });
      setShowAddForm(false);
    } catch {
      // keep simple
    } finally {
      setAddingMember(false);
    }
  };

  const handleFinish = () => {
    router.invalidate();
  };

  // ─── Progress indicator ───
  const ProgressDots = () => (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? "w-8 bg-g1" : "w-1.5 bg-gray-300"
            }`}
        />
      ))}
    </div>
  );

  // ─── Step 0: Welcome ───
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className="flex min-h-full flex-col items-center px-6 pb-12 pt-10"
          style={{
            background:
              "linear-gradient(170deg, #032A21 0%, #085A44 40%, #0D7C5F 100%)",
          }}
        >
          <div className="hero-animate flex w-full max-w-sm flex-col items-center gap-6">
            <img src="/logo.webp" alt="" className="h-14 w-auto" />

            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                <span className="text-xs font-semibold text-gold">
                  Welcome!
                </span>
              </div>
              <h1 className="font-[family-name:var(--font-family-heading)] text-2xl font-bold text-white">
                Thank you for your
                <br />
                generous contribution
              </h1>
              <div className="flex items-baseline gap-1 pt-1">
                <span className="font-[family-name:var(--font-family-heading)] text-4xl font-bold text-gold">
                  ${Number(data.subscription.monthlyAmount).toFixed(0)}
                </span>
                <span className="text-sm text-white/50">/month</span>
              </div>
            </div>

            {/* Perks card */}
            <div
              className="w-full rounded-2xl border border-white/10 p-6"
              style={{
                background:
                  "linear-gradient(150deg, rgba(3,42,33,0.8) 0%, rgba(13,124,95,0.6) 100%)",
              }}
            >
              <div className="mb-4 flex items-center gap-2">
                {isPintarPlus ? (
                  <Users className="h-5 w-5 text-gold" />
                ) : (
                  <Shield className="h-5 w-5 text-mint" />
                )}
                <span className="font-[family-name:var(--font-family-heading)] text-base font-bold text-white">
                  {data.subscription.planName}
                </span>
                <span
                  className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isPintarPlus
                    ? "bg-gold/20 text-gold"
                    : "bg-mint/20 text-mint"
                    }`}
                >
                  Unlocked
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2.5">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isPintarPlus ? "bg-gold/20" : "bg-mint/20"
                        }`}
                    >
                      <Check
                        className={`h-3 w-3 ${isPintarPlus ? "text-gold" : "text-mint"
                          }`}
                      />
                    </div>
                    <span className="text-sm text-white/90">{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-bold text-gdeep transition-all hover:brightness-110"
            >
              Activate your perks
              <ArrowRight className="h-4 w-4" />
            </button>

            <ProgressDots />
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 1: Personal details ───
  if (step === 1) {
    const isValid =
      form.name.trim() && form.nric.trim() && form.dob && form.phone.trim();

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-cream">
        <div className="mx-auto flex min-h-full max-w-sm flex-col px-6 pb-12 pt-8">
          {/* Header */}
          <button
            onClick={() => setStep(0)}
            className="mb-6 flex items-center gap-1.5 text-sm text-txt3 hover:text-gd"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mb-8 flex flex-col gap-2">
            <h2 className="font-[family-name:var(--font-family-heading)] text-2xl font-bold text-gd">
              A little about you
            </h2>
            <p className="text-sm leading-relaxed text-txt2">
              We need a few details to activate your coverage. This only takes a
              minute.
            </p>
          </div>

          {/* Form */}
          <div className="flex flex-1 flex-col gap-5">
            <ScanDocumentButton
              variant="member"
              onExtracted={(data) => {
                setForm((prev) => ({
                  ...prev,
                  ...(data.name && { name: data.name }),
                  ...(data.nric && { nric: data.nric }),
                  ...(data.dob && { dob: data.dob }),
                  ...(data.phone && { phone: data.phone }),
                  ...(data.address && { address: data.address }),
                  ...(data.postalCode && { postalCode: data.postalCode }),
                }));
                if (data.dependants && data.dependants.length > 0) {
                  const newMembers = data.dependants.map((d) => ({
                    name: d.name,
                    dob: d.dob || "",
                    relationship: d.relationship || "spouse",
                  }));
                  setAddedMembers((prev) => [...prev, ...newMembers]);
                }
              }}
            />

            <FormField
              label="Full Name"
              required
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="e.g. Ahmad bin Abdullah"
            />
            <FormField
              label="NRIC"
              required
              value={form.nric}
              onChange={(v) => setForm({ ...form, nric: v })}
              placeholder="e.g. S1234567A"
            />
            <FormField
              label="Date of Birth"
              required
              type="date"
              value={form.dob}
              onChange={(v) => setForm({ ...form, dob: v })}
            />
            <FormField
              label="Phone Number"
              required
              type="tel"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="e.g. 91234567"
            />
            <FormField
              label="Address"
              value={form.address}
              onChange={(v) => setForm({ ...form, address: v })}
              placeholder="e.g. 123 Lorong Ah Soo"
            />
            <FormField
              label="Postal Code"
              value={form.postalCode}
              onChange={(v) => setForm({ ...form, postalCode: v })}
              placeholder="e.g. 530123"
              inputMode="numeric"
            />

            <div className="mt-auto pt-6">
              <button
                onClick={handleSaveProfile}
                disabled={!isValid || saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-bold text-gdeep transition-all hover:brightness-110 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Continue"}
                {!saving && <ArrowRight className="h-4 w-4" />}
              </button>
              <div className="mt-4">
                <ProgressDots />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2: Family members (Plus only) ───
  if (step === 2 && isPintarPlus) {
    const relationshipLabels: Record<string, string> = {
      spouse: "Spouse",
      child: "Child",
      parent: "Parent",
      in_law: "Parent-in-law",
      sibling: "Sibling",
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-cream">
        <div className="mx-auto flex min-h-full max-w-sm flex-col px-6 pb-12 pt-8">
          <button
            onClick={() => setStep(1)}
            className="mb-6 flex items-center gap-1.5 text-sm text-txt3 hover:text-gd"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mb-6 flex flex-col gap-2">
            <h2 className="font-[family-name:var(--font-family-heading)] text-2xl font-bold text-gd">
              Cover your loved ones
            </h2>
            <p className="text-sm leading-relaxed text-txt2">
              Add household members and parents-in-law to extend your coverage
              to them.
            </p>
          </div>

          {/* Added members */}
          <div className="flex flex-col gap-3">
            {addedMembers.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-g1/10">
                  <Heart className="h-5 w-5 text-g1" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gd">{m.name}</p>
                  <p className="text-xs text-txt3">
                    {relationshipLabels[m.relationship] || m.relationship}
                  </p>
                </div>
                <Check className="h-4 w-4 text-g1" />
              </div>
            ))}

            {/* Add form */}
            {showAddForm ? (
              <div className="rounded-xl border border-g1/20 bg-white p-5">
                <div className="flex flex-col gap-4">
                  <FormField
                    label="Full Name"
                    required
                    value={addForm.name}
                    onChange={(v) => setAddForm({ ...addForm, name: v })}
                    placeholder="e.g. Siti binte Ahmad"
                  />
                  <FormField
                    label="Date of Birth"
                    type="date"
                    value={addForm.dob}
                    onChange={(v) => setAddForm({ ...addForm, dob: v })}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gd/70">
                      Relationship <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={addForm.relationship}
                      onChange={(e) =>
                        setAddForm({ ...addForm, relationship: e.target.value })
                      }
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
                      onClick={handleAddFamilyMember}
                      disabled={
                        !addForm.name || !addForm.relationship || addingMember
                      }
                      className="flex-1 rounded-xl bg-g1 py-3 text-sm font-bold text-white transition-all hover:bg-g2 disabled:opacity-50"
                    >
                      {addingMember ? "Adding..." : "Add Member"}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setAddForm({ name: "", dob: "", relationship: "" });
                      }}
                      className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-txt2 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white/50 py-5 text-sm font-medium text-txt2 cursor-pointer transition-all hover:border-g1/40 hover:text-g1"
              >
                <UserPlus className="h-5 w-5" />
                {addedMembers.length === 0
                  ? "Add your first family member"
                  : "Add another member"}
              </button>
            )}
          </div>

          <div className="mt-auto pt-8">
            <button
              onClick={() => setStep(step + 1)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-bold text-gdeep transition-all hover:brightness-110"
            >
              {addedMembers.length > 0 ? "Continue" : "Skip for now"}
              <ArrowRight className="h-4 w-4" />
            </button>
            {addedMembers.length === 0 && (
              <p className="mt-3 text-center text-xs text-txt3">
                You can always add family members later
              </p>
            )}
            <div className="mt-4">
              <ProgressDots />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Final step: Done ───
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="flex min-h-full flex-col items-center justify-center px-6 pb-12 pt-10"
        style={{
          background:
            "linear-gradient(170deg, #032A21 0%, #085A44 40%, #0D7C5F 100%)",
        }}
      >
        <div className="hero-animate flex w-full max-w-sm flex-col items-center gap-6 text-center">
          {/* Animated check */}
          <div className="relative">
            <div className="success-glow-ring" />
            <div className="success-confetti-wrap">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm success-check-pop">
                <Check className="h-10 w-10 text-mint" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-[family-name:var(--font-family-heading)] text-3xl font-bold text-white">
              You're all set!
            </h1>
            <p className="text-sm leading-relaxed text-white/70">
              Your {data.subscription.planName} coverage is now active.
            </p>
          </div>

          {/* Summary */}
          <div className="w-full rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-left">
            <div className="flex flex-col gap-3">
              <SummaryRow label="Personal details" done />
              {isPintarPlus && (
                <SummaryRow
                  label={
                    addedMembers.length > 0
                      ? `${addedMembers.length} family member${addedMembers.length > 1 ? "s" : ""} added`
                      : "No family members yet"
                  }
                  done={addedMembers.length > 0}
                />
              )}
              <SummaryRow label="Funeral coverage activated" done />
              <SummaryRow
                label={`${data.subscription.courseDiscount}% course discount`}
                done
              />
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-bold text-gdeep transition-all hover:brightness-110"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-mint/20" : "bg-white/10"
          }`}
      >
        <Check
          className={`h-3.5 w-3.5 ${done ? "text-mint" : "text-white/30"}`}
        />
      </div>
      <span className={`text-sm ${done ? "text-white" : "text-white/40"}`}>
        {label}
      </span>
    </div>
  );
}

// ─── Reusable form field ───

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  inputMode?: "numeric" | "tel" | "text";
}) {
  if (type === "date") {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gd/70">
          {label}
          {required && <span className="text-red-400"> *</span>}
        </label>
        <DatePicker
          value={value}
          onChange={onChange}
          placeholder={placeholder ?? "Pick a date"}
          className="h-auto rounded-xl border-gray-200 px-4 py-3 text-gd hover:bg-white focus-visible:border-g1 focus-visible:ring-g1/10"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gd/70">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gd placeholder-txt3 outline-none transition-all focus:border-g1 focus:ring-2 focus:ring-g1/10"
      />
    </div>
  );
}

// ─── Regular dashboard (post-onboarding) ───

const statusConfig = {
  active: {
    label: "Active",
    icon: ShieldCheck,
    color: "text-g1",
    bg: "bg-g1/10",
    ring: "ring-g1/20",
  },
  grace: {
    label: "Grace Period",
    icon: ShieldAlert,
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
  },
  lapsed: {
    label: "Lapsed",
    icon: ShieldX,
    color: "text-red-600",
    bg: "bg-red-50",
    ring: "ring-red-200",
  },
  pending_payment: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
  },
  pending_approval: {
    label: "Pending Approval",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: ShieldX,
    color: "text-gray-500",
    bg: "bg-gray-100",
    ring: "ring-gray-200",
  },
};

function Dashboard({
  data,
}: {
  data: DashboardData & {
    subscription: NonNullable<DashboardData["subscription"]>;
  };
}) {
  const { subscription } = data;
  const config = statusConfig[subscription.status];
  const isPintarPlus = subscription.planSlug === "pintar_plus";
  const perks = isPintarPlus ? PINTAR_PLUS_PERKS : PINTAR_PERKS;

  const coverageEnd = new Date(subscription.coverageUntil);
  const coverageStart = new Date(subscription.coverageStart);
  const today = new Date();
  const daysLeft = Math.ceil(
    (coverageEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Calculate months as a member
  const monthsActive =
    (today.getFullYear() - coverageStart.getFullYear()) * 12 +
    (today.getMonth() - coverageStart.getMonth());
  const memberSince = coverageStart.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  const totalContributed = Number(data.totalContributions);
  const firstName = data.member.name?.split(" ")[0] || "there";

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting */}
      <div>
        <h2 className="font-[family-name:var(--font-family-heading)] text-xl font-bold text-gd lg:text-2xl">
          Assalamualaikum, {firstName}
        </h2>
        <p className="mt-0.5 text-sm text-txt2">
          Your contributions keep the mosque thriving. Thank you.
        </p>
      </div>

      {/* Impact stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-g1/10">
            <Calendar className="h-4 w-4 text-g1" />
          </div>
          <p className="text-lg font-bold text-gd">
            {monthsActive < 1 ? "1" : monthsActive}
            <span className="ml-1 text-xs font-normal text-txt3">
              {monthsActive < 2 ? "month" : "months"}
            </span>
          </p>
          <p className="text-[11px] text-txt3">Member since {memberSince}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-g1/10">
            <HandHeart className="h-4 w-4 text-g1" />
          </div>
          <p className="text-lg font-bold text-gd">
            ${totalContributed.toFixed(0)}
          </p>
          <p className="text-[11px] text-txt3">
            Total contributed to date
          </p>
        </div>
      </div>

      {/* Your Benefits */}
      <h3 className="font-[family-name:var(--font-family-heading)] text-sm font-bold text-gd">
        Your Benefits
      </h3>

      {/* Plan tier card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background:
            "linear-gradient(150deg, #032A21 0%, #085A44 60%, #0D7C5F 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPintarPlus ? (
              <Users className="h-5 w-5 text-gold" />
            ) : (
              <Shield className="h-5 w-5 text-mint" />
            )}
            <span className="font-[family-name:var(--font-family-heading)] text-lg font-bold text-white">
              {subscription.planName}
            </span>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${config.color === "text-g1"
              ? "bg-mint/20 text-mint"
              : config.color === "text-amber-600"
                ? "bg-amber-400/20 text-amber-300"
                : "bg-white/10 text-white/50"
              }`}
          >
            {config.label}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-[family-name:var(--font-family-heading)] text-3xl font-bold text-white">
            ${Number(subscription.monthlyAmount).toFixed(0)}
          </span>
          <span className="text-sm text-white/50">/month</span>
        </div>

        <p className="mt-1 text-xs text-white/50">
          {subscription.status === "active"
            ? `Covered until ${coverageEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
            : subscription.status === "grace"
              ? `Grace period — ${daysLeft} days left`
              : `Coverage ended ${coverageEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
        </p>

        {/* Perks list */}
        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="flex flex-col gap-2.5">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-2.5">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isPintarPlus ? "bg-gold/20" : "bg-mint/20"
                    }`}
                >
                  <Check
                    className={`h-3 w-3 ${isPintarPlus ? "text-gold" : "text-mint"
                      }`}
                  />
                </div>
                <span className="text-sm text-white/90">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share CTA */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="flex items-center gap-1.5 font-[family-name:var(--font-family-heading)] text-sm font-bold text-gd">
          <Heart className="h-4 w-4 text-g1" />
          Let your loved ones know
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-txt2">
          Share the news that you're now covered under Skim Pintar, and the benefits you got under it.
        </p>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `Assalamualaikum! Just letting you know that I'm now covered under Skim Pintar by Masjid Ar-Raudhah. Just by donating a small amount monthly to the mosque, you get:\n\n✅ Free funeral services (bathing, shrouding, burial & transport)\n✅ Discounts on religious courses\n✅ Family coverage options\n\nYou should check it out too!\n\nhttps://mtc2026.msociety.dev/donate`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A8D4A] py-3 text-sm font-bold text-white transition-all hover:brightness-110"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}
