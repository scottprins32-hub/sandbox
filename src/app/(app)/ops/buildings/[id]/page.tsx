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
import {
  attachServiceAction,
  detachServiceAction,
  seedBuildingObligationsAction,
  seedCheckpointsAction,
  updateBuildingAction,
} from "../../actions";
import { listCheckpoints } from "@/server/repo/walks";
import { BuildingForm } from "../BuildingForm";
import { exposureFor } from "@/server/complianceService";
import { ExposureWidget } from "@/components/ops/ExposureWidget";
import { listBuildingServices, listServiceLines } from "@/server/repo/services";
import { UNIT_LABEL_RO, type ServiceUnit } from "@/lib/compliance/services";
import { listBuildingObligations, listObligationDocuments } from "@/server/repo/compliance";
import { OBLIGATION_BY_KEY } from "@/lib/compliance";

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

  const [exposure, serviceLines, attached, obligationRows, certificates, checkpoints] =
    await Promise.all([
      exposureFor(org.id, building.id),
      listServiceLines(org.id),
      listBuildingServices(org.id, building.id),
      listBuildingObligations(org.id, building.id),
      listObligationDocuments(org.id, building.id),
      listCheckpoints(org.id, building.id),
    ]);
  const lineById = new Map(serviceLines.map((l) => [l.id, l]));
  const activeServices = attached.filter((s) => s.active);
  const monthlyTotal = activeServices.reduce((sum, s) => {
    const line = lineById.get(s.serviceLineId);
    if (!line) return sum;
    if (line.unit === "per_building_month") return sum + s.priceBani;
    if (line.unit === "per_apartment_month") return sum + s.priceBani * building.apartments;
    return sum; // per-job lines are not part of the recurring monthly total
  }, 0);

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

      {/* Compliance (add-on §4) */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold">Services</h2>
          {activeServices.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">
              Only the core cleaning price is set. Attach service lines to build a defensible
              monthly total.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {activeServices.map((s) => {
                const line = lineById.get(s.serviceLineId);
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{line?.nameRo ?? "Serviciu"}</p>
                      <p className="text-xs text-ink-faint">
                        {UNIT_LABEL_RO[(line?.unit ?? "per_building_month") as ServiceUnit]}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="tnum text-sm">{fmtLeiRound(s.priceBani)} lei</span>
                      <form action={detachServiceAction.bind(null, building.id, s.id)}>
                        <button className="rounded-md border border-line px-2 py-0.5 text-xs text-ink-faint">
                          scoate
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
              <li className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm font-medium">Recurring monthly total</span>
                <span className="tnum text-sm font-semibold">
                  {fmtLeiRound(monthlyTotal)} lei
                </span>
              </li>
            </ul>
          )}

          <form
            action={attachServiceAction.bind(null, building.id)}
            className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3"
          >
            <label className="text-xs">
              <span className="block text-ink-faint">Add service</span>
              <select
                name="serviceLineId"
                className="mt-0.5 max-w-56 rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
              >
                {serviceLines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nameRo} ({fmtLeiRound(l.defaultPriceBani)} lei)
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="block text-ink-faint">Price (lei)</span>
              <input
                name="priceLei"
                type="number"
                defaultValue={200}
                className="mt-0.5 w-24 rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
              />
            </label>
            <button className="rounded-md bg-moss-deep px-3 py-1.5 text-sm font-medium text-paper">
              Attach
            </button>
          </form>
        </div>

        <div className="space-y-2">
          <ExposureWidget summary={exposure} buildingId={building.id} />
          {obligationRows.length === 0 && (
            <form action={seedBuildingObligationsAction.bind(null, building.id)}>
              <button className="w-full rounded-xl border border-dashed border-line-strong bg-surface px-3 py-2.5 text-xs text-ink-soft hover:border-moss">
                Load the legal obligations for this building
              </button>
            </form>
          )}
          <Link
            href={`/ops/buildings/${building.id}/record`}
            className="block rounded-xl border border-line bg-surface px-3 py-2.5 text-center text-xs text-ink-soft hover:border-moss"
          >
            Building record · Cartea Tehnică
          </Link>
          <div className="rounded-xl border border-line bg-surface p-3">
            <p className="micro">For the notice board</p>
            <a
              href={`/ops/buildings/${building.id}/schedule`}
              target="_blank"
              className="mt-1.5 block text-xs text-moss underline"
            >
              Programul de întreținere (A4)
            </a>
            <a
              href={`/ops/buildings/${building.id}/visit-cards?weeks=2`}
              target="_blank"
              className="mt-1 block text-xs text-moss underline"
            >
              Fișe de vizită, 2 weeks (4-up A4)
            </a>
          </div>
          {checkpoints.length === 0 ? (
            <form action={seedCheckpointsAction.bind(null, building.id)}>
              <button className="w-full rounded-xl border border-dashed border-line-strong bg-surface px-3 py-2.5 text-xs text-ink-soft hover:border-moss">
                Load the standard control-walk checkpoints
              </button>
            </form>
          ) : (
            <Link
              href={`/ops/buildings/${building.id}/checkpoints/print`}
              className="block rounded-xl border border-line bg-surface px-3 py-2.5 text-center text-xs text-ink-soft hover:border-moss"
            >
              Print the checkpoint QR sheet ({checkpoints.length})
            </Link>
          )}
        </div>
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

      {certificates.length > 0 && (
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold">Compliance documents</h2>
          <ul className="mt-2 divide-y divide-line">
            {certificates.map(({ event, obligationKey }) => (
              <li key={event.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {OBLIGATION_BY_KEY[obligationKey]?.nameRo ?? obligationKey}
                  </p>
                  <p className="tnum text-xs text-ink-faint">{event.occurredAt}</p>
                </div>
                <a
                  href={getStorage().url(event.documentFileKey!)}
                  className="shrink-0 text-xs text-moss underline"
                >
                  Document
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

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
