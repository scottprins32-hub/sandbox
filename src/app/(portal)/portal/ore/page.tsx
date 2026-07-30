import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalCleaner } from "@/server/portalAuth";
import { getCurrentOrg } from "@/server/org";
import { payrollForMonth } from "@/server/payrollService";
import { currentMonthKey } from "@/lib/dates";
import { ro } from "@/lib/i18n/ro";

export const metadata: Metadata = { title: "Orele mele · Scara" };
export const dynamic = "force-dynamic";

// Orele mele (§8): the cleaner's month at a glance, with the honest disclaimer.
export default async function PortalHours() {
  const cleaner = await getPortalCleaner();
  if (!cleaner) redirect("/portal");

  const org = await getCurrentOrg();
  const month = currentMonthKey();
  const rows = await payrollForMonth(org.id, month);
  const mine = rows.find((r) => r.cleanerId === cleaner.id);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{ro.portal.hours.title}</h1>
      <p className="tnum text-sm text-ink-faint">{month}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface p-4 text-center shadow-card">
          <p className="text-xs text-ink-faint">{ro.portal.hours.visitsDone}</p>
          <p className="tnum mt-1 text-3xl font-semibold">{mine?.visitsDone ?? 0}</p>
        </div>
        <div className="rounded-xl bg-surface p-4 text-center shadow-card">
          <p className="text-xs text-ink-faint">{ro.portal.hours.hoursWorked}</p>
          <p className="tnum mt-1 text-3xl font-semibold">
            {String(mine?.hours ?? 0).replace(".", ",")}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-surface p-4 shadow-card">
        <p className="text-xs text-ink-faint">{ro.portal.hours.estimatedNet}</p>
        <p className="tnum mt-1 text-2xl font-semibold">
          {mine ? Math.round(mine.netEstimateBani / 100).toLocaleString("ro-RO") : 0} lei
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-faint">
          {ro.portal.hours.disclaimer}
        </p>
      </div>
    </div>
  );
}
