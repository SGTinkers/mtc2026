import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { recordPayment, searchMembersForPayment } from "~/lib/server-fns.js";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Label } from "~/components/ui/label.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "~/components/ui/select.js";
import { Combobox } from "~/components/ui/combobox.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card.js";
import { DatePicker } from "~/components/ui/date-picker.js";

type PaymentSearch = {
  memberId?: string;
  memberName?: string;
  memberEmail?: string;
  subscriptionId?: string;
  monthlyAmount?: number;
  amount?: string;
  method?: string;
  periodMonth?: string;
  reference?: string;
};

export const Route = createFileRoute("/admin/payments/new")({
  validateSearch: (search: Record<string, unknown>): PaymentSearch => ({
    memberId: typeof search.memberId === "string" ? search.memberId : undefined,
    memberName: typeof search.memberName === "string" ? search.memberName : undefined,
    memberEmail: typeof search.memberEmail === "string" ? search.memberEmail : undefined,
    subscriptionId: typeof search.subscriptionId === "string" ? search.subscriptionId : undefined,
    monthlyAmount: typeof search.monthlyAmount === "number" ? search.monthlyAmount : undefined,
    amount: typeof search.amount === "string" ? search.amount : undefined,
    method: typeof search.method === "string" ? search.method : undefined,
    periodMonth: typeof search.periodMonth === "string" ? search.periodMonth : undefined,
    reference: typeof search.reference === "string" ? search.reference : undefined,
  }),
  component: RecordPayment,
});

type Member = Awaited<ReturnType<typeof searchMembersForPayment>>[number];

function RecordPayment() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateSearch = useCallback(
    (updates: Partial<PaymentSearch>) =>
      navigate({
        search: (prev) => ({ ...prev, ...updates }),
        replace: true,
      }),
    [navigate],
  );

  const selectedMember: Member | null =
    search.memberId && search.subscriptionId
      ? ({
          id: search.memberId,
          userName: search.memberName ?? null,
          userEmail: search.memberEmail ?? null,
          subscriptionId: search.subscriptionId,
          monthlyAmount: search.monthlyAmount ? String(search.monthlyAmount) : null,
        } as Member)
      : null;

  const handleSearchMembers = useCallback(
    (query: string) => searchMembersForPayment({ data: query }),
    [],
  );

  function handleMemberSelect(member: Member | null) {
    if (member) {
      const amt = member.monthlyAmount
        ? Number(member.monthlyAmount).toFixed(2)
        : undefined;
      updateSearch({
        memberId: member.id,
        memberName: member.userName ?? undefined,
        memberEmail: member.userEmail ?? undefined,
        subscriptionId: member.subscriptionId ?? undefined,
        monthlyAmount: member.monthlyAmount ? Number(member.monthlyAmount) : undefined,
        amount: amt,
      });
    } else {
      updateSearch({
        memberId: undefined,
        memberName: undefined,
        memberEmail: undefined,
        subscriptionId: undefined,
        monthlyAmount: undefined,
        amount: undefined,
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await recordPayment({
        data: {
          subscriptionId: search.subscriptionId!,
          amount: search.amount!,
          method: search.method as "giro" | "cash" | "bank_transfer" | "paynow",
          reference: search.reference || undefined,
          periodMonth: search.periodMonth || undefined,
        },
      });
      navigate({ to: "/admin/payments", search: { page: 1 } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold">Record Payment</h2>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            Record a manual payment (cash, GIRO, bank transfer, or PayNow)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Member *</Label>
              <Combobox
                onSearch={handleSearchMembers}
                value={selectedMember}
                onSelect={handleMemberSelect}
                getOptionValue={(m) => m.id}
                getOptionLabel={(m) =>
                  m.userName
                    ? `${m.userName} (${m.userEmail})`
                    : m.userEmail ?? ""
                }
                renderOption={(m) => (
                  <div>
                    <div className="font-medium">{m.userName}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.userEmail}
                      {m.monthlyAmount
                        ? ` — $${Number(m.monthlyAmount).toFixed(2)}/mo`
                        : ""}
                    </div>
                  </div>
                )}
                placeholder="Search by name or email..."
              />
              {selectedMember && !selectedMember.subscriptionId && (
                <p className="text-sm text-amber-600">
                  This member has no active subscription. A payment cannot be recorded.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={search.amount ?? ""}
                  onChange={(e) => updateSearch({ amount: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select
                  value={search.method ?? ""}
                  onValueChange={(v) => updateSearch({ method: v || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Period Month</Label>
                <DatePicker
                  value={search.periodMonth ? `${search.periodMonth}-01` : ""}
                  onChange={(v) => updateSearch({ periodMonth: v ? v.slice(0, 7) : undefined })}
                  placeholder="Select month"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference / Receipt No.</Label>
                <Input
                  id="reference"
                  value={search.reference ?? ""}
                  onChange={(e) => updateSearch({ reference: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !search.subscriptionId || !search.amount || !search.method}
              >
                {loading ? "Recording..." : "Record Payment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/admin/payments", search: { page: 1 } })}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
