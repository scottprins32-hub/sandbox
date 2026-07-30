// VAT headroom gauge — shared semantics between Simulator and Ops Money tab
// (§6, §7.2): green >20% headroom, amber <20%, red = breached. Status colors
// carry an explicit label, never color alone.

import { TAX } from "@/lib/constants";
import { vatGauge } from "@/lib/finance";
import { fmtLeiRound } from "@/lib/money";

const STATE_STYLES = {
  green: { bar: "bg-ok", text: "text-ok", label: "Safe" },
  amber: { bar: "bg-warn", text: "text-warn", label: "Close to the wall" },
  red: { bar: "bg-danger", text: "text-danger", label: "Threshold breached" },
} as const;

export function VatGauge({
  annualRunRateBani,
  maxBuildingsAtPrice,
}: {
  annualRunRateBani: number;
  /** floor(vatCeilingBuildings(price)) — for the always-visible sentence. */
  maxBuildingsAtPrice?: number;
}) {
  const g = vatGauge(annualRunRateBani);
  const s = STATE_STYLES[g.state];
  const pct = Math.min(1, g.used);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-ink-soft">VAT headroom</span>
        <span className={`text-sm font-medium ${s.text}`}>{s.label}</span>
      </div>
      <div
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(g.used * 100)}
        aria-label="Share of the annual VAT threshold used"
      >
        <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${pct * 100}%` }} />
      </div>
      <p className="tnum mt-1.5 text-xs text-ink-faint">
        Run rate {fmtLeiRound(annualRunRateBani)} of {fmtLeiRound(TAX.VAT_THRESHOLD_ANNUAL)} lei/yr
        ({Math.round(g.used * 100)}%)
        {g.state !== "red" && <> · headroom {fmtLeiRound(g.headroomBani)} lei</>}
      </p>
      {maxBuildingsAtPrice !== undefined && (
        <p className="mt-1 text-xs text-ink-soft">
          At this price you can run {maxBuildingsAtPrice} buildings before VAT.
        </p>
      )}
    </div>
  );
}
