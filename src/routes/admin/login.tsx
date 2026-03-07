import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { authClient } from "~/lib/auth-client.js";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });
      if (result.error) {
        setError(result.error.message ?? "Login failed");
      } else {
        router.navigate({ to: "/admin" });
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12 font-[family-name:var(--font-family-body)]"
      style={{
        background:
          "linear-gradient(170deg, #032A21 0%, #085A44 40%, #0D7C5F 100%)",
      }}
    >
      <div className="hero-animate flex w-full max-w-sm flex-col items-center gap-8">
        {/* Logo & branding */}
        <Link to="/" className="flex flex-col items-center gap-3">
          <img
            src="/logo.webp"
            alt="Masjid Ar-Raudhah"
            className="h-16 w-auto"
          />
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-[family-name:var(--font-family-heading)] text-lg font-bold text-white">
              Skim Pintar
            </span>
            <span className="text-xs text-white/50">Admin Portal</span>
          </div>
        </Link>

        {/* Card */}
        <div className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.06] p-8 backdrop-blur-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5 text-center">
              <h2 className="font-[family-name:var(--font-family-heading)] text-xl font-bold text-white">
                Admin Login
              </h2>
              <p className="text-sm text-white/50">
                Sign in to the Skim Pintar admin portal
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-white/60"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                  required
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-mint/50 focus:ring-2 focus:ring-mint/20"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-white/60"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-mint/50 focus:ring-2 focus:ring-mint/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-gdeep transition-all hover:brightness-110 disabled:opacity-60"
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer link */}
        <Link
          to="/"
          className="text-xs text-white/30 transition-colors hover:text-white/60"
        >
          &larr; Back to masjid homepage
        </Link>
      </div>
    </div>
  );
}
