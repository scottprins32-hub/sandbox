import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPortalCleaner } from "@/server/portalAuth";
import { getCurrentOrg } from "@/server/org";
import {
  ensureVisitItems,
  getVisit,
  listVisitItems,
  listVisitPhotos,
} from "@/server/repo/visits";
import { getBuilding } from "@/server/repo/buildings";
import { listTemplateItems } from "@/server/repo/checklists";
import { ro } from "@/lib/i18n/ro";
import { VisitFlow, type FlowItem } from "./VisitFlow";

export const metadata: Metadata = { title: "Vizită · Scara" };
export const dynamic = "force-dynamic";

export default async function PortalVisit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cleaner = await getPortalCleaner();
  if (!cleaner) redirect("/portal");

  const org = await getCurrentOrg();
  const visit = await getVisit(org.id, id);
  if (!visit || visit.cleanerId !== cleaner.id) notFound();

  const building = visit.buildingId ? await getBuilding(org.id, visit.buildingId) : null;
  if (building?.checklistTemplateId) {
    const templateItems = await listTemplateItems(org.id, building.checklistTemplateId);
    await ensureVisitItems(
      org.id,
      visit.id,
      templateItems.map((i) => i.id)
    );
  }
  const [visitItems, photos] = await Promise.all([
    listVisitItems(org.id, visit.id),
    listVisitPhotos(org.id, visit.id),
  ]);
  const templateItems = building?.checklistTemplateId
    ? await listTemplateItems(org.id, building.checklistTemplateId)
    : [];
  const textById = new Map(templateItems.map((i) => [i.id, i.textRo]));
  const items: FlowItem[] = visitItems.map((vi) => ({
    id: vi.id,
    text: textById.get(vi.checklistItemId) ?? "…",
    done: vi.done,
  }));

  return (
    <div>
      <Link href="/portal" className="text-sm text-ink-faint">
        ← {ro.portal.nav.today}
      </Link>
      <h1 className="mt-1 text-xl font-semibold tracking-tight">
        {building?.label ?? visit.locationLabel ?? "Job"}
      </h1>
      <p className="text-sm text-ink-soft">
        {visit.window === "am" ? ro.portal.today.morning : ro.portal.today.afternoon}
        {building ? ` · ${String(building.hoursPerVisit).replace(".", ",")} h` : ""}
        {visit.bonusBani ? ` · ${ro.portal.jobs.bonus} ${Math.round(visit.bonusBani / 100)} lei` : ""}
      </p>
      {visit.notes && <p className="mt-1 text-sm text-ink-soft">{visit.notes}</p>}

      <div className="mt-4">
        <VisitFlow
          visitId={visit.id}
          initialStatus={visit.status}
          items={items}
          photoCount={photos.length}
        />
      </div>
    </div>
  );
}
