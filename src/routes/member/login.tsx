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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authClient.signIn.magicLink({
        email,
        callbackURL: "/member",
      });
    } catch {
      // ignore — don't reveal whether the email exists
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium">Check your email for the magic link</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <form onSubmit={handleSubmit} className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
