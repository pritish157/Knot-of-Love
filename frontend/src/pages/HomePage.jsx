import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    title: "Create your profile",
    copy: "Tell us about yourself in just a few minutes. Your information stays private until you choose to share it."
  },
  {
    number: "02",
    title: "Discover meaningful matches",
    copy: "Browse profiles filtered by what truly matters — location, faith, education, and more."
  },
  {
    number: "03",
    title: "Connect with confidence",
    copy: "Express interest and begin conversations in a safe, respectful environment."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        id="platform"
        className="relative overflow-hidden rounded-[2.25rem] border border-white/60 bg-white/30 backdrop-blur-xl shadow-soft"
        style={{ minHeight: "82vh" }}
      >
        {/* Background image, full bleed */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(224,62,85,0.15) 0%, transparent 60%), url('/img/banner.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center right",
            opacity: 0.65
          }}
        />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#faf7f4] via-[#faf7f4]/95 to-white/5" />

        <div className="relative z-10 flex h-full flex-col justify-center px-7 py-20 sm:px-10 lg:max-w-[55%] lg:px-14 lg:py-28">
          <p className="hero-badge">A new way to find your partner</p>

          <h1 className="mt-6 font-serif text-5xl leading-[1.05] text-ink sm:text-6xl lg:text-[4.5rem]">
            Find the right<br />
            partner, with<br />
            <em className="not-italic text-brand-600">clarity &amp; trust.</em>
          </h1>

          <p className="mt-7 max-w-md text-lg leading-8 text-muted">
            Knot of Love brings serious matchmaking into a calmer, more personal experience — for you and your family.
          </p>

          <div className="mt-10 flex flex-wrap gap-5">
            <Link to="/register" className="btn-primary shadow-glow px-10 py-4 text-lg">
              Create free profile
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-4 text-lg">
              Sign in
            </Link>
          </div>

          <p className="mt-8 text-sm text-muted">
            Free to join &nbsp;·&nbsp; Private by default &nbsp;·&nbsp; Trusted by families
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how-it-works" className="py-24">
        <div className="mb-14 text-center">
          <p className="section-kicker">Simple from the start</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            How it works
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-muted">
            Three steps to go from registration to a meaningful connection.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="surface-card interactive-card p-8">
              <span className="font-serif text-5xl font-bold text-brand-500/25">{step.number}</span>
              <h3 className="mt-5 font-serif text-2xl leading-snug text-ink">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── TRUST SECTION ────────────────────────────────── */}
      <section
        id="success-stories"
        className="relative overflow-hidden rounded-[2.25rem] border border-white/60 bg-brand-gradient-vivid px-7 py-20 text-white sm:px-10 lg:px-16 lg:py-24 shadow-soft-lg"
      >
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-10"
          style={{
            backgroundImage: "url('/img/banner.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        <div className="relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em]">
              Why families trust us
            </p>
            <h2 className="mt-6 font-serif text-4xl leading-tight sm:text-5xl">
              Built around real decisions, not just algorithms.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-white/80">
              Matrimonial choices affect entire families. We've built a platform that feels respectful, unhurried, and safe — because you deserve nothing less.
            </p>
            <Link to="/register" className="mt-8 inline-flex btn-base bg-white text-brand-700 hover:bg-brand-50 shadow-lg px-8 text-base">
              Start your journey
            </Link>
          </div>

          <blockquote className="rounded-[1.75rem] border border-white/15 bg-white/10 p-8 backdrop-blur-sm">
            <p className="font-serif text-2xl leading-relaxed">
              "The experience felt respectful and well-organised. We found exactly what we were looking for."
            </p>
            <footer className="mt-8 border-t border-white/20 pt-5">
              <strong className="block text-base">A happy family</strong>
              <span className="mt-1 block text-sm text-white/70">Joined through Knot of Love</span>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* bottom spacer */}
      <div className="py-8" />
    </main>
  );
}
