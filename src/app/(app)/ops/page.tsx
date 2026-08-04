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
import {
  listBuildingObligations,
  listContractors,
  listScheduledEventsOnDate,
} from "@/server/repo/compliance";
import { decorate, exposureFor } from "@/server/complianceService";
import { OBLIGATION_BY_KEY } from "@/lib/compliance";
import { listBuildingServices, listServiceLines } from "@/server/repo/services";
import { ExposureWidget } from "@/components/ops/ExposureWidget";
import { RECURRING_UNITS, type ServiceUnit } from "@/lib/compliance/services";

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

  // Compliance layer (add-on §4).
  const [exposure, obligationRecords, contractors, serviceLines, buildingServices, todaysTreatments] =
    await Promise.all([
      exposureFor(org.id),
      listBuildingObligations(org.id),
      listContractors(org.id),
      listServiceLines(org.id),
      listBuildingServices(org.id),
      listScheduledEventsOnDate(org.id, today),
    ]);
  const complianceRows = decorate(obligationRecords);
  // Treatments booked for today: coordination tasks, not cleaning jobs. The
  // crew escorts, photographs and files — it never performs these (§2.3).
  const obligationById = new Map(obligationRecords.map((r) => [r.id, r]));
  const contractorById = new Map(contractors.map((c) => [c.id, c]));
  const coordination = todaysTreatments.flatMap((e) => {
    const record = obligationById.get(e.buildingObligationId);
    const obligation = record ? OBLIGATION_BY_KEY[record.obligationKey] : undefined;
    if (!record || !obligation) return [];
    return [
      {
        id: e.id,
        name: obligation.nameRo,
        building: buildingById.get(record.buildingId)?.label ?? "…",
        contractor: e.contractorId ? contractorById.get(e.contractorId)?.name : undefined,
        note: e.note,
      },
    ];
  });
  const overdueObligations = complianceRows.filter((r) => r.status === "overdue");
  const dueNoContractor = complianceRows.filter(
    (r) =>
      r.status === "due_soon" &&
      r.obligation.performerRequirement !== "us" &&
      !r.record.contractorId
  );
  const unauthorisedContractors = contractors.filter(
    (c) => !c.authorisationNote || c.authorisationNote.trim() === ""
  );

  // Revenue split by service line (add-on §7).
  const lineById = new Map(serviceLines.map((l) => [l.id, l]));
  const recurringByLine = new Map<string, number>();
  for (const bs of buildingServices) {
    if (!bs.active) continue;
    const line = lineById.get(bs.serviceLineId);
    if (!line || !RECURRING_UNITS.includes(line.unit as ServiceUnit)) continue;
    const building = buildingById.get(bs.buildingId);
    if (!building || building.status !== "active") continue;
    const monthly =
      line.unit === "per_apartment_month" ? bs.priceBani * building.apartments : bs.priceBani;
    recurringByLine.set(line.nameRo, (recurringByLine.get(line.nameRo) ?? 0) + monthly);
  }
  const serviceLineRevenue = [...recurringByLine.entries()].sort((a, b) => b[1] - a[1]);
  const serviceLineTotal = serviceLineRevenue.reduce((s, [, v]) => s + v, 0);

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
    issues.length +
    missed.length +
    expiringProofs.length +
    indexingContracts.length +
    overdueObligations.length +
    dueNoContractor.length +
    unauthorisedContractors.length;

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
          {coordination.length > 0 && (
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <h2 className="text-sm font-semibold">Coordination today</h2>
              <ul className="mt-2 divide-y divide-line">
                {coordination.map((c) => (
                  <li key={c.id} className="py-2.5">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-ink-soft">
                      {c.building}
                      {c.contractor ? ` · ${c.contractor}` : " · no contractor booked"}
                      {c.note ? ` · ${c.note}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      Escort, photograph, file the document. Performed by the contractor,
                      not by us.
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
              <p className="tnum font-display mt-1 text-xl font-bold">
                {fmtLeiRound(recurringMonthly)} lei
              </p>
              <p className="text-xs text-ink-soft">
                {activeBuildings.length} active buildings
              </p>
            </div>
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <p className="text-xs text-ink-faint">Turnover and one-off, done MTD</p>
              <p className="tnum font-display mt-1 text-xl font-bold">{fmtLeiRound(turnoverDone)} lei</p>
            </div>
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <p className="text-xs text-ink-faint">Expenses MTD</p>
              <p className="tnum font-display mt-1 text-xl font-bold">{fmtLeiRound(expensesMtd)} lei</p>
            </div>
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <p className="text-xs text-ink-faint">Unsigned protocols</p>
              <p className="tnum font-display mt-1 text-xl font-bold">{unsigned}</p>
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

          {serviceLineRevenue.length > 0 && (
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <h2 className="text-sm font-semibold">Recurring revenue by service line</h2>
              <ul className="mt-2 divide-y divide-line">
                {serviceLineRevenue.map(([name, bani]) => (
                  <li key={name} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="min-w-0 truncate text-sm">{name}</span>
                    <span className="tnum shrink-0 text-sm font-medium">
                      {fmtLeiRound(bani)} lei
                    </span>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-sm font-medium">Total</span>
                  <span className="tnum text-sm font-semibold">
                    {fmtLeiRound(serviceLineTotal)} lei
                  </span>
                </li>
              </ul>
            </div>
          )}

          <ExposureWidget summary={exposure} />
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

          {overdueObligations.length > 0 && (
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <h2 className="text-sm font-semibold">Obligații legale restante</h2>
              <ul className="mt-2 divide-y divide-line">
                {overdueObligations.map((r) => (
                  <li key={r.record.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{r.obligation.nameRo}</p>
                      <p className="text-xs text-ink-faint">
                        {buildingById.get(r.record.buildingId)?.label} · scadent {r.nextDue}
                      </p>
                    </div>
                    <span className="tnum shrink-0 text-xs text-danger">
                      {r.obligation.fineMaxBani
                        ? `până la ${fmtLeiRound(r.obligation.fineMaxBani)} lei`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/ops/compliance?status=overdue" className="mt-2 inline-block text-xs text-moss underline">
                Deschide calendarul
              </Link>
            </div>
          )}

          {dueNoContractor.length > 0 && (
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <h2 className="text-sm font-semibold">Scadente curând, fără furnizor</h2>
              <ul className="mt-2 divide-y divide-line">
                {dueNoContractor.map((r) => (
                  <li key={r.record.id} className="py-2.5">
                    <p className="text-sm">{r.obligation.nameRo}</p>
                    <p className="text-xs text-warn">
                      {buildingById.get(r.record.buildingId)?.label} · scadent {r.nextDue} ·
                      nimeni programat
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {unauthorisedContractors.length > 0 && (
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <h2 className="text-sm font-semibold">Furnizori fără autorizare consemnată</h2>
              <ul className="mt-2 divide-y divide-line">
                {unauthorisedContractors.map((c) => (
                  <li key={c.id} className="py-2.5">
                    <p className="text-sm">{c.name}</p>
                    <p className="text-xs text-warn">
                      Cere numărul de atestat înainte de următoarea lucrare.
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
