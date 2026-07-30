import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentOrg } from "@/server/org";
import { listBuildings } from "@/server/repo/buildings";
import { listActiveCleaners } from "@/server/repo/cleaners";
import {
  listMissedVisits,
  listVisitsInMonth,
  listVisitsOnDate,
} from "@/server/repo/visits";
import { listIssues } from "@/server/repo/issues";
import { listExpensesInMonth } from "@/server/repo/expenses";
import { countUnsignedProtocols } from "@/server/repo/protocols";
import { listContracts } from "@/server/repo/contracts";
import { currentMonthKey, todayYmd } from "@/lib/dates";
import { fmtLeiRound } from "@/lib/money";
import { VatGauge } from "@/components/VatGauge";
import { StatusChip } from "@/components/ops/StatusChip";
import { vatCeilingBuildings } from "@/lib/finance";
import {
  generateThisWeekAction,
  setIssueStatusAction,
  markVisitMissedAction,
} from "./actions";

export const metadata: Metadata = { title: "Ops · Scara" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "route", label: "Route" },
  { key: "money", label: "Money" },
  { key: "problems", label: "Problems" },
] as const;

export default async function OpsToday({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "money" || rawTab === "problems" ? rawTab : "route";
  const org = await getCurrentOrg();
  const today = todayYmd();
  const month = currentMonthKey();

  const [buildings, cleaners, todaysVisits, monthVisits, missed, issues, expenses, unsigned, contracts] =
    await Promise.all([
      listBuildings(org.id),
      listActiveCleaners(org.id),
      listVisitsOnDate(org.id, today),
      listVisitsInMonth(org.id, month),
      listMissedVisits(org.id, today),
      listIssues(org.id, { openOnly: true }),
      listExpensesInMonth(org.id, month),
      countUnsignedProtocols(org.id),
      listContracts(org.id),
    ]);

  const buildingById = new Map(buildings.map((b) => [b.id, b]));
  const cleanerById = new Map(cleaners.map((c) => [c.id, c]));

  // Money (§7.2): contracted recurring + turnover/one-off done this month.
  const activeBuildings = buildings.filter((b) => b.status === "active");
  const recurringMonthly = activeBuildings.reduce((sum, b) => sum + b.priceBani, 0);
  const turnoverDone = monthVisits
    .filter((v) => v.type !== "recurring" && v.status === "done")
    .reduce((sum, v) => sum + (v.priceBani ?? 0), 0);
  const expensesMtd = expenses.reduce((sum, e) => sum + e.amountBani, 0);
  const runRate = (recurringMonthly + turnoverDone) * 12;
  const avgPrice =
    activeBuildings.length > 0 ? recurringMonthly / activeBuildings.length : 3566_00;

  // Problems (§7.2).
  const soon = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const expiringProofs = cleaners.filter(
    (c) => c.studentProofExpiry && c.studentProofExpiry <= soon
  );
  const indexationSoon = new Date(Date.now() + 60 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  const indexingContracts = contracts.filter(
    (c) => c.nextIndexationDate && c.nextIndexationDate <= indexationSoon
  );
  const problemCount =
    issues.length + missed.length + expiringProofs.length + indexingContracts.length;

  // Route: group today's visits by cleaner.
  const byCleaner = new Map<string, typeof todaysVisits>();
  for (const v of todaysVisits) {
    const key = v.cleanerId ?? "unassigned";
    if (!byCleaner.has(key)) byCleaner.set(key, []);
    byCleaner.get(key)!.push(v);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Today, {today}</h1>
        <Link
          href="/ops/visits/new"
          className="rounded-md bg-moss-deep px-3 py-1.5 text-sm font-medium text-paper"
        >
          Book a job
        </Link>
      </div>

      <div className="mt-3 flex gap-1 rounded-lg border border-line bg-surface p-1 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/ops?tab=${t.key}`}
            className={`flex-1 rounded-md px-3 py-1.5 text-center ${
              tab === t.key ? "bg-moss-deep font-medium text-paper" : "text-ink-soft"
            }`}
          >
            {t.label}
            {t.key === "problems" && problemCount > 0 && (
              <span className="tnum ml-1.5 rounded-full bg-danger-wash px-1.5 text-xs text-danger">
                {problemCount}
              </span>
            )}
          </Link>
        ))}
      </div>

      {tab === "route" && (
        <section className="mt-4 space-y-4">
          {todaysVisits.length === 0 && (
            <div className="rounded-xl bg-surface p-6 text-center shadow-card">
              <p className="text-sm text-ink-soft">No visits scheduled for today.</p>
            </div>
          )}
          {[...byCleaner.entries()].map(([cleanerId, visits]) => (
            <div key={cleanerId} className="rounded-xl bg-surface p-4 shadow-card">
              <h2 className="text-sm font-semibold">
                {cleanerById.get(cleanerId)?.name ?? "Unassigned"}
              </h2>
              <ul className="mt-2 divide-y divide-line">
                {visits
                  .sort((a, b) => (a.window + a.id).localeCompare(b.window + b.id))
                  .map((v) => (
                    <li key={v.id}>
                      <Link
                        href={`/ops/visits/${v.id}`}
                        className="flex items-center justify-between gap-2 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {v.buildingId
                              ? buildingById.get(v.buildingId)?.label
                              : v.locationLabel ?? "One-off job"}
                          </span>
                          <span className="text-xs text-ink-faint">
                            {v.window === "am" ? "morning" : "afternoon"}
                            {v.type !== "recurring" && ` · ${v.type}`}
                            {v.priceBani ? ` · ${fmtLeiRound(v.priceBani)} lei` : ""}
                          </span>
                        </span>
                        <StatusChip status={v.status} />
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <form action={generateThisWeekAction}>
            <button className="w-full rounded-xl border border-dashed border-line-strong bg-surface px-4 py-3 text-sm text-ink-soft hover:border-moss">
              Generate this week&apos;s visits from building schedules
            </button>
          </form>
        </section>
      )}

      {tab === "money" && (
        <section className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <p className="text-xs text-ink-faint">Contracted recurring</p>
              <p className="tnum mt-1 text-xl font-semibold">
                {fmtLeiRound(recurringMonthly)} lei
              </p>
              <p className="text-xs text-ink-soft">
                {activeBuildings.length} active buildings
              </p>
            </div>
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <p className="text-xs text-ink-faint">Turnover and one-off, done MTD</p>
              <p className="tnum mt-1 text-xl font-semibold">{fmtLeiRound(turnoverDone)} lei</p>
            </div>
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <p className="text-xs text-ink-faint">Expenses MTD</p>
              <p className="tnum mt-1 text-xl font-semibold">{fmtLeiRound(expensesMtd)} lei</p>
            </div>
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <p className="text-xs text-ink-faint">Unsigned protocols</p>
              <p className="tnum mt-1 text-xl font-semibold">{unsigned}</p>
              <Link href="/ops/protocols" className="text-xs text-moss underline">
                Protocols
              </Link>
            </div>
          </div>
          <div className="rounded-xl bg-surface p-4 shadow-card">
            <VatGauge
              annualRunRateBani={runRate}
              maxBuildingsAtPrice={Math.floor(vatCeilingBuildings(avgPrice))}
            />
            <p className="mt-2 text-xs text-ink-faint">
              Turnover revenue counts toward the threshold too.
            </p>
          </div>
        </section>
      )}

      {tab === "problems" && (
        <section className="mt-4 space-y-4">
          {problemCount === 0 && (
            <div className="rounded-xl bg-surface p-6 text-center shadow-card">
              <p className="text-sm text-ink-soft">Nothing on fire. Nice.</p>
            </div>
          )}

          {issues.length > 0 && (
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <h2 className="text-sm font-semibold">Open issues</h2>
              <ul className="mt-2 divide-y divide-line">
                {issues.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{i.description}</p>
                      <p className="text-xs text-ink-faint">
                        {i.buildingId ? buildingById.get(i.buildingId)?.label : "General"} ·{" "}
                        {i.source}
                      </p>
                    </div>
                    <form action={setIssueStatusAction.bind(null, i.id, "done")}>
                      <button className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft hover:border-moss">
                        Resolve
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {missed.length > 0 && (
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <h2 className="text-sm font-semibold">Missed visits</h2>
              <ul className="mt-2 divide-y divide-line">
                {missed.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/ops/visits/${v.id}`} className="min-w-0">
                      <p className="truncate text-sm">
                        {v.buildingId
                          ? buildingById.get(v.buildingId)?.label
                          : v.locationLabel ?? "One-off"}
                      </p>
                      <p className="text-xs text-ink-faint">{v.scheduledDate}</p>
                    </Link>
                    <form action={markVisitMissedAction.bind(null, v.id)}>
                      <button className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft">
                        Mark missed
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {expiringProofs.length > 0 && (
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <h2 className="text-sm font-semibold">Adeverință expiră</h2>
              <ul className="mt-2 divide-y divide-line">
                {expiringProofs.map((c) => (
                  <li key={c.id} className="py-2.5">
                    <p className="text-sm">{c.name}</p>
                    <p className="text-xs text-warn">
                      Student proof expires {c.studentProofExpiry}. Ask for the new adeverință.
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {indexingContracts.length > 0 && (
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <h2 className="text-sm font-semibold">Contract indexation due</h2>
              <ul className="mt-2 divide-y divide-line">
                {indexingContracts.map((c) => (
                  <li key={c.id} className="py-2.5">
                    <p className="text-sm">
                      Indexation on {c.nextIndexationDate}
                      {c.indexationNote ? ` (${c.indexationNote})` : ""}
                    </p>
                    <p className="text-xs text-ink-faint">
                      Contract from {c.startDate}, {c.termMonths} months, notice {c.noticeDays}{" "}
                      days
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
