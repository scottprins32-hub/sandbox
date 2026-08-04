import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPortalCleaner } from "@/server/portalAuth";
import { getCurrentOrg } from "@/server/org";
import { getVisit } from "@/server/repo/visits";
import { getBuilding } from "@/server/repo/buildings";
import {
  getWalkForVisit,
  listCheckpoints,
  listWalkCheckpoints,
} from "@/server/repo/walks";
import { ro } from "@/lib/i18n/ro";
import { WalkFlow, type WalkCheckpointState } from "./WalkFlow";

export const metadata: Metadata = { title: "Tur de control · Scara" };
export const dynamic = "force-dynamic";

export default async function PortalWalk({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { id } = await params;
  const { c: focusCode } = await searchParams;
  const cleaner = await getPortalCleaner();
  if (!cleaner) redirect("/portal");

  const org = await getCurrentOrg();
  const visit = await getVisit(org.id, id);
  if (!visit || visit.cleanerId !== cleaner.id || !visit.buildingId) notFound();
  const building = await getBuilding(org.id, visit.buildingId);
  if (!building) notFound();

  const [checkpoints, walk] = await Promise.all([
    listCheckpoints(org.id, visit.buildingId),
    getWalkForVisit(org.id, visit.id),
  ]);
  const rows = walk ? await listWalkCheckpoints(org.id, [walk.id]) : [];
  const conditionByCheckpoint = new Map(rows.map((r) => [r.checkpointId, r.condition]));

  const state: WalkCheckpointState[] = checkpoints.map((c) => ({
    id: c.id,
    label: c.labelRo,
    condition: conditionByCheckpoint.get(c.id) ?? null,
  }));
  const focus = focusCode ? checkpoints.find((c) => c.code === focusCode)?.id : undefined;

  return (
    <div>
      <Link href={`/portal/v/${visit.id}`} className="text-sm text-ink-faint">
        ← {building.label}
      </Link>
      <h1 className="mt-1 text-xl font-semibold tracking-tight">{ro.portal.walk.title}</h1>
      <div className="mt-4">
        <WalkFlow
          visitId={visit.id}
          initialWalkId={walk?.id ?? null}
          initialStatus={walk?.status ?? null}
          checkpoints={state}
          focusCheckpointId={focus}
        />
      </div>
    </div>
  );
}
