import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentOrg } from "@/server/org";
import {
  ensureVisitItems,
  getVisit,
  listVisitItems,
  listVisitPhotos,
  setVisitItemDone,
} from "@/server/repo/visits";
import { getBuilding } from "@/server/repo/buildings";
import { getCleaner, listActiveCleaners } from "@/server/repo/cleaners";
import { listTemplateItems } from "@/server/repo/checklists";
import { getStorage } from "@/server/storage";
import { fmtDateTime } from "@/lib/dates";
import { fmtLeiRound } from "@/lib/money";
import { StatusChip } from "@/components/ops/StatusChip";
import { PhotoUpload } from "@/components/ops/PhotoUpload";
import {
  assignVisitCleanerAction,
  confirmClaimAction,
  finishVisitAction,
  markVisitMissedAction,
  rescheduleVisitAction,
  startVisitAction,
} from "../../actions";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = { title: "Visit · Scara" };
export const dynamic = "force-dynamic";

export default async function VisitDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await getCurrentOrg();
  const visit = await getVisit(org.id, id);
  if (!visit) notFound();

  const building = visit.buildingId ? await getBuilding(org.id, visit.buildingId) : null;
  const cleaner = visit.cleanerId ? await getCleaner(org.id, visit.cleanerId) : null;
  const cleaners = await listActiveCleaners(org.id);

  // Materialize checklist rows from the building's template.
  if (building?.checklistTemplateId) {
    const templateItems = await listTemplateItems(org.id, building.checklistTemplateId);
    await ensureVisitItems(
      org.id,
      visit.id,
      templateItems.map((i) => i.id)
    );
  }
  const items = await listVisitItems(org.id, visit.id);
  const templateItems = building?.checklistTemplateId
    ? await listTemplateItems(org.id, building.checklistTemplateId)
    : [];
  const textById = new Map(templateItems.map((i) => [i.id, i.textRo]));
  const photos = await listVisitPhotos(org.id, visit.id);
  const storage = getStorage();

  async function toggleItem(itemId: string, done: boolean) {
    "use server";
    const org = await getCurrentOrg();
    await setVisitItemDone(org.id, itemId, done);
    revalidatePath(`/ops/visits/${id}`);
  }

  const before = photos.filter((p) => p.kind === "before");
  const after = photos.filter((p) => p.kind !== "before");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">
          {building?.label ?? visit.locationLabel ?? "One-off job"}
        </h1>
        <StatusChip status={visit.status} />
      </div>

      <div className="rounded-xl bg-surface p-4 shadow-card">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <div>
            <dt className="text-xs text-ink-faint">Scheduled</dt>
            <dd className="tnum">
              {visit.scheduledDate} · {visit.window === "am" ? "morning" : "afternoon"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">Type</dt>
            <dd>
              {visit.type}
              {visit.priceBani ? ` · ${fmtLeiRound(visit.priceBani)} lei` : ""}
              {visit.bonusBani ? ` (+${fmtLeiRound(visit.bonusBani)} bonus)` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">Cleaner</dt>
            <dd>{cleaner?.name ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">Timeline</dt>
            <dd className="tnum">
              {visit.startedAt ? `started ${fmtDateTime(visit.startedAt)}` : "not started"}
              {visit.finishedAt ? ` · finished ${fmtDateTime(visit.finishedAt)}` : ""}
            </dd>
          </div>
        </dl>
        {visit.notes && <p className="mt-2 text-sm text-ink-soft">{visit.notes}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          {visit.status === "claimed" && (
            <form action={confirmClaimAction.bind(null, visit.id)}>
              <button className="rounded-md bg-moss-deep px-3 py-1.5 text-sm font-medium text-paper">
                Confirm claim
              </button>
            </form>
          )}
          {(visit.status === "scheduled" || visit.status === "claimed") && (
            <form action={startVisitAction.bind(null, visit.id)}>
              <button className="rounded-md bg-moss-deep px-3 py-1.5 text-sm font-medium text-paper">
                Start
              </button>
            </form>
          )}
          {visit.status === "in_progress" && (
            <form action={finishVisitAction.bind(null, visit.id)}>
              <button className="rounded-md bg-moss-deep px-3 py-1.5 text-sm font-medium text-paper">
                Finish
              </button>
            </form>
          )}
          {visit.status !== "done" && visit.status !== "missed" && (
            <form action={markVisitMissedAction.bind(null, visit.id)}>
              <button className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft">
                Mark missed
              </button>
            </form>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold">Checklist</h2>
          <ul className="mt-2 divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="py-1.5">
                <form action={toggleItem.bind(null, item.id, !item.done)}>
                  <button className="flex w-full items-center gap-3 py-1 text-left">
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                        item.done
                          ? "border-moss bg-moss text-paper"
                          : "border-line-strong bg-surface"
                      }`}
                    >
                      {item.done ? "✓" : ""}
                    </span>
                    <span className={`text-sm ${item.done ? "text-ink-faint line-through" : ""}`}>
                      {textById.get(item.checklistItemId) ?? "…"}
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Photos</h2>
          <div className="flex gap-2">
            <PhotoUpload visitId={visit.id} kind="before" label="Before" />
            <PhotoUpload visitId={visit.id} kind="after" label="After" />
          </div>
        </div>
        {photos.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No photos yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-ink-faint">Before</p>
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                {before.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={storage.url(p.fileKey)}
                    alt={`Before, ${fmtDateTime(p.takenAt)}`}
                    className="aspect-[4/3] w-full rounded-md object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-ink-faint">After</p>
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                {after.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={storage.url(p.fileKey)}
                    alt={`After, ${fmtDateTime(p.takenAt)}`}
                    className="aspect-[4/3] w-full rounded-md object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-ink-faint">
          Photos are timestamped; they feed the monthly proces-verbal counts.
        </p>
      </div>

      <details className="rounded-xl bg-surface p-4 shadow-card">
        <summary className="cursor-pointer text-sm font-semibold">Admin: reassign or reschedule</summary>
        <div className="mt-3 space-y-3">
          <form action={assignVisitCleanerAction.bind(null, visit.id)} className="flex gap-2">
            <select
              name="cleanerId"
              defaultValue={visit.cleanerId ?? ""}
              className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {cleaners.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft">
              Assign
            </button>
          </form>
          <form action={rescheduleVisitAction.bind(null, visit.id)} className="flex gap-2">
            <input
              type="date"
              name="date"
              defaultValue={visit.scheduledDate}
              className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm"
            />
            <button className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft">
              Reschedule
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}
