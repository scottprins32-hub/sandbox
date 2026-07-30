import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentOrg } from "@/server/org";
import { payrollForMonth } from "@/server/payrollService";
import { WORKER_MODEL_LABELS, type WorkerModel } from "@/lib/finance";
import { currentMonthKey } from "@/lib/dates";
import { fmtLei } from "@/lib/money";

export const metadata: Metadata = { title: "Payroll · Scara" };
export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(rawMonth ?? "") ? rawMonth! : currentMonthKey();
  const org = await getCurrentOrg();
  const rows = await payrollForMonth(org.id, month);

  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Payroll</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/ops/payroll?month=${prev}`} className="rounded-md border border-line px-2 py-1 text-ink-soft">
            ←
          </Link>
          <span className="tnum font-medium">{month}</span>
          <Link href={`/ops/payroll?month=${next}`} className="rounded-md border border-line px-2 py-1 text-ink-soft">
            →
          </Link>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-faint">
              <th className="px-4 py-2.5 font-medium">Cleaner</th>
              <th className="px-4 py-2.5 font-medium">Model</th>
              <th className="px-4 py-2.5 text-right font-medium">Visits</th>
              <th className="px-4 py-2.5 text-right font-medium">Hours</th>
              <th className="px-4 py-2.5 text-right font-medium">Employer cost</th>
              <th className="px-4 py-2.5 text-right font-medium">Net (est.)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cleanerId} className="border-b border-line last:border-b-0">
                <td className="px-4 py-2.5 font-medium">{r.name}</td>
                <td className="px-4 py-2.5 text-ink-soft">
                  {WORKER_MODEL_LABELS[r.workerModel as WorkerModel] ?? r.workerModel} ·{" "}
                  {r.hoursPerDay}h/day
                </td>
                <td className="tnum px-4 py-2.5 text-right">{r.visitsDone}</td>
                <td className="tnum px-4 py-2.5 text-right">{r.hours}</td>
                <td className="tnum px-4 py-2.5 text-right">{fmtLei(r.employerCostBani)} lei</td>
                <td className="tnum px-4 py-2.5 text-right">{fmtLei(r.netEstimateBani)} lei</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-ink-faint">
          Modeled monthly cost per contract; the accountant owns the real payroll run.
        </p>
        <a
          href={`/ops/payroll/export?month=${month}`}
          className="rounded-md bg-moss-deep px-3 py-1.5 text-sm font-medium text-paper"
        >
          Download CSV
        </a>
      </div>
    </div>
  );
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
