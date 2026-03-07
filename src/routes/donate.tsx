import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Users, Shield, CheckCircle, Mail, AlertCircle } from "lucide-react";
import {
  createDonateCheckout,
  getCheckoutSubscriptionInfo,
} from "~/lib/server-fns.js";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  PINTAR_PERKS,
  PINTAR_PLUS_ALL_PERKS,
  PINTAR_PLUS_PREVIEW_PERKS,
} from "~/lib/perks.js";

const donateSearchSchema = z.object({
  success: z.boolean().optional().catch(undefined),
  session_id: z.string().optional().catch(undefined),
  amount: z.coerce.number().int().positive().optional().catch(undefined),
});

export const Route = createFileRoute("/donate")({
  component: DonatePage,
  validateSearch: zodValidator({ schema: donateSearchSchema, input: "output" }),
});

const PRESET_AMOUNTS = [5, 10, 20, 50];

type SubInfo = {
  planName: string;
  planSlug: string;
  monthlyAmount: string;
  coverageStart: string;
  coverageUntil: string;
  courseDiscount: number;
  maxDependants: number | null;
};

function DonateSuccessPage({ sessionId }: { sessionId?: string }) {
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(!!sessionId);
  const [error, setError] = useState(!sessionId);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    const maxTime = Date.now() + 2 * 60 * 1000; // 2 minutes
    const pollInterval = 3000; // 3 seconds

    async function poll() {
      while (!cancelled && Date.now() < maxTime) {
        try {
          const info = await getCheckoutSubscriptionInfo({ data: { sessionId } });
          if (cancelled) return;
          if (info) {
            setSubInfo(info as SubInfo);
            setLoading(false);
            return;
          }
        } catch {
          // ignore and retry
        }
        await new Promise((r) => setTimeout(r, pollInterval));
      }
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [sessionId]);

  if (loading) {
    return (
      <div
        className="min-h-screen font-[family-name:var(--font-family-body)] flex flex-col items-center justify-center px-6"
        style={{
          background:
            "linear-gradient(170deg, #032A21 0%, #085A44 25%, #0D7C5F 55%, #2DD4A8 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-6">
          <img
            src="/logo.webp"
            alt="Masjid Ar-Raudhah"
            className="h-16 w-auto success-loading-pulse"
          />
          <p className="text-white/80 text-sm font-medium">
            Setting up your membership...
          </p>
        </div>
      </div>
    );
  }

  if (subInfo) {
    const isPintarPlus = subInfo.planSlug === "pintar_plus";
    const perks = isPintarPlus ? PINTAR_PLUS_ALL_PERKS : PINTAR_PERKS;

    return (
      <div className="min-h-screen font-[family-name:var(--font-family-body)]">
        {/* Hero gradient section */}
        <div
          className="flex flex-col items-center pb-28 pt-12 lg:pb-32 lg:pt-16 px-6"
          style={{
            background:
              "linear-gradient(170deg, #032A21 0%, #085A44 25%, #0D7C5F 55%, #2DD4A8 100%)",
          }}
        >
          <div className="success-hero-animate flex flex-col items-center gap-4 lg:gap-5 max-w-md text-center">
            <div className="relative flex items-center justify-center">
              <div className="success-glow-ring" />
              <div className="success-confetti-wrap">
                <div className="flex h-20 w-20 lg:h-24 lg:w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm success-check-pop">
                  <CheckCircle
                    size={40}
                    className="text-mint lg:!w-12 lg:!h-12"
                  />
                </div>
              </div>
            </div>

            <h1 className="font-[family-name:var(--font-family-heading)] text-3xl lg:text-4xl font-bold text-white">
              Alhamdulillah!
            </h1>
            <p className="text-base lg:text-lg text-white/85">
              You're now a{" "}
              <span className="font-semibold text-white">
                {subInfo.planName}
              </span>{" "}
              member
            </p>
          </div>
        </div>

        {/* Subscription card */}
        <div className="mx-auto w-full max-w-md lg:max-w-xl px-6 -mt-20 lg:-mt-24">
          <div
            className="success-card-reveal relative overflow-hidden rounded-[24px] lg:rounded-[28px] border border-white/10"
            style={{
              background:
                "linear-gradient(150deg, #032A21 0%, #085A44 60%, #0D7C5F 100%)",
            }}
          >
            <div className="gift-shimmer success-card-shimmer" />

            <div className="relative z-10 flex flex-col gap-5 p-6 lg:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPintarPlus ? (
                    <Users size={18} className="text-gold" />
                  ) : (
                    <Shield size={18} className="text-mint" />
                  )}
                  <span className="font-[family-name:var(--font-family-heading)] text-lg lg:text-xl font-bold text-white">
                    {subInfo.planName}
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] lg:text-xs font-bold ${
                    isPintarPlus
                      ? "bg-gold/20 text-gold"
                      : "bg-mint/20 text-mint"
                  }`}
                >
                  Active
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-family-heading)] text-3xl lg:text-4xl font-bold text-white">
                  ${subInfo.monthlyAmount}
                </span>
                <span className="text-sm text-white/50">/month</span>
              </div>

              <div
                className={`h-px ${isPintarPlus ? "bg-gold/20" : "bg-mint/20"}`}
              />

              <div className="success-perk-stagger flex flex-col gap-2.5">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2.5">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        isPintarPlus ? "bg-gold/20" : "bg-mint/20"
                      }`}
                    >
                      <Check
                        size={12}
                        className={isPintarPlus ? "text-gold" : "text-mint"}
                      />
                    </div>
                    <span className="text-sm lg:text-base text-white">
                      {perk}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Next steps + CTA */}
        <div className="mx-auto w-full max-w-md lg:max-w-xl px-6 py-8 lg:py-12 flex flex-col gap-6 lg:gap-8">
          <div className="success-next-steps flex flex-col items-center gap-3 rounded-2xl bg-white border border-gray-100 p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-g1/10">
              <Mail size={20} className="text-g1" />
            </div>
            <p className="font-semibold text-gd">Check your email</p>
            <p className="text-sm text-txt2 leading-relaxed">
              We've sent a login link to your email. Use it to access your
              member portal and manage your subscription.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link
              to="/"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 lg:py-5 font-bold lg:text-lg text-gdeep hover:brightness-105 transition-all donate-cta-glow"
            >
              Back to Homepage
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-cream p-6">
          <div className="mx-auto flex max-w-md flex-col items-center gap-1">
            <img
              src="/logo.webp"
              alt="Masjid Ar-Raudhah"
              className="h-8 w-auto opacity-40"
            />
            <span className="text-xs text-txt3">
              Masjid Ar-Raudhah &middot; Skim Pintar
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // Error state: no session_id, fetch failed, or null result
  return (
    <div className="min-h-screen font-[family-name:var(--font-family-body)] flex flex-col">
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12"
        style={{
          background:
            "linear-gradient(170deg, #032A21 0%, #085A44 25%, #0D7C5F 55%, #2DD4A8 100%)",
        }}
      >
        <div className="success-hero-animate flex flex-col items-center gap-5 max-w-md text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            <AlertCircle size={40} className="text-gold" />
          </div>
          <h1 className="font-[family-name:var(--font-family-heading)] text-2xl lg:text-3xl font-bold text-white">
            Something went wrong
          </h1>
          <p className="text-base text-white/80 leading-relaxed">
            Your payment may still have been processed. Please check your email
            for a confirmation, or contact us for help.
          </p>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-full bg-gold px-8 py-4 font-bold text-gdeep hover:brightness-105 transition-all donate-cta-glow"
          >
            Back to Homepage
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-cream p-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-1">
          <img
            src="/logo.webp"
            alt="Masjid Ar-Raudhah"
            className="h-8 w-auto opacity-40"
          />
          <span className="text-xs text-txt3">
            Masjid Ar-Raudhah &middot; Skim Pintar
          </span>
        </div>
      </footer>
    </div>
  );
}

function DonatePage() {
  const { success, session_id, amount: defaultAmount } = Route.useSearch();
  const isPreset = defaultAmount !== undefined && PRESET_AMOUNTS.includes(defaultAmount);
  const isDefaultCustom = defaultAmount !== undefined && !isPreset;
  const [amount, setAmount] = useState<number | null>(isPreset ? defaultAmount : null);
  const [customAmount, setCustomAmount] = useState(isDefaultCustom ? String(defaultAmount) : "");
  const [isCustom, setIsCustom] = useState(isDefaultCustom);
  const [showCustom, setShowCustom] = useState(isDefaultCustom);
  const [perksKey, setPerksKey] = useState(0);
  const [shimmerTick, setShimmerTick] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const amountGridRef = useRef<HTMLDivElement>(null);
  const prevTierRef = useRef<string | null>(null);

  const effectiveAmount = isCustom ? Number(customAmount) || 0 : amount ?? 0;
  const hasSelection = amount !== null || isCustom;
  const isPintarPlus = effectiveAmount >= 20;
  const isPintar = effectiveAmount >= 5;

  const getTier = (amt: number) => {
    if (amt >= 20) return "plus";
    if (amt >= 5) return "pintar";
    return "none";
  };

  const triggerChange = (newAmount: number) => {
    const newTier = getTier(newAmount);
    const oldTier = prevTierRef.current;
    prevTierRef.current = newTier;

    if (oldTier !== null && oldTier !== newTier) {
      setPerksKey((k) => k + 1);
    }
    setShimmerTick((t) => t + 1);
  };

  const handlePreset = (val: number) => {
    triggerChange(val);
    setAmount(val);
    setIsCustom(false);
    setShowCustom(false);
    setCustomAmount("");
  };

  const handleUpgradeToPintarPlus = () => {
    triggerChange(20);
    setAmount(20);
    setIsCustom(false);
    setShowCustom(false);
    setCustomAmount("");
    amountGridRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCustomAmount(val);
    setIsCustom(true);
  };

  const handleCheckout = async () => {
    if (!isPintar || isLoading) return;
    setIsLoading(true);
    try {
      const result = await createDonateCheckout({
        data: { monthlyAmount: effectiveAmount },
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setIsLoading(false);
    }
  };

  if (success) {
    return <DonateSuccessPage sessionId={session_id} />;
  }

  return (
    <div className="min-h-screen bg-cream font-[family-name:var(--font-family-body)]">
      {/* Header */}
      <div
        className="flex flex-col items-center pb-10 pt-12 lg:pb-14 lg:pt-16"
        style={{
          background:
            "linear-gradient(170deg, #032A21 0%, #085A44 25%, #0D7C5F 55%, #2DD4A8 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-md lg:max-w-xl px-6 hero-animate flex flex-col items-center gap-3 lg:gap-4">
          <Link to="/">
            <img
              src="/logo.webp"
              alt="Masjid Ar-Raudhah"
              className="h-14 lg:h-20 w-auto"
            />
          </Link>
          <h1 className="text-center font-[family-name:var(--font-family-heading)] text-2xl lg:text-4xl font-bold tracking-tight text-white">
            Choose your
            <br />
            monthly contribution
          </h1>
          <p className="text-center text-sm lg:text-base text-white/70">
            Every dollar keeps our masjid thriving
          </p>
        </div>
      </div>

      {/* Amount Selection */}
      <div className="mx-auto w-full max-w-md lg:max-w-xl px-6 -mt-1">
        <div className="flex flex-col gap-6 lg:gap-8 py-8 lg:py-12">
          {/* Amount Grid */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold tracking-[0.5px] text-g2 uppercase">
              Monthly amount
            </label>
            <div ref={amountGridRef} className="grid grid-cols-4 gap-2.5 lg:gap-3">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  onClick={() => handlePreset(val)}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl py-4 lg:py-5 font-[family-name:var(--font-family-heading)] text-2xl lg:text-3xl font-bold transition-all duration-300 ${!isCustom && amount === val
                    ? "bg-gdeep text-gold ring-2 ring-gold/30"
                    : "bg-white text-gd border border-gray-200 hover:border-g1/30"
                    }`}
                >
                  <span>${val}</span>
                  <span
                    className={`text-[10px] lg:text-xs font-medium ${!isCustom && amount === val
                      ? "text-white/50"
                      : "text-txt3"
                      }`}
                  >
                    /mo
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            {showCustom ? (
              <div className="donate-input-enter flex items-center gap-3 rounded-2xl border-2 border-g1/30 bg-white px-4 py-3.5 lg:py-4">
                <span className="font-[family-name:var(--font-family-heading)] text-xl lg:text-2xl font-bold text-gd">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="flex-1 bg-transparent font-[family-name:var(--font-family-heading)] text-xl lg:text-2xl font-bold text-gd outline-none placeholder:font-[family-name:var(--font-family-body)] placeholder:text-sm placeholder:font-normal placeholder:text-txt3"
                />
                <span className="text-xs font-medium text-txt3">
                  /month
                </span>
              </div>
            ) : (
              <button
                onClick={() => { setShowCustom(true); setIsCustom(true); }}
                className="text-center text-sm font-medium text-g1 underline hover:text-g2 transition-colors"
              >
                or choose a custom amount
              </button>
            )}
          </div>

          {hasSelection && (
            <div className="perks-section-enter flex flex-col gap-6 lg:gap-8">
              {/* Perks intro */}
              <div className="flex flex-col items-center gap-2 text-center pt-2">
                <span className="donate-gift-emoji">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-gold">
                    <rect x="3" y="8" width="18" height="4" rx="1" /><rect x="3" y="12" width="18" height="8" rx="1" /><path d="M12 8v12" /><path d="M19 12v8" /><path d="M5 12v8" /><path d="M12 8c-2-4-6-4-6-1s4 1 6 1" /><path d="M12 8c2-4 6-4 6-1s-4 1-6 1" />
                  </svg>
                </span>
                <h2 className="font-[family-name:var(--font-family-heading)] text-xl lg:text-2xl font-bold text-gd">
                  A gift from your masjid
                </h2>
                <p className="max-w-sm text-sm lg:text-base leading-relaxed text-txt2">
                  As a thank you for your commitment, Masjid Ar-Raudhah honours
                  every monthly giver with special coverage and benefits under{" "}
                  <span className="font-semibold text-g1">Skim Pintar</span>.
                </p>
              </div>

              {/* Skim Pintar Plus — single unified card when $20+ */}
              {isPintarPlus ? (
                <div
                  className="relative overflow-hidden rounded-[24px] lg:rounded-[28px] border-2 border-gold transition-all duration-500"
                  style={{
                    background:
                      "linear-gradient(150deg, #032A21 0%, #085A44 60%, #0D7C5F 100%)",
                  }}
                >
                  <div key={`shimmer-plus-${shimmerTick}`} className="gift-shimmer donate-card-shimmer" />
                  <div key={`glow-plus-${shimmerTick}`} className="donate-card-glow-gold absolute inset-0 rounded-[inherit] pointer-events-none" />

                  <div className="relative z-10 flex flex-col gap-5 p-6 lg:p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={18} className="text-gold" />
                        <span className="font-[family-name:var(--font-family-heading)] text-lg lg:text-xl font-bold text-white">
                          Skim Pintar Plus
                        </span>
                      </div>
                      <span className="rounded-full bg-gold/20 px-3 py-1 text-[11px] lg:text-xs font-bold text-gold">
                        Unlocked
                      </span>
                    </div>

                    <p className="text-sm lg:text-base leading-relaxed text-white/70">
                      You and your family are fully covered:
                    </p>

                    <div key={`plus-perks-${perksKey}`} className="donate-perk-stagger flex flex-col gap-2.5">
                      {PINTAR_PLUS_ALL_PERKS.map((perk) => (
                        <div key={perk} className="flex items-center gap-2.5">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20">
                            <Check size={12} className="text-gold" />
                          </div>
                          <span className="text-sm lg:text-base text-white">
                            {perk}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Skim Pintar Card */}
                  <div
                    className={`relative overflow-hidden rounded-[24px] lg:rounded-[28px] transition-all duration-500 ${isPintar ? "opacity-100" : "opacity-40"
                      }`}
                    style={{
                      background:
                        "linear-gradient(150deg, #032A21 0%, #0D7C5F 100%)",
                    }}
                  >
                    <div key={`shimmer-pintar-${shimmerTick}`} className="gift-shimmer donate-card-shimmer" />
                    <div key={`glow-pintar-${shimmerTick}`} className="donate-card-glow-mint absolute inset-0 rounded-[inherit] pointer-events-none" />

                    <div className="relative z-10 flex flex-col gap-5 p-6 lg:p-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield size={18} className="text-mint" />
                          <span className="font-[family-name:var(--font-family-heading)] text-lg lg:text-xl font-bold text-white">
                            Skim Pintar
                          </span>
                        </div>
                        {isPintar && (
                          <span className="rounded-full bg-mint/20 px-3 py-1 text-[11px] lg:text-xs font-bold text-mint">
                            Included
                          </span>
                        )}
                      </div>

                      <p className="text-sm lg:text-base leading-relaxed text-white/70">
                        {isPintar
                          ? "Your monthly contribution automatically includes these benefits:"
                          : "Donate $5/mo or more to unlock these benefits:"}
                      </p>

                      <div key={`pintar-perks-${perksKey}`} className="donate-perk-stagger flex flex-col gap-2.5">
                        {PINTAR_PERKS.map((perk) => (
                          <div key={perk} className="flex items-center gap-2.5">
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isPintar ? "bg-mint/20" : "bg-white/10"
                                }`}
                            >
                              <Check
                                size={12}
                                className={isPintar ? "text-mint" : "text-white/30"}
                              />
                            </div>
                            <span
                              className={`text-sm lg:text-base ${isPintar ? "text-white" : "text-white/40"
                                }`}
                            >
                              {perk}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Skim Pintar Plus Nudge — clickable */}
                  <button
                    onClick={handleUpgradeToPintarPlus}
                    className="group relative overflow-hidden rounded-[24px] lg:rounded-[28px] border-2 border-dashed border-gold/30 bg-gdeep/50 text-left transition-all duration-300 hover:border-gold/60 hover:bg-gdeep/70 cursor-pointer"
                  >
                    <div className="relative z-10 flex flex-col gap-5 p-6 lg:p-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={18} className="text-gold" />
                          <span className="font-[family-name:var(--font-family-heading)] text-lg lg:text-xl font-bold text-white">
                            Skim Pintar Plus
                          </span>
                        </div>
                        <span className="rounded-full bg-gold/10 px-3 py-1 text-[11px] lg:text-xs font-semibold text-gold/60 group-hover:bg-gold/20 group-hover:text-gold transition-all">
                          $20+/mo
                        </span>
                      </div>

                      <p className="text-sm lg:text-base leading-relaxed text-white/70">
                        Upgrade to $20/mo to extend coverage to your family:
                      </p>

                      <div className="flex flex-col gap-2.5">
                        {PINTAR_PLUS_PREVIEW_PERKS.map((perk) => (
                          <div key={perk} className="flex items-center gap-2.5">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                              <Check size={12} className="text-white/30" />
                            </div>
                            <span className="text-sm lg:text-base text-white/40">
                              {perk}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-2 rounded-full bg-gold/10 py-2.5 text-sm font-semibold text-gold group-hover:bg-gold/20 transition-all">
                        Tap to upgrade
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </button>
                </>
              )}

              {/* CTA */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  onClick={handleCheckout}
                  disabled={!isPintar || isLoading}
                  className={`flex w-full items-center justify-center gap-2 rounded-full py-4 lg:py-5 font-bold lg:text-lg transition-all ${isPintar
                    ? "bg-gold text-gdeep hover:brightness-105 donate-cta-glow"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  {isLoading
                    ? "Redirecting to checkout\u2026"
                    : isPintar
                      ? `Continue with $${effectiveAmount}/mo`
                      : "Select at least $5/mo"}
                  {isPintar && !isLoading && <ArrowRight size={18} />}
                </button>
                <p className="text-center text-xs text-txt3">
                  Secure payment via Stripe · Cancel anytime
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-cream p-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-1">
          <img
            src="/logo.webp"
            alt="Masjid Ar-Raudhah"
            className="h-8 w-auto opacity-40"
          />
          <span className="text-xs text-txt3">
            Masjid Ar-Raudhah · Skim Pintar
          </span>
        </div>
      </footer>
    </div>
  );
}
