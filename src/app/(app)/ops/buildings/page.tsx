import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentOrg } from "@/server/org";
import { listBuildings } from "@/server/repo/buildings";
import { buildingUnitEconomics } from "@/lib/finance";
import { fmtLeiRound } from "@/lib/money";
import { StatusChip } from "@/components/ops/StatusChip";

export const metadata: Metadata = { title: "Buildings · Scara" };
export const dynamic = "force-dynamic";

export default async function BuildingsPage() {
  const org = await getCurrentOrg();
  const buildings = await listBuildings(org.id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Buildings</h1>
        <Link
          href="/ops/buildings/new"
          className="rounded-md bg-moss-deep px-3 py-1.5 text-sm font-medium text-paper"
        >
          Add building
        </Link>
      </div>

      {buildings.length === 0 ? (
        <div className="mt-4 rounded-xl bg-surface p-6 text-center shadow-card">
          <p className="text-sm text-ink-soft">
            No buildings yet. Add the first one, or run the seed for the demo world.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {buildings.map((b) => {
            const ue = buildingUnitEconomics({
              priceBani: b.priceBani,
              hoursPerVisit: b.hoursPerVisit,
              visitsPerWeek: b.visitsPerWeek,
            });
            const marginPct = Math.round(ue.marginPct * 100);
            const marginTone =
              marginPct >= 60
                ? "bg-moss-wash text-moss-deep"
                : marginPct >= 30
                  ? "bg-warn-wash text-warn"
                  : "bg-danger-wash text-danger";
            return (
              <li key={b.id}>
                <Link
                  href={`/ops/buildings/${b.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface p-4 shadow-card"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.label}</p>
                    <p className="text-xs text-ink-faint">
                      {b.locality} · {b.visitsPerWeek}×/week · {b.hoursPerVisit}h ·{" "}
                      {fmtLeiRound(b.priceBani)} lei/mo
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`tnum rounded-full px-2 py-0.5 text-xs font-medium ${marginTone}`}
                    >
                      {marginPct}% margin
                    </span>
                    {b.status !== "active" && <StatusChip status={b.status} />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
