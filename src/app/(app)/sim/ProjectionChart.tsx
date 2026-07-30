"use client";

// 24-month projection chart (§6.3): stacked cost+profit bars (their sum is
// revenue) with a profit trend line, one lei axis. Vertical markers where the
// cleaner count increments, a shaded zone where run-rate breaches the VAT
// threshold, a dotted line at the micro ceiling, and the €2,000 "worth it" line.
// Series colors validated (dataviz palette): cost #eb6834, profit #1baf7a.

import {
  Bar,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { addMonths, format } from "date-fns";
import type { MonthRow } from "@/lib/finance";
import { TAX } from "@/lib/constants";
import { fmtLeiRound } from "@/lib/money";

const COLORS = {
  cost: "#eb6834",
  profit: "#1baf7a",
  profitLine: "#0d7a52",
  grid: "#e3e1d8",
  ink: "#21201c",
  faint: "#8b887e",
  vatZone: "#a8443c",
};

interface ChartDatum {
  name: string;
  monthIndex: number;
  costLei: number;
  profitLei: number;
  revenueLei: number;
  buildings: number;
  cleaners: number;
  vatBreached: boolean;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartDatum }[];
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-card">
      <p className="font-medium">{d.name}</p>
      <table className="tnum mt-1">
        <tbody>
          <tr>
            <td className="pr-3 text-ink-soft">Buildings</td>
            <td className="text-right">{d.buildings}</td>
          </tr>
          <tr>
            <td className="pr-3 text-ink-soft">Revenue</td>
            <td className="text-right">{fmtLeiRound(d.revenueLei * 100)} lei</td>
          </tr>
          <tr>
            <td className="pr-3 text-ink-soft">Cost</td>
            <td className="text-right">{fmtLeiRound(d.costLei * 100)} lei</td>
          </tr>
          <tr>
            <td className="pr-3 text-ink-soft">Profit</td>
            <td className="text-right font-medium">{fmtLeiRound(d.profitLei * 100)} lei</td>
          </tr>
          <tr>
            <td className="pr-3 text-ink-soft">Cleaners</td>
            <td className="text-right">{d.cleaners}</td>
          </tr>
        </tbody>
      </table>
      {d.vatBreached && <p className="mt-1 text-danger">Past the VAT threshold</p>}
    </div>
  );
}

export function ProjectionChart({
  rows,
  worthItLineBani,
}: {
  rows: MonthRow[];
  worthItLineBani: number;
}) {
  const start = new Date();
  const data: ChartDatum[] = rows.map((r) => ({
    name: format(addMonths(start, r.monthIndex), "MMM yy"),
    monthIndex: r.monthIndex,
    costLei: Math.round(r.totalCostBani / 100),
    profitLei: Math.round(r.profitBani / 100),
    revenueLei: Math.round(r.revenueBani / 100),
    buildings: r.buildings,
    cleaners: r.cleanersNeeded,
    vatBreached: r.vatBreached,
  }));

  const cleanerSteps = rows
    .filter((r, i) => i > 0 && r.cleanersNeeded > rows[i - 1]!.cleanersNeeded)
    .map((r) => ({ month: r.monthIndex, cleaners: r.cleanersNeeded }));

  const firstBreach = rows.find((r) => r.vatBreached)?.monthIndex;
  const microMonthlyLei = Math.round(TAX.MICRO_CEILING_ANNUAL / 12 / 100);
  const worthItLei = Math.round(worthItLineBani / 100);

  return (
    <div className="h-80 w-full" role="img" aria-label="24-month revenue, cost and profit projection">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 24, right: 8, left: 4, bottom: 0 }} barGap={0}>
          <XAxis
            dataKey="name"
            interval={2}
            tick={{ fontSize: 11, fill: COLORS.faint }}
            axisLine={{ stroke: COLORS.grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: COLORS.faint }}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          {firstBreach !== undefined && data[firstBreach] && (
            <ReferenceArea
              x1={data[firstBreach].name}
              x2={data[data.length - 1]!.name}
              fill={COLORS.vatZone}
              fillOpacity={0.06}
              stroke="none"
              label={{
                value: "past VAT threshold",
                position: "insideTopRight",
                fontSize: 10,
                fill: COLORS.vatZone,
              }}
            />
          )}
          {cleanerSteps.map((s) => (
            <ReferenceLine
              key={s.month}
              x={data[s.month]!.name}
              stroke={COLORS.faint}
              strokeDasharray="2 3"
              label={{
                value: `${s.cleaners} cleaners`,
                position: "top",
                fontSize: 9,
                fill: COLORS.faint,
              }}
            />
          ))}
          <ReferenceLine
            y={microMonthlyLei}
            stroke={COLORS.faint}
            strokeDasharray="1 4"
            label={{
              value: "micro ceiling",
              position: "insideBottomRight",
              fontSize: 10,
              fill: COLORS.faint,
            }}
          />
          <ReferenceLine
            y={worthItLei}
            stroke={COLORS.ink}
            strokeDasharray="6 3"
            label={{
              value: "worth it (€2,000/mo)",
              position: "insideTopLeft",
              fontSize: 10,
              fill: COLORS.ink,
            }}
          />
          <Bar dataKey="costLei" name="Cost" stackId="rev" fill={COLORS.cost} radius={[0, 0, 0, 0]} />
          <Bar
            dataKey="profitLei"
            name="Profit"
            stackId="rev"
            fill={COLORS.profit}
            radius={[4, 4, 0, 0]}
          />
          <Line
            dataKey="profitLei"
            name="Profit trend"
            stroke={COLORS.profitLine}
            strokeWidth={2}
            dot={false}
            type="monotone"
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(33,32,28,0.04)" }} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value: string) => <span style={{ color: COLORS.ink }}>{value}</span>}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
