import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentOrg } from "@/server/org";
import { getRoute, listPhotosForProspects } from "@/server/repo/prospecting";
import { listProspects } from "@/server/repo/prospects";
import {
  PRIORITY_LABEL_RO,
  priorityRank,
  scorecard,
  STATUS_LABEL_RO,
  type Access,
  type Incumbent,
  type Ownership,
} from "@/lib/prospecting/field-data";
import { FieldSyncChip } from "../SyncChip";

// The route's building list, sorted by what is worth knocking on (§3.6).

export const metadata: Metadata = { title: "Rută · Scara" };
export const dynamic = "force-dynamic";

export default async function RoutePage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;
  const org = await getCurrentOrg();
  const route = await getRoute(org.id, routeId);
  if (!route) notFound();

  const prospects = await listProspects(org.id, { routeId });
  const photos = await listPhotosForProspects(org.id, prospects.map((p) => p.id));
  const binPhotos = new Set(photos.filter((p) => p.kind === "pubele").map((p) => p.prospectId));
  const currentMonth = new Date().getMonth() + 1;

  const scored = prospects
    .map((p) => ({
      p,
      card: scorecard({
        access: p.access as Access,
        incumbent: p.incumbent as Incumbent,
        ownership: p.ownership as Ownership,
        hasBinPhoto: binPhotos.has(p.id),
        assemblyMonth: p.assemblyMonth,
        currentMonth,
      }),
    }))
    .sort((a, b) => priorityRank(a.card.tags) - priorityRank(b.card.tags));

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/ops/teren" className="text-xs text-ink-faint">
            ← Rute
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">{route.name}</h1>
        </div>
        <FieldSyncChip />
      </div>
      {route.parkAtLabel && (
        <p className="text-xs text-ink-soft">Parcare: {route.parkAtLabel}</p>
      )}

      <ul className="mt-4 space-y-2">
        {scored.map(({ p, card }) => (
          <li key={p.id}>
            <Link
              href={`/ops/teren/${routeId}/${p.id}`}
              className="block rounded-xl bg-surface p-3.5 shadow-card"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-medium">{p.label}</h2>
                <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-xs text-ink-soft">
                  {STATUS_LABEL_RO[p.status]}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-faint">
                {[
                  p.floors ? `${p.floors} etaje` : null,
                  p.apartmentsEst ? `${p.apartmentsEst} apartamente` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {card.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {card.tags.map((t) => (
                    <span
                      key={t}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        t === "prioritate_mare"
                          ? "bg-moss-wash text-moss-deep"
                          : t === "sezon"
                            ? "bg-warn-wash text-warn"
                            : "bg-paper text-ink-soft"
                      }`}
                    >
                      {PRIORITY_LABEL_RO[t]}
                    </span>
                  ))}
                </div>
              )}
              {/* The reasoning is always visible — never a score (§7.5). */}
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{card.reasonRo}</p>
            </Link>
          </li>
        ))}
        {scored.length === 0 && (
          <li className="rounded-xl bg-surface p-6 text-center text-sm text-ink-soft shadow-card">
            Nicio clădire consemnată pe ruta asta. Începe cu prima de la parcare.
          </li>
        )}
      </ul>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 p-3 backdrop-blur">
        <Link
          href={`/ops/teren/${routeId}/nou`}
          className="block rounded-xl bg-moss-deep px-4 py-4 text-center text-lg font-semibold text-paper"
        >
          Clădire nouă
        </Link>
      </div>
    </div>
  );
}
