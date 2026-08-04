import type { Metadata } from "next";
import Link from "next/link";
import {
  FREQUENCY_LABEL_EN,
  frequencyTableRo,
  SERVICE_TASKS,
  tasksForPackage,
  totalMinutesPerVisit,
  uniqueVsMarket,
  ZONE_LABEL_EN,
  type ServiceTask,
} from "@/lib/services/task-catalogue";

// Section A reference page (add-on 2 §2). No database: the catalogue is
// static, so this works on a bare deployment and can be shown on a phone in
// front of a building president. The Romanian wording is the client-facing
// line; the English around it is the admin app (§0).

export const metadata: Metadata = { title: "Services · Scara" };

const VIS_TONE: Record<ServiceTask["visibilityToResident"], string> = {
  very_high: "bg-moss-wash text-moss-deep",
  high: "bg-moss-wash text-moss-deep",
  medium: "bg-paper text-ink-soft",
  low: "bg-paper text-ink-faint",
};

function CoverageBar({ n }: { n: number }) {
  const gap = n <= 2;
  return (
    <span className="flex items-center justify-end gap-1.5">
      <span
        aria-hidden
        className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-line sm:block"
      >
        <span
          className={`block h-full rounded-full ${gap ? "bg-danger" : "bg-line-strong"}`}
          style={{ width: `${(n / 20) * 100}%` }}
        />
      </span>
      <span className={`tnum text-xs ${gap ? "font-medium text-danger" : "text-ink-soft"}`}>
        {n}/20
      </span>
    </span>
  );
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ lift?: string; basement?: string; gaps?: string }>;
}) {
  const sp = await searchParams;
  const flags = { hasLift: sp.lift === "1", hasBasement: sp.basement === "1", hasGreen: true };
  const gapsOnly = sp.gaps === "1";

  const base = tasksForPackage(flags);
  const minutes = totalMinutesPerVisit(base);
  const drift = Math.round(((minutes - 90) / 90) * 100);
  const gaps = uniqueVsMarket();
  const groups = frequencyTableRo(gapsOnly ? gaps : SERVICE_TASKS);

  const chip = (on: boolean) =>
    `rounded-full px-2.5 py-1 text-xs ${
      on ? "bg-ink text-paper" : "border border-line bg-surface text-ink-soft"
    }`;
  const href = (patch: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = {
      lift: sp.lift,
      basement: sp.basement,
      gaps: sp.gaps,
      ...patch,
    };
    const q = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return q ? `/services?${q}` : "/services";
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">What we actually do</h1>
        <p className="text-xs text-ink-faint">
          {SERVICE_TASKS.length} tasks · 20 Romanian firms audited
        </p>
      </div>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Romanian competitors publish about 15 line items. The German benchmark runs to
        roughly 60. The right-hand column is how many of the 20 audited firms publish each
        task — the low numbers are the offer.
      </p>

      {/* Headline numbers */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <p className="text-xs text-ink-faint">Tasks nobody else publishes</p>
          <p className="tnum font-display mt-1 text-2xl font-bold">{gaps.length}</p>
          <p className="mt-0.5 text-xs text-ink-soft">2 or fewer firms out of 20</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <p className="text-xs text-ink-faint">Base package, every visit</p>
          <p
            className={`tnum font-display mt-1 text-2xl font-bold ${
              Math.abs(drift) > 20 ? "text-warn" : ""
            }`}
          >
            {minutes} min
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {drift > 0 ? "+" : ""}
            {drift}% vs the 90 min pricing assumption
          </p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <p className="text-xs text-ink-faint">In the base package</p>
          <p className="tnum font-display mt-1 text-2xl font-bold">{base.length}</p>
          <p className="mt-0.5 text-xs text-ink-soft">for this building&apos;s features</p>
        </div>
      </div>

      {Math.abs(drift) > 20 && (
        <p className="mt-3 rounded-xl bg-warn-wash px-4 py-3 text-sm leading-relaxed text-warn">
          The every-visit tasks add up to {minutes} minutes, but the finance module prices
          on 1.5 hours. Either trim the base package or raise hours per visit — the price
          floor moves with it.
        </p>
      )}

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Link href={href({ lift: sp.lift ? undefined : "1" })} className={chip(!!sp.lift)}>
          has a lift
        </Link>
        <Link
          href={href({ basement: sp.basement ? undefined : "1" })}
          className={chip(!!sp.basement)}
        >
          has a basement
        </Link>
        <Link href={href({ gaps: gapsOnly ? undefined : "1" })} className={chip(gapsOnly)}>
          only what the market skips
        </Link>
      </div>

      {/* The catalogue */}
      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <section key={g.zone} className="rounded-xl bg-surface p-4 shadow-card">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold">{ZONE_LABEL_EN[g.zone]}</h2>
              <span className="micro">{g.labelRo}</span>
            </div>
            <ul className="mt-2 divide-y divide-line">
              {g.tasks.map((t) => (
                <li key={t.key} className="py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {t.nameEn}
                        {!t.inBasePackage && (
                          <span className="ml-1.5 rounded-full border border-line px-1.5 py-0.5 text-xs text-ink-faint">
                            extra
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ink-faint">{t.nameRo}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-ink-soft">
                        {FREQUENCY_LABEL_EN[t.defaultFrequency]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${VIS_TONE[t.visibilityToResident]}`}
                      >
                        {t.visibilityToResident.replace("_", " ")}
                      </span>
                      <span className="tnum w-12 text-right text-xs text-ink-faint">
                        {t.effortMinutes}′
                      </span>
                      <span className="w-24 text-right">
                        <CoverageBar n={t.competitorCoverage} />
                      </span>
                    </div>
                  </div>
                  {t.gapNote && (
                    <p className="mt-1.5 border-l-2 border-danger pl-3 text-xs leading-relaxed text-ink-soft">
                      {t.gapNote}
                    </p>
                  )}
                  {t.requiresConsumable && (
                    <p className="mt-1 text-xs text-ink-faint">
                      Consumable: {t.requiresConsumable}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        Coverage figures come from an audit of 20 Romanian firms&apos; published service
        menus, read against German Leistungsverzeichnisse. They describe what competitors
        publish, which is not always what they do.
      </p>
    </div>
  );
}
