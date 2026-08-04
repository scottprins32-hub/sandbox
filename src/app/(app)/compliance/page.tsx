import type { Metadata } from "next";
import Link from "next/link";
import {
  applicableObligations,
  CATALOGUE_VERSION,
  CATEGORY_LABEL_EN,
  maxExposureBani,
  OBLIGATIONS,
  PERFORMER_LABEL_EN,
  type Obligation,
  type ObligationCategory,
  type PerformerRequirement,
} from "@/lib/compliance";
import { fmtLeiRound } from "@/lib/money";

export const metadata: Metadata = { title: "Legal obligations · Scara" };

// Section A reference page (add-on §3). No database: the catalogue is static
// data, so this works on a bare deployment and is usable from a phone in front
// of a building president.

const CADENCE_EN = (o: Obligation): string => {
  const c = o.cadence;
  switch (c.kind) {
    case "fixed":
      return c.perYear === 1 ? "once a year" : `${c.perYear} times a year`;
    case "months":
      return c.every === 1 ? "monthly" : `every ${c.every} months`;
    case "years":
      return c.every === 1 ? "annually" : `every ${c.every} years`;
    case "continuous":
      return "ongoing";
    case "seasonal":
      return `seasonal, months ${c.fromMonth}-${c.toMonth}`;
    case "event":
      return "on occurrence";
    case "once":
      return `once, by ${c.byDate.split("-").reverse().join(".")}`;
  }
};

function fineRange(o: Obligation): string {
  if (o.fineMinBani === null && o.fineMaxBani === null) return "unspecified";
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

const CATEGORIES = Object.keys(CATEGORY_LABEL_EN) as ObligationCategory[];
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
          A block&apos;s legal obligations
        </h1>
        <p className="text-xs text-ink-faint">
          {OBLIGATIONS.length} obligations · catalogue {CATALOGUE_VERSION}
        </p>
      </div>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
        What a condominium must do, how often, who is allowed to do it, and the maximum
        penalty the law provides.
      </p>

      {/* Building flags: narrows the catalogue to one real building */}
      <div className="mt-4 rounded-xl bg-surface p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          The building has
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { key: "gas" as const, label: "gas" },
            { key: "lift" as const, label: "a lift" },
            { key: "basement" as const, label: "a basement" },
            { key: "playground" as const, label: "a playground" },
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
            ? `${rows.length} obligations apply to this configuration.`
            : "With nothing selected, the whole catalogue is shown."}
        </p>
      </div>

      {/* Exposure headline */}
      <div className="mt-3 rounded-xl bg-surface p-4 shadow-card">
        <p className="text-xs text-ink-faint">
          Maximum exposure under the law, for the obligations shown
        </p>
        <p className="tnum mt-1 text-2xl font-semibold">{fmtLeiRound(exposure)} lei</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-faint">
          The sum of the statutory maximums, for information only. It is not an estimate of
          a fine and it takes no account of what has already been done in the building.
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
            all categories
          </Link>
          {usedCategories.map((c) => (
            <Link
              key={c}
              href={chipHref(base, { cat: sp.cat === c ? undefined : c })}
              className={`rounded-full px-2.5 py-1 text-xs ${
                sp.cat === c ? "bg-ink text-paper" : "border border-line bg-surface text-ink-soft"
              }`}
            >
              {CATEGORY_LABEL_EN[c]}
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
            anyone
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
              {PERFORMER_LABEL_EN[p]}
            </Link>
          ))}
        </div>
      </div>

      {/* The catalogue */}
      <ul className="mt-4 space-y-2">
        {rows.map((o) => (
          <li key={o.key} className="rounded-xl bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="max-w-lg font-medium leading-snug">{o.nameEn}</h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${PERFORMER_TONE[o.performerRequirement]}`}
              >
                {PERFORMER_LABEL_EN[o.performerRequirement]}
              </span>
            </div>

            <dl className="tnum mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Frequency</dt>
                <dd className="text-right">{CADENCE_EN(o)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Maximum fine</dt>
                <dd className="text-right">{fineRange(o)}</dd>
              </div>
              {(o.typicalCostMinBani || o.typicalCostMaxBani) && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Typical cost</dt>
                  <dd className="text-right">
                    {fmtLeiRound(o.typicalCostMinBani ?? 0)} - {fmtLeiRound(o.typicalCostMaxBani ?? 0)} lei
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Category</dt>
                <dd className="text-right">{CATEGORY_LABEL_EN[o.category]}</dd>
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
                To verify: {o.needsVerification}
              </p>
            )}
            {/* Romanian legal name beside the citations: both are what you
                quote to a contractor, an inspector or the association. */}
            <p className="mt-2 border-t border-line pt-2 text-xs leading-relaxed text-ink-faint">
              {o.nameRo} · {o.legalBasis.join(" · ")}
            </p>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <p className="mt-4 rounded-xl bg-surface p-6 text-center text-sm text-ink-soft shadow-card">
          No obligations match these filters.
        </p>
      )}

      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        The data above is quoted from the legislation cited, for reference. Confirm the
        position for a specific building with a lawyer or with the association&apos;s
        accountant.
      </p>
    </div>
  );
}
