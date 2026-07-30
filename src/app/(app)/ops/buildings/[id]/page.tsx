import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentOrg } from "@/server/org";
import { getBuilding } from "@/server/repo/buildings";
import { listVisitsForBuilding, listPhotosForVisits } from "@/server/repo/visits";
import { listIssuesForBuilding } from "@/server/repo/issues";
import { listProtocolsForBuilding } from "@/server/repo/protocols";
import { getStorage } from "@/server/storage";
import { buildingUnitEconomics } from "@/lib/finance";
import { fmtLei, fmtLeiRound } from "@/lib/money";
import { StatusChip } from "@/components/ops/StatusChip";
import { updateBuildingAction } from "../../actions";
import { BuildingForm } from "../BuildingForm";

export const metadata: Metadata = { title: "Building · Scara" };
export const dynamic = "force-dynamic";

export default async function BuildingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getCurrentOrg();
  const building = await getBuilding(org.id, id);
  if (!building) notFound();

  const [visits, issues, protocols] = await Promise.all([
    listVisitsForBuilding(org.id, id, 10),
    listIssuesForBuilding(org.id, id),
    listProtocolsForBuilding(org.id, id),
  ]);
  const photos = await listPhotosForVisits(
    org.id,
    visits.map((v) => v.id)
  );
  const storage = getStorage();
  const photosByVisit = new Map<string, string[]>();
  for (const p of photos) {
    if (!photosByVisit.has(p.visitId)) photosByVisit.set(p.visitId, []);
    photosByVisit.get(p.visitId)!.push(storage.url(p.fileKey));
  }

  const ue = buildingUnitEconomics({
    priceBani: building.priceBani,
    hoursPerVisit: building.hoursPerVisit,
    visitsPerWeek: building.visitsPerWeek,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">{building.label}</h1>
        <StatusChip status={building.status} />
      </div>

      <div className="rounded-xl bg-surface p-4 shadow-card">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-faint">Address</dt>
            <dd>{building.address || "…"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">Locality</dt>
            <dd>{building.locality}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">Schedule</dt>
            <dd>
              {building.visitsPerWeek}×/week · {building.hoursPerVisit}h
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">Price</dt>
            <dd className="tnum">{fmtLeiRound(building.priceBani)} lei/month</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">Modeled margin</dt>
            <dd className="tnum">
              {fmtLei(ue.marginBani)} lei ({Math.round(ue.marginPct * 100)}%)
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">Size</dt>
            <dd>
              {building.floors} floors · {building.apartments} apts · {building.residents}{" "}
              residents
            </dd>
          </div>
        </dl>
        {building.notes && <p className="mt-2 text-sm text-ink-soft">{building.notes}</p>}
      </div>

      <div className="rounded-xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">Last visits</h2>
        {visits.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No visits yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {visits.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/ops/visits/${v.id}`}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="tnum text-sm">{v.scheduledDate}</span>
                    <span className="text-xs text-ink-faint">
                      {v.window === "am" ? "morning" : "afternoon"}
                    </span>
                    <span className="flex gap-1">
                      {(photosByVisit.get(v.id) ?? []).slice(0, 3).map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="h-7 w-9 rounded object-cover"
                          loading="lazy"
                        />
                      ))}
                    </span>
                  </div>
                  <StatusChip status={v.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">Issues</h2>
        {issues.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No issues recorded.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {issues.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                <p className="min-w-0 truncate text-sm">{i.description}</p>
                <StatusChip status={i.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">Protocol history</h2>
        {protocols.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            None yet. Generate one from the Protocols screen.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {protocols.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="tnum text-sm">{p.month}</span>
                <span className="flex items-center gap-2">
                  {p.signed ? (
                    <span className="rounded-full bg-moss-wash px-2 py-0.5 text-xs text-moss-deep">
                      signed
                    </span>
                  ) : (
                    <span className="rounded-full bg-warn-wash px-2 py-0.5 text-xs text-warn">
                      unsigned
                    </span>
                  )}
                  <a
                    href={getStorage().url(p.pdfFileKey)}
                    className="text-xs text-moss underline"
                  >
                    PDF
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <details className="rounded-xl bg-surface p-4 shadow-card">
        <summary className="cursor-pointer text-sm font-semibold">Edit building</summary>
        <div className="mt-3">
          <BuildingForm
            action={updateBuildingAction.bind(null, building.id)}
            building={building}
            submitLabel="Save changes"
          />
        </div>
      </details>
    </div>
  );
}
