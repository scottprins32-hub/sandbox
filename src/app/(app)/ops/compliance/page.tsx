import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentOrg } from "@/server/org";
import { listBuildings } from "@/server/repo/buildings";
import { listBuildingObligations, listContractors } from "@/server/repo/compliance";
import { decorate, exposureFor } from "@/server/complianceService";
import {
  CATEGORY_LABEL_EN,
  PERFORMER_LABEL_EN,
  STATUS_LABEL_EN,
  type ObligationStatus,
} from "@/lib/compliance";
import { fmtLeiRound } from "@/lib/money";
import { ExposureWidget } from "@/components/ops/ExposureWidget";
import {
  markObligationDoneAction,
  scheduleObligationAction,
  seedBuildingObligationsAction,
  uploadObligationDocumentAction,
} from "../actions";

export const metadata: Metadata = { title: "Compliance · Scara" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<ObligationStatus, string> = {
  overdue: "bg-danger-wash text-danger",
  due_soon: "bg-warn-wash text-warn",
  ok: "bg-moss-wash text-moss-deep",
  unknown: "bg-paper text-ink-soft border border-line",
};

export default async function OpsCompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ building?: string; status?: string; cat?: string }>;
}) {
  const sp = await searchParams;
  const org = await getCurrentOrg();
  const buildings = await listBuildings(org.id);
  // The calendar is a per-building screen (add-on §4). Showing every building
  // at once is a 90-row wall, so default to the first and make "all" explicit.
  const buildingId =
    sp.building === "all"
      ? undefined
      : sp.building && buildings.some((b) => b.id === sp.building)
        ? sp.building
        : buildings[0]?.id;

  const [records, contractors, summary] = await Promise.all([
    listBuildingObligations(org.id, buildingId),
    listContractors(org.id),
    exposureFor(org.id, buildingId),
  ]);

  let rows = decorate(records);
  if (sp.status) rows = rows.filter((r) => r.status === sp.status);
  if (sp.cat) rows = rows.filter((r) => r.obligation.category === sp.cat);

  const buildingById = new Map(buildings.map((b) => [b.id, b]));
  const qs = (patch: Record<string, string | undefined>) => {
    const merged = { building: buildingId, status: sp.status, cat: sp.cat, ...patch };
    const s = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return s ? `/ops/compliance?${s}` : "/ops/compliance";
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Compliance calendar</h1>
        <Link href="/ops/contractors" className="text-sm text-moss underline">
          Contractors
        </Link>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-2">
          {/* Building filter */}
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={qs({ building: "all" })}
              className={`rounded-full px-2.5 py-1 text-xs ${
                !buildingId ? "bg-ink text-paper" : "border border-line bg-surface text-ink-soft"
              }`}
            >
              all buildings
            </Link>
            {buildings.map((b) => (
              <Link
                key={b.id}
                href={qs({ building: b.id })}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  buildingId === b.id
                    ? "bg-ink text-paper"
                    : "border border-line bg-surface text-ink-soft"
                }`}
              >
                {b.label}
              </Link>
            ))}
          </div>
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={qs({ status: undefined })}
              className={`rounded-full px-2.5 py-1 text-xs ${
                !sp.status ? "bg-ink text-paper" : "border border-line bg-surface text-ink-soft"
              }`}
            >
              all statuses
            </Link>
            {(["overdue", "due_soon", "unknown", "ok"] as ObligationStatus[]).map((s) => (
              <Link
                key={s}
                href={qs({ status: sp.status === s ? undefined : s })}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  sp.status === s
                    ? "bg-ink text-paper"
                    : "border border-line bg-surface text-ink-soft"
                }`}
              >
                {STATUS_LABEL_EN[s]}
              </Link>
            ))}
          </div>
        </div>
        <ExposureWidget summary={summary} buildingId={buildingId} />
      </div>

      {records.length === 0 && (
        <div className="mt-4 rounded-xl bg-surface p-6 text-center shadow-card">
          <p className="text-sm text-ink-soft">
            No building has its obligations loaded yet. Pick a building and load them from
            the catalogue, filtered by what that building has.
          </p>
          {buildingId && (
            <form
              action={seedBuildingObligationsAction.bind(null, buildingId)}
              className="mt-3"
            >
              <button className="rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper">
                Load the obligations for {buildingById.get(buildingId)?.label}
              </button>
            </form>
          )}
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {rows.map(({ record, obligation, status, nextDue }) => {
          const contractor = contractors.find((c) => c.id === record.contractorId);
          const canWeDoIt = obligation.performerRequirement === "us";
          const isContinuous =
            obligation.cadence.kind === "continuous" || obligation.cadence.kind === "event";
          return (
            <li key={record.id} className="rounded-xl bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-medium leading-snug">{obligation.nameEn}</h2>
                  <p className="text-xs text-ink-faint">
                    {buildingById.get(record.buildingId)?.label} ·{" "}
                    {CATEGORY_LABEL_EN[obligation.category]}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[status]}`}
                >
                  {STATUS_LABEL_EN[status]}
                </span>
              </div>

              <dl className="tnum mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Due</dt>
                  <dd>{nextDue ?? (isContinuous ? "ongoing" : "not scheduled")}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Last done</dt>
                  <dd>{record.lastDoneAt ?? "not recorded"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Maximum fine</dt>
                  <dd>
                    {obligation.fineMaxBani
                      ? `${fmtLeiRound(obligation.fineMaxBani)} lei`
                      : "unspecified"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Performed by</dt>
                  <dd className="text-right">
                    {PERFORMER_LABEL_EN[obligation.performerRequirement]}
                  </dd>
                </div>
              </dl>

              {contractor && (
                <p className="mt-1.5 text-xs text-ink-soft">Contractor: {contractor.name}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {canWeDoIt ? (
                  <form action={markObligationDoneAction.bind(null, record.id)}>
                    <button className="rounded-md bg-moss-deep px-3 py-1.5 text-xs font-medium text-paper">
                      Mark done
                    </button>
                  </form>
                ) : (
                  <form action={markObligationDoneAction.bind(null, record.id)}>
                    <input type="hidden" name="performedBy" value="contractor" />
                    <button className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft">
                      Record the contractor&apos;s work
                    </button>
                  </form>
                )}
                <details className="inline-block">
                  <summary className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft">
                    Schedule
                  </summary>
                  <form
                    action={scheduleObligationAction.bind(null, record.id)}
                    className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-line p-2"
                  >
                    <label className="text-xs">
                      <span className="block text-ink-faint">Date</span>
                      <input
                        type="date"
                        name="date"
                        required
                        className="mt-0.5 rounded-md border border-line bg-surface px-2 py-1"
                      />
                    </label>
                    <label className="text-xs">
                      <span className="block text-ink-faint">Contractor</span>
                      <select
                        name="contractorId"
                        className="mt-0.5 rounded-md border border-line bg-surface px-2 py-1"
                      >
                        <option value="">none</option>
                        {contractors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="rounded-md bg-moss-deep px-3 py-1.5 text-xs font-medium text-paper">
                      Save
                    </button>
                  </form>
                </details>
                <details className="inline-block">
                  <summary className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft">
                    Upload document
                  </summary>
                  <form
                    action={uploadObligationDocumentAction.bind(null, record.id)}
                    className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-line p-2"
                  >
                    <label className="text-xs">
                      <span className="block text-ink-faint">
                        Certificate or service record (PDF or photo)
                      </span>
                      <input
                        type="file"
                        name="file"
                        required
                        accept="application/pdf,image/jpeg,image/png"
                        className="mt-0.5 text-xs"
                      />
                    </label>
                    <button className="rounded-md bg-moss-deep px-3 py-1.5 text-xs font-medium text-paper">
                      Attach
                    </button>
                  </form>
                </details>
              </div>

              {!canWeDoIt && (
                <p className="mt-2 text-xs leading-relaxed text-warn">
                  Our staff may not perform this. We schedule it, escort it and file the
                  document.
                </p>
              )}
              {/* The Romanian legal name and the citations travel together:
                  both are what you quote to a contractor or an inspector. */}
              <p className="mt-2 border-t border-line pt-2 text-xs text-ink-faint">
                {obligation.nameRo} · {obligation.legalBasis.join(" · ")}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        Legal data is quoted for reference. Confirm the position for a specific building
        with a lawyer or with the association&apos;s accountant.
      </p>
    </div>
  );
}
