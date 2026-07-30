import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentOrg } from "@/server/org";
import { listBuildings } from "@/server/repo/buildings";
import { listVisitsInMonth, listPhotosForVisits } from "@/server/repo/visits";
import { listProtocolsForMonth } from "@/server/repo/protocols";
import { getStorage } from "@/server/storage";
import { currentMonthKey } from "@/lib/dates";
import { generateProtocolAction, markProtocolSignedAction } from "../actions";

export const metadata: Metadata = { title: "Protocols · Scara" };
export const dynamic = "force-dynamic";

// §7.2: month picker → per building: visits done vs scheduled, photo count,
// generate the proces-verbal PDF, download, mark signed.
export default async function ProtocolsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(rawMonth ?? "") ? rawMonth! : currentMonthKey();
  const org = await getCurrentOrg();

  const [buildings, monthVisits, protocols] = await Promise.all([
    listBuildings(org.id, { status: "active" }),
    listVisitsInMonth(org.id, month),
    listProtocolsForMonth(org.id, month),
  ]);
  const photos = await listPhotosForVisits(
    org.id,
    monthVisits.map((v) => v.id)
  );
  const protocolByBuilding = new Map(protocols.map((p) => [p.buildingId, p]));
  const storage = getStorage();

  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Protocols</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/ops/protocols?month=${prevMonth}`} className="rounded-md border border-line px-2 py-1 text-ink-soft">
            ←
          </Link>
          <span className="tnum font-medium">{month}</span>
          <Link href={`/ops/protocols?month=${nextMonth}`} className="rounded-md border border-line px-2 py-1 text-ink-soft">
            →
          </Link>
        </div>
      </div>

      {buildings.length === 0 && (
        <div className="mt-4 rounded-xl bg-surface p-6 text-center shadow-card">
          <p className="text-sm text-ink-soft">
            No active buildings yet, so nothing to protocol. Add a building first.
          </p>
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {buildings.map((b) => {
          const visits = monthVisits.filter(
            (v) => v.buildingId === b.id && v.type === "recurring"
          );
          const done = visits.filter((v) => v.status === "done").length;
          const visitIds = new Set(visits.map((v) => v.id));
          const photoCount = photos.filter((p) => visitIds.has(p.visitId)).length;
          const protocol = protocolByBuilding.get(b.id);
          return (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-4 shadow-card"
            >
              <div>
                <p className="font-medium">{b.label}</p>
                <p className="tnum text-xs text-ink-faint">
                  {done}/{visits.length} visits done · {photoCount} photos
                </p>
              </div>
              <div className="flex items-center gap-2">
                {protocol ? (
                  <>
                    <a
                      href={storage.url(protocol.pdfFileKey)}
                      className="rounded-md border border-line px-3 py-1.5 text-sm text-moss underline-offset-2"
                    >
                      Download PDF
                    </a>
                    {protocol.signed ? (
                      <span className="rounded-full bg-moss-wash px-2.5 py-1 text-xs font-medium text-moss-deep">
                        signed
                      </span>
                    ) : (
                      <form action={markProtocolSignedAction.bind(null, protocol.id)}>
                        <button className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft">
                          Mark signed
                        </button>
                      </form>
                    )}
                    <form action={generateProtocolAction.bind(null, b.id, month)}>
                      <button className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-faint">
                        Regenerate
                      </button>
                    </form>
                  </>
                ) : (
                  <form action={generateProtocolAction.bind(null, b.id, month)}>
                    <button className="rounded-md bg-moss-deep px-3 py-1.5 text-sm font-medium text-paper">
                      Generate PDF
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-ink-faint">
        The proces-verbal is generated in Romanian with the month&apos;s real counts; it is the
        documented-delivery proof this company sells.
      </p>
    </div>
  );
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
