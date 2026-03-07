import { createFileRoute, getRouteApi, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getAdmins, updateAdminProfile } from "~/lib/server-fns.js";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card.js";
import { Label } from "~/components/ui/label.js";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table.js";
import { ShieldPlus, Search, Pencil, X, Check, KeyRound } from "lucide-react";
import { authClient } from "~/lib/auth-client.js";

const adminRoute = getRouteApi("/admin");

export const Route = createFileRoute("/admin/admins/")({
  loader: () => getAdmins(),
  component: AdminsList,
});

function AdminsList() {
  const admins = Route.useLoaderData();
  const { session } = adminRoute.useRouteContext();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(session?.user.name ?? "");
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const filtered = admins.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAdminProfile({ data: { name, email } });
      setEditing(false);
      router.invalidate();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(session?.user.name ?? "");
    setEmail(session?.user.email ?? "");
    setEditing(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (error) {
        setPasswordError(error.message ?? "Failed to change password");
      } else {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setChangingPassword(false);
          setPasswordSuccess(false);
        }, 1500);
      }
    } catch (e: any) {
      setPasswordError(e.message ?? "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admins</h2>
        <Link to="/admin/admins/new">
          <Button>
            <ShieldPlus className="h-4 w-4" />
            Add Admin
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Your Profile</CardTitle>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Check className="mr-1 h-4 w-4" />
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {session?.user.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {session?.user.email}</p>
            </div>
          )}

          <div className="mt-4 border-t pt-4">
            {changingPassword ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-sm text-green-600">Password changed successfully!</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleChangePassword} disabled={savingPassword}>
                    <Check className="mr-1 h-4 w-4" />
                    {savingPassword ? "Saving…" : "Update Password"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError("");
                      setPasswordSuccess(false);
                    }}
                    disabled={savingPassword}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setChangingPassword(true)}>
                <KeyRound className="mr-1 h-4 w-4" />
                Change Password
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>
                    {a.createdAt
                      ? new Date(a.createdAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    No admins found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
