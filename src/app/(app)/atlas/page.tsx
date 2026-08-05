import type { Metadata } from "next";
import { ATLAS_LAST_UPDATED, COMMUNES } from "./atlasData";
import { getCurrentOrg } from "@/server/org";
import { listProspects, type Prospect } from "@/server/repo/prospects";
import { listDocuments, type Doc } from "@/server/repo/documents";
import { listBuildings } from "@/server/repo/buildings";
import { getStorage } from "@/server/storage";
import { fmtLeiRound } from "@/lib/money";
import { TAX } from "@/lib/constants";
import {
  convertProspectAction,
  createProspectAction,
  setProspectStatusAction,
} from "../ops/actions";

export const metadata: Metadata = { title: "Atlas · Scara" };
export const dynamic = "force-dynamic";

// The field-capture statuses (add-on 2 §3.1). "de_vizitat" lives on the
// prospecting screen, not here — Atlas shows the pipeline after first contact.
const PIPELINE = [
  "vizitat",
  "contactat",
  "oferta_trimisa",
  "castigat",
  "pierdut",
] as const;
const PIPELINE_LABEL: Record<(typeof PIPELINE)[number], string> = {
  vizitat: "visited",
  contactat: "contacted",
  oferta_trimisa: "offer sent",
  castigat: "won",
  pierdut: "lost",
};

// Atlas (§6b): Cut 1 commune cards + Cut 2 field notebook and document shelf.
export default async function AtlasPage() {
  let prospects: Prospect[] = [];
  let documents: Doc[] = [];
  let recurringMonthlyBani = 0;
  let dbReady = true;
  try {
    const org = await getCurrentOrg();
    [prospects, documents] = await Promise.all([
      listProspects(org.id),
      listDocuments(org.id),
    ]);
    recurringMonthlyBani = (await listBuildings(org.id, { status: "active" })).reduce(
      (sum, b) => sum + b.priceBani,
      0
    );
  } catch {
    dbReady = false; // fresh clone before `npm run seed`: show Cut 1 only
  }

  const quotedBani = prospects
    .filter((p) => p.status === "oferta_trimisa")
    .reduce((sum, p) => sum + (p.quotedPriceBani ?? 0), 0);
  const vatUsedIfWon = ((recurringMonthlyBani + quotedBani) * 12) / TAX.VAT_THRESHOLD_ANNUAL;
  const storage = getStorage();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Atlas: the Giroc belt</h1>
        <p className="text-xs text-ink-faint">
          Last updated {ATLAS_LAST_UPDATED} · curated monthly from public sources
        </p>
      </div>

      {dbReady && quotedBani > 0 && (
        <div className="tnum mt-4 rounded-xl bg-moss-wash px-4 py-3 text-sm text-moss-deep">
          If we win every &quot;quoted&quot; prospect: +{fmtLeiRound(quotedBani)} lei/month,{" "}
          {Math.round(vatUsedIfWon * 100)}% of the VAT ceiling used.
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {COMMUNES.map((c) => (
          <article key={c.key} className="rounded-xl bg-surface p-4 shadow-card">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">{c.name}</h2>
              <span className="rounded-full bg-moss-wash px-2.5 py-0.5 text-xs font-medium text-moss-deep">
                {c.wave}
              </span>
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <Row label="Population" value={c.population} />
              <Row label="Trajectory" value={c.growth} />
              <Row label="Development" value={c.projectsPerYear} />
              <Row label="Block stock" value={c.blocksEst} />
              <Row label="Short-lets" value={c.shortLets} />
              <Row label="Rent level" value={c.rentLevel} />
            </dl>
            <p className="mt-3 border-t border-line pt-2.5 text-sm leading-relaxed text-ink-soft">
              {c.note}
            </p>
          </article>
        ))}
      </div>

      {dbReady && (
        <>
          {/* Field notebook (§6b): prospect pipeline */}
          <section className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Field notebook</h2>
              <p className="text-xs text-ink-faint">
                Buildings spotted on the ground or from listings
              </p>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {PIPELINE.map((stage) => {
                const inStage = prospects.filter((p) => p.status === stage);
                return (
                  <div key={stage} className="rounded-xl bg-paper">
                    <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      {PIPELINE_LABEL[stage]} <span className="tnum">({inStage.length})</span>
                    </p>
                    <div className="space-y-2">
                      {inStage.map((p) => (
                        <div key={p.id} className="rounded-lg bg-surface p-3 shadow-card">
                          <p className="text-sm font-medium leading-tight">{p.label}</p>
                          <p className="mt-0.5 text-xs text-ink-faint">
                            {p.commune}
                            {p.floors ? ` · ${p.floors} floors` : ""}
                            {p.apartmentsEst ? ` · ~${p.apartmentsEst} apts` : ""}
                          </p>
                          {p.quotedPriceBani ? (
                            <p className="tnum mt-1 text-xs">
                              quoted {fmtLeiRound(p.quotedPriceBani)} lei/mo
                            </p>
                          ) : null}
                          {p.currentCleaner !== "unknown" && (
                            <p className="mt-0.5 text-xs text-ink-soft">
                              current: {p.currentCleaner}
                            </p>
                          )}
                          {p.notes && (
                            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{p.notes}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {stage !== "castigat" && stage !== "pierdut" && (
                              <a
                                href={`/ops/offers?prospect=${p.id}`}
                                className="rounded-md border border-moss px-2 py-1 text-xs font-medium text-moss-deep"
                              >
                                Offer
                              </a>
                            )}
                            {stage !== "vizitat" && stage !== "castigat" && (
                              <MoveButton
                                id={p.id}
                                to={PIPELINE[PIPELINE.indexOf(stage) - 1]!}
                                label="←"
                              />
                            )}
                            {stage === "vizitat" && (
                              <MoveButton id={p.id} to="contactat" label="Contacted →" />
                            )}
                            {stage === "contactat" && (
                              <MoveButton id={p.id} to="oferta_trimisa" label="Offer sent →" />
                            )}
                            {stage === "oferta_trimisa" && (
                              <>
                                <MoveButton id={p.id} to="pierdut" label="Lost" />
                                {p.convertedBuildingId ? null : (
                                  <form action={convertProspectAction.bind(null, p.id)}>
                                    <button className="rounded-md bg-moss-deep px-2 py-1 text-xs font-medium text-paper">
                                      Won → building
                                    </button>
                                  </form>
                                )}
                              </>
                            )}
                            {stage === "pierdut" && (
                              <MoveButton id={p.id} to="contactat" label="Reopen" />
                            )}
                          </div>
                        </div>
                      ))}
                      {inStage.length === 0 && (
                        <p className="px-1 py-2 text-xs text-ink-faint">Empty.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <details className="mt-4 rounded-xl bg-surface p-4 shadow-card">
              <summary className="cursor-pointer text-sm font-semibold">Add prospect</summary>
              <form action={createProspectAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-ink-soft">Address / label</span>
                  <input
                    name="label"
                    required
                    className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-soft">Commune</span>
                  <input
                    name="commune"
                    defaultValue="Giroc"
                    className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-soft">Floors</span>
                  <input
                    name="floors"
                    type="number"
                    className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-soft">Apartments (est.)</span>
                  <input
                    name="apartments"
                    type="number"
                    className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-soft">Current cleaner</span>
                  <input
                    name="currentCleaner"
                    defaultValue="unknown"
                    className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-soft">Contact</span>
                  <input
                    name="contact"
                    className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-soft">Quoted price (lei/month)</span>
                  <input
                    name="quotedLei"
                    type="number"
                    className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="text-ink-soft">Notes</span>
                  <textarea
                    name="notes"
                    rows={2}
                    className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
                  />
                </label>
                <div>
                  <button className="rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper">
                    Add to notebook
                  </button>
                </div>
              </form>
            </details>
          </section>

          {/* Document shelf (§6b) */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold tracking-tight">Document shelf</h2>
            <div className="mt-3 rounded-xl bg-surface p-4 shadow-card">
              {documents.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  No documents yet. Research PDFs, contracts and legal notes live here.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {documents.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-ink-faint">
                          {d.tag}
                          {d.date ? ` · ${d.date}` : ""}
                        </p>
                      </div>
                      <a
                        href={storage.url(d.fileKey)}
                        className="shrink-0 text-sm text-moss underline underline-offset-2"
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <form
                action="/api/documents"
                method="post"
                encType="multipart/form-data"
                className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-3"
              >
                <label className="block text-sm">
                  <span className="text-ink-soft">Title</span>
                  <input
                    name="title"
                    className="mt-1 w-48 rounded-md border border-line bg-surface px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-soft">Tag</span>
                  <select
                    name="tag"
                    className="mt-1 rounded-md border border-line bg-surface px-3 py-2"
                  >
                    <option value="research">research</option>
                    <option value="contract">contract</option>
                    <option value="legal">legal</option>
                    <option value="other">other</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-ink-soft">File</span>
                  <input name="file" type="file" required className="mt-1 block text-sm" />
                </label>
                <button className="rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper">
                  Upload
                </button>
              </form>
            </div>
          </section>
        </>
      )}

      {!dbReady && (
        <p className="mt-6 rounded-xl bg-surface p-4 text-sm text-ink-soft shadow-card">
          The field notebook and document shelf appear after the database is seeded: run{" "}
          <code className="rounded bg-paper px-1">npm run seed</code>.
        </p>
      )}
    </div>
  );
}

function MoveButton({
  id,
  to,
  label,
}: {
  id: string;
  to: (typeof PIPELINE)[number];
  label: string;
}) {
  return (
    <form action={setProspectStatusAction.bind(null, id, to)}>
      <button className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft hover:border-moss">
        {label}
      </button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const empty = value.startsWith("no data");
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-ink-faint">{label}</dt>
      <dd className={`text-right ${empty ? "italic text-ink-faint" : "text-ink"}`}>{value}</dd>
    </div>
  );
}
