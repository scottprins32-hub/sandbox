// The building status page (add-on 2 §C5): public, no login, Romanian.
//
// The QR on the notice board, on the visit card and on the offer resolves
// here. It answers the resident's real question — was my stairwell cleaned? —
// and it publishes how our own commitments held up this month, counted from
// the data rather than asserted. A number that embarrasses us is the point:
// the association president can show a sceptic a live page, and we find out
// about a slipping promise the same way they do.
//
// Bounded by construction: no resident names, no apartment numbers, no sums,
// no interior photos.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resultLineRo } from "@/lib/commitments";
import { ISSUE_CATEGORY_RO, type IssueCategory } from "@/lib/issues";
import { getPublicBuildingView } from "@/server/publicBuilding";
import { reportIssueAction } from "./actions";
import { SubmitButton } from "./SubmitButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Starea scării · Scara",
  // A notice-board URL has no business in a search index.
  robots: { index: false, follow: false },
};

// Cleaning first: it is what most people are reporting.
const CATEGORY_ORDER: IssueCategory[] = [
  "curatenie",
  "bec",
  "deseuri",
  "defectiune",
  "zapada",
  "altele",
];

export default async function PublicBuildingPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ trimis?: string; eroare?: string }>;
}) {
  const { code } = await params;
  const { trimis, eroare } = await searchParams;
  const view = await getPublicBuildingView(code);
  if (!view) notFound();

  return (
    <div className="min-h-[100dvh] bg-paper">
      <header className="mx-auto max-w-xl px-6 pt-8">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-block h-5 w-5 rounded-md bg-moss-deep" aria-hidden>
            <svg viewBox="0 0 32 32" className="h-5 w-5">
              <path
                d="M8 24h6v-5h5v-5h5V9"
                fill="none"
                stroke="#F7F5F0"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {view.orgName}
        </span>
      </header>

      <main className="mx-auto max-w-xl px-6 pb-20 pt-8">
        <p className="micro text-ink-faint">Starea scării</p>
        <h1 className="mt-1 font-display text-4xl leading-tight text-ink">{view.label}</h1>
        {view.locality && <p className="mt-1 text-ink-soft">{view.locality}</p>}

        {/* The two facts anyone actually came for. */}
        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-surface p-4 shadow-card">
            <p className="micro text-ink-faint">Ultima vizită</p>
            <p className="mt-1 font-display text-2xl text-ink">
              {view.lastVisitRo ?? "—"}
            </p>
            {view.lastVisitCheckpoints !== null && (
              <p className="mt-1 text-sm text-ink-soft">
                Verificată în {view.lastVisitCheckpoints}{" "}
                {view.lastVisitCheckpoints === 1 ? "punct" : "puncte"} de control.
              </p>
            )}
          </div>
          <div className="rounded-xl bg-surface p-4 shadow-card">
            <p className="micro text-ink-faint">Următoarea vizită</p>
            <p className="mt-1 font-display text-2xl text-ink">
              {view.nextVisitRo ?? "—"}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {view.daysRo}, între {view.windowFrom} și {view.windowTo}.
            </p>
          </div>
        </section>

        {/* What gets done, and how often. */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">Ce facem, și cât de des</h2>
          <div className="mt-4 space-y-5">
            {view.frequency.map((g) => (
              <div key={g.labelRo}>
                <p className="micro text-moss-deep">{g.labelRo}</p>
                <ul className="mt-1.5 space-y-1">
                  {g.lines.map((line) => (
                    <li key={line} className="text-sm leading-relaxed text-ink-soft">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* The commitments, with this month's count where the app can prove it. */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">Angajamentele noastre</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Cifrele sunt din luna curentă și se actualizează singure.
          </p>
          <ul className="mt-4 space-y-3">
            {view.commitments.map((c) => {
              const line = resultLineRo(c);
              return (
                <li key={c.key} className="border-l-2 border-line pl-3">
                  <p className="text-sm leading-relaxed text-ink">{c.textRo}</p>
                  {line && <p className="tnum mt-0.5 text-sm text-moss-deep">{line}</p>}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Report something. */}
        <section id="sesizare" className="mt-10 rounded-2xl bg-surface p-5 shadow-card">
          <h2 className="font-display text-2xl text-ink">Ați observat ceva?</h2>
          {trimis ? (
            <p className="mt-3 rounded-lg bg-moss-wash px-4 py-3 text-moss-deep">
              Am primit sesizarea. O confirmăm în cel mult o zi lucrătoare.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink-soft">
                Scrieți-ne direct. Nu aveți nevoie de cont.
              </p>
              {eroare === "scurt" && (
                <p className="mt-3 text-sm text-rust">Scrieți câteva cuvinte despre ce ați observat.</p>
              )}
              {eroare === "prea-multe" && (
                <p className="mt-3 text-sm text-rust">
                  Prea multe sesizări trimise de pe acest dispozitiv. Încercați mai târziu.
                </p>
              )}
              {eroare === "indisponibil" && (
                <p className="mt-3 text-sm text-rust">
                  Nu am putut primi sesizarea acum. Încercați din nou în câteva minute sau
                  sunați-ne.
                </p>
              )}
              <form action={reportIssueAction} className="mt-4 grid gap-4">
                <input type="hidden" name="code" value={code} />
                {/* Honeypot: invisible to humans, irresistible to bots. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                />
                <label className="block text-sm">
                  <span className="text-ink-soft">Despre ce este vorba</span>
                  <select
                    name="categorie"
                    defaultValue="curatenie"
                    className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5"
                  >
                    {CATEGORY_ORDER.map((c) => (
                      <option key={c} value={c}>
                        {ISSUE_CATEGORY_RO[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-ink-soft">Ce ați observat</span>
                  <textarea
                    name="descriere"
                    required
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-soft">
                    Telefon sau e-mail <span className="text-ink-faint">(opțional)</span>
                  </span>
                  <input
                    name="contact"
                    autoComplete="off"
                    className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5"
                  />
                  <span className="mt-1 block text-xs text-ink-faint">
                    Doar dacă doriți să vă răspundem personal. Îl folosim exclusiv pentru
                    această sesizare.
                  </span>
                </label>
                <SubmitButton />
              </form>
            </>
          )}
        </section>

        <p className="mt-8 text-xs leading-relaxed text-ink-faint">
          Pagina arată doar informații despre clădire: date de vizită, lucrările din
          contract și felul în care ne-am respectat angajamentele. Nu publicăm nume de
          locatari, numere de apartament sau sume.
        </p>
      </main>
    </div>
  );
}
