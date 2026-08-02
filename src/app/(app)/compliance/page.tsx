import type { Metadata } from "next";
import Link from "next/link";
import {
  applicableObligations,
  CATALOGUE_VERSION,
  CATEGORY_LABEL_RO,
  maxExposureBani,
  OBLIGATIONS,
  PERFORMER_LABEL_RO,
  type Obligation,
  type ObligationCategory,
  type PerformerRequirement,
} from "@/lib/compliance";
import { fmtLeiRound } from "@/lib/money";

export const metadata: Metadata = { title: "Obligații legale · Scara" };

// Section A reference page (add-on §3). No database: the catalogue is static
// data, so this works on a bare deployment and is usable from a phone in front
// of a building president.

const CADENCE_RO = (o: Obligation): string => {
  const c = o.cadence;
  switch (c.kind) {
    case "fixed":
      return c.perYear === 1 ? "o dată pe an" : `de ${c.perYear} ori pe an`;
    case "months":
      return c.every === 1 ? "lunar" : `la ${c.every} luni`;
    case "years":
      return c.every === 1 ? "anual" : `la ${c.every} ani`;
    case "continuous":
      return "permanent";
    case "seasonal":
      return `sezonier, lunile ${c.fromMonth}-${c.toMonth}`;
    case "event":
      return "la eveniment";
    case "once":
      return `o singură dată, până la ${c.byDate.split("-").reverse().join(".")}`;
  }
};

function fineRange(o: Obligation): string {
  if (o.fineMinBani === null && o.fineMaxBani === null) return "nespecificat";
  if (o.fineMinBani !== null && o.fineMaxBani !== null) {
    return `${fmtLeiRound(o.fineMinBani)} - ${fmtLeiRound(o.fineMaxBani)} lei`;
  }
  return `${fmtLeiRound((o.fineMaxBani ?? o.fineMinBani)!)} lei`;
}

const PERFORMER_TONE: Record<PerformerRequirement, string> = {
  us: "bg-moss-wash text-moss-deep",
  authorised_third_party: "bg-warn-wash text-warn",
  qualified_signatory: "bg-danger-wash text-danger",
};

const CATEGORIES = Object.keys(CATEGORY_LABEL_RO) as ObligationCategory[];
const PERFORMERS: PerformerRequirement[] = [
  "us",
  "authorised_third_party",
  "qualified_signatory",
];

function chipHref(
  base: Record<string, string | undefined>,
  patch: Record<string, string | undefined>
): string {
  const merged = { ...base, ...patch };
  const qs = Object.entries(merged)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join("&");
  return qs ? `/compliance?${qs}` : "/compliance";
}

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{
    cat?: string;
    performer?: string;
    gas?: string;
    lift?: string;
    playground?: string;
    basement?: string;
  }>;
}) {
  const sp = await searchParams;
  const base = {
    cat: sp.cat,
    performer: sp.performer,
    gas: sp.gas,
    lift: sp.lift,
    playground: sp.playground,
    basement: sp.basement,
  };

  const flags = {
    hasGas: sp.gas === "1",
    hasLift: sp.lift === "1",
    hasPlayground: sp.playground === "1",
    hasBasement: sp.basement === "1",
  };
  const anyFlag = Object.values(flags).some(Boolean);

  // With no flags set, show the whole catalogue; with flags, show the subset
  // that actually applies to that building.
  let rows: Obligation[] = anyFlag ? applicableObligations(flags) : OBLIGATIONS;
  if (sp.cat) rows = rows.filter((o) => o.category === sp.cat);
  if (sp.performer) rows = rows.filter((o) => o.performerRequirement === sp.performer);

  // Nothing recorded here (no database), so every shown obligation is
  // uncovered by definition. That is the honest reading of this page.
  const exposure = maxExposureBani(
    rows.map((o) => ({ obligation: o, lastDoneDate: null }))
  );

  const usedCategories = CATEGORIES.filter((c) =>
    (anyFlag ? applicableObligations(flags) : OBLIGATIONS).some((o) => o.category === c)
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          Obligațiile legale ale unui bloc
        </h1>
        <p className="text-xs text-ink-faint">
          {OBLIGATIONS.length} obligații · catalog {CATALOGUE_VERSION}
        </p>
      </div>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Ce trebuie făcut într-un condominiu, cât de des, cine are voie să facă și care este
        sancțiunea maximă prevăzută de lege.
      </p>

      {/* Building flags: narrows the catalogue to one real building */}
      <div className="mt-4 rounded-xl bg-surface p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Imobilul are
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { key: "gas" as const, label: "gaze" },
            { key: "lift" as const, label: "ascensor" },
            { key: "basement" as const, label: "subsol" },
            { key: "playground" as const, label: "loc de joacă" },
          ].map((f) => {
            const on = base[f.key] === "1";
            return (
              <Link
                key={f.key}
                href={chipHref(base, { [f.key]: on ? undefined : "1" })}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  on
                    ? "bg-moss-deep font-medium text-paper"
                    : "border border-line bg-surface text-ink-soft"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          {anyFlag
            ? `Se aplică ${rows.length} obligații pentru această configurație.`
            : "Fără selecție, se afișează întregul catalog."}
        </p>
      </div>

      {/* Exposure headline */}
      <div className="mt-3 rounded-xl bg-surface p-4 shadow-card">
        <p className="text-xs text-ink-faint">
          Expunere maximă conform legii, pentru obligațiile afișate
        </p>
        <p className="tnum mt-1 text-2xl font-semibold">{fmtLeiRound(exposure)} lei</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-faint">
          Sumă a maximelor prevăzute de lege, cu titlu informativ. Nu este o estimare a unei
          amenzi și nu ține cont de ce s-a făcut deja în imobil.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={chipHref(base, { cat: undefined })}
            className={`rounded-full px-2.5 py-1 text-xs ${
              !sp.cat ? "bg-ink text-paper" : "border border-line bg-surface text-ink-soft"
            }`}
          >
            toate categoriile
          </Link>
          {usedCategories.map((c) => (
            <Link
              key={c}
              href={chipHref(base, { cat: sp.cat === c ? undefined : c })}
              className={`rounded-full px-2.5 py-1 text-xs ${
                sp.cat === c ? "bg-ink text-paper" : "border border-line bg-surface text-ink-soft"
              }`}
            >
              {CATEGORY_LABEL_RO[c]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={chipHref(base, { performer: undefined })}
            className={`rounded-full px-2.5 py-1 text-xs ${
              !sp.performer
                ? "bg-ink text-paper"
                : "border border-line bg-surface text-ink-soft"
            }`}
          >
            oricine
          </Link>
          {PERFORMERS.map((p) => (
            <Link
              key={p}
              href={chipHref(base, { performer: sp.performer === p ? undefined : p })}
              className={`rounded-full px-2.5 py-1 text-xs ${
                sp.performer === p
                  ? "bg-ink text-paper"
                  : "border border-line bg-surface text-ink-soft"
              }`}
            >
              {PERFORMER_LABEL_RO[p]}
            </Link>
          ))}
        </div>
      </div>

      {/* The catalogue */}
      <ul className="mt-4 space-y-2">
        {rows.map((o) => (
          <li key={o.key} className="rounded-xl bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="max-w-lg font-medium leading-snug">{o.nameRo}</h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${PERFORMER_TONE[o.performerRequirement]}`}
              >
                {PERFORMER_LABEL_RO[o.performerRequirement]}
              </span>
            </div>

            <dl className="tnum mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Frecvență</dt>
                <dd className="text-right">{CADENCE_RO(o)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Sancțiune maximă</dt>
                <dd className="text-right">{fineRange(o)}</dd>
              </div>
              {(o.typicalCostMinBani || o.typicalCostMaxBani) && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Cost uzual</dt>
                  <dd className="text-right">
                    {fmtLeiRound(o.typicalCostMinBani ?? 0)} - {fmtLeiRound(o.typicalCostMaxBani ?? 0)} lei
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Categorie</dt>
                <dd className="text-right">{CATEGORY_LABEL_RO[o.category]}</dd>
              </div>
            </dl>

            {o.fineNote && (
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{o.fineNote}</p>
            )}
            {o.salesNote && (
              <p className="mt-2 border-l-2 border-moss pl-3 text-sm leading-relaxed text-ink-soft">
                {o.salesNote}
              </p>
            )}
            {o.needsVerification && (
              <p className="mt-2 rounded-lg bg-warn-wash px-3 py-2 text-xs leading-relaxed text-warn">
                De verificat: {o.needsVerification}
              </p>
            )}
            <p className="mt-2 border-t border-line pt-2 text-xs leading-relaxed text-ink-faint">
              {o.legalBasis.join(" · ")}
            </p>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <p className="mt-4 rounded-xl bg-surface p-6 text-center text-sm text-ink-soft shadow-card">
          Nicio obligație pentru filtrele selectate.
        </p>
      )}

      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        Datele de mai sus sunt citate din actele normative indicate, cu titlu de referință.
        Poziția juridică pentru un imobil anume se confirmă cu un avocat sau cu contabilul
        asociației.
      </p>
    </div>
  );
}
