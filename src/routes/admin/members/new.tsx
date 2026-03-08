import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { registerMember, type ScannedFormData } from "~/lib/server-fns.js";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Label } from "~/components/ui/label.js";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card.js";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select.js";
import { DatePicker } from "~/components/ui/date-picker.js";
import { Info, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { ScanDocumentButton } from "~/components/scan-document-button.js";

export const Route = createFileRoute("/admin/members/new")({
  component: RegisterMemberWizard,
});

type PaymentMethod = "cash" | "giro" | "bank_transfer" | "paynow";

type Dependant = {
  name: string;
  nric: string;
  dob: string;
  phone: string;
  relationship: "spouse" | "child" | "parent" | "in_law" | "sibling";
};

type FormData = {
  email: string;
  name: string;
  monthlyAmount: string;
  paymentMethod: PaymentMethod;
  phone: string;
  nric: string;
  dob: string;
  address: string;
  postalCode: string;
  dependants: Dependant[];
  recordPayment: boolean;
  initialPaymentAmount: string;
  initialPaymentReference: string;
};

const STEPS = [
  { label: "Account & Plan" },
  { label: "Personal Details" },
  { label: "Family Members" },
  { label: "Review & Confirm" },
];

const RELATIONSHIPS = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "in_law", label: "In-Law" },
  { value: "sibling", label: "Sibling" },
] as const;

function resolvedPlan(amount: number) {
  if (amount >= 20) return "Skim Pintar Plus";
  if (amount >= 5) return "Skim Pintar";
  return null;
}

function RegisterMemberWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    email: "",
    name: "",
    monthlyAmount: "",
    paymentMethod: "cash",
    phone: "",
    nric: "",
    dob: "",
    address: "",
    postalCode: "",
    dependants: [],
    recordPayment: false,
    initialPaymentAmount: "",
    initialPaymentReference: "",
  });

  const [expandedDeps, setExpandedDeps] = useState<Set<number>>(new Set());

  // Adding a new dependant
  const [depForm, setDepForm] = useState<Dependant>({
    name: "",
    nric: "",
    dob: "",
    phone: "",
    relationship: "spouse",
  });

  const amount = Number(form.monthlyAmount);
  const plan = resolvedPlan(amount);
  const isPintarPlus = amount >= 20;
  const isGiro = form.paymentMethod === "giro";

  // Determine visible steps (skip family if not Pintar Plus)
  const visibleSteps = isPintarPlus
    ? STEPS
    : STEPS.filter((_, i) => i !== 2);

  // Map visible step index to logical step
  function toLogical(visibleIdx: number): number {
    if (isPintarPlus) return visibleIdx;
    return visibleIdx >= 2 ? visibleIdx + 1 : visibleIdx;
  }

  const logicalStep = toLogical(step);
  const totalVisibleSteps = visibleSteps.length;

  function update(partial: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function canNext(): boolean {
    if (logicalStep === 0) {
      return !!(form.email && form.name && amount >= 5 && plan);
    }
    return true;
  }

  function addDependant() {
    if (!depForm.name || !depForm.relationship) return;
    update({ dependants: [...form.dependants, { ...depForm }] });
    setDepForm({ name: "", nric: "", dob: "", phone: "", relationship: "spouse" });
  }

  function removeDependant(idx: number) {
    update({ dependants: form.dependants.filter((_, i) => i !== idx) });
  }

  function handleScanExtracted(data: ScannedFormData) {
    const updates: Partial<FormData> = {};
    if (data.name) updates.name = data.name;
    if (data.email) updates.email = data.email;
    if (data.nric) updates.nric = data.nric;
    if (data.dob) updates.dob = data.dob;
    if (data.phone) updates.phone = data.phone;
    if (data.address) updates.address = data.address;
    if (data.postalCode) updates.postalCode = data.postalCode;
    if (data.monthlyAmount) updates.monthlyAmount = data.monthlyAmount;
    if (data.dependants && data.dependants.length > 0) {
      updates.dependants = data.dependants.map((d) => ({
        name: d.name,
        nric: d.nric || "",
        dob: d.dob || "",
        phone: d.phone || "",
        relationship: (["spouse", "child", "parent", "in_law", "sibling"].includes(d.relationship)
          ? d.relationship
          : "spouse") as Dependant["relationship"],
      }));
    }
    update(updates);
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      await registerMember({
        data: {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          nric: form.nric || undefined,
          dob: form.dob || undefined,
          address: form.address || undefined,
          postalCode: form.postalCode || undefined,
          monthlyAmount: form.monthlyAmount,
          paymentMethod: form.paymentMethod,
          dependants: form.dependants.length > 0 ? form.dependants : undefined,
          initialPayment:
            form.recordPayment && !isGiro && Number(form.initialPaymentAmount) > 0
              ? {
                  amount: form.initialPaymentAmount,
                  reference: form.initialPaymentReference || undefined,
                }
              : undefined,
        },
      });
      router.navigate({ to: "/admin/members" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold">Register New Member</h2>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-1">
        {visibleSteps.map((s, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < visibleSteps.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 transition-colors ${
                      i < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  i <= step ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{visibleSteps[step]?.label}</CardTitle>
              <CardDescription>
                {logicalStep === 0 && "Set up the member's account and subscription plan"}
                {logicalStep === 1 && "Fill in personal details for the member"}
                {logicalStep === 2 && "Add family members covered under Skim Pintar Plus"}
                {logicalStep === 3 && "Review all details before registering"}
              </CardDescription>
            </div>
            {(logicalStep === 0 || logicalStep === 1) && (
              <ScanDocumentButton onExtracted={handleScanExtracted} variant="admin" />
            )}
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Step 1: Account & Plan */}
          {logicalStep === 0 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => update({ name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update({ email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monthlyAmount">Monthly Amount ($) *</Label>
                  <Input
                    id="monthlyAmount"
                    type="number"
                    step="0.01"
                    min="5"
                    value={form.monthlyAmount}
                    onChange={(e) => update({ monthlyAmount: e.target.value })}
                    required
                  />
                  {plan && (
                    <p className="text-xs font-medium text-primary">{plan}</p>
                  )}
                  {form.monthlyAmount && !plan && (
                    <p className="text-xs text-destructive">Minimum $5 required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={form.paymentMethod}
                    onValueChange={(v) => update({ paymentMethod: v as PaymentMethod })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="giro">GIRO</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paynow">PayNow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isGiro && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    GIRO subscriptions require approval. The subscription will start in{" "}
                    <strong>pending approval</strong> status until you approve it from the member's detail page.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Personal Details */}
          {logicalStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => update({ phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nric">NRIC</Label>
                  <Input
                    id="nric"
                    value={form.nric}
                    onChange={(e) => update({ nric: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <DatePicker
                  value={form.dob}
                  onChange={(v) => update({ dob: v })}
                  placeholder="Select date of birth"
                  captionLayout="dropdown"
                  fromYear={1930}
                  toYear={new Date().getFullYear()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => update({ address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={form.postalCode}
                  onChange={(e) => update({ postalCode: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 3: Family Members (Pintar Plus only) */}
          {logicalStep === 2 && (
            <div className="space-y-6">
              {form.dependants.length > 0 && (
                <div className="space-y-2">
                  {form.dependants.map((dep, i) => {
                    const isExpanded = expandedDeps.has(i);
                    const hasDetails = dep.nric || dep.phone || dep.dob;
                    return (
                      <div
                        key={i}
                        className="rounded-lg border"
                      >
                        <div
                          className={`flex items-center justify-between p-3 ${hasDetails ? "cursor-pointer" : ""}`}
                          onClick={() => {
                            if (!hasDetails) return;
                            setExpandedDeps((prev) => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              return next;
                            });
                          }}
                        >
                          <div className="flex min-h-[44px] items-center gap-2">
                            {hasDetails && (
                              isExpanded
                                ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                                : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{dep.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {dep.relationship.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDependant(i);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {isExpanded && hasDetails && (
                          <div className="grid gap-x-6 gap-y-1 border-t px-3 py-2 text-sm sm:grid-cols-3">
                            {dep.nric && (
                              <div>
                                <span className="text-xs text-muted-foreground">NRIC</span>
                                <p>{dep.nric}</p>
                              </div>
                            )}
                            {dep.phone && (
                              <div>
                                <span className="text-xs text-muted-foreground">Phone</span>
                                <p>{dep.phone}</p>
                              </div>
                            )}
                            {dep.dob && (
                              <div>
                                <span className="text-xs text-muted-foreground">Date of Birth</span>
                                <p>{new Date(dep.dob).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-4 rounded-lg border border-dashed p-4">
                <p className="text-sm font-medium">Add Family Member</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={depForm.name}
                      onChange={(e) =>
                        setDepForm({ ...depForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship *</Label>
                    <Select
                      value={depForm.relationship}
                      onValueChange={(v) =>
                        setDepForm({
                          ...depForm,
                          relationship: v as Dependant["relationship"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIPS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>NRIC</Label>
                    <Input
                      value={depForm.nric}
                      onChange={(e) =>
                        setDepForm({ ...depForm, nric: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={depForm.phone}
                      onChange={(e) =>
                        setDepForm({ ...depForm, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <DatePicker
                    value={depForm.dob}
                    onChange={(v) => setDepForm({ ...depForm, dob: v })}
                    placeholder="Select date of birth"
                    captionLayout="dropdown"
                    fromYear={1930}
                    toYear={new Date().getFullYear()}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!depForm.name}
                  onClick={addDependant}
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {logicalStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Account & Plan</h4>
                <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{form.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium">{form.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Plan</dt>
                    <dd className="font-medium">{plan}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Monthly Amount</dt>
                    <dd className="font-medium">${Number(form.monthlyAmount).toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Payment Method</dt>
                    <dd className="font-medium capitalize">
                      {form.paymentMethod.replace("_", " ")}
                    </dd>
                  </div>
                  {isGiro && (
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="font-medium text-amber-600">Pending Approval</dd>
                    </div>
                  )}
                </dl>
              </div>

              {(form.phone || form.nric || form.dob || form.address || form.postalCode) && (
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">Personal Details</h4>
                  <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                    {form.phone && (
                      <div>
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd className="font-medium">{form.phone}</dd>
                      </div>
                    )}
                    {form.nric && (
                      <div>
                        <dt className="text-muted-foreground">NRIC</dt>
                        <dd className="font-medium">{form.nric}</dd>
                      </div>
                    )}
                    {form.dob && (
                      <div>
                        <dt className="text-muted-foreground">Date of Birth</dt>
                        <dd className="font-medium">{form.dob}</dd>
                      </div>
                    )}
                    {form.address && (
                      <div>
                        <dt className="text-muted-foreground">Address</dt>
                        <dd className="font-medium">{form.address}</dd>
                      </div>
                    )}
                    {form.postalCode && (
                      <div>
                        <dt className="text-muted-foreground">Postal Code</dt>
                        <dd className="font-medium">{form.postalCode}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {form.dependants.length > 0 && (
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Family Members ({form.dependants.length})
                  </h4>
                  <div className="space-y-2">
                    {form.dependants.map((dep, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">{dep.name}</span>
                        <span className="text-muted-foreground capitalize">
                          {" "}
                          — {dep.relationship.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Record first payment toggle (non-GIRO only) */}
              {!isGiro && (
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.recordPayment}
                      onClick={() =>
                        update({
                          recordPayment: !form.recordPayment,
                          initialPaymentAmount: !form.recordPayment
                            ? form.monthlyAmount
                            : "",
                        })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        form.recordPayment ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          form.recordPayment ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <Label className="cursor-pointer" onClick={() =>
                      update({
                        recordPayment: !form.recordPayment,
                        initialPaymentAmount: !form.recordPayment
                          ? form.monthlyAmount
                          : "",
                      })
                    }>
                      Record first payment
                    </Label>
                  </div>
                  {form.recordPayment && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="paymentAmount">Amount ($)</Label>
                        <Input
                          id="paymentAmount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.initialPaymentAmount}
                          onChange={(e) =>
                            update({ initialPaymentAmount: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentRef">Reference</Label>
                        <Input
                          id="paymentRef"
                          value={form.initialPaymentReference}
                          onChange={(e) =>
                            update({ initialPaymentReference: e.target.value })
                          }
                          placeholder="Receipt #, etc."
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 0) {
                router.navigate({ to: "/admin/members" });
              } else {
                setStep(step - 1);
                setError("");
              }
            }}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < totalVisibleSteps - 1 ? (
            <Button disabled={!canNext()} onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button disabled={loading} onClick={handleSubmit}>
              {loading ? "Registering…" : "Register Member"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
