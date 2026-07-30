import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalCleaner } from "@/server/portalAuth";
import { ro } from "@/lib/i18n/ro";

export const metadata: Metadata = { title: "Contractul meu · Scara" };
export const dynamic = "force-dynamic";

// Contractul meu (§8): static info card in plain Romanian; for students, the
// adeverință reminder when expiry approaches.
export default async function PortalContract() {
  const cleaner = await getPortalCleaner();
  if (!cleaner) redirect("/portal");

  const contractLabel =
    ro.portal.contract.types[cleaner.workerModel as keyof typeof ro.portal.contract.types] ??
    cleaner.workerModel;

  const soon = new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const showStudentReminder =
    cleaner.workerModel === "parttime_student" &&
    cleaner.studentProofExpiry !== null &&
    cleaner.studentProofExpiry <= soon;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{ro.portal.contract.title}</h1>

      <div className="mt-4 rounded-xl bg-surface p-4 shadow-card">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-faint">{ro.portal.contract.type}</dt>
            <dd className="font-medium">{contractLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-faint">{ro.portal.contract.hoursPerDay}</dt>
            <dd className="tnum font-medium">
              {String(cleaner.hoursPerDay).replace(".", ",")} h
            </dd>
          </div>
        </dl>
      </div>

      {showStudentReminder && (
        <p className="mt-3 rounded-xl bg-warn-wash p-4 text-sm font-medium leading-relaxed text-warn">
          {ro.portal.contract.studentReminder.replace("{date}", cleaner.studentProofExpiry!)}
        </p>
      )}
    </div>
  );
}
