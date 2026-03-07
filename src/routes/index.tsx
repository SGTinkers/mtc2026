import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Lightbulb, GraduationCap, BookOpen } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const cx = "mx-auto w-full max-w-md lg:max-w-2xl 2xl:max-w-3xl px-6 lg:px-10";

function LandingPage() {
  const [selectedAmount, setSelectedAmount] = useState(20);
  const [hadithVisible, setHadithVisible] = useState(false);
  const hadithRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = hadithRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHadithVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll-reveal: re-run on every mount so back-navigation works
  useEffect(() => {
    const selector = '.reveal,.reveal-scale,.reveal-left,.reveal-right,.reveal-quote,.reveal-pop,.reveal-gift-card';
    const els = document.querySelectorAll(selector);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-cream font-[family-name:var(--font-family-body)]">
      {/* Hero Section */}
      <section
        className="relative flex flex-col items-center pb-20 pt-16 lg:pb-32 lg:pt-24 2xl:pb-40 2xl:pt-32 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/carousel/5.jpg')", filter: "brightness(0.15)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(170deg, rgba(3,42,33,0.80) 0%, rgba(8,90,68,0.75) 25%, rgba(13,124,95,0.72) 55%, rgba(45,212,168,0.70) 100%)",
          }}
        />
        <div className={`${cx} relative z-10 hero-animate flex flex-col items-center gap-4 lg:gap-6 2xl:gap-8`}>
          <img src="/logo.webp" alt="Masjid Ar-Raudhah" className="h-20 lg:h-28 2xl:h-36 w-auto" />

          <h1 className="max-w-sm lg:max-w-2xl text-center font-[family-name:var(--font-family-heading)] text-4xl lg:text-6xl 2xl:text-7xl leading-[1.1] font-bold tracking-tight text-white">
            Be the reason
            <br />
            Masjid Ar-Raudhah thrives.
          </h1>

          <p className="max-w-sm lg:max-w-md 2xl:max-w-lg text-center text-[15px] lg:text-lg 2xl:text-xl leading-[1.7] text-white/85">
            Every prayer, class, and mosque operations. They happen because
            people like you give consistently. Not once. Every month.
          </p>

          <Link
            to="/donate"
            className="flex items-center gap-2 rounded-full bg-gold px-10 py-[15px] lg:px-14 lg:py-5 2xl:px-16 2xl:py-6 font-bold lg:text-lg 2xl:text-xl text-gdeep"
          >
            Start giving monthly
            <ArrowRight size={16} className="lg:h-5 lg:w-5" />
          </Link>

          <p className="text-center text-[13px] lg:text-sm 2xl:text-base text-white/50">
            From $5/month · Cancel anytime
          </p>
        </div>
      </section>

      {/* Reality Section */}
      <section className="bg-cream py-16 lg:py-24 2xl:py-32">
        <div className={`${cx} flex flex-col items-center gap-5 lg:gap-7 2xl:gap-9`}>
          <div className="reveal flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-g1" />
            <span className="text-[11px] lg:text-xs 2xl:text-sm font-bold tracking-[1.1px] text-g1">
              THE REALITY
            </span>
          </div>

          <h2 className="reveal reveal-delay-1 w-full text-center font-[family-name:var(--font-family-heading)] text-[30px] lg:text-4xl 2xl:text-5xl leading-[1.15] font-bold tracking-tight text-gd">
            It takes a village to
            <br />
            keep our masjid alive
          </h2>

          <div className="flex max-w-lg 2xl:max-w-xl flex-col items-center gap-5 lg:gap-7">
            <p className="reveal reveal-delay-2 w-full text-center text-[15px] lg:text-base 2xl:text-lg leading-[1.75] text-txt2">
              Every month, Masjid Ar-Raudhah serves hundreds of families:
              daily prayers, Friday sermons, funeral services, religious
              education, youth programmes, and community support.
            </p>

            <p className="reveal reveal-delay-3 w-full text-center text-[15px] lg:text-base 2xl:text-lg leading-[1.75] text-txt2">
              All of this costs money. Electricity, staff salaries,
              maintenance, course materials, burial services. One-off
              donations help, but they don&apos;t keep the lights on
              year-round.
            </p>

            <p className="reveal reveal-delay-4 w-full text-center text-[15px] lg:text-base 2xl:text-lg leading-[1.75] font-bold text-txt">
              What helps most? Consistent, monthly support from people who care.
            </p>
          </div>

          <Link
            to="/donate"
            className="reveal reveal-delay-5 flex items-center gap-2 rounded-full bg-g1 px-8 py-[13px] lg:px-10 lg:py-4 2xl:px-12 2xl:py-5 text-sm lg:text-base 2xl:text-lg font-bold text-white"
          >
            Be one of them
            <ArrowRight size={14} className="lg:h-4 lg:w-4" />
          </Link>

          {/* Carousel */}
          <div className="reveal reveal-delay-5 carousel-fade-mask w-screen overflow-hidden pt-4">
            <div className="carousel-track flex gap-3">
              {[...Array(2)].flatMap((_, dup) =>
                [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <img
                    key={`${dup}-${n}`}
                    src={`/carousel/${n}.jpg`}
                    alt=""
                    className="h-32 lg:h-40 2xl:h-48 w-auto rounded-xl object-cover flex-shrink-0"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Impact Journey Section */}
      <section className="bg-gdeep py-14 lg:py-20 2xl:py-28">
        <div className={`${cx} flex flex-col items-center gap-8 lg:gap-12`}>
          {/* Header */}
          <div className="flex w-full flex-col items-center gap-2 lg:gap-3">
            <div className="reveal flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 py-1.5 lg:px-5 lg:py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              <span className="text-[10px] lg:text-xs 2xl:text-sm font-bold tracking-[1.2px] text-gold">
                YOUR IMPACT
              </span>
            </div>
            <h2 className="reveal reveal-delay-1 w-full text-center font-[family-name:var(--font-family-heading)] text-[28px] lg:text-[36px] 2xl:text-[44px] leading-[1.15] font-bold tracking-tight text-white">
              What your contribution
              <br />
              helps keep alive
            </h2>
          </div>

          {/* Timeline */}
          <div className="flex w-full max-w-md lg:max-w-lg flex-col md:mx-auto">
            {[
              {
                icon: <Lightbulb className="h-5 w-5 lg:h-7 lg:w-7 2xl:h-8 2xl:w-8 text-white" />,
                title: "Lights stay on",
                desc: "Electricity & air-conditioning for 5 daily prayers",
              },
              {
                icon: <GraduationCap className="h-5 w-5 lg:h-7 lg:w-7 2xl:h-8 2xl:w-8 text-white" />,
                title: "Asatizah keep teaching",
                desc: "Salaries for the people who lead prayers & guide the community",
              },
              {
                icon: <BookOpen className="h-5 w-5 lg:h-7 lg:w-7 2xl:h-8 2xl:w-8 text-white" />,
                title: "Knowledge keeps flowing",
                desc: "Religious classes, Quran recitations & youth programmes",
                last: true,
              },
            ].map((item, i) => (
              <div key={item.title} className={`reveal-left reveal-delay-${i + 2} flex gap-4 lg:gap-6`}>
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-10 w-10 lg:h-14 lg:w-14 2xl:h-16 2xl:w-16 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, #0D7C5F 0%, #2DD4A8 100%)",
                    }}
                  >
                    {item.icon}
                  </div>
                  {!item.last && (
                    <div className="h-10 lg:h-14 w-0.5 bg-white/10" />
                  )}
                </div>
                <div className={`flex flex-col gap-1 ${item.last ? "pt-1" : "pt-1 pb-5 lg:pb-8"}`}>
                  <span className="text-[15px] lg:text-lg 2xl:text-xl font-bold text-white">
                    {item.title}
                  </span>
                  <span className="text-[13px] lg:text-sm 2xl:text-base leading-[1.5] text-white/60">
                    {item.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Bar */}
          <div className="reveal-scale reveal-delay-5 flex w-full max-w-md lg:max-w-lg flex-col items-center gap-3.5 lg:gap-5 rounded-[20px] lg:rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-6 lg:p-10 md:mx-auto">
            <h3 className="text-center font-[family-name:var(--font-family-heading)] text-xl lg:text-2xl 2xl:text-3xl font-bold text-gold">
              Small amounts, big impact.
            </h3>
            <p className="w-full text-center text-[13px] lg:text-sm 2xl:text-base leading-[1.55] text-white/60">
              Your $5 alone won&apos;t cover it all, but when hundreds give
              together, every single month, it does.
            </p>
            <Link
              to="/donate"
              className="flex items-center gap-2 rounded-full bg-gold px-8 py-[13px] lg:px-10 lg:py-4 text-sm lg:text-base font-bold text-gdeep"
            >
              Start giving monthly
              <ArrowRight size={14} className="lg:h-4 lg:w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Hadith Section */}
      <section
        ref={hadithRef}
        className="py-12 lg:py-20 2xl:py-24"
        style={{
          background: "linear-gradient(135deg, #085A44 0%, #0D7C5F 100%)",
        }}
      >
        <div className={`${cx} flex flex-col items-center justify-center gap-3 lg:gap-5`}>
          <p className="max-w-sm lg:max-w-lg 2xl:max-w-xl text-center font-[family-name:var(--font-family-heading)] text-xl lg:text-3xl 2xl:text-4xl italic leading-[1.6] text-white/90">
            {"\u201CThe most beloved of deeds to Allah are those that are most consistent, even if they are small.\u201D"
              .split(" ")
              .map((word, i) => (
                <span
                  key={i}
                  className="inline-block transition-all duration-500"
                  style={{
                    opacity: hadithVisible ? 1 : 0,
                    transform: hadithVisible ? "translateY(0)" : "translateY(8px)",
                    transitionDelay: hadithVisible ? `${i * 80}ms` : "0ms",
                  }}
                >
                  {word}&nbsp;
                </span>
              ))}
          </p>
          <p
            className="text-center text-xs lg:text-sm 2xl:text-base font-semibold text-white/40 transition-opacity duration-700"
            style={{
              opacity: hadithVisible ? 1 : 0,
              transitionDelay: hadithVisible ? "1.6s" : "0ms",
            }}
          >
            - Prophet Muhammad ﷺ (Bukhari &amp; Muslim)
          </p>
        </div>
      </section>

      {/* The Ask Section */}
      <section className="bg-gdeep py-16 lg:py-24 2xl:py-32">
        <div className={`${cx} flex flex-col items-center gap-4 lg:gap-6 2xl:gap-8`}>
          <div className="flex w-full flex-col items-center">
            <h2 className="reveal text-center font-[family-name:var(--font-family-heading)] text-[32px] lg:text-5xl 2xl:text-6xl font-bold tracking-tight text-white">
              Choose your impact.
            </h2>
            <h2 className="reveal reveal-delay-1 text-center font-[family-name:var(--font-family-heading)] text-[32px] lg:text-5xl 2xl:text-6xl font-bold tracking-tight text-gold">
              Every dollar matters.
            </h2>
          </div>

          <p className="reveal reveal-delay-2 max-w-sm lg:max-w-md 2xl:max-w-lg text-center text-[15px] lg:text-lg 2xl:text-xl leading-[1.7] text-white/75">
            Pick an amount that feels right for you. No matter how small,
            your consistent giving keeps this masjid alive for everyone.
          </p>

          {/* Pricing Cards */}
          <div className="flex w-full max-w-md lg:max-w-lg gap-3 lg:gap-5 md:mx-auto justify-center">
            {[5, 20, 50].map((val) => (
              <button
                key={val}
                onClick={() => setSelectedAmount(val)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl lg:rounded-3xl p-5 lg:p-8 2xl:p-10 transition-all duration-300 cursor-pointer ${selectedAmount === val
                  ? "border-2 border-gold bg-white/12"
                  : "border-2 border-white/12 bg-white/[0.06] hover:border-white/25"
                  }`}
              >
                <span
                  className={`font-[family-name:var(--font-family-heading)] text-[28px] lg:text-[44px] 2xl:text-[52px] font-extrabold ${selectedAmount === val ? "text-gold" : "text-white"
                    }`}
                >
                  ${val}
                </span>
                <span className="text-[11px] lg:text-sm 2xl:text-base font-medium text-white/50">
                  /month
                </span>
              </button>
            ))}
          </div>

          <Link
            to="/donate"
            search={{ amount: selectedAmount }}
            className="reveal reveal-delay-5 flex items-center gap-2 rounded-full bg-gold px-11 py-[15px] lg:px-14 lg:py-5 2xl:px-16 2xl:py-6 font-bold lg:text-lg 2xl:text-xl text-gdeep transition-all"
          >
            Start my monthly gift
            <ArrowRight size={16} className="lg:h-5 lg:w-5" />
          </Link>

          <p className="reveal reveal-delay-5 text-center text-xs lg:text-sm text-white/35">
            Takes 2 minutes · Cancel anytime
          </p>
        </div>
      </section>

      {/* Perks Teaser Section */}
      <section className="bg-cream py-14 lg:py-20 2xl:py-28">
        <div className={cx}>
          <div
            className="reveal-gift-card relative flex w-full flex-col items-center gap-4 lg:gap-6 rounded-[28px] lg:rounded-[36px] px-7 py-10 lg:px-14 lg:py-16 2xl:px-20 2xl:py-20"
            style={{
              background:
                "linear-gradient(150deg, #032A21 0%, #0D7C5F 100%)",
            }}
          >
            {/* Shimmer overlay */}
            <div className="gift-shimmer" />

            {/* Gift emoji with glow + sparkles */}
            <span className="gift-sparkle-wrap">
              <span className="gift-glow" />
              <span className="gift-emoji text-[64px] lg:text-[88px] 2xl:text-[100px] leading-none">🎁</span>
            </span>

            <h2 className="max-w-sm lg:max-w-md 2xl:max-w-lg text-center font-[family-name:var(--font-family-heading)] text-2xl lg:text-3xl 2xl:text-4xl leading-[1.2] font-bold tracking-tight text-white">
              Oh, and there&apos;s
              <br />a little something for you too.
            </h2>
            <p className="max-w-sm lg:max-w-md 2xl:max-w-lg text-center text-sm lg:text-base 2xl:text-lg leading-[1.65] text-white/80">
              Monthly givers unlock exclusive perks, from covered funeral
              services to course discounts for your family.
            </p>
            <Link to="/donate" search={{ amount: selectedAmount }} className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 lg:px-7 lg:py-3 hover:bg-white/15 transition-all cursor-pointer">
              <span className="text-xs lg:text-sm 2xl:text-base font-semibold text-white/80">
                You&apos;ll discover all perks in the next step
              </span>
              <ArrowRight size={12} className="text-white/80 lg:h-4 lg:w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Numbers Section */}
      <section
        className="py-14 lg:py-20 2xl:py-28"
        style={{
          background:
            "linear-gradient(180deg, #F0FDF4 0%, #FFFDF5 100%)",
        }}
      >
        <div className={`${cx} flex flex-col items-center gap-7 lg:gap-10`}>
          <h2 className="reveal w-full text-center font-[family-name:var(--font-family-heading)] text-[26px] lg:text-4xl 2xl:text-5xl leading-[1.15] font-bold tracking-tight text-gd">
            A growing community
            <br />
            of monthly givers
          </h2>

          <div className="flex w-full max-w-lg 2xl:max-w-xl gap-3 lg:gap-5 md:mx-auto">
            {[
              { value: "1,247", label: "MEMBERS" },
              { value: "$6.2k", label: "MONTHLY" },
              { value: "100%", label: "CLAIMS COVERED" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`reveal-pop reveal-delay-${i + 2} flex flex-1 flex-col items-center gap-1 lg:gap-2 rounded-[20px] lg:rounded-[28px] px-3 py-[22px] lg:py-8 2xl:py-10`}
                style={{
                  background:
                    "linear-gradient(135deg, #0D7C5F 0%, #2DD4A8 100%)",
                }}
              >
                <span className="font-[family-name:var(--font-family-heading)] text-2xl lg:text-4xl 2xl:text-5xl font-extrabold leading-none text-white">
                  {stat.value}
                </span>
                <span className="text-[10px] lg:text-xs 2xl:text-sm font-semibold tracking-[0.4px] text-white/70">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-cream py-14 lg:py-20 2xl:py-28">
        <div className={`${cx} flex flex-col items-center gap-6 lg:gap-10`}>
          <h2 className="reveal text-center font-[family-name:var(--font-family-heading)] text-[26px] lg:text-4xl 2xl:text-5xl font-bold tracking-tight text-gd">
            Hear from the jemaah
          </h2>

          <div className="flex w-full flex-col gap-6 lg:gap-8">
            {[
              {
                quote:
                  "It's just $5 a month but knowing it helps keep the masjid running for everyone. That's what matters to me. I used to give whenever I remembered, now it's consistent and I feel part of something bigger.",
                name: "Ahmad R.",
                since: "Member since 2024",
                dir: "reveal-left",
              },
              {
                quote:
                  "My family has been going to this masjid for years. Being a monthly giver feels like I'm giving back to a place that has given us so much. And there are perks too, which is a nice bonus.",
                name: "Siti H.",
                since: "Monthly giver",
                dir: "reveal-right",
              },
            ].map((t) => (
              <div
                key={t.name}
                className={`${t.dir} reveal-delay-2 flex flex-1 flex-col gap-3 lg:gap-4 rounded-[20px] lg:rounded-[28px] border-[1.5px] border-[#EEEEEE] bg-white px-[22px] py-7 lg:px-10 lg:py-10`}
              >
                <span className="font-[family-name:var(--font-family-heading)] text-[56px] lg:text-[72px] leading-[0.6] text-mint/40">
                  &ldquo;
                </span>
                <p className="w-full text-sm lg:text-base 2xl:text-lg italic leading-[1.65] text-txt2">
                  {t.quote}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-xs lg:text-sm font-bold text-gd">{t.name}</span>
                  <span className="text-xs lg:text-sm text-txt3">· {t.since}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gdeep py-16 lg:py-24 2xl:py-32">
        <div className={`${cx} flex flex-col items-center gap-3 lg:gap-5`}>
          <img src="/logo.webp" alt="Masjid Ar-Raudhah" className="reveal-scale h-20 lg:h-28 2xl:h-36 w-auto" />
          <div className="flex flex-col items-center">
            <h2 className="reveal reveal-delay-1 text-center font-[family-name:var(--font-family-heading)] text-[28px] lg:text-4xl 2xl:text-5xl leading-[1.15] font-bold tracking-tight text-white">
              Masjid Ar-Raudhah thrives
            </h2>
            <h2 className="reveal reveal-delay-2 text-center font-[family-name:var(--font-family-heading)] text-[28px] lg:text-4xl 2xl:text-5xl leading-[1.15] font-bold tracking-tight text-gold">
              thanks to people like you.
            </h2>
          </div>
          <p className="reveal reveal-delay-3 max-w-sm lg:max-w-md 2xl:max-w-lg text-center text-[15px] lg:text-lg 2xl:text-xl leading-[1.65] text-white/65">
            Join thousands of families who give a little every month, so
            your masjid never has to worry about keeping its doors open.
          </p>
          <Link
            to="/donate"
            className="reveal reveal-delay-4 flex items-center gap-2 rounded-full bg-gold px-11 py-[15px] lg:px-14 lg:py-5 2xl:px-16 2xl:py-6 font-bold lg:text-lg 2xl:text-xl text-gdeep"
          >
            Start giving monthly
            <ArrowRight size={16} className="lg:h-5 lg:w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-gdeep p-6 lg:p-10">
        <div className={`${cx} flex flex-col items-center gap-1 lg:gap-2`}>
          <img src="/logo.webp" alt="Masjid Ar-Raudhah" className="h-8 lg:h-12 w-auto opacity-55" />
          <span className="text-[13px] lg:text-base font-bold text-white/55">
            Masjid Ar-Raudhah
          </span>
          <span className="text-center text-xs lg:text-sm text-white/30">
            Skim Pintar Monthly Giving Programme
          </span>
          <Link to="/member/login" className="text-center text-xs lg:text-sm text-white/40 hover:text-white/70 transition-colors">
            Manage my donation
          </Link>
          <span className="text-center text-xs lg:text-sm text-white/30">
            © 2026 Masjid Ar-Raudhah. All rights reserved.
          </span>
        </div>
      </footer>

    </div>
  );
}
