import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Users, Shield } from "lucide-react";

export const Route = createFileRoute("/donate")({
  component: DonatePage,
});

const PRESET_AMOUNTS = [5, 10, 20, 50];

const PINTAR_PERKS = [
  "Free funeral services",
  "Ritual bathing & shrouding",
  "Burial & transport",
  "20% discount on religious courses",
];

const PINTAR_PLUS_ALL_PERKS = [
  "Free funeral services",
  "Ritual bathing & shrouding",
  "Burial & transport",
  "Coverage for immediate family",
  "Same-address family members",
  "50% discount on religious courses",
  "50% discount for parents/in-laws",
  "Extended funeral service coverage",
];

const PINTAR_PLUS_PREVIEW_PERKS = [
  "All individual benefits",
  "Coverage for immediate family",
  "Same-address family members",
  "50% discount for parents/in-laws",
  "Extended funeral service coverage",
];

function DonatePage() {
  const [amount, setAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const effectiveAmount = isCustom ? Number(customAmount) || 0 : amount;
  const isPintarPlus = effectiveAmount >= 20;
  const isPintar = effectiveAmount >= 5;

  const handlePreset = (val: number) => {
    setAmount(val);
    setIsCustom(false);
    setShowCustom(false);
    setCustomAmount("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCustomAmount(val);
    setIsCustom(true);
  };

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
            <div className="grid grid-cols-4 gap-2.5 lg:gap-3">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  onClick={() => handlePreset(val)}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl py-4 lg:py-5 font-[family-name:var(--font-family-heading)] text-2xl lg:text-3xl font-bold transition-all ${
                    !isCustom && amount === val
                      ? "bg-gdeep text-gold ring-2 ring-gold/30 scale-[1.03]"
                      : "bg-white text-gd border border-gray-200 hover:border-g1/30"
                  }`}
                >
                  <span>${val}</span>
                  <span
                    className={`text-[10px] lg:text-xs font-medium ${
                      !isCustom && amount === val
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
              <div className="flex items-center gap-3 rounded-2xl border-2 border-g1/30 bg-white px-4 py-3.5 lg:py-4 transition-all">
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

          {/* Perks intro */}
          <div className="flex flex-col items-center gap-2 text-center pt-2">
            <span className="text-2xl">🎁</span>
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
              <div className="gift-shimmer auto-shimmer" />

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

                <div className="flex flex-col gap-2.5">
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
                className={`relative overflow-hidden rounded-[24px] lg:rounded-[28px] transition-all duration-500 ${
                  isPintar ? "opacity-100" : "opacity-40"
                }`}
                style={{
                  background:
                    "linear-gradient(150deg, #032A21 0%, #0D7C5F 100%)",
                }}
              >
                {isPintar && <div className="gift-shimmer auto-shimmer" />}

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

                  <div className="flex flex-col gap-2.5">
                    {PINTAR_PERKS.map((perk) => (
                      <div key={perk} className="flex items-center gap-2.5">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            isPintar ? "bg-mint/20" : "bg-white/10"
                          }`}
                        >
                          <Check
                            size={12}
                            className={isPintar ? "text-mint" : "text-white/30"}
                          />
                        </div>
                        <span
                          className={`text-sm lg:text-base ${
                            isPintar ? "text-white" : "text-white/40"
                          }`}
                        >
                          {perk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skim Pintar Plus Nudge */}
              <div className="relative overflow-hidden rounded-[24px] lg:rounded-[28px] border-2 border-dashed border-gold/30 bg-gdeep/50 opacity-70 transition-all duration-500">
                <div className="relative z-10 flex flex-col gap-5 p-6 lg:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-gold" />
                      <span className="font-[family-name:var(--font-family-heading)] text-lg lg:text-xl font-bold text-white">
                        Skim Pintar Plus
                      </span>
                    </div>
                    <span className="rounded-full bg-gold/10 px-3 py-1 text-[11px] lg:text-xs font-semibold text-gold/60">
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

                  {isPintar && (
                    <button
                      onClick={() => handlePreset(20)}
                      className="flex items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold transition-all hover:bg-gold/20"
                    >
                      Upgrade to $20/mo for family coverage
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* CTA */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <Link
              to="/member/login"
              className={`flex w-full items-center justify-center gap-2 rounded-full py-4 lg:py-5 font-bold lg:text-lg transition-all ${
                isPintar
                  ? "bg-gold text-gdeep hover:brightness-105"
                  : "bg-gray-300 text-gray-500 pointer-events-none"
              }`}
            >
              {isPintar
                ? `Continue with $${effectiveAmount}/mo`
                : "Select at least $5/mo"}
              {isPintar && <ArrowRight size={18} />}
            </Link>
            <p className="text-center text-xs text-txt3">
              Secure payment via Stripe · Cancel anytime
            </p>
          </div>
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
