import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getMemberDependants, addDependant, removeDependant } from "~/lib/server-fns.js";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Label } from "~/components/ui/label.js";
import { Select } from "~/components/ui/select.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card.js";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table.js";
import { Plus, Trash2, Users } from "lucide-react";

export const Route = createFileRoute("/member/dependants")({
  loader: () => getMemberDependants(),
  component: DependantsPage,
});

function DependantsPage() {
  const { dependants: deps, canAdd, subscriptionId } = Route.useLoaderData();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subscriptionId) return;
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      await addDependant({
        data: {
          subscriptionId,
          name: form.get("name") as string,
          nric: form.get("nric") as string,
          phone: (form.get("phone") as string) || undefined,
          relationship: form.get("relationship") as "spouse" | "child" | "parent" | "in_law" | "sibling",
          sameAddress: form.get("sameAddress") === "on",
        },
      });
      setShowForm(false);
      router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add dependant");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this dependant?")) return;
    await removeDependant({ data: id });
    router.invalidate();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dependants</h2>
        {canAdd && !showForm && deps.length > 0 && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Dependant
          </Button>
        )}
      </div>

      {!subscriptionId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No active subscription. Contact the mosque to get started.
          </CardContent>
        </Card>
      )}

      {subscriptionId && !canAdd && deps.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <Users className="mb-4 h-12 w-12" />
            <p>Dependants are available on Skim Pintar Plus.</p>
            <p className="mt-1 text-sm">
              Upgrade your plan to add dependants to your coverage.
            </p>
          </CardContent>
        </Card>
      )}

      {subscriptionId && canAdd && deps.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <Users className="mb-4 h-12 w-12" />
            <p>No dependants added yet.</p>
            <p className="mt-1 text-sm">
              Add family members to extend your coverage to them.
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Add Dependant
            </Button>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Dependant</CardTitle>
            <CardDescription>Add a family member to your coverage</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
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
                  <Label htmlFor="nric">NRIC *</Label>
                  <Input id="nric" name="nric" required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Select id="relationship" name="relationship" required>
                    <option value="">Select</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="in_law">In-law</option>
                    <option value="sibling">Sibling</option>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sameAddress"
                  name="sameAddress"
                  defaultChecked
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="sameAddress">Same address as subscriber</Label>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {deps.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>NRIC</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {deps.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.nric}</TableCell>
                    <TableCell className="capitalize">
                      {d.relationship.replace("_", " ")}
                    </TableCell>
                    <TableCell>{d.phone || "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(d.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
