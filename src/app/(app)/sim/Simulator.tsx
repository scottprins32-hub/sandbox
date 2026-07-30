"use client";

// Module 1 — the Simulator (§6). Everything reacts live; compute is client-side
// via the finance module. Pinned scenario persists to localStorage (Phase 1
// decision, see DECISIONS.md).

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MARKET,
  PRICING,
  OVERHEAD_MONTHLY,
  SEED_BUILDINGS,
  SERVICE,
  TAX,
} from "@/lib/constants";
import {
  employerCost,
  project,
  vatAbsorb,
  vatReprice,
  WORKER_MODEL_LABELS,
  type FlexRow,
} from "@/lib/finance";
import { fmtEur, fmtLei, fmtLeiRound } from "@/lib/money";
import { VatGauge } from "@/components/VatGauge";
import { NumberField, Section, Segmented, SliderRow, Stepper } from "./controls";
import { ProjectionChart } from "./ProjectionChart";
import {
  computeResults,
  CURRENT_KEY,
  DEFAULT_STATE,
  loadState,
  PINNED_KEY,
  planFromState,
  saveState,
  studentSavingsBani,
  type CityPreset,
  type SimState,
} from "./simState";

const PRESET_FLAVOR: Record<CityPreset, string> = {
  giroc: `Giroc: pop. ${MARKET.GIROC.population.toLocaleString("en-US")}, +65% in a decade, ${MARKET.GIROC.projectsPerYear} residential projects/yr, ~${MARKET.GIROC.blocksEst[0]}-${MARKET.GIROC.blocksEst[1]} blocks.`,
  dumbravita: `Dumbrăvița: pop. ${MARKET.DUMBRAVITA.population.toLocaleString("en-US")}, ${MARKET.DUMBRAVITA.projectsPerYear} residential projects/yr. Second route, own cleaner (opposite side of the city).`,
  custom: "Custom scenario: nothing prefilled, every control is yours.",
};

function Tile({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-card">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="tnum mt-1 text-xl font-semibold leading-tight">{value}</p>
      {sub && <p className="tnum mt-0.5 text-xs text-ink-soft">{sub}</p>}
      {delta && <p className="tnum mt-0.5 text-xs text-ink-faint">{delta}</p>}
    </div>
  );
}

function WaterfallRow({
  label,
  bani,
  pctOfPrice,
  tone,
}: {
  label: string;
  bani: number;
  pctOfPrice: number;
  tone: "price" | "cost" | "margin";
}) {
  const fill =
    tone === "price" ? "bg-line-strong" : tone === "cost" ? "bg-[#eb6834]" : "bg-[#1baf7a]";
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-28 shrink-0 text-sm text-ink-soft">{label}</span>
      <div className="h-3 flex-1 rounded-sm bg-paper">
        <div
          className={`h-full rounded-sm ${fill}`}
          style={{ width: `${Math.max(0, Math.min(100, pctOfPrice * 100))}%` }}
        />
      </div>
      <span className="tnum w-24 shrink-0 text-right text-sm">{fmtLei(bani)} lei</span>
    </div>
  );
}

export function Simulator() {
  const [state, setState] = useState<SimState>(DEFAULT_STATE);
  const [pinned, setPinned] = useState<SimState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = loadState(CURRENT_KEY);
    if (saved) setState(saved);
    setPinned(loadState(PINNED_KEY));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(CURRENT_KEY, state);
  }, [state, hydrated]);

  const results = useMemo(() => computeResults(state), [state]);
  const pinnedResults = useMemo(() => (pinned ? computeResults(pinned) : null), [pinned]);

  const set = <K extends keyof SimState>(key: K, value: SimState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const setFlex = (index: number, patch: Partial<FlexRow>) =>
    setState((s) => ({
      ...s,
      flex: s.flex.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));

  // Guardrails (§6): educational, not blocking.
  const priceVsMarket = state.priceBani / PRICING.MARKET_PRICE_3FLOOR_2X;
  const standardFlexNote = state.flex.find(
    (r) => r.model === "parttime_standard" && r.hoursPerDay <= 4 && r.count > 0
  );

  // VAT-registered card numbers: one month of projection under each strategy.
  const vatCards = useMemo(() => {
    if (!state.vatRegistered) return null;
    const mk = (strategy: "reprice" | "absorb") =>
      project(12, planFromState(state, { strategy }));
    return { reprice: mk("reprice"), absorb: mk("absorb") };
  }, [state]);

  function pinA() {
    setPinned(state);
    saveState(PINNED_KEY, state);
  }
  function clearPin() {
    setPinned(null);
    saveState(PINNED_KEY, null);
  }

  function delta(nowBani: number, pinnedBani: number | undefined): string | undefined {
    if (pinnedBani === undefined) return undefined;
    const d = nowBani - pinnedBani;
    const sign = d >= 0 ? "+" : "−";
    return `A: ${fmtLeiRound(pinnedBani)} lei · Δ ${sign}${fmtLeiRound(Math.abs(d))} lei`;
  }

  function copySummary() {
    const r = results;
    const lines = [
      `Scara scenario, ${new Date().toISOString().slice(0, 10)}`,
      `Price/building: ${fmtLei(state.priceBani)} lei (${fmtEur(state.priceBani, state.ronPerEur)}), ${(state.priceBani / PRICING.MARKET_PRICE_3FLOOR_2X).toFixed(1)}x market`,
      `Buildings: ${state.buildings} now, +${state.growthPerMonth}/month`,
      `Service: ${state.hoursPerVisit}h x ${state.visitsPerWeek}/week`,
      `Team: ${state.fulltimeCount} full-time + ${state.flex.map((f) => `${f.count} ${WORKER_MODEL_LABELS[f.model]} ${f.hoursPerDay}h/day`).join(", ")}`,
      state.turnoversPerWeek > 0
        ? `Turnovers: ${state.turnoversPerWeek}/week @ ${fmtLei(state.turnoverPriceBani)} lei`
        : null,
      `Monthly profit now: ${fmtLeiRound(r.now.profitBani)} lei (${fmtEur(r.now.profitBani, state.ronPerEur)})`,
      `Profit at month 12: ${fmtLeiRound(r.at12.profitBani)} lei`,
      `Cleaners needed now: ${r.now.cleanersNeeded}`,
      `Margin/building: ${fmtLei(r.unit.marginBani)} lei (${Math.round(r.unit.marginPct * 100)}%)`,
      `VAT ceiling at this price: ${r.vatCeiling.toFixed(1)} buildings; run rate now ${fmtLeiRound(r.now.annualizedRunRateBani)} lei/yr`,
      state.vatRegistered ? `VAT-registered mode: ${state.vatStrategy}` : null,
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1500);
    });
  }

  function downloadCsv() {
    const header =
      "month,buildings,revenue_lei,turnover_revenue_lei,total_cost_lei,payroll_lei,tax_lei,profit_lei,cumulative_cash_lei,cleaners_needed,run_rate_lei_yr,vat_breached,micro_breached";
    const lines = results.rows.map((r) =>
      [
        r.monthIndex + 1,
        r.buildings,
        (r.revenueBani / 100).toFixed(2),
        (r.turnoverRevenueBani / 100).toFixed(2),
        (r.totalCostBani / 100).toFixed(2),
        (r.payrollBani / 100).toFixed(2),
        (r.taxBani / 100).toFixed(2),
        (r.profitBani / 100).toFixed(2),
        (r.cumulativeCashBani / 100).toFixed(2),
        r.cleanersNeeded,
        (r.annualizedRunRateBani / 100).toFixed(0),
        r.vatBreached,
        r.microBreached,
      ].join(",")
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scara-24-month-projection.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const rail = (
    <div className="divide-y-0">
      <Section title="City preset">
        <Segmented
          label=""
          value={state.preset}
          options={[
            { value: "giroc" as const, label: "Giroc" },
            { value: "dumbravita" as const, label: "Dumbrăvița" },
            { value: "custom" as const, label: "Custom" },
          ]}
          onChange={(preset) => set("preset", preset)}
        />
        <p className="text-xs leading-relaxed text-ink-faint">{PRESET_FLAVOR[state.preset]}</p>
      </Section>

      <Section title="Pricing">
        <SliderRow
          label="Price per building"
          value={state.priceBani / 100}
          min={400}
          max={6000}
          step={25}
          onChange={(v) => set("priceBani", Math.round(v * 100))}
          format={(v) => `${fmtLeiRound(v * 100)} lei`}
        >
          <div className="tnum mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-ink-soft">
            <span>{fmtEur(state.priceBani, state.ronPerEur)}/building</span>
            <span>
              {fmtLei(Math.round(state.priceBani / SEED_BUILDINGS.apartmentsEach))} lei/apartment
            </span>
            <span>
              {(state.priceBani / 100 / SEED_BUILDINGS.residentsEach / state.ronPerEur).toFixed(2)}{" "}
              €/person/month
            </span>
            <span>{priceVsMarket.toFixed(1)}× market</span>
          </div>
          {priceVsMarket > 2 && (
            <p className="mt-1.5 text-xs leading-relaxed text-warn">
              7.2× market is what the current landlord pays. Above ~2× is fragile against a
              competitor&apos;s published price list.
            </p>
          )}
        </SliderRow>
      </Section>

      <Section title="Growth">
        <SliderRow
          label="Buildings"
          value={state.buildings}
          min={1}
          max={60}
          step={1}
          onChange={(v) => set("buildings", v)}
        />
        <SliderRow
          label="Growth per month"
          value={state.growthPerMonth}
          min={0}
          max={4}
          step={1}
          onChange={(v) => set("growthPerMonth", v)}
          format={(v) => `+${v}`}
        />
      </Section>

      <Section title="Service">
        <SliderRow
          label="Hours per visit"
          value={state.hoursPerVisit}
          min={0.75}
          max={3}
          step={0.25}
          onChange={(v) => set("hoursPerVisit", v)}
          format={(v) => `${v} h`}
        />
        <Segmented
          label="Visits per week"
          value={state.visitsPerWeek}
          options={[
            { value: 1 as const, label: "1" },
            { value: 2 as const, label: "2" },
            { value: 3 as const, label: "3" },
          ]}
          onChange={(v) => set("visitsPerWeek", v)}
        />
      </Section>

      <Section title="Team">
        <Stepper
          label="Full-time cleaners"
          value={state.fulltimeCount}
          min={0}
          max={6}
          onChange={(v) => set("fulltimeCount", v)}
        />
        {state.flex.map((row, i) => (
          <div key={i} className="mt-2 rounded-lg border border-line bg-paper p-2.5">
            <label className="text-xs text-ink-faint">Flexible workers</label>
            <select
              value={row.model}
              onChange={(e) => setFlex(i, { model: e.target.value as FlexRow["model"] })}
              className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
              aria-label="Worker model"
            >
              <option value="parttime_student">{WORKER_MODEL_LABELS.parttime_student}</option>
              <option value="parttime_standard">{WORKER_MODEL_LABELS.parttime_standard}</option>
              <option value="parttime_pensioner">{WORKER_MODEL_LABELS.parttime_pensioner}</option>
            </select>
            <Stepper
              label="Count"
              value={row.count}
              min={0}
              max={10}
              onChange={(v) => setFlex(i, { count: v })}
            />
            <SliderRow
              label="Hours per day"
              value={row.hoursPerDay}
              min={0}
              max={8}
              step={1}
              onChange={(v) => setFlex(i, { hoursPerDay: v })}
              format={(v) => `${v} h`}
            />
            <p className="tnum text-xs text-ink-faint">
              {fmtLei(
                employerCost(row.model, row.hoursPerDay, row.grossMonthlyBani, {
                  partTimeFloorBani: state.partTimeFloorBani,
                }).employerTotalBani
              )}{" "}
              lei employer cost each
            </p>
          </div>
        ))}
        {standardFlexNote && (
          <p className="mt-1.5 text-xs leading-relaxed text-warn">
            A student under 26 would cost{" "}
            {fmtLeiRound(studentSavingsBani(standardFlexNote, state.partTimeFloorBani))} lei
            less/month (exempt from the part-time floor).
          </p>
        )}
        {results.blendedCostPerHourBani !== null && (
          <p className="tnum mt-2 text-xs text-ink-soft">
            Blended cost: {(results.blendedCostPerHourBani / 100).toFixed(2)} lei per productive
            hour
          </p>
        )}
      </Section>

      <Section title="Airbnb turnovers" defaultOpen={false}>
        <SliderRow
          label="Turnovers per week"
          value={state.turnoversPerWeek}
          min={0}
          max={30}
          step={1}
          onChange={(v) => set("turnoversPerWeek", v)}
        />
        <SliderRow
          label="Price per turnover"
          value={state.turnoverPriceBani / 100}
          min={80}
          max={400}
          step={10}
          onChange={(v) => set("turnoverPriceBani", Math.round(v * 100))}
          format={(v) => `${fmtLeiRound(v * 100)} lei`}
        />
        <p className="text-xs text-ink-faint">
          Market: 120-250 lei per 2-room turnover; {SERVICE.TURNOVER.DEFAULT_HOURS}h each. Hours
          feed the same capacity math.
        </p>
      </Section>

      <Section title="Money">
        <SliderRow
          label="Overhead"
          value={state.overheadBani / 100}
          min={500}
          max={3000}
          step={10}
          onChange={(v) => set("overheadBani", Math.round(v * 100))}
          format={(v) => `${fmtLeiRound(v * 100)} lei`}
        />
        <details className="text-xs text-ink-faint">
          <summary className="cursor-pointer">Default breakdown (1,070 lei)</summary>
          <ul className="tnum mt-1 space-y-0.5 pl-1">
            {Object.entries(OVERHEAD_MONTHLY).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k.toLowerCase().replaceAll("_", " ")}</span>
                <span>{fmtLei(v)} lei</span>
              </li>
            ))}
          </ul>
        </details>
        <SliderRow
          label="Platform fee (Scott)"
          value={state.platformFeeBani / 100}
          min={0}
          max={2000}
          step={50}
          onChange={(v) => set("platformFeeBani", Math.round(v * 100))}
          format={(v) => `${fmtLeiRound(v * 100)} lei`}
        />
      </Section>

      <Section title="VAT: crossing the wall" defaultOpen={false}>
        <label className="flex items-center justify-between py-1.5 text-sm">
          <span className="text-ink-soft">VAT-registered</span>
          <input
            type="checkbox"
            checked={state.vatRegistered}
            onChange={(e) => set("vatRegistered", e.target.checked)}
            className="h-5 w-5 accent-[#2c523c]"
          />
        </label>
        {state.vatRegistered && (
          <Segmented
            label="Chart follows"
            value={state.vatStrategy}
            options={[
              { value: "reprice" as const, label: "Reprice" },
              { value: "absorb" as const, label: "Absorb" },
            ]}
            onChange={(v) => set("vatStrategy", v)}
          />
        )}
      </Section>

      <Section title="Constants" defaultOpen={false}>
        <NumberField
          label="RON per EUR"
          value={state.ronPerEur}
          step={0.01}
          onChange={(v) => set("ronPerEur", v)}
        />
        <NumberField
          label="Part-time floor (lei)"
          value={state.partTimeFloorBani / 100}
          step={0.25}
          onChange={(v) => set("partTimeFloorBani", Math.round(v * 100))}
        />
        <p className="text-xs leading-relaxed text-ink-faint">
          Floor default 1,513.75 lei (35% × 4,325). Accountant to confirm; see DECISIONS.md.
        </p>
      </Section>
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
      {/* Desktop rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-16 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-xl bg-surface shadow-card">
          {rail}
        </div>
      </aside>

      {/* Mobile bottom sheet */}
      {railOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close controls"
            className="absolute inset-0 bg-ink/30"
            onClick={() => setRailOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-surface pb-8 shadow-card">
            <div className="sticky top-0 flex justify-between border-b border-line bg-surface px-4 py-2">
              <span className="text-sm font-medium">Scenario controls</span>
              <button onClick={() => setRailOpen(false)} className="text-sm text-moss">
                Done
              </button>
            </div>
            {rail}
          </div>
        </div>
      )}
      <button
        onClick={() => setRailOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-moss-deep px-5 py-3 text-sm font-medium text-paper shadow-card lg:hidden"
      >
        Adjust scenario
      </button>

      {/* Results canvas */}
      <div className="space-y-4">
        {/* Pin + export row */}
        <div className="flex flex-wrap items-center gap-2">
          {pinned ? (
            <>
              <span className="rounded-full bg-moss-wash px-3 py-1 text-xs font-medium text-moss-deep">
                Comparing to pinned A
              </span>
              <button
                onClick={pinA}
                className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft"
              >
                Re-pin as A
              </button>
              <button
                onClick={clearPin}
                className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft"
              >
                Clear pin
              </button>
            </>
          ) : (
            <button
              onClick={pinA}
              className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft"
            >
              Pin as A
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={copySummary}
              className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft"
            >
              {copied ? "Copied" : "Copy summary"}
            </button>
            <button
              onClick={downloadCsv}
              className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft"
            >
              CSV (24 months)
            </button>
          </div>
        </div>

        {/* Hero row */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Tile
            label="Monthly profit (now)"
            value={`${fmtLeiRound(results.now.profitBani)} lei`}
            sub={fmtEur(results.now.profitBani, state.ronPerEur)}
            delta={delta(results.now.profitBani, pinnedResults?.now.profitBani)}
          />
          <Tile
            label="Profit at 12 months"
            value={`${fmtLeiRound(results.at12.profitBani)} lei`}
            sub={fmtEur(results.at12.profitBani, state.ronPerEur)}
            delta={delta(results.at12.profitBani, pinnedResults?.at12.profitBani)}
          />
          <Tile
            label="Cleaners needed now"
            value={String(results.now.cleanersNeeded)}
            sub={`${results.now.totalHours.toFixed(0)} h/month of work`}
            delta={
              pinnedResults
                ? `A: ${pinnedResults.now.cleanersNeeded}`
                : undefined
            }
          />
          <div className="rounded-xl bg-surface p-4 shadow-card">
            <VatGauge
              annualRunRateBani={results.now.annualizedRunRateBani}
              maxBuildingsAtPrice={Math.floor(results.vatCeiling)}
            />
          </div>
        </div>

        {/* Dividend info line */}
        <p className="tnum text-xs text-ink-faint">
          Her dividend draw (profit after platform fee, net of 16% dividend tax):{" "}
          {fmtLeiRound(results.dividendNetBani)} lei/month.
        </p>

        {/* Unit economics waterfall */}
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold">Unit economics per building</h2>
          <div className="mt-2">
            <WaterfallRow label="Price" bani={state.priceBani} pctOfPrice={1} tone="price" />
            <WaterfallRow
              label="Labour"
              bani={results.unit.labourBani}
              pctOfPrice={results.unit.labourBani / state.priceBani}
              tone="cost"
            />
            <WaterfallRow
              label="Consumables"
              bani={results.unit.consumablesBani}
              pctOfPrice={results.unit.consumablesBani / state.priceBani}
              tone="cost"
            />
            <WaterfallRow
              label="Travel"
              bani={results.unit.travelBani}
              pctOfPrice={results.unit.travelBani / state.priceBani}
              tone="cost"
            />
            <WaterfallRow
              label="Margin"
              bani={results.unit.marginBani}
              pctOfPrice={Math.max(0, results.unit.marginPct)}
              tone="margin"
            />
          </div>
          <p className="tnum mt-1 text-right text-sm font-medium text-moss-deep">
            {Math.round(results.unit.marginPct * 100)}% margin
          </p>
        </div>

        {/* 24-month chart */}
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">24-month projection</h2>
            <span className="text-xs text-ink-faint">
              {results.worthItMonth >= 0
                ? `Crosses "worth it" in month ${results.worthItMonth + 1}`
                : `Does not reach €2,000/month in 24 months`}
            </span>
          </div>
          <ProjectionChart rows={results.rows} worthItLineBani={results.worthItLineBani} />
        </div>

        {/* Capacity strip */}
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <p className="tnum text-sm">
            {state.buildings} buildings = {Math.round((state.buildings / results.capacityBuildings) * 100)}%
            of one full-time cleaner.{" "}
            <span className="text-ink-soft">
              1 full-time cleaner covers {results.capacityBuildings.toFixed(1)} buildings at these
              settings.
            </span>
          </p>
          <p className="tnum mt-1 text-xs text-ink-faint">
            Break-even at {(
              (state.overheadBani / 100 + 4418) /
              (results.unit.marginBani / 100)
            ).toFixed(1)}{" "}
            buildings (overhead + one full-time cleaner) · micro ceiling ≈{" "}
            {results.microCeiling.toFixed(1)} buildings
          </p>
        </div>

        {/* VAT-registered: the two crossing strategies side by side */}
        {state.vatRegistered && vatCards && (
          <div className="rounded-xl bg-surface p-4 shadow-card">
            <h2 className="text-sm font-semibold">VAT-registered: two ways across the wall</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div
                className={`rounded-lg border p-3 ${state.vatStrategy === "reprice" ? "border-moss" : "border-line"}`}
              >
                <p className="text-sm font-medium">(a) Reprice</p>
                <ul className="tnum mt-1.5 space-y-1 text-xs text-ink-soft">
                  <li>
                    Client pays {fmtLei(vatReprice(state.priceBani).clientPriceBani)} lei
                    (+{Math.round(TAX.VAT_RATE * 100)}%)
                  </li>
                  <li>Net revenue/building unchanged: {fmtLei(state.priceBani)} lei</li>
                  <li className="font-medium text-ink">
                    Profit now: {fmtLeiRound(vatCards.reprice[0]!.profitBani)} lei · month 12:{" "}
                    {fmtLeiRound(vatCards.reprice[11]!.profitBani)} lei
                  </li>
                </ul>
                <p className="mt-2 text-xs leading-relaxed text-warn">
                  Fragile: residential clients cannot reclaim VAT, so their bill really rises 21%.
                </p>
              </div>
              <div
                className={`rounded-lg border p-3 ${state.vatStrategy === "absorb" ? "border-moss" : "border-line"}`}
              >
                <p className="text-sm font-medium">(b) Absorb</p>
                <ul className="tnum mt-1.5 space-y-1 text-xs text-ink-soft">
                  <li>Client price unchanged: {fmtLei(state.priceBani)} lei</li>
                  <li>
                    Net revenue/building: {fmtLei(vatAbsorb(state.priceBani).netRevenuePerBuildingBani)}{" "}
                    lei (÷1.21)
                  </li>
                  <li className="font-medium text-ink">
                    Profit now: {fmtLeiRound(vatCards.absorb[0]!.profitBani)} lei · month 12:{" "}
                    {fmtLeiRound(vatCards.absorb[11]!.profitBani)} lei
                  </li>
                </ul>
                <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                  Margin takes the hit; the client notices nothing.
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              Past {fmtLeiRound(TAX.MICRO_CEILING_ANNUAL)} lei/yr the model switches to 16% profit
              tax. Simplified; the accountant owns the real numbers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
