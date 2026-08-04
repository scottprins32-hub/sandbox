// Control-walk orchestration (add-on §5): the standard checkpoint set every
// building starts with, and the month summaries the Raport lunar draws on.

import { formatInTimeZone } from "date-fns-tz";
import { APP_TZ } from "@/lib/dates";
import {
  createCheckpoints,
  listCheckpoints,
  listFindingsForWalks,
  listWalkCheckpoints,
  listWalksForBuilding,
  type Checkpoint,
  type ControlWalk,
  type WalkCheckpoint,
  type WalkFinding,
} from "./repo/walks";

/** The standard seven (add-on §5), editable per building afterwards. */
export const STANDARD_CHECKPOINTS: { slug: string; labelRo: string }[] = [
  { slug: "intrare", labelRo: "Intrare și ușa de acces" },
  { slug: "casa-scarii", labelRo: "Casa scării - paliere" },
  { slug: "subsol", labelRo: "Subsol / spații tehnice" },
  { slug: "tomberoane", labelRo: "Zona tomberoanelor" },
  { slug: "trotuar", labelRo: "Trotuar și acces exterior" },
  { slug: "tablou-electric", labelRo: "Tablou electric comun / iluminat" },
  { slug: "fatada", labelRo: "Fațadă - vedere de la sol" },
];

/**
 * Seed the standard checkpoint set for a building. Idempotent: only fills in
 * when the building has none. Codes are org-unique so a printed QR resolves
 * to its building.
 */
export async function seedCheckpoints(orgId: string, buildingId: string): Promise<number> {
  const existing = await listCheckpoints(orgId, buildingId);
  if (existing.length > 0) return 0;
  await createCheckpoints(
    orgId,
    STANDARD_CHECKPOINTS.map((c, i) => ({
      buildingId,
      labelRo: c.labelRo,
      code: `${c.slug}-${buildingId.slice(0, 8)}`,
      orderIndex: i,
    }))
  );
  return STANDARD_CHECKPOINTS.length;
}

export interface WalkMonthSummary {
  walks: {
    walk: ControlWalk;
    date: string; // dd.MM.yyyy
    time: string; // HH:mm
    points: number;
    findings: number;
  }[];
  findings: {
    finding: WalkFinding;
    date: string;
    checkpointLabel: string | null;
    photoCount: number;
  }[];
  checkpointById: Map<string, Checkpoint>;
  walkCheckpoints: WalkCheckpoint[];
}

/** Everything section 2 and 3 of the monthly report need, for one month. */
export async function walkSummaryForMonth(
  orgId: string,
  buildingId: string,
  monthKey: string
): Promise<WalkMonthSummary> {
  const all = await listWalksForBuilding(orgId, buildingId);
  const inMonth = all.filter(
    (w) =>
      w.status === "done" &&
      formatInTimeZone(new Date(w.startedAt), APP_TZ, "yyyy-MM") === monthKey
  );
  const walkIds = inMonth.map((w) => w.id);
  const [rows, findings, checkpointsList] = await Promise.all([
    listWalkCheckpoints(orgId, walkIds),
    listFindingsForWalks(orgId, walkIds),
    listCheckpoints(orgId, buildingId),
  ]);
  const checkpointById = new Map(checkpointsList.map((c) => [c.id, c]));
  const rowsByWalk = new Map<string, number>();
  for (const r of rows) {
    rowsByWalk.set(r.controlWalkId, (rowsByWalk.get(r.controlWalkId) ?? 0) + 1);
  }
  const findingsByWalk = new Map<string, number>();
  for (const f of findings) {
    findingsByWalk.set(f.controlWalkId, (findingsByWalk.get(f.controlWalkId) ?? 0) + 1);
  }

  return {
    walks: inMonth
      .sort((a, b) => a.startedAt - b.startedAt)
      .map((walk) => ({
        walk,
        date: formatInTimeZone(new Date(walk.startedAt), APP_TZ, "dd.MM.yyyy"),
        time: formatInTimeZone(new Date(walk.startedAt), APP_TZ, "HH:mm"),
        points: rowsByWalk.get(walk.id) ?? 0,
        findings: findingsByWalk.get(walk.id) ?? 0,
      })),
    findings: findings
      .sort((a, b) => a.reportedAt - b.reportedAt)
      .map((finding) => ({
        finding,
        date: formatInTimeZone(new Date(finding.reportedAt), APP_TZ, "dd.MM.yyyy"),
        checkpointLabel: finding.checkpointId
          ? checkpointById.get(finding.checkpointId)?.labelRo ?? null
          : null,
        photoCount: finding.photoKeys ? (JSON.parse(finding.photoKeys) as string[]).length : 0,
      })),
    checkpointById,
    walkCheckpoints: rows,
  };
}
