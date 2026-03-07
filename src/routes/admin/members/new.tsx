import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { registerMember } from "~/lib/server-fns.js";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Label } from "~/components/ui/label.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card.js";

export const Route = createFileRoute("/admin/members/new")({
  component: RegisterMember,
});

function RegisterMember() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      await registerMember({
        data: {
          name: form.get("name") as string,
          email: form.get("email") as string,
          phone: (form.get("phone") as string) || undefined,
          nric: (form.get("nric") as string) || undefined,
          address: (form.get("address") as string) || undefined,
          monthlyAmount: form.get("monthlyAmount") as string,
        },
      });
      router.navigate({ to: "/admin/members" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold">Register New Member</h2>

      <Card>
        <CardHeader>
          <CardTitle>Member Details</CardTitle>
          <CardDescription>Register a walk-in member for Skim Pintar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nric">NRIC</Label>
                <Input id="nric" name="nric" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyAmount">Monthly Amount ($) *</Label>
              <Input
                id="monthlyAmount"
                name="monthlyAmount"
                type="number"
                step="0.01"
                min="5"
                required
              />
              <p className="text-xs text-muted-foreground">
                $5–$19.99: Skim Pintar &middot; $20+: Skim Pintar Plus
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Registering..." : "Register Member"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.navigate({ to: "/admin/members" })}
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
