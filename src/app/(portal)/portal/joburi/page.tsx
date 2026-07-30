import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalCleaner } from "@/server/portalAuth";
import { getCurrentOrg } from "@/server/org";
import { listOpenOffers } from "@/server/repo/visits";
import { todayYmd } from "@/lib/dates";
import { ro } from "@/lib/i18n/ro";
import { ClaimButton } from "./ClaimButton";

export const metadata: Metadata = { title: "Joburi libere · Scara" };
export const dynamic = "force-dynamic";

// Joburi libere (§8): one-off jobs with a bonus; claim-with-approval, never
// auto-assignment (§9 DO-NOT-BUILD).
export default async function PortalJobs() {
  const cleaner = await getPortalCleaner();
  if (!cleaner) redirect("/portal");

  const org = await getCurrentOrg();
  const offers = await listOpenOffers(org.id, todayYmd());

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{ro.portal.jobs.title}</h1>
      {offers.length === 0 ? (
        <p className="mt-6 rounded-xl bg-surface p-5 text-center text-sm text-ink-soft shadow-card">
          {ro.portal.jobs.empty}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {offers.map((v) => (
            <li key={v.id} className="rounded-xl bg-surface p-4 shadow-card">
              <p className="text-base font-semibold leading-snug">
                {v.locationLabel ?? "Job curățenie"}
              </p>
              <p className="tnum mt-0.5 text-sm text-ink-soft">
                {v.scheduledDate} ·{" "}
                {v.window === "am" ? ro.portal.today.morning : ro.portal.today.afternoon}
                {v.priceBani ? ` · ${Math.round(v.priceBani / 100)} lei` : ""}
                {v.bonusBani
                  ? ` · ${ro.portal.jobs.bonus} +${Math.round(v.bonusBani / 100)} lei`
                  : ""}
              </p>
              {v.notes && <p className="mt-1 text-sm text-ink-soft">{v.notes}</p>}
              <div className="mt-3">
                <ClaimButton visitId={v.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
