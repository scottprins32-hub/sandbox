// The public lead-generation page (§9). Romanian, no passcode, no prices,
// no fabricated testimonials — the credibility strategy is proof, not claims.

import { LeadForm } from "./LeadForm";

const PROMISES = [
  {
    title: "Fotografii datate la fiecare vizită",
    body: "Fiecare curățenie lasă urme în aplicație: poze cu ora și data, înainte și după. Nu trebuie să ne credeți pe cuvânt.",
  },
  {
    title: "Proces-verbal lunar semnat",
    body: "La sfârșitul fiecărei luni primiți un proces-verbal de recepție cu vizitele programate, cele efectuate și fotografiile atașate.",
  },
  {
    title: "O lună gratuită dacă nu suntem la nivel",
    body: "Dacă într-o lună nu ne ținem de programul promis, luna aceea nu se plătește. Simplu.",
  },
];

export default function PublicHome() {
  return (
    <div className="min-h-[100dvh]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-6">
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-5 w-5 rounded-md bg-moss-deep" aria-hidden>
            <svg viewBox="0 0 32 32" className="h-5 w-5">
              <path
                d="M8 24h6v-5h5v-5h5V9"
                fill="none"
                stroke="#f6f5f1"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Scara
        </span>
        <a href="#oferta" className="text-sm font-medium text-moss-deep underline underline-offset-4">
          Cere ofertă
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-14 pt-16 sm:pt-24">
        <h1 className="font-display text-5xl leading-[1.05] text-ink sm:text-6xl">
          Curățenie cu dovadă.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
          Scara curăță blocuri în Giroc și Timișoara, cu fotografii la fiecare vizită și
          proces-verbal semnat în fiecare lună.
        </p>
        <a
          href="#oferta"
          className="mt-8 inline-block rounded-lg bg-moss-deep px-6 py-3.5 text-base font-semibold text-paper"
        >
          Cere ofertă
        </a>
      </section>

      {/* Proof promises: stacked editorial rows, not cards */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="font-display text-3xl text-ink">Ce primiți, negru pe alb</h2>
          <div className="mt-8 space-y-8">
            {PROMISES.map((p) => (
              <div key={p.title} className="border-l-2 border-moss pl-5 sm:pl-6">
                <h3 className="text-lg font-semibold leading-snug">{p.title}</h3>
                <p className="mt-1.5 max-w-xl leading-relaxed text-ink-soft">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price anchor, no prices */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <h2 className="font-display text-3xl text-ink">Prețul depinde de clădire.</h2>
        <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-soft">
          Numărul de etaje, frecvența vizitelor, starea scării. Spuneți-ne ce aveți și
          răspundem în aceeași zi, cu o ofertă clară.
        </p>
      </section>

      {/* Lead form */}
      <section id="oferta" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="font-display text-3xl text-ink">Cereți o ofertă</h2>
          <p className="mb-8 mt-2 text-ink-soft">Răspundem azi, la telefon sau în scris.</p>
          <LeadForm />
        </div>
      </section>

      <footer className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-10 text-sm text-ink-faint">
        <span>Giroc · Timiș</span>
        <span>Platformă: Scara</span>
      </footer>
    </div>
  );
}
