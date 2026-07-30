import type { Metadata } from "next";
import Link from "next/link";
import { getPortalCleaner } from "@/server/portalAuth";
import { getCurrentOrg } from "@/server/org";
import { listVisitsForCleanerOnDate } from "@/server/repo/visits";
import { listBuildings } from "@/server/repo/buildings";
import { todayYmd } from "@/lib/dates";
import { ro } from "@/lib/i18n/ro";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Portal · Scara" };
export const dynamic = "force-dynamic";

// Ziua mea (§8): today's assigned visits as big tappable cards.
export default async function PortalToday() {
  const cleaner = await getPortalCleaner();
  if (!cleaner) return <LoginForm />;

  const org = await getCurrentOrg();
  const today = todayYmd();
  const [visits, buildings] = await Promise.all([
    listVisitsForCleanerOnDate(org.id, cleaner.id, today),
    listBuildings(org.id),
  ]);
  const buildingById = new Map(buildings.map((b) => [b.id, b]));
  const allDone = visits.length > 0 && visits.every((v) => v.status === "done" || v.status === "missed");

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{ro.portal.today.title}</h1>
      {visits.length === 0 && (
        <p className="mt-6 rounded-xl bg-surface p-5 text-center text-sm text-ink-soft shadow-card">
          {ro.portal.today.empty}
        </p>
      )}
      {allDone && (
        <p className="mt-4 rounded-xl bg-moss-wash p-4 text-center text-sm font-medium text-moss-deep">
          {ro.portal.today.allDone}
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {visits.map((v) => {
          const b = v.buildingId ? buildingById.get(v.buildingId) : null;
          const hours = b ? b.hoursPerVisit : 2;
          return (
            <li key={v.id}>
              <Link
                href={`/portal/v/${v.id}`}
                className="block rounded-xl bg-surface p-4 shadow-card active:bg-moss-wash"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-semibold">
                    {b?.label ?? v.locationLabel ?? "Job"}
                  </p>
                  <StatusRo status={v.status} />
                </div>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {v.window === "am" ? ro.portal.today.morning : ro.portal.today.afternoon} ·{" "}
                  {String(hours).replace(".", ",")} {ro.portal.today.hours}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusRo({ status }: { status: string }) {
  if (status === "done")
    return (
      <span className="rounded-full bg-moss-wash px-2.5 py-1 text-xs font-medium text-moss-deep">
        {ro.portal.today.done}
      </span>
    );
  if (status === "in_progress")
    return (
      <span className="rounded-full bg-warn-wash px-2.5 py-1 text-xs font-medium text-warn">
        {ro.portal.today.inProgress}
      </span>
    );
  return null;
}
