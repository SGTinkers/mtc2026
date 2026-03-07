import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { recordPayment, getMembers } from "~/lib/server-fns.js";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Label } from "~/components/ui/label.js";
import { Select } from "~/components/ui/select.js";
import { Combobox } from "~/components/ui/combobox.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card.js";

export const Route = createFileRoute("/admin/payments/new")({
  loader: () => getMembers(),
  component: RecordPayment,
});

type Member = Awaited<ReturnType<typeof getMembers>>[number];

function RecordPayment() {
  const members = Route.useLoaderData();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState("");

  function handleMemberSelect(member: Member | null) {
    setSelectedMember(member);
    if (member?.monthlyAmount) {
      setAmount(Number(member.monthlyAmount).toFixed(2));
    } else {
      setAmount("");
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      await recordPayment({
        data: {
          subscriptionId: form.get("subscriptionId") as string,
          amount: form.get("amount") as string,
          method: form.get("method") as "giro" | "cash" | "bank_transfer" | "paynow",
          reference: (form.get("reference") as string) || undefined,
          periodMonth: (form.get("periodMonth") as string) || undefined,
        },
      });
      router.navigate({ to: "/admin/payments" });
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
                options={members}
                value={selectedMember}
                onSelect={handleMemberSelect}
                getOptionValue={(m) => m.id}
                getOptionLabel={(m) =>
                  m.userName
                    ? `${m.userName} (${m.userEmail})`
                    : m.userEmail ?? ""
                }
                filterOption={(m, q) => {
                  const lower = q.toLowerCase();
                  return (
                    (m.userName?.toLowerCase().includes(lower) ?? false) ||
                    (m.userEmail?.toLowerCase().includes(lower) ?? false)
                  );
                }}
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
              <input
                type="hidden"
                name="subscriptionId"
                value={selectedMember?.subscriptionId ?? ""}
                required
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
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method *</Label>
                <Select id="method" name="method" required>
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="giro">GIRO</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paynow">PayNow</option>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="periodMonth">Period Month</Label>
                <Input id="periodMonth" name="periodMonth" type="month" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference / Receipt No.</Label>
                <Input id="reference" name="reference" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || (!!selectedMember && !selectedMember.subscriptionId)}
              >
                {loading ? "Recording..." : "Record Payment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.navigate({ to: "/admin/payments" })}
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
