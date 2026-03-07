import { useState } from "react";
import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { getMemberDetail, cancelSubscription, adminUpdateMemberProfile } from "~/lib/server-fns.js";
import { SubscriptionStatusBadge } from "~/components/subscription-status-badge.js";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Label } from "~/components/ui/label.js";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card.js";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table.js";

export const Route = createFileRoute("/admin/members/$id")({
  loader: ({ params }) => getMemberDetail({ data: params.id }),
  component: MemberDetail,
});

function MemberDetail() {
  const { member, subscription, subscriptions, dependants, payments } = Route.useLoaderData();
  const pastSubscriptions = subscriptions.slice(1);
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: member.userName,
    email: member.userEmail,
    phone: member.userPhone || "",
    nric: member.nric || "",
    address: member.address || "",
  });

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await adminUpdateMemberProfile({
        data: { memberId: member.id, ...form },
      });
      setEditing(false);
      router.invalidate();
    } catch (e: any) {
      alert(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const canCancel =
    subscription &&
    subscription.status !== "cancelled" &&
    subscription.status !== "lapsed";

  async function handleCancel() {
    if (!subscription) return;
    if (!window.confirm("Are you sure you want to cancel this subscription?")) return;
    setCancelling(true);
    try {
      await cancelSubscription({ data: { subscriptionId: subscription.id } });
      router.invalidate();
    } catch (e: any) {
      alert(e.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{member.userName}</h2>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profile</CardTitle>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nric">NRIC</Label>
                <Input id="nric" value={form.nric} onChange={(e) => setForm({ ...form, nric: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Joined</dt>
                <dd className="font-medium">{new Date(member.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button size="sm" disabled={saving} onClick={handleSaveProfile}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => {
                    setForm({
                      name: member.userName,
                      email: member.userEmail,
                      phone: member.userPhone || "",
                      nric: member.nric || "",
                      address: member.address || "",
                    });
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="font-medium">{member.userEmail}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Phone</dt>
                <dd className="font-medium">{member.userPhone || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">NRIC</dt>
                <dd className="font-medium">{member.nric || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Address</dt>
                <dd className="font-medium">{member.address || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Joined</dt>
                <dd className="font-medium">
                  {new Date(member.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Subscription</CardTitle>
                <SubscriptionStatusBadge status={subscription.status} />
              </div>
              {canCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={cancelling}
                  onClick={handleCancel}
                >
                  {cancelling ? "Cancelling…" : "Cancel Subscription"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted-foreground">Plan</dt>
                <dd className="font-medium">{subscription.planName}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Monthly Amount</dt>
                <dd className="font-medium">
                  ${Number(subscription.monthlyAmount).toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Payment Method</dt>
                <dd className="font-medium capitalize">{subscription.paymentMethod}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Coverage Start</dt>
                <dd className="font-medium">{subscription.coverageStart}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Coverage Until</dt>
                <dd className="font-medium">{subscription.coverageUntil}</dd>
              </div>
              {subscription.graceUntil && (
                <div>
                  <dt className="text-sm text-muted-foreground">Grace Until</dt>
                  <dd className="font-medium">{subscription.graceUntil}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Past Subscriptions */}
      {pastSubscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastSubscriptions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.planName}</TableCell>
                    <TableCell>${Number(s.monthlyAmount).toFixed(2)}/mo</TableCell>
                    <TableCell>{s.coverageStart} — {s.coverageUntil}</TableCell>
                    <TableCell className="capitalize">{s.paymentMethod.replace("_", " ")}</TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={s.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dependants */}
      {dependants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dependants ({dependants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>NRIC</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependants.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.nric}</TableCell>
                    <TableCell className="capitalize">
                      {d.relationship.replace("_", " ")}
                    </TableCell>
                    <TableCell>{d.phone || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            {subscription && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/admin/payments/new"
                  search={{
                    memberId: member.id,
                    memberName: member.userName,
                    memberEmail: member.userEmail,
                    subscriptionId: subscription.id,
                    monthlyAmount: Number(subscription.monthlyAmount),
                    amount: Number(subscription.monthlyAmount).toFixed(2),
                  }}
                >
                  Record Payment
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">No payments recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${Number(p.amount).toFixed(2)}</TableCell>
                    <TableCell className="capitalize">
                      {p.method.replace("_", " ")}
                    </TableCell>
                    <TableCell>{p.periodMonth || "—"}</TableCell>
                    <TableCell>{p.reference || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
