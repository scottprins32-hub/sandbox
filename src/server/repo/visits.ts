import { and, desc, eq, gte, inArray, isNull, lt, lte, or } from "drizzle-orm";
import { getDb, schema } from "../db";
import { weekDays, WEEK_PATTERNS } from "@/lib/dates";
import { listBuildings } from "./buildings";
import { listActiveCleaners } from "./cleaners";

export type Visit = typeof schema.visits.$inferSelect;
export type VisitItem = typeof schema.visitItems.$inferSelect;
export type Photo = typeof schema.photos.$inferSelect;

export async function getVisit(orgId: string, id: string): Promise<Visit | null> {
  const rows = await getDb()
    .select()
    .from(schema.visits)
    .where(and(eq(schema.visits.orgId, orgId), eq(schema.visits.id, id)));
  return rows[0] ?? null;
}

export async function listVisitsOnDate(orgId: string, ymd: string): Promise<Visit[]> {
  return getDb()
    .select()
    .from(schema.visits)
    .where(and(eq(schema.visits.orgId, orgId), eq(schema.visits.scheduledDate, ymd)));
}

export async function listVisitsForCleanerOnDate(
  orgId: string,
  cleanerId: string,
  ymd: string
): Promise<Visit[]> {
  return getDb()
    .select()
    .from(schema.visits)
    .where(
      and(
        eq(schema.visits.orgId, orgId),
        eq(schema.visits.cleanerId, cleanerId),
        eq(schema.visits.scheduledDate, ymd)
      )
    );
}

export async function listVisitsForBuilding(
  orgId: string,
  buildingId: string,
  limit = 10
): Promise<Visit[]> {
  return getDb()
    .select()
    .from(schema.visits)
    .where(and(eq(schema.visits.orgId, orgId), eq(schema.visits.buildingId, buildingId)))
    .orderBy(desc(schema.visits.scheduledDate))
    .limit(limit);
}

export async function listVisitsInMonth(orgId: string, monthKey: string): Promise<Visit[]> {
  return getDb()
    .select()
    .from(schema.visits)
    .where(
      and(
        eq(schema.visits.orgId, orgId),
        gte(schema.visits.scheduledDate, `${monthKey}-01`),
        lte(schema.visits.scheduledDate, `${monthKey}-31`)
      )
    );
}

/** Missed = scheduled/claimed/in_progress with a date strictly before today. */
export async function listMissedVisits(orgId: string, todayYmd: string): Promise<Visit[]> {
  return getDb()
    .select()
    .from(schema.visits)
    .where(
      and(
        eq(schema.visits.orgId, orgId),
        lt(schema.visits.scheduledDate, todayYmd),
        inArray(schema.visits.status, ["scheduled", "claimed", "in_progress"])
      )
    )
    .orderBy(desc(schema.visits.scheduledDate));
}

/** Open one-off offers cleaners can claim in the Portal (§8). */
export async function listOpenOffers(orgId: string, fromYmd: string): Promise<Visit[]> {
  return getDb()
    .select()
    .from(schema.visits)
    .where(
      and(
        eq(schema.visits.orgId, orgId),
        eq(schema.visits.openOffer, true),
        eq(schema.visits.status, "scheduled"),
        gte(schema.visits.scheduledDate, fromYmd),
        or(isNull(schema.visits.cleanerId), eq(schema.visits.cleanerId, ""))
      )
    );
}

export async function createVisit(
  orgId: string,
  data: Omit<typeof schema.visits.$inferInsert, "id" | "orgId" | "createdAt" | "updatedAt">
): Promise<Visit> {
  const rows = await getDb()
    .insert(schema.visits)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

export async function updateVisit(
  orgId: string,
  id: string,
  data: Partial<typeof schema.visits.$inferInsert>
): Promise<void> {
  await getDb()
    .update(schema.visits)
    .set(data)
    .where(and(eq(schema.visits.orgId, orgId), eq(schema.visits.id, id)));
}

/**
 * "Generate this week's visits" (§7.2): creates visit rows from each active
 * building's schedule for the week containing `anchorYmd`. Idempotent — never
 * duplicates a building+date pair.
 * visits_per_week mapping: 1 → Mon; 2 → Mon+Thu; 3 → Mon+Wed+Fri.
 */
export async function generateWeekVisits(
  orgId: string,
  anchorYmd: string
): Promise<{ created: number; skipped: number }> {
  const db = getDb();
  const days = weekDays(anchorYmd);
  const buildings = await listBuildings(orgId, { status: "active" });
  const cleaners = await listActiveCleaners(orgId);
  const defaultCleaner = cleaners.find((c) => c.workerModel === "fulltime_min") ?? cleaners[0];

  const existing = await db
    .select()
    .from(schema.visits)
    .where(
      and(
        eq(schema.visits.orgId, orgId),
        gte(schema.visits.scheduledDate, days[0]!),
        lte(schema.visits.scheduledDate, days[6]!),
        eq(schema.visits.type, "recurring")
      )
    );
  const seen = new Set(existing.map((v) => `${v.buildingId}|${v.scheduledDate}`));

  let created = 0;
  let skipped = 0;
  for (const b of buildings) {
    const pattern = WEEK_PATTERNS[b.visitsPerWeek] ?? WEEK_PATTERNS[2]!;
    for (const dayIdx of pattern) {
      const date = days[dayIdx]!;
      if (seen.has(`${b.id}|${date}`)) {
        skipped++;
        continue;
      }
      await db.insert(schema.visits).values({
        orgId,
        buildingId: b.id,
        cleanerId: defaultCleaner?.id ?? null,
        type: "recurring",
        scheduledDate: date,
        window: "am",
        status: "scheduled",
      });
      created++;
    }
  }
  return { created, skipped };
}

// --- Checklist state on a visit ---

export async function listVisitItems(
  orgId: string,
  visitId: string
): Promise<VisitItem[]> {
  return getDb()
    .select()
    .from(schema.visitItems)
    .where(and(eq(schema.visitItems.orgId, orgId), eq(schema.visitItems.visitId, visitId)));
}

/** Creates per-visit checklist rows from the building's template (idempotent). */
export async function ensureVisitItems(
  orgId: string,
  visitId: string,
  templateItemIds: string[]
): Promise<void> {
  const db = getDb();
  const existing = await listVisitItems(orgId, visitId);
  const have = new Set(existing.map((i) => i.checklistItemId));
  for (const itemId of templateItemIds) {
    if (!have.has(itemId)) {
      await db.insert(schema.visitItems).values({
        orgId,
        visitId,
        checklistItemId: itemId,
        done: false,
      });
    }
  }
}

export async function setVisitItemDone(
  orgId: string,
  visitItemId: string,
  done: boolean
): Promise<void> {
  await getDb()
    .update(schema.visitItems)
    .set({ done })
    .where(and(eq(schema.visitItems.orgId, orgId), eq(schema.visitItems.id, visitItemId)));
}

// --- Photos ---

export async function listVisitPhotos(orgId: string, visitId: string): Promise<Photo[]> {
  return getDb()
    .select()
    .from(schema.photos)
    .where(and(eq(schema.photos.orgId, orgId), eq(schema.photos.visitId, visitId)));
}

export async function listPhotosForVisits(orgId: string, visitIds: string[]): Promise<Photo[]> {
  if (visitIds.length === 0) return [];
  return getDb()
    .select()
    .from(schema.photos)
    .where(and(eq(schema.photos.orgId, orgId), inArray(schema.photos.visitId, visitIds)));
}

export async function addPhoto(
  orgId: string,
  data: { visitId: string; fileKey: string; takenAt: number; kind: Photo["kind"] }
): Promise<Photo> {
  const rows = await getDb()
    .insert(schema.photos)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}
