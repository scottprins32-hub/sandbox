import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentOrg } from "@/server/org";
import { getBuilding } from "@/server/repo/buildings";
import {
  listAnnualReports,
  listAssessments,
  listElements,
  listJournal,
} from "@/server/repo/record";
import { listObligationDocuments } from "@/server/repo/compliance";
import { listProtocolsForBuilding } from "@/server/repo/protocols";
import { listOpenFindings } from "@/server/repo/walks";
import {
  defaultElementFor,
  draftRecommendations,
  elementStatuses,
} from "@/server/recordService";
import {
  ELEMENT_BY_KEY,
  SCORE_SCALE,
  TREND_LABEL_EN,
} from "@/lib/compliance/elements";
import { OBLIGATION_BY_KEY } from "@/lib/compliance";
import { getStorage } from "@/server/storage";
import {
  addJournalEntryAction,
  generateAnnualReportAction,
  promoteFindingAction,
  seedElementsAction,
} from "../../../actions";

export const metadata: Metadata = { title: "Building record · Scara" };
export const dynamic = "force-dynamic";

// Journal kinds: English in the admin, Romanian in the annual report.
const KIND_LABEL: Record<string, string> = {
  observatie: "observation",
  interventie: "intervention",
  modificare: "alteration",
  eveniment: "event",
  document: "document",
};

/** Elements are seeded from our own catalogue, so an English name exists. */
function elementNameEn(e: { key: string; nameRo: string }): string {
  return ELEMENT_BY_KEY[e.key]?.nameEn ?? e.nameRo;
}

export default async function BuildingRecord({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getCurrentOrg();
  const building = await getBuilding(org.id, id);
  if (!building) notFound();

  const [elements, journal, annuals, certificates, protocols, openFindings] =
    await Promise.all([
      listElements(org.id, id),
      listJournal(org.id, id),
      listAnnualReports(org.id, id),
      listObligationDocuments(org.id, id),
      listProtocolsForBuilding(org.id, id),
      listOpenFindings(org.id),
    ]);
  const assessments = await listAssessments(org.id, elements.map((e) => e.id));
  const statuses = elementStatuses(elements, assessments);
  const buildingFindings = openFindings.filter((f) => f.buildingId === id);
  const scored = statuses.filter((s) => s.latest !== null).length;
  const year = new Date().getFullYear();
  const recommendationsDraft = draftRecommendations(
    statuses,
    buildingFindings.map((f) => f.finding)
  ).join("\n");
  const storage = getStorage();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Link href={`/ops/buildings/${id}`} className="text-xs text-ink-faint">
            ← {building.label}
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">
            Building record · Cartea Tehnică
          </h1>
        </div>
        {elements.length > 0 && (
          <Link
            href={`/ops/buildings/${id}/record/assess?e=0`}
            className="rounded-md bg-moss-deep px-3 py-1.5 text-sm font-medium text-paper"
          >
            Annual assessment
          </Link>
        )}
      </div>

      {/* Element scores with trend */}
      <div className="rounded-xl bg-surface p-4 shadow-card">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Element condition</h2>
          <span className="tnum text-xs text-ink-faint">
            {scored} / {elements.length} scored
          </span>
        </div>
        {elements.length === 0 ? (
          <form action={seedElementsAction.bind(null, id)} className="mt-3">
            <button className="w-full rounded-xl border border-dashed border-line-strong bg-surface px-3 py-2.5 text-sm text-ink-soft hover:border-moss">
              Load the twelve standard elements
            </button>
          </form>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {statuses.map((s) => (
              <li key={s.element.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm">{elementNameEn(s.element)}</p>
                  {s.latest?.noteRo && (
                    <p className="truncate text-xs text-ink-faint">{s.latest.noteRo}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  {s.latest ? (
                    <>
                      <span
                        className={`tnum rounded-full px-2 py-0.5 font-medium ${
                          s.latest.score >= 5
                            ? "bg-danger-wash text-danger"
                            : s.latest.score === 4
                              ? "bg-warn-wash text-warn"
                              : "bg-moss-wash text-moss-deep"
                        }`}
                      >
                        {s.latest.score} · {s.scoreLabelEn}
                      </span>
                      <span
                        className={
                          s.trend === "declined"
                            ? "text-danger"
                            : s.trend === "improved"
                              ? "text-ok"
                              : "text-ink-faint"
                        }
                      >
                        {s.trend ? TREND_LABEL_EN[s.trend] : "not assessed"}
                      </span>
                    </>
                  ) : (
                    <span className="text-ink-faint">not assessed</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Promote open findings into the record */}
      {buildingFindings.length > 0 && elements.length > 0 && (
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold">Findings to promote into the record</h2>
          <p className="mt-1 text-xs text-ink-faint">
            An assessment and a journal entry are written together — this is what makes
            next year&apos;s report cheap.
          </p>
          <ul className="mt-2 divide-y divide-line">
            {buildingFindings.map(({ finding }) => {
              const suggested = defaultElementFor(finding.category, elements);
              return (
                <li key={finding.id} className="py-2.5">
                  <p className="text-sm">{finding.descriptionRo}</p>
                  <form
                    action={promoteFindingAction.bind(null, id, finding.id)}
                    className="mt-2 flex flex-wrap items-end gap-2"
                  >
                    <label className="text-xs">
                      <span className="block text-ink-faint">Element</span>
                      <select
                        name="elementId"
                        defaultValue={suggested?.id}
                        className="mt-0.5 max-w-52 rounded-md border border-line bg-surface px-2 py-1 text-xs"
                      >
                        {elements.map((e) => (
                          <option key={e.id} value={e.id}>
                            {elementNameEn(e)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs">
                      <span className="block text-ink-faint">Score</span>
                      <select
                        name="score"
                        defaultValue={4}
                        className="mt-0.5 rounded-md border border-line bg-surface px-2 py-1 text-xs"
                      >
                        {SCORE_SCALE.map((s) => (
                          <option key={s.score} value={s.score}>
                            {s.score} · {s.labelEn}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="rounded-md bg-moss-deep px-3 py-1.5 text-xs font-medium text-paper">
                      Promote
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Journal */}
      <div className="rounded-xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">
          Events journal <span className="font-normal text-ink-faint">· Jurnalul evenimentelor</span>
        </h2>
        {journal.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No entries yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {journal.map((j) => (
              <li key={j.id} className="py-2">
                <p className="text-sm">{j.descriptionRo}</p>
                <p className="tnum text-xs text-ink-faint">
                  {j.occurredAt} · {KIND_LABEL[j.kind] ?? j.kind}
                </p>
              </li>
            ))}
          </ul>
        )}
        <form
          action={addJournalEntryAction.bind(null, id)}
          className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3"
        >
          <label className="text-xs">
            <span className="block text-ink-faint">Date</span>
            <input
              type="date"
              name="date"
              className="mt-0.5 rounded-md border border-line bg-surface px-2 py-1 text-xs"
            />
          </label>
          <label className="text-xs">
            <span className="block text-ink-faint">Kind</span>
            <select
              name="kind"
              className="mt-0.5 rounded-md border border-line bg-surface px-2 py-1 text-xs"
            >
              {Object.entries(KIND_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="grow text-xs">
            <span className="block text-ink-faint">Description (Romanian)</span>
            <input
              name="description"
              required
              className="mt-0.5 w-full rounded-md border border-line bg-surface px-2 py-1 text-xs"
            />
          </label>
          <button className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-moss">
            Add entry
          </button>
        </form>
      </div>

      {/* Document shelf */}
      <div className="rounded-xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">Document shelf</h2>
        <ul className="mt-2 divide-y divide-line text-sm">
          {annuals.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                Raport anual {a.year}{" "}
                <span className="rounded-full bg-warn-wash px-2 py-0.5 text-xs font-medium text-warn">
                  PROIECT
                </span>
              </span>
              <a href={storage.url(a.pdfFileKey)} className="text-xs text-moss underline">
                PDF
              </a>
            </li>
          ))}
          {protocols.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
              <span>Raport lunar · {p.month}</span>
              <a href={storage.url(p.pdfFileKey)} className="text-xs text-moss underline">
                PDF
              </a>
            </li>
          ))}
          {certificates.map(({ event, obligationKey }) => (
            <li key={event.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate">
                {OBLIGATION_BY_KEY[obligationKey]?.nameEn ?? obligationKey} ·{" "}
                {event.occurredAt}
              </span>
              <a
                href={storage.url(event.documentFileKey!)}
                className="shrink-0 text-xs text-moss underline"
              >
                Document
              </a>
            </li>
          ))}
          {annuals.length === 0 && protocols.length === 0 && certificates.length === 0 && (
            <li className="py-2 text-ink-soft">Nothing filed yet.</li>
          )}
        </ul>
      </div>

      {/* Annual report generation */}
      {elements.length > 0 && (
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold">Generate the annual report (PROIECT)</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-faint">
            Generated as a draft: it requires the signature of the responsible person and
            says so on every page. Edit the recommendations before generating.
          </p>
          <form action={generateAnnualReportAction.bind(null, id)} className="mt-3 space-y-2">
            <label className="block text-xs">
              <span className="text-ink-faint">Year</span>
              <input
                type="number"
                name="year"
                defaultValue={year}
                className="tnum mt-0.5 w-24 rounded-md border border-line bg-surface px-2 py-1"
              />
            </label>
            <label className="block text-xs">
              <span className="text-ink-faint">Recommendations (one per line, editable)</span>
              <textarea
                name="recommendations"
                rows={5}
                defaultValue={recommendationsDraft}
                className="mt-0.5 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
              />
            </label>
            <button className="rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper">
              Generate PROIECT report
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
