import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const cx = "mx-auto w-full max-w-md md:max-w-2xl px-6 md:px-8";

function LandingPage() {
  return (
    <div className="landing-zoom min-h-screen bg-cream font-[family-name:var(--font-family-body)]">
      {/* Hero Section */}
      <section
        className="flex flex-col items-center pb-20 pt-16"
        style={{
          background:
            "linear-gradient(170deg, #032A21 0%, #085A44 25%, #0D7C5F 55%, #2DD4A8 100%)",
        }}
      >
        <div className={`${cx} flex flex-col items-center gap-4`}>
          <img src="/logo.webp" alt="Masjid Ar-Raudhah" className="h-20 w-auto" />

          <h1 className="max-w-sm text-center font-[family-name:var(--font-family-heading)] text-4xl leading-[1.1] font-bold tracking-tight text-white md:max-w-lg md:text-5xl">
            Be the reason
            <br />
            Masjid Ar-Raudhah thrives.
          </h1>

          <p className="max-w-sm text-center text-[15px] leading-[1.7] text-white/85 md:max-w-md md:text-base">
            Every prayer, class, and mosque operations — they happen because
            people like you give consistently. Not once. Every month.
          </p>

          <Link
            to="/member/login"
            className="flex items-center gap-2 rounded-full bg-gold px-10 py-[15px] font-bold text-gdeep"
          >
            Start giving monthly
            <ArrowRight size={16} />
          </Link>

          <p className="text-center text-[13px] text-white/50">
            From $5/month · Cancel anytime
          </p>
        </div>
      </section>

      {/* Reality Section */}
      <section className="bg-cream py-16">
        <div className={`${cx} flex flex-col items-center gap-5`}>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-g1" />
            <span className="text-[11px] font-bold tracking-[1.1px] text-g1">
              THE REALITY
            </span>
          </div>

          <h2 className="w-full text-center font-[family-name:var(--font-family-heading)] text-[30px] leading-[1.15] font-bold tracking-tight text-gd md:text-4xl">
            It takes a village to
            <br />
            keep our masjid alive
          </h2>

          <div className="flex max-w-lg flex-col items-center gap-5">
            <p className="w-full text-center text-[15px] leading-[1.75] text-txt2">
              Every month, Masjid Ar-Raudhah serves hundreds of families —
              daily prayers, Friday sermons, funeral services, religious
              education, youth programmes, and community support.
            </p>

            <p className="w-full text-center text-[15px] leading-[1.75] text-txt2">
              All of this costs money. Electricity, staff salaries,
              maintenance, course materials, burial services. One-off
              donations help — but they don&apos;t keep the lights on
              year-round.
            </p>

            <p className="w-full text-center text-[15px] leading-[1.75] font-bold text-txt">
              What helps most? Consistent, monthly support from people who care.
            </p>
          </div>

          <Link
            to="/member/login"
            className="flex items-center gap-2 rounded-full bg-g1 px-8 py-[13px] text-sm font-bold text-white"
          >
            Be one of them
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Impact Journey Section */}
      <section className="bg-gdeep py-14">
        <div className={`${cx} flex flex-col items-center gap-8`}>
          {/* Header */}
          <div className="flex w-full flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              <span className="text-[10px] font-bold tracking-[1.2px] text-gold">
                YOUR IMPACT
              </span>
            </div>
            <h2 className="w-full text-center font-[family-name:var(--font-family-heading)] text-[28px] leading-[1.15] font-bold tracking-tight text-white md:text-[34px]">
              What your contribution
              <br />
              helps keep alive
            </h2>
          </div>

          {/* Timeline */}
          <div className="flex w-full max-w-md flex-col md:mx-auto">
            {[
              {
                emoji: "💡",
                title: "Lights stay on",
                desc: "Electricity & air-conditioning for 5 daily prayers",
              },
              {
                emoji: "🤲",
                title: "Asatizah keep teaching",
                desc: "Salaries for the people who lead prayers & guide the community",
              },
              {
                emoji: "📚",
                title: "Knowledge keeps flowing",
                desc: "Religious classes, Quran recitations & youth programmes",
                last: true,
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, #0D7C5F 0%, #2DD4A8 100%)",
                    }}
                  >
                    <span className="text-lg">{item.emoji}</span>
                  </div>
                  {!item.last && (
                    <div className="h-10 w-0.5 bg-white/10" />
                  )}
                </div>
                <div className={`flex flex-col gap-1 ${item.last ? "pt-1" : "pt-1 pb-5"}`}>
                  <span className="text-[15px] font-bold text-white">
                    {item.title}
                  </span>
                  <span className="text-[13px] leading-[1.5] text-white/60">
                    {item.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Bar */}
          <div className="flex w-full max-w-md flex-col items-center gap-3.5 rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-6 md:mx-auto">
            <h3 className="text-center font-[family-name:var(--font-family-heading)] text-xl font-bold text-gold">
              Small amounts, big impact.
            </h3>
            <p className="w-full text-center text-[13px] leading-[1.55] text-white/60">
              Your $5 alone won&apos;t cover it all — but when hundreds give
              together, every single month, it does.
            </p>
            <Link
              to="/member/login"
              className="flex items-center gap-2 rounded-full bg-gold px-8 py-[13px] text-sm font-bold text-gdeep"
            >
              Start giving monthly
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Hadith Section */}
      <section
        className="py-12"
        style={{
          background: "linear-gradient(135deg, #085A44 0%, #0D7C5F 100%)",
        }}
      >
        <div className={`${cx} flex flex-col items-center justify-center gap-3`}>
          <p className="max-w-sm text-center font-[family-name:var(--font-family-heading)] text-xl italic leading-[1.6] text-white/90 md:max-w-lg md:text-2xl">
            &ldquo;The most beloved of deeds to Allah are those that are most
            consistent, even if they are small.&rdquo;
          </p>
          <p className="text-center text-xs font-semibold text-white/40">
            — Prophet Muhammad ﷺ (Bukhari &amp; Muslim)
          </p>
        </div>
      </section>

      {/* The Ask Section */}
      <section className="bg-gdeep py-16">
        <div className={`${cx} flex flex-col items-center gap-4`}>
          <div className="flex w-full flex-col items-center">
            <h2 className="text-center font-[family-name:var(--font-family-heading)] text-[32px] font-bold tracking-tight text-white md:text-[38px]">
              Choose your impact.
            </h2>
            <h2 className="text-center font-[family-name:var(--font-family-heading)] text-[32px] font-bold tracking-tight text-gold md:text-[38px]">
              Every dollar matters.
            </h2>
          </div>

          <p className="max-w-sm text-center text-[15px] leading-[1.7] text-white/75 md:max-w-md">
            Pick an amount that feels right for you. No matter how small,
            your consistent giving keeps this masjid alive for everyone.
          </p>

          {/* Pricing Cards */}
          <div className="flex w-full max-w-md gap-3 md:mx-auto">
            {[
              { amount: "$5", highlighted: false },
              { amount: "$20", highlighted: true },
              { amount: "$50", highlighted: false },
            ].map((tier) => (
              <div
                key={tier.amount}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl p-5 md:py-8 ${tier.highlighted
                  ? "border-2 border-gold bg-white/12"
                  : "border-2 border-white/12 bg-white/[0.06]"
                  }`}
              >
                <span
                  className={`font-[family-name:var(--font-family-heading)] text-[28px] font-extrabold md:text-[36px] ${tier.highlighted ? "text-gold" : "text-white"
                    }`}
                >
                  {tier.amount}
                </span>
                <span className="text-[11px] font-medium text-white/50">
                  /month
                </span>
              </div>
            ))}
          </div>

          <Link
            to="/member/login"
            className="flex items-center gap-2 rounded-full bg-gold px-11 py-[15px] font-bold text-gdeep"
          >
            Start my monthly gift
            <ArrowRight size={16} />
          </Link>

          <p className="text-center text-xs text-white/35">
            Takes 2 minutes · Cancel anytime
          </p>
        </div>
      </section>

      {/* Perks Teaser Section */}
      <section className="bg-cream py-14">
        <div className={cx}>
          <div
            className="flex w-full flex-col items-center gap-4 rounded-[28px] px-7 py-10 md:px-12 md:py-14"
            style={{
              background:
                "linear-gradient(150deg, #032A21 0%, #0D7C5F 100%)",
            }}
          >
            <span className="text-[40px]">🎁</span>
            <h2 className="max-w-sm text-center font-[family-name:var(--font-family-heading)] text-2xl leading-[1.2] font-bold tracking-tight text-white md:max-w-md md:text-3xl">
              Oh, and there&apos;s
              <br />a little something for you too.
            </h2>
            <p className="max-w-sm text-center text-sm leading-[1.65] text-white/80 md:max-w-md">
              Monthly givers unlock exclusive perks — from covered funeral
              services to course discounts for your family.
            </p>
            <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-5 py-2.5">
              <span className="text-xs font-semibold text-white/80">
                You&apos;ll discover all perks in the next step
              </span>
              <ArrowRight size={12} className="text-white/80" />
            </div>
          </div>
        </div>
      </section>

      {/* Numbers Section */}
      <section
        className="py-14"
        style={{
          background:
            "linear-gradient(180deg, #F0FDF4 0%, #FFFDF5 100%)",
        }}
      >
        <div className={`${cx} flex flex-col items-center gap-7`}>
          <h2 className="w-full text-center font-[family-name:var(--font-family-heading)] text-[26px] leading-[1.15] font-bold tracking-tight text-gd md:text-[32px]">
            A growing community
            <br />
            of monthly givers
          </h2>

          <div className="flex w-full max-w-lg gap-3 md:mx-auto">
            {[
              { value: "1,247", label: "MEMBERS" },
              { value: "$6.2k", label: "MONTHLY" },
              { value: "100%", label: "CLAIMS COVERED" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-1 flex-col items-center gap-1 rounded-[20px] px-3 py-[22px] md:py-7"
                style={{
                  background:
                    "linear-gradient(135deg, #0D7C5F 0%, #2DD4A8 100%)",
                }}
              >
                <span className="font-[family-name:var(--font-family-heading)] text-2xl font-extrabold leading-none text-white md:text-3xl">
                  {stat.value}
                </span>
                <span className="text-[10px] font-semibold tracking-[0.4px] text-white/70">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-cream py-14">
        <div className={`${cx} flex flex-col items-center gap-6`}>
          <h2 className="text-center font-[family-name:var(--font-family-heading)] text-[26px] font-bold tracking-tight text-gd md:text-[32px]">
            Hear from the jemaah
          </h2>

          <div className="flex w-full flex-col gap-6 md:flex-row">
            {[
              {
                quote:
                  "It's just $5 a month but knowing it helps keep the masjid running for everyone — that's what matters to me. I used to give whenever I remembered, now it's consistent and I feel part of something bigger.",
                name: "Ahmad R.",
                since: "Member since 2024",
              },
              {
                quote:
                  "My family has been going to this masjid for years. Being a monthly giver feels like I'm giving back to a place that has given us so much. And there are perks too, which is a nice bonus.",
                name: "Siti H.",
                since: "Monthly giver",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="flex flex-1 flex-col gap-3 rounded-[20px] border-[1.5px] border-[#EEEEEE] bg-white px-[22px] py-7"
              >
                <span className="font-[family-name:var(--font-family-heading)] text-[56px] leading-[0.6] text-mint/40">
                  &ldquo;
                </span>
                <p className="w-full text-sm italic leading-[1.65] text-txt2">
                  {t.quote}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-gd">{t.name}</span>
                  <span className="text-xs text-txt3">· {t.since}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gdeep py-16">
        <div className={`${cx} flex flex-col items-center gap-3`}>
          <img src="/logo.webp" alt="Masjid Ar-Raudhah" className="h-20 w-auto" />
          <div className="flex flex-col items-center">
            <h2 className="text-center font-[family-name:var(--font-family-heading)] text-[28px] leading-[1.15] font-bold tracking-tight text-white md:text-[34px]">
              Masjid Ar-Raudhah is counting
            </h2>
            <h2 className="text-center font-[family-name:var(--font-family-heading)] text-[28px] leading-[1.15] font-bold tracking-tight text-gold md:text-[34px]">
              on people like you.
            </h2>
          </div>
          <p className="max-w-sm text-center text-[15px] leading-[1.65] text-white/65 md:max-w-md">
            Join hundreds of families who give a little every month — so
            your masjid never has to worry about keeping its doors open.
          </p>
          <Link
            to="/member/login"
            className="flex items-center gap-2 rounded-full bg-gold px-11 py-[15px] font-bold text-gdeep"
          >
            Start giving monthly
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-gdeep p-6">
        <div className={`${cx} flex flex-col items-center gap-1`}>
          <img src="/logo.webp" alt="Masjid Ar-Raudhah" className="h-8 w-auto opacity-55" />
          <span className="text-[13px] font-bold text-white/55">
            Masjid Ar-Raudhah
          </span>
          <span className="text-center text-xs text-white/30">
            Skim Pintar Monthly Giving Programme
          </span>
          <span className="text-center text-xs text-white/30">
            © 2026 Masjid Ar-Raudhah. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
