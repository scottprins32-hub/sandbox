// Assembles the notice-board printables (add-on 2 §C1, §C2) from the task
// catalogue and the building's own record. Nothing here invents a fact: the
// days come from the same pattern the visit generator books, and the tasks
// come from the catalogue filtered by what the building actually has.

import { formatInTimeZone } from "date-fns-tz";
import { APP_TZ, todayYmd, visitDaysRo, WEEK_PATTERNS, weekDays } from "@/lib/dates";
import {
  FREQUENCY_LABEL_RO,
  scheduleGroupsRo,
  tasksForPackage,
  type PackageFlags,
} from "@/lib/services/task-catalogue";
import { getBuilding } from "./repo/buildings";
import { listVisitsForBuilding } from "./repo/visits";
import { listCleaners } from "./repo/cleaners";
import { getOrgSettings } from "./repo/settings";
import { getCurrentOrg } from "./org";
import { renderSchedulePdf, type ScheduleData, type ScheduleGroup } from "./pdf/schedule";
import { renderVisitCardsPdf } from "./pdf/visitCard";

/** Frequencies that belong on a wall sheet — the rest are event-driven. */
const POSTED_FREQUENCIES = [
  "fiecare_vizita",
  "saptamanal",
  "bilunar",
  "lunar",
  "trimestrial",
  "semestrial",
  "anual",
] as const;

const WINTER_LINE =
  "Deszăpezire și material antiderapant la intrare, înainte de ora 7:00.";

function flagsOfBuilding(b: { hasLift: boolean; hasBasement: boolean }): PackageFlags {
  return {
    hasLift: b.hasLift,
    hasBasement: b.hasBasement,
    // Every block in the demo world has some green edge; the catalogue's
    // green tasks are cheap and visible, so they stay in the base package.
    hasGreen: true,
  };
}

/** The cleaner who actually works this building, by recent visit history. */
async function usualCleanerFirstName(
  orgId: string,
  buildingId: string
): Promise<string | undefined> {
  const visits = await listVisitsForBuilding(orgId, buildingId);
  const counts = new Map<string, number>();
  for (const v of visits) {
    if (!v.cleanerId) continue;
    counts.set(v.cleanerId, (counts.get(v.cleanerId) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) return undefined;
  const cleaner = (await listCleaners(orgId)).find((c) => c.id === top[0]);
  return cleaner?.name.trim().split(/\s+/)[0];
}

export async function buildScheduleData(
  orgId: string,
  buildingId: string
): Promise<ScheduleData> {
  const org = await getCurrentOrg();
  const settings = await getOrgSettings(orgId);
  const building = await getBuilding(orgId, buildingId);
  if (!building) throw new Error("Building not found");

  const tasks = tasksForPackage(flagsOfBuilding(building));
  const groups: ScheduleGroup[] = scheduleGroupsRo(tasks)
    .filter((g) => (POSTED_FREQUENCIES as readonly string[]).includes(g.frequency))
    .map((g) => ({
      labelRo: g.labelRo,
      lines: g.tasks.map((t) => t.nameRo),
    }));

  return {
    orgName: org.name,
    buildingLabel: building.label,
    address: [building.address, building.locality].filter(Boolean).join(", ") || undefined,
    daysRo: visitDaysRo(building.visitsPerWeek),
    windowFrom: settings.visitWindowFrom ?? "07:00",
    windowTo: settings.visitWindowTo ?? "09:00",
    cleanerFirstName: await usualCleanerFirstName(orgId, buildingId),
    groups,
    winterLine: WINTER_LINE,
    phone: settings.phone ?? "",
  };
}

export async function generateSchedulePdf(
  orgId: string,
  buildingId: string
): Promise<Uint8Array> {
  return renderSchedulePdf(await buildScheduleData(orgId, buildingId));
}

/**
 * Pre-dated cards for the coming weeks, on the days the building is actually
 * visited. `weeks` of cards, rounded up to a full A4 sheet of four.
 */
export async function generateVisitCardsPdf(
  orgId: string,
  buildingId: string,
  weeks = 2
): Promise<Uint8Array> {
  const org = await getCurrentOrg();
  const building = await getBuilding(orgId, buildingId);
  if (!building) throw new Error("Building not found");

  const pattern = WEEK_PATTERNS[building.visitsPerWeek] ?? WEEK_PATTERNS[2]!;
  const dates: string[] = [];
  const start = todayYmd();
  for (let w = 0; w < weeks; w++) {
    const anchor = new Date(`${start}T12:00:00Z`);
    anchor.setUTCDate(anchor.getUTCDate() + w * 7);
    const days = weekDays(anchor.toISOString().slice(0, 10));
    for (const idx of pattern) {
      const ymd = days[idx]!;
      if (ymd < start) continue; // never pre-date a card into the past
      dates.push(formatInTimeZone(new Date(`${ymd}T12:00:00Z`), APP_TZ, "dd.MM.yyyy"));
    }
  }

  return renderVisitCardsPdf({
    orgName: org.name,
    buildingLabel: building.label,
    dates,
  });
}

export { FREQUENCY_LABEL_RO };
