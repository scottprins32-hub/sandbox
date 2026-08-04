import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentOrg } from "@/server/org";
import { listBuildings } from "@/server/repo/buildings";
import { listBuildingObligations, listContractors } from "@/server/repo/compliance";
import { decorate, exposureFor } from "@/server/complianceService";
import {
  CATEGORY_LABEL_RO,
  PERFORMER_LABEL_RO,
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

export const metadata: Metadata = { title: "Conformitate · Scara" };
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<ObligationStatus, { tone: string; label: string }> = {
  overdue: { tone: "bg-danger-wash text-danger", label: "restant" },
  due_soon: { tone: "bg-warn-wash text-warn", label: "scadent curând" },
  ok: { tone: "bg-moss-wash text-moss-deep", label: "în regulă" },
  unknown: { tone: "bg-paper text-ink-soft border border-line", label: "neînregistrat" },
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
        <h1 className="text-lg font-semibold tracking-tight">Calendar de conformitate</h1>
        <Link href="/ops/contractors" className="text-sm text-moss underline">
          Furnizori
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
              toate imobilele
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
              toate stările
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
                {STATUS_STYLE[s].label}
              </Link>
            ))}
          </div>
        </div>
        <ExposureWidget summary={summary} buildingId={buildingId} />
      </div>

      {records.length === 0 && (
        <div className="mt-4 rounded-xl bg-surface p-6 text-center shadow-card">
          <p className="text-sm text-ink-soft">
            Niciun imobil nu are încă obligații încărcate. Alege un imobil și încarcă
            obligațiile din catalog, în funcție de dotările lui.
          </p>
          {buildingId && (
            <form
              action={seedBuildingObligationsAction.bind(null, buildingId)}
              className="mt-3"
            >
              <button className="rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper">
                Încarcă obligațiile pentru {buildingById.get(buildingId)?.label}
              </button>
            </form>
          )}
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {rows.map(({ record, obligation, status, nextDue }) => {
          const st = STATUS_STYLE[status];
          const contractor = contractors.find((c) => c.id === record.contractorId);
          const canWeDoIt = obligation.performerRequirement === "us";
          return (
            <li key={record.id} className="rounded-xl bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-medium leading-snug">{obligation.nameRo}</h2>
                  <p className="text-xs text-ink-faint">
                    {buildingById.get(record.buildingId)?.label} ·{" "}
                    {CATEGORY_LABEL_RO[obligation.category]}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.tone}`}
                >
                  {st.label}
                </span>
              </div>

              <dl className="tnum mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Scadent</dt>
                  <dd>{nextDue ?? "permanent"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Ultima dată</dt>
                  <dd>{record.lastDoneAt ?? "neînregistrat"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Sancțiune maximă</dt>
                  <dd>
                    {obligation.fineMaxBani
                      ? `${fmtLeiRound(obligation.fineMaxBani)} lei`
                      : "nespecificat"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Executant</dt>
                  <dd className="text-right">
                    {PERFORMER_LABEL_RO[obligation.performerRequirement]}
                  </dd>
                </div>
              </dl>

              {contractor && (
                <p className="mt-1.5 text-xs text-ink-soft">Furnizor: {contractor.name}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {canWeDoIt ? (
                  <form action={markObligationDoneAction.bind(null, record.id)}>
                    <button className="rounded-md bg-moss-deep px-3 py-1.5 text-xs font-medium text-paper">
                      Marchează efectuat
                    </button>
                  </form>
                ) : (
                  <form action={markObligationDoneAction.bind(null, record.id)}>
                    <input type="hidden" name="performedBy" value="contractor" />
                    <button className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft">
                      Consemnează execuția furnizorului
                    </button>
                  </form>
                )}
                <details className="inline-block">
                  <summary className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft">
                    Programează
                  </summary>
                  <form
                    action={scheduleObligationAction.bind(null, record.id)}
                    className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-line p-2"
                  >
                    <label className="text-xs">
                      <span className="block text-ink-faint">Data</span>
                      <input
                        type="date"
                        name="date"
                        required
                        className="mt-0.5 rounded-md border border-line bg-surface px-2 py-1"
                      />
                    </label>
                    <label className="text-xs">
                      <span className="block text-ink-faint">Furnizor</span>
                      <select
                        name="contractorId"
                        className="mt-0.5 rounded-md border border-line bg-surface px-2 py-1"
                      >
                        <option value="">fără</option>
                        {contractors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="rounded-md bg-moss-deep px-3 py-1.5 text-xs font-medium text-paper">
                      Salvează
                    </button>
                  </form>
                </details>
                <details className="inline-block">
                  <summary className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft">
                    Încarcă document
                  </summary>
                  <form
                    action={uploadObligationDocumentAction.bind(null, record.id)}
                    className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-line p-2"
                  >
                    <label className="text-xs">
                      <span className="block text-ink-faint">
                        Certificat sau proces-verbal (PDF sau foto)
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
                      Atașează
                    </button>
                  </form>
                </details>
              </div>

              {!canWeDoIt && (
                <p className="mt-2 text-xs leading-relaxed text-warn">
                  Nu poate fi executată de personalul nostru. O programăm, o însoțim și
                  arhivăm documentul.
                </p>
              )}
              <p className="mt-2 border-t border-line pt-2 text-xs text-ink-faint">
                {obligation.legalBasis.join(" · ")}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        Datele legale sunt citate cu titlu de referință. Poziția juridică se confirmă cu un
        avocat sau cu contabilul asociației.
      </p>
    </div>
  );
}
