import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getMemberDashboard, updateMemberProfile } from "~/lib/server-fns.js";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Label } from "~/components/ui/label.js";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card.js";

export const Route = createFileRoute("/member/profile")({
  loader: () => getMemberDashboard(),
  component: ProfilePage,
});

function ProfilePage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!data) {
    return (
      <div>
        <h2 className="mb-6 text-2xl font-bold">Profile</h2>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Profile not found. Contact the mosque for assistance.
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const form = new FormData(e.currentTarget);

    await updateMemberProfile({
      data: {
        phone: form.get("phone") as string,
        address: form.get("address") as string,
      },
    });

    setSuccess(true);
    setLoading(false);
    router.invalidate();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold">Profile</h2>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                Profile updated successfully.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={data.member.phone ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={data.member.address ?? ""}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
