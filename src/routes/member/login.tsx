import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "~/lib/auth-client.js";
import { Button } from "~/components/ui/button.js";
import { Input } from "~/components/ui/input.js";
import { Label } from "~/components/ui/label.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card.js";

export const Route = createFileRoute("/member/login")({
  component: MemberLogin,
});

function MemberLogin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL: "/member",
      });
      if (result.error) {
        setError(result.error.message ?? "Failed to send login link");
      } else {
        setSent(true);
      }
    } catch {
      setError("Failed to send login link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Member Login</CardTitle>
          <CardDescription>
            Sign in to view your Skim Pintar coverage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="rounded-md bg-secondary p-4">
                <p className="font-medium text-primary">Check your email!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We sent a login link to <strong>{email}</strong>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSent(false)}
                className="w-full"
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Login Link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
