import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalCleaner } from "@/server/portalAuth";
import { getCurrentOrg } from "@/server/org";
import { getCheckpointByCode } from "@/server/repo/walks";
import { listVisitsForCleanerOnDate } from "@/server/repo/visits";
import { todayYmd } from "@/lib/dates";
import { ro } from "@/lib/i18n/ro";

// The printed QR lands here: resolve the checkpoint code to today's visit for
// that building and drop the cleaner into the walk with the point focused.
// A QR must never dead-end — if there is no job today, say so plainly.

export const metadata: Metadata = { title: "Tur de control · Scara" };
export const dynamic = "force-dynamic";

export default async function WalkDeepLink({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const cleaner = await getPortalCleaner();
  if (!cleaner) redirect("/portal");
  if (!c) redirect("/portal");

  const org = await getCurrentOrg();
  const checkpoint = await getCheckpointByCode(org.id, c);
  if (checkpoint) {
    const visits = await listVisitsForCleanerOnDate(org.id, cleaner.id, todayYmd());
    const visit = visits.find(
      (v) => v.buildingId === checkpoint.buildingId && v.status !== "missed"
    );
    if (visit) redirect(`/portal/v/${visit.id}/tur?c=${encodeURIComponent(c)}`);
  }

  return (
    <div className="py-8 text-center">
      <p className="text-base text-ink-soft">{ro.portal.walk.noVisitToday}</p>
      <Link
        href="/portal"
        className="mt-4 inline-block rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper"
      >
        {ro.portal.nav.today}
      </Link>
    </div>
  );
}
