// The building status page (add-on 2 §C5).
//
// A resident scans the QR on the notice board and gets, with no login, the
// answer to the only question they have: was my stairwell actually cleaned?
//
// What may appear here is strictly bounded. Operational facts about the
// building — dates, task frequencies, how the published commitments held up
// this month. Never a resident name, never an apartment number, never a sum of
// money, never a photo of the building's interior. The page is public, and a
// public page that carries any of those is a data-protection incident waiting
// for an author.

import { formatInTimeZone } from "date-fns-tz";
import { ro } from "date-fns/locale";
import { APP_TZ, todayYmd, visitDaysRo, WEEK_PATTERNS, weekDays } from "@/lib/dates";
import {
  measureCommitments,
  monthBounds,
  type CommitmentResult,
  type MeasurableIssue,
} from "@/lib/commitments";
import {
  FREQUENCY_LABEL_RO,
  scheduleGroupsRo,
  tasksForPackage,
} from "@/lib/services/task-catalogue";
import { getBuildingByPublicCode, type Building } from "./repo/buildings";
import { listIssuesForBuildingBetween } from "./repo/issues";
import { listProtocolsForBuilding } from "./repo/protocols";
import { listVisitsForBuilding } from "./repo/visits";
import { listWalkCheckpoints, listWalksForBuilding } from "./repo/walks";
import { getOrgSettings } from "./repo/settings";
import { getDb, schema } from "./db";
import { eq } from "drizzle-orm";

export interface PublicBuildingView {
  buildingId: string;
  orgId: string;
  orgName: string;
  label: string;
  locality: string;
  /** "vineri, 3 iulie" — never an exact time, which would track a person. */
  lastVisitRo: string | null;
  lastVisitCheckpoints: number | null;
  nextVisitRo: string | null;
  daysRo: string;
  windowFrom: string;
  windowTo: string;
  frequency: { labelRo: string; lines: string[] }[];
  commitments: CommitmentResult[];
  month: string;
}

/**
 * "5 august 2026". The `ro` locale is not optional here: date-fns defaults to
 * English, and this page has exactly one audience, none of whom asked for
 * "5 August".
 */
function dateRo(ymd: string): string {
  return formatInTimeZone(new Date(`${ymd}T12:00:00Z`), APP_TZ, "d MMMM yyyy", {
    locale: ro,
  });
}

/** The next booked visit on or after today, from the same pattern Ops books. */
function nextVisitYmd(building: Building, booked: string[]): string | null {
  const today = todayYmd();
  const future = booked.filter((d) => d >= today).sort();
  if (future[0]) return future[0];
  // Nothing booked yet: fall back to the pattern, so the page never goes blank
  // between week generations.
  const pattern = WEEK_PATTERNS[building.visitsPerWeek] ?? WEEK_PATTERNS[2]!;
  for (let w = 0; w < 2; w++) {
    const anchor = new Date(`${today}T12:00:00Z`);
    anchor.setUTCDate(anchor.getUTCDate() + w * 7);
    const days = weekDays(anchor.toISOString().slice(0, 10));
    for (const idx of pattern) {
      const ymd = days[idx]!;
      if (ymd >= today) return ymd;
    }
  }
  return null;
}

export async function getPublicBuildingView(
  code: string
): Promise<PublicBuildingView | null> {
  const building = await getBuildingByPublicCode(code);
  if (!building) return null;
  const orgId = building.orgId;

  const orgRows = await getDb().select().from(schema.orgs).where(eq(schema.orgs.id, orgId));
  const settings = await getOrgSettings(orgId);

  // A generous window: the page needs the last completed visit and the next
  // booked one, and a paused building may have neither in the last ten rows.
  const visits = await listVisitsForBuilding(orgId, building.id, 60);
  const done = visits
    .filter((v) => v.status === "done")
    .sort((a, b) => (a.scheduledDate < b.scheduledDate ? 1 : -1));
  const last = done[0] ?? null;

  // The control walk that belongs to that visit, if there was one: "verificat
  // în 7 puncte" is the claim residents can check against the QR stickers they
  // can see in the stairwell.
  let lastVisitCheckpoints: number | null = null;
  if (last) {
    const walks = await listWalksForBuilding(orgId, building.id);
    const walk = walks.find((w) => w.visitId === last.id && w.status === "done");
    if (walk) {
      lastVisitCheckpoints = (await listWalkCheckpoints(orgId, [walk.id])).length;
    }
  }

  const month = formatInTimeZone(new Date(), APP_TZ, "yyyy-MM");
  const { from, to } = monthBounds(month);
  const issues = await listIssuesForBuildingBetween(orgId, building.id, from, to);
  const protocols = await listProtocolsForBuilding(orgId, building.id);

  const tasks = tasksForPackage({
    hasLift: building.hasLift,
    hasBasement: building.hasBasement,
    hasGreen: true,
  });
  const frequency = scheduleGroupsRo(tasks).map((g) => ({
    labelRo: g.labelRo,
    lines: g.tasks.map((t) => t.nameRo),
  }));

  return {
    buildingId: building.id,
    orgId,
    orgName: orgRows[0]?.name ?? "",
    label: building.label,
    locality: building.locality,
    lastVisitRo: last ? dateRo(last.scheduledDate) : null,
    lastVisitCheckpoints,
    nextVisitRo: (() => {
      const ymd = nextVisitYmd(
        building,
        visits.map((v) => v.scheduledDate)
      );
      return ymd ? dateRo(ymd) : null;
    })(),
    daysRo: visitDaysRo(building.visitsPerWeek),
    windowFrom: settings.visitWindowFrom ?? "07:00",
    windowTo: settings.visitWindowTo ?? "09:00",
    frequency,
    commitments: measureCommitments({
      month,
      issues: issues.map(
        (i): MeasurableIssue => ({
          category: i.category,
          source: i.source,
          createdAt: i.createdAt,
          acknowledgedAt: i.acknowledgedAt,
          resolvedAt: i.resolvedAt,
          photoFileKey: i.photoFileKey,
        })
      ),
      protocols: protocols.map((p) => ({ month: p.month, generatedAt: p.generatedAt })),
    }),
    month,
  };
}

export { FREQUENCY_LABEL_RO };
