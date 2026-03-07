import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { authClient } from "~/lib/auth-client.js";

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
            <span className="text-xs text-white/50">Member Portal</span>
          </div>
        </Link>

        {/* Card */}
        <div className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.06] p-8 backdrop-blur-sm">
          {sent ? (
            <div className="flex flex-col items-center gap-5 text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #0D7C5F 0%, #2DD4A8 100%)",
                }}
              >
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h2 className="font-[family-name:var(--font-family-heading)] text-xl font-bold text-white">
                  Check your email
                </h2>
                <p className="text-sm leading-relaxed text-white/60">
                  We sent a login link to{" "}
                  <span className="font-medium text-white/80">{email}</span>.
                  Click the link to sign in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-white/50 transition-colors hover:text-white/80"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Try a different email
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5 text-center">
                <h2 className="font-[family-name:var(--font-family-heading)] text-xl font-bold text-white">
                  Welcome back
                </h2>
                <p className="text-sm text-white/50">
                  Sign in to manage your Skim Pintar coverage
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    placeholder="your@email.com"
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
                    "Sending link..."
                  ) : (
                    <>
                      Send login link
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
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
