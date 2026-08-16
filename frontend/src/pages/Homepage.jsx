import React, { useState, useRef, useCallback } from "react";

/**
 * SwipeX — Marketing Homepage
 * -----------------------------------------------------------------------
 * Drop-in landing page for the SwipeX platform (swipe-based AI job
 * discovery). Built with React + Tailwind CSS, matching the project's
 * existing stack. No external component libraries required.
 *
 * Integration notes:
 * - Replace the two <a href="/login"> / <a href="/signup"> tags with your
 *   react-router-dom <Link> components (or pass onLogin / onGetStarted
 *   handlers as props) once this is wired into your router.
 * - Swap the Google Fonts <link> for a proper import in index.html if you
 *   prefer not to load fonts at runtime from this component.
 * - Tailwind's default color palette is untouched — every brand color
 *   here is scoped locally via the `tokens` object / CSS variables below,
 *   so it won't collide with the rest of your app.
 */

const tokens = {
  bg: "#0A0D14",
  bgSoft: "#0D1119",
  surface: "#12151D",
  surfaceElevated: "#171B26",
  border: "#212637",
  borderSoft: "#1A1E2B",
  indigo: "#6C5CE7",
  indigoLight: "#9B8CFF",
  mint: "#34D399",
  coral: "#FB7185",
  gold: "#F2C94C",
  textPrimary: "#EDEFF7",
  textSecondary: "#9298AE",
  textMuted: "#5C6178",
};

const fontDisplay = "'Space Grotesk', 'Segoe UI', sans-serif";
const fontBody = "'Inter', 'Segoe UI', sans-serif";
const fontMono = "'JetBrains Mono', ui-monospace, monospace";

export default function SwipeXHomepage() {
  return (
    <div
      style={{
        background: tokens.bg,
        color: tokens.textPrimary,
        fontFamily: fontBody,
      }}
      className="min-h-screen w-full overflow-x-hidden"
    >
      <GlobalStyle />
      <NoiseBackdrop />
      <Header />
      <main className="relative">
        <Hero />
        <AudienceStrip />
        <HowItWorks />
        <Features />
        <RolesSplit />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Global style / fonts / keyframes                                    */
/* ------------------------------------------------------------------ */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');

      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }

      @keyframes swx-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes swx-fade-up {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes swx-pulse-ring {
        0% { box-shadow: 0 0 0 0 rgba(108,92,231,0.35); }
        70% { box-shadow: 0 0 0 14px rgba(108,92,231,0); }
        100% { box-shadow: 0 0 0 0 rgba(108,92,231,0); }
      }
      .swx-fade-up { animation: swx-fade-up 0.7s cubic-bezier(.16,1,.3,1) both; }
      .swx-float { animation: swx-float 5s ease-in-out infinite; }
      .swx-pulse { animation: swx-pulse-ring 2.4s ease-out infinite; }

      @media (prefers-reduced-motion: reduce) {
        .swx-float, .swx-pulse, .swx-fade-up { animation: none !important; }
        html { scroll-behavior: auto; }
      }

      .swx-link { position: relative; }
      .swx-link::after {
        content: '';
        position: absolute;
        left: 0; bottom: -4px;
        width: 0%; height: 1px;
        background: ${tokens.indigoLight};
        transition: width 0.25s ease;
      }
      .swx-link:hover::after { width: 100%; }

      .swx-btn-primary {
        background: ${tokens.indigo};
        transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
      }
      .swx-btn-primary:hover {
        background: ${tokens.indigoLight};
        transform: translateY(-1px);
        box-shadow: 0 10px 24px -8px rgba(108,92,231,0.55);
      }
      .swx-btn-primary:active { transform: translateY(0); }

      .swx-btn-ghost {
        border: 1px solid ${tokens.border};
        transition: border-color 0.18s ease, background 0.18s ease;
      }
      .swx-btn-ghost:hover {
        border-color: ${tokens.textMuted};
        background: ${tokens.surfaceElevated};
      }

      .swx-card {
        transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
      }
      .swx-card:hover {
        border-color: #2C3348;
        background: ${tokens.surfaceElevated};
        transform: translateY(-3px);
      }

      .swx-focus:focus-visible {
        outline: 2px solid ${tokens.indigoLight};
        outline-offset: 3px;
      }

      ::selection { background: ${tokens.indigo}; color: white; }

      @media (max-width: 640px) {
        .swx-hero-grid { grid-template-columns: 1fr !important; }
        .swx-hero-visual { margin-top: 3rem; }
      }
    `}</style>
  );
}

function NoiseBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          `radial-gradient(1100px 520px at 82% -8%, rgba(108,92,231,0.16), transparent 60%),` +
          `radial-gradient(760px 420px at 8% 8%, rgba(52,211,153,0.06), transparent 55%)`,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Product", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "For recruiters", href: "#roles" },
  ];

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        borderBottom: `1px solid ${tokens.borderSoft}`,
        background: "rgba(10,13,20,0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5 swx-focus" aria-label="SwipeX home">
          <Logomark />
          <span
            style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.02em" }}
          >
            SwipeX
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="swx-link swx-focus text-sm"
              style={{ color: tokens.textSecondary }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="swx-focus rounded-lg px-4 py-2 text-sm font-medium"
            style={{ color: tokens.textPrimary }}
          >
            Log in
          </a>
          <a
            href="/signup"
            className="swx-btn-primary swx-focus rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            Get started
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="swx-focus flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
          style={{ border: `1px solid ${tokens.border}` }}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <BurgerIcon open={open} />
        </button>
      </div>

      {open && (
        <div
          className="md:hidden px-6 pb-6"
          style={{ borderTop: `1px solid ${tokens.borderSoft}` }}
        >
          <div className="flex flex-col gap-4 pt-4">
            {links.map((l) => (
              <a key={l.label} href={l.href} className="text-sm" style={{ color: tokens.textSecondary }}>
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-3">
              <a
                href="/login"
                className="flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-medium swx-btn-ghost"
              >
                Log in
              </a>
              <a
                href="/signup"
                className="swx-btn-primary flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Get started
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Logomark() {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-lg"
      style={{ background: `linear-gradient(135deg, ${tokens.indigo}, #4834D4)` }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12L10 6M4 12L10 18M4 12H15"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
        <path
          d="M20 12L14 6M20 12L14 18M20 12H9"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function BurgerIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      {open ? (
        <path d="M6 6L18 18M6 18L18 6" stroke={tokens.textPrimary} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path
          d="M4 7H20M4 12H20M4 17H20"
          stroke={tokens.textPrimary}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section id="top" className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="swx-hero-grid grid grid-cols-1 items-center gap-16 md:grid-cols-2">
        <div className="swx-fade-up">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, color: tokens.indigoLight }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: tokens.mint }} />
            AI-powered job discovery
          </div>

          <h1
            className="text-4xl leading-[1.08] tracking-tight md:text-6xl"
            style={{ fontFamily: fontDisplay, fontWeight: 700 }}
          >
            Find your next role the way you scroll everything else.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed" style={{ color: tokens.textSecondary }}>
            Swipe through roles at MNCs, startups, and freshly funded companies. See your
            ATS match before you apply. SwipeX learns what you want from every swipe.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="/signup"
              className="swx-btn-primary swx-focus rounded-lg px-6 py-3.5 text-center text-sm font-semibold text-white"
            >
              Get started free
            </a>
            <a
              href="/login"
              className="swx-btn-ghost swx-focus rounded-lg px-6 py-3.5 text-center text-sm font-semibold"
              style={{ color: tokens.textPrimary }}
            >
              Log in
            </a>
          </div>

          <p className="mt-6 text-xs" style={{ color: tokens.textMuted }}>
            Built for students, career switchers, experienced professionals, and hiring teams.
          </p>
        </div>

        <div className="swx-hero-visual">
          <SwipeCardStack />
        </div>
      </div>
    </section>
  );
}

function SwipeCardStack() {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -8, y: px * 10 });
  }, []);

  const reset = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  return (
    <div
      className="relative mx-auto flex h-[420px] w-full max-w-sm items-center justify-center swx-float"
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ perspective: "1200px" }}
    >
      <BackCard rotate={-9} translateY={26} scale={0.94} />
      <BackCard rotate={7} translateY={14} scale={0.97} />

      <div
        className="relative z-10 w-72 rounded-2xl p-5"
        style={{
          background: tokens.surface,
          border: `1px solid ${tokens.border}`,
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.55)",
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.15s ease-out",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold"
              style={{ background: "#1C2130", color: tokens.indigoLight }}
            >
              NX
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                Product Designer
              </p>
              <p className="text-xs" style={{ color: tokens.textMuted }}>
                Nimbus Labs · Remote
              </p>
            </div>
          </div>
          <div
            className="flex flex-col items-center rounded-lg px-2.5 py-1.5"
            style={{ background: "rgba(242,201,76,0.1)", border: "1px solid rgba(242,201,76,0.25)" }}
          >
            <span style={{ fontFamily: fontMono, fontSize: "0.85rem", fontWeight: 600, color: tokens.gold }}>
              91%
            </span>
            <span style={{ fontSize: "0.6rem", color: "#C9A94A" }}>match</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Figma", "Design systems", "React"].map((tag) => (
            <span
              key={tag}
              className="rounded-md px-2 py-1 text-[11px]"
              style={{ background: tokens.surfaceElevated, color: tokens.textSecondary, border: `1px solid ${tokens.borderSoft}` }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px]" style={{ color: tokens.textMuted }}>
            <span>ATS compatibility</span>
            <span style={{ fontFamily: fontMono, color: tokens.mint }}>Strong</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: tokens.surfaceElevated }}>
            <div className="h-full rounded-full" style={{ width: "82%", background: tokens.mint }} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px]" style={{ color: tokens.textMuted }}>
          <span>Posted 3h ago</span>
          <span>Low competition</span>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <SwipeHint direction="left" />
          <SwipeHint direction="right" />
        </div>
      </div>
    </div>
  );
}

function BackCard({ rotate, translateY, scale }) {
  return (
    <div
      aria-hidden="true"
      className="absolute z-0 h-96 w-72 rounded-2xl"
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.borderSoft}`,
        transform: `rotate(${rotate}deg) translateY(${translateY}px) scale(${scale})`,
      }}
    />
  );
}

function SwipeHint({ direction }) {
  const isRight = direction === "right";
  const color = isRight ? tokens.mint : tokens.coral;
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full ${isRight ? "swx-pulse" : ""}`}
      style={{ border: `1.5px solid ${color}` }}
    >
      {isRight ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M6 18L18 6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Audience strip                                                       */
/* ------------------------------------------------------------------ */

function AudienceStrip() {
  const items = [
    "Students",
    "Fresh graduates",
    "Experienced professionals",
    "Recruiters",
    "Career coaches",
    "Placement teams",
  ];
  return (
    <section style={{ borderTop: `1px solid ${tokens.borderSoft}`, borderBottom: `1px solid ${tokens.borderSoft}` }}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-8">
        {items.map((item) => (
          <span key={item} className="text-sm" style={{ color: tokens.textMuted, fontFamily: fontMono }}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                         */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Swipe through roles",
      body: "Explore MNC, startup, and newly founded company openings as cards. Swipe right to apply or save, left to skip and refine your feed.",
    },
    {
      n: "02",
      title: "See your ATS score",
      body: "Upload your resume once. Every card shows a live compatibility score, missing keywords, and specific suggestions to improve it.",
    },
    {
      n: "03",
      title: "Track and get alerted",
      body: "Follow each application from applied to interview to offer, and get notified the moment a high-match or low-competition role appears.",
    },
  ];

  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="How it works"
        title="From first swipe to signed offer."
        subtitle="Three steps, one continuous loop that gets smarter the more you use it."
      />

      <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.n} className="relative">
            <span
              style={{ fontFamily: fontDisplay, fontSize: "3rem", fontWeight: 700, color: tokens.surfaceElevated }}
              className="select-none"
            >
              {s.n}
            </span>
            <h3 className="mt-2 text-xl font-semibold" style={{ fontFamily: fontDisplay }}>
              {s.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: tokens.textSecondary }}>
              {s.body}
            </p>
            {i < steps.length - 1 && (
              <div
                className="mt-8 hidden h-px w-full md:block"
                style={{
                  background: `linear-gradient(90deg, ${tokens.border}, transparent)`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                             */
/* ------------------------------------------------------------------ */

function Features() {
  const features = [
    {
      title: "AI resume analyzer",
      body: "Parses your resume, extracts skills and experience, and flags exactly what a job needs that yours is missing.",
      accent: tokens.indigoLight,
      icon: <IconDoc />,
    },
    {
      title: "ATS compatibility scoring",
      body: "A live percentage score per job, built from keyword matching and semantic similarity, not guesswork.",
      accent: tokens.gold,
      icon: <IconGauge />,
    },
    {
      title: "Personalized recommendations",
      body: "Your feed adjusts with every swipe, weighted by skills, experience level, and the roles you actually engage with.",
      accent: tokens.mint,
      icon: <IconSpark />,
    },
    {
      title: "Real-time competition tracking",
      body: "See how fresh a listing is and how many candidates are already in the running before you commit to applying.",
      accent: tokens.coral,
      icon: <IconPulse />,
    },
    {
      title: "Application tracking",
      body: "Saved, applied, shortlisted, interviewing, rejected — every stage in one dashboard instead of a dozen tabs.",
      accent: tokens.indigoLight,
      icon: <IconLayers />,
    },
    {
      title: "Smart notifications",
      body: "Instant alerts for high-match roles, low-competition openings, and startups actively hiring in your field.",
      accent: tokens.gold,
      icon: <IconBell />,
    },
  ];

  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24" style={{ borderTop: `1px solid ${tokens.borderSoft}` }}>
      <SectionHeading
        eyebrow="Product"
        title="Everything a job search actually needs."
        subtitle="Discovery, scoring, recommendations, and tracking — built into one workflow instead of scattered across tools."
      />

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="swx-card rounded-2xl p-6"
            style={{ background: tokens.surface, border: `1px solid ${tokens.border}` }}
          >
            <div
              className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", color: f.accent }}
            >
              {f.icon}
            </div>
            <h3 className="text-base font-semibold" style={{ fontFamily: fontDisplay }}>
              {f.title}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed" style={{ color: tokens.textSecondary }}>
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Roles split                                                          */
/* ------------------------------------------------------------------ */

function RolesSplit() {
  return (
    <section id="roles" className="mx-auto max-w-7xl px-6 py-24" style={{ borderTop: `1px solid ${tokens.borderSoft}` }}>
      <SectionHeading
        eyebrow="Built for both sides"
        title="One platform, two very different jobs."
        subtitle=""
      />

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
        <RoleCard
          label="For job seekers"
          title="Apply to roles that actually fit."
          points={[
            "Swipe-based discovery across MNCs, startups, and new companies",
            "Live ATS match score and resume improvement suggestions",
            "One dashboard for saved, applied, and in-progress applications",
          ]}
          cta="Start swiping"
          href="/signup"
          accent={tokens.indigo}
        />
        <RoleCard
          label="For recruiters"
          title="Reach candidates before they scroll past you."
          points={[
            "Post roles and manage hiring workflows in one place",
            "Review applicants with skill and compatibility context",
            "Analytics on applications, views, and hiring trends",
          ]}
          cta="Post a role"
          href="/signup"
          accent={tokens.mint}
        />
      </div>
    </section>
  );
}

function RoleCard({ label, title, points, cta, href, accent }) {
  return (
    <div
      className="rounded-2xl p-8"
      style={{ background: tokens.surface, border: `1px solid ${tokens.border}` }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: accent, fontFamily: fontMono }}
      >
        {label}
      </span>
      <h3 className="mt-3 text-2xl" style={{ fontFamily: fontDisplay, fontWeight: 600 }}>
        {title}
      </h3>
      <ul className="mt-6 flex flex-col gap-3">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm" style={{ color: tokens.textSecondary }}>
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
            {p}
          </li>
        ))}
      </ul>
      <a
        href={href}
        className="swx-btn-ghost swx-focus mt-8 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
        style={{ color: tokens.textPrimary }}
      >
        {cta}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CTA banner                                                           */
/* ------------------------------------------------------------------ */

function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div
        className="relative overflow-hidden rounded-3xl px-8 py-16 text-center md:px-16"
        style={{
          background: `linear-gradient(135deg, #171226, ${tokens.surface} 60%)`,
          border: `1px solid ${tokens.border}`,
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full"
          style={{ background: "rgba(108,92,231,0.22)", filter: "blur(80px)" }}
        />
        <h2
          className="relative text-3xl leading-tight md:text-4xl"
          style={{ fontFamily: fontDisplay, fontWeight: 700 }}
        >
          Stop scrolling job boards.
          <br />
          Start swiping toward the right one.
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-sm" style={{ color: tokens.textSecondary }}>
          Create your profile, upload your resume, and get your first match score in minutes.
        </p>
        <a
          href="/signup"
          className="swx-btn-primary swx-focus relative mt-8 inline-block rounded-lg px-7 py-3.5 text-sm font-semibold text-white"
        >
          Get started free
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                               */
/* ------------------------------------------------------------------ */

function Footer() {
  const columns = [
    {
      heading: "Product",
      links: ["Job discovery", "Resume analyzer", "Application tracking", "For recruiters"],
    },
    {
      heading: "Company",
      links: ["About", "Careers", "Contact"],
    },
    {
      heading: "Resources",
      links: ["Help center", "Guides", "API status"],
    },
    {
      heading: "Legal",
      links: ["Privacy policy", "Terms of service"],
    },
  ];

  return (
    <footer style={{ borderTop: `1px solid ${tokens.borderSoft}` }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <Logomark />
              <span style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.15rem" }}>SwipeX</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed" style={{ color: tokens.textMuted }}>
              Swipe-based job discovery and career assistance, built around AI resume
              analysis and real ATS scoring.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: tokens.textMuted }}>
                {col.heading}
              </h4>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="swx-link text-sm" style={{ color: tokens.textSecondary }}>
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-14 flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row"
          style={{ borderTop: `1px solid ${tokens.borderSoft}` }}
        >
          <p className="text-xs" style={{ color: tokens.textMuted }}>
            © {new Date().getFullYear()} SwipeX. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <SocialIcon path="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            <SocialIcon path="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0021.4.36a9.09 9.09 0 01-2.88 1.1 4.52 4.52 0 00-7.7 4.13A12.83 12.83 0 011.64 1.15a4.52 4.52 0 001.4 6.04A4.48 4.48 0 011 6.13v.06a4.52 4.52 0 003.63 4.43 4.5 4.5 0 01-2.04.08 4.53 4.53 0 004.22 3.14A9.06 9.06 0 011 15.58a12.8 12.8 0 006.92 2.03c8.3 0 12.85-6.88 12.85-12.85 0-.2 0-.39-.01-.58A9.22 9.22 0 0023 3z" />
            <SocialIcon path="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ path }) {
  return (
    <a href="#" className="swx-focus" style={{ color: tokens.textMuted }} aria-label="Social link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d={path} />
      </svg>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                          */
/* ------------------------------------------------------------------ */

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="max-w-xl">
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: tokens.indigoLight, fontFamily: fontMono }}
      >
        {eyebrow}
      </span>
      <h2
        className="mt-3 text-3xl leading-tight md:text-4xl"
        style={{ fontFamily: fontDisplay, fontWeight: 700 }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed" style={{ color: tokens.textSecondary }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* Icons (inline, no external icon dependency) */
function IconDoc() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconGauge() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 14a8 8 0 1116 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 14l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconSpark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconPulse() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 12h4l2-7 4 14 2-7h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconLayers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 13l9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
