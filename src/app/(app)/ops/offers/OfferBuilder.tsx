"use client";

// Offer builder. Pricing reacts live via the pure finance module, so the
// number is never sent blind: the cost floor, the like-for-like market rate
// and the §6 fragility guardrail are all on screen while you type.

import { useMemo, useState } from "react";
import {
  defaultHoursForFloors,
  priceOffer,
  suggestOpeningPrice,
} from "@/lib/finance";
import { fmtLei, fmtLeiRound } from "@/lib/money";

export interface OfferPrefill {
  prospectId?: string;
  clientName?: string;
  buildingLabel?: string;
  address?: string;
  floors?: number;
  apartments?: number;
  quotedPriceBani?: number;
}

/** Uncontrolled: plain text that does not feed the live pricing panel. */
function TextField({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-ink-soft">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-moss"
      />
    </label>
  );
}

/** Controlled: drives the live pricing panel. */
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  step,
  hint,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-ink-soft">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-moss"
      />
      {hint && <span className="mt-0.5 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function OfferBuilder({
  action,
  prefill,
}: {
  action: (formData: FormData) => Promise<void>;
  prefill: OfferPrefill;
}) {
  const [floors, setFloors] = useState(String(prefill.floors ?? 3));
  const [apartments, setApartments] = useState(String(prefill.apartments ?? 11));
  const [residents, setResidents] = useState(
    String(Math.max(1, (prefill.apartments ?? 11) * 2))
  );
  const [visitsPerWeek, setVisitsPerWeek] = useState("2");
  const [hoursPerVisit, setHoursPerVisit] = useState(
    String(defaultHoursForFloors(prefill.floors ?? 3))
  );
  const [priceLei, setPriceLei] = useState(
    String(
      Math.round(
        (prefill.quotedPriceBani ?? suggestOpeningPrice(prefill.floors ?? 3, 2)) / 100
      )
    )
  );

  const n = (s: string, fallback = 0) => {
    const v = Number(s);
    return Number.isFinite(v) ? v : fallback;
  };

  const pricing = useMemo(
    () =>
      priceOffer({
        floors: Math.max(1, n(floors, 3)),
        apartments: Math.max(1, n(apartments, 11)),
        residents: Math.max(1, n(residents, 24)),
        visitsPerWeek: Math.max(1, n(visitsPerWeek, 2)),
        hoursPerVisit: Math.max(0.25, n(hoursPerVisit, 1.5)),
        priceBani: Math.round(n(priceLei) * 100),
      }),
    [floors, apartments, residents, visitsPerWeek, hoursPerVisit, priceLei]
  );

  const warnTone: Record<string, string> = {
    below_cost: "bg-danger-wash text-danger",
    thin_margin: "bg-warn-wash text-warn",
    fragile_vs_market: "bg-warn-wash text-warn",
  };

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="prospectId" value={prefill.prospectId ?? ""} />

      <div className="space-y-3 rounded-xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">Who it&apos;s for</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Client name"
            name="clientName"
            defaultValue={prefill.clientName ?? ""}
          />
          <TextField
            label="Building label"
            name="buildingLabel"
            defaultValue={prefill.buildingLabel ?? ""}
          />
        </div>
        <TextField label="Address" name="address" defaultValue={prefill.address ?? ""} />

        <h2 className="pt-2 text-sm font-semibold">The building</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Floors"
            name="floors"
            type="number"
            value={floors}
            onChange={(v) => {
              setFloors(v);
              setHoursPerVisit(String(defaultHoursForFloors(Math.max(1, Number(v) || 3))));
            }}
          />
          <Field
            label="Apartments"
            name="apartments"
            type="number"
            value={apartments}
            onChange={setApartments}
          />
          <Field
            label="Residents"
            name="residents"
            type="number"
            value={residents}
            onChange={setResidents}
          />
          <Field
            label="Visits per week"
            name="visitsPerWeek"
            type="number"
            value={visitsPerWeek}
            onChange={setVisitsPerWeek}
          />
          <Field
            label="Hours per visit"
            name="hoursPerVisit"
            type="number"
            step="0.25"
            value={hoursPerVisit}
            onChange={setHoursPerVisit}
            hint={`${pricing.hoursPerMonth.toFixed(1)} h/month`}
          />
          <TextField label="Offer valid (days)" name="validDays" type="number" defaultValue={30} />
        </div>

        <h2 className="pt-2 text-sm font-semibold">Compliance sections (add-on)</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="withCompliance" defaultChecked className="h-4 w-4 accent-[#1F4A37]" />
          <span className="text-ink-soft">
            Include the building&apos;s legal obligations, the statutory exposure sum and the
            honest boundaries section
          </span>
        </label>
        <div className="grid gap-1.5 pl-6 sm:grid-cols-2">
          {(
            [
              ["hasGas", "Gas installation"],
              ["hasLift", "Lift"],
              ["hasBasement", "Basement"],
              ["hasPlayground", "Playground"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={name} className="h-4 w-4 accent-[#1F4A37]" />
              <span className="text-ink-soft">{label}</span>
            </label>
          ))}
        </div>
        <div className="grid gap-1.5 pl-6 sm:grid-cols-2">
          {(
            [
              ["tur_control", "Control walk + monthly report (200 lei/mo)"],
              ["calendar_conformitate", "Compliance calendar (300 lei/mo)"],
              ["raport_anual", "Annual monitoring report (1.500 lei/report)"],
              ["serviciu_iarna", "Winter service (1.800 lei/season)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="extraService"
                value={key}
                defaultChecked={key === "tur_control" || key === "calendar_conformitate"}
                className="h-4 w-4 accent-[#1F4A37]"
              />
              <span className="text-ink-soft">{label}</span>
            </label>
          ))}
        </div>

        <h2 className="pt-2 text-sm font-semibold">The price</h2>
        <Field
          label="Price per month (lei)"
          name="priceLei"
          type="number"
          value={priceLei}
          onChange={setPriceLei}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setPriceLei(
                String(
                  Math.round(
                    suggestOpeningPrice(
                      Math.max(1, n(floors, 3)),
                      Math.max(1, n(visitsPerWeek, 2))
                    ) / 100
                  )
                )
              )
            }
            className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-moss"
          >
            Use recommended
          </button>
          <button
            type="button"
            onClick={() => setPriceLei(String(Math.round(pricing.marketRateBani / 100)))}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-moss"
          >
            Match market rate
          </button>
        </div>

        <button className="mt-2 rounded-md bg-moss-deep px-4 py-2.5 text-sm font-medium text-paper">
          Generate ofertă PDF
        </button>
      </div>

      {/* Live pricing panel */}
      <aside className="space-y-3">
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold">What this price means</h2>
          <dl className="tnum mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Your direct cost</dt>
              <dd>{fmtLei(pricing.costFloorBani)} lei</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Recommended floor</dt>
              <dd>{fmtLeiRound(pricing.recommendedMinBani)} lei</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Market rate, like for like</dt>
              <dd>{fmtLeiRound(pricing.marketRateBani)} lei</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Fântânii contract</dt>
              <dd>{fmtLeiRound(pricing.currentContractBani)} lei</dd>
            </div>
            <div className="mt-1 flex justify-between gap-3 border-t border-line pt-1.5">
              <dt className="text-ink-faint">Margin</dt>
              <dd className={pricing.marginBani < 0 ? "text-danger" : "font-medium"}>
                {fmtLei(pricing.marginBani)} lei ({Math.round(pricing.marginPct * 100)}%)
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Multiple of market</dt>
              <dd>{pricing.multipleOfMarket.toFixed(1)}×</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold">What they will feel</h2>
          <dl className="tnum mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Per apartment</dt>
              <dd>{fmtLei(pricing.perApartmentBani)} lei</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Per resident</dt>
              <dd>{fmtLei(pricing.perPersonBani)} lei</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">
            The per-resident number is the one that wins or loses the meeting.
          </p>
        </div>

        {pricing.warnings.map((w) => (
          <p
            key={w.kind}
            className={`rounded-xl px-4 py-3 text-xs leading-relaxed ${warnTone[w.kind]}`}
          >
            {w.message}
          </p>
        ))}

        {pricing.ladderBelowCost && (
          <p className="rounded-xl bg-paper px-4 py-3 text-xs leading-relaxed text-ink-soft">
            A published competitor list price for {n(floors, 3)} floors is about{" "}
            {fmtLeiRound(pricing.competitorLadderBani)} lei, which is under your direct cost
            of {fmtLei(pricing.costFloorBani)} lei. Nobody serves this building twice a week
            on declared wages at that price. Say that out loud in the meeting: it is the
            argument for your price.
          </p>
        )}
      </aside>
    </form>
  );
}
