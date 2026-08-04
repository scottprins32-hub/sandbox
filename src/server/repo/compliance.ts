import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "../db";

export type BuildingObligation = typeof schema.buildingObligations.$inferSelect;
export type ComplianceEvent = typeof schema.complianceEvents.$inferSelect;
export type Contractor = typeof schema.contractors.$inferSelect;

// --------------------------------------------------------- building obligations

export async function listBuildingObligations(
  orgId: string,
  buildingId?: string
): Promise<BuildingObligation[]> {
  const where = buildingId
    ? and(
        eq(schema.buildingObligations.orgId, orgId),
        eq(schema.buildingObligations.buildingId, buildingId)
      )
    : eq(schema.buildingObligations.orgId, orgId);
  return getDb().select().from(schema.buildingObligations).where(where);
}

export async function getBuildingObligation(
  orgId: string,
  id: string
): Promise<BuildingObligation | null> {
  const rows = await getDb()
    .select()
    .from(schema.buildingObligations)
    .where(
      and(eq(schema.buildingObligations.orgId, orgId), eq(schema.buildingObligations.id, id))
    );
  return rows[0] ?? null;
}

export async function createBuildingObligations(
  orgId: string,
  rows: Omit<
    typeof schema.buildingObligations.$inferInsert,
    "id" | "orgId" | "createdAt" | "updatedAt"
  >[]
): Promise<void> {
  if (rows.length === 0) return;
  await getDb()
    .insert(schema.buildingObligations)
    .values(rows.map((r) => ({ orgId, ...r })));
}

export async function updateBuildingObligation(
  orgId: string,
  id: string,
  data: Partial<typeof schema.buildingObligations.$inferInsert>
): Promise<void> {
  await getDb()
    .update(schema.buildingObligations)
    .set(data)
    .where(
      and(eq(schema.buildingObligations.orgId, orgId), eq(schema.buildingObligations.id, id))
    );
}

// ------------------------------------------------------------ compliance events

export async function listComplianceEvents(
  orgId: string,
  buildingObligationIds: string[]
): Promise<ComplianceEvent[]> {
  if (buildingObligationIds.length === 0) return [];
  return getDb()
    .select()
    .from(schema.complianceEvents)
    .where(
      and(
        eq(schema.complianceEvents.orgId, orgId),
        inArray(schema.complianceEvents.buildingObligationId, buildingObligationIds)
      )
    )
    .orderBy(desc(schema.complianceEvents.occurredAt));
}

export async function createComplianceEvent(
  orgId: string,
  data: Omit<
    typeof schema.complianceEvents.$inferInsert,
    "id" | "orgId" | "createdAt" | "updatedAt"
  >
): Promise<ComplianceEvent> {
  const rows = await getDb()
    .insert(schema.complianceEvents)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

/**
 * Treatments booked for a given day — the Today route's coordination list
 * (add-on §4: a scheduled DDD appears on the day as a task to escort).
 */
export async function listScheduledEventsOnDate(
  orgId: string,
  ymd: string
): Promise<ComplianceEvent[]> {
  return getDb()
    .select()
    .from(schema.complianceEvents)
    .where(
      and(
        eq(schema.complianceEvents.orgId, orgId),
        eq(schema.complianceEvents.kind, "scheduled"),
        eq(schema.complianceEvents.occurredAt, ymd)
      )
    );
}

export async function latestEventFor(
  orgId: string,
  buildingObligationId: string
): Promise<ComplianceEvent | null> {
  const rows = await getDb()
    .select()
    .from(schema.complianceEvents)
    .where(
      and(
        eq(schema.complianceEvents.orgId, orgId),
        eq(schema.complianceEvents.buildingObligationId, buildingObligationId)
      )
    )
    .orderBy(desc(schema.complianceEvents.occurredAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function setEventDocument(
  orgId: string,
  eventId: string,
  documentFileKey: string
): Promise<void> {
  await getDb()
    .update(schema.complianceEvents)
    .set({ documentFileKey })
    .where(
      and(eq(schema.complianceEvents.orgId, orgId), eq(schema.complianceEvents.id, eventId))
    );
}

/** Certificates and protocols filed against a building's obligations. */
export async function listObligationDocuments(
  orgId: string,
  buildingId: string
): Promise<{ event: ComplianceEvent; obligationKey: string }[]> {
  const obligations = await listBuildingObligations(orgId, buildingId);
  if (obligations.length === 0) return [];
  const keyById = new Map(obligations.map((o) => [o.id, o.obligationKey]));
  const events = await listComplianceEvents(
    orgId,
    obligations.map((o) => o.id)
  );
  return events
    .filter((e) => e.documentFileKey)
    .map((event) => ({ event, obligationKey: keyById.get(event.buildingObligationId)! }));
}

// ------------------------------------------------------------------ contractors

export async function listContractors(orgId: string): Promise<Contractor[]> {
  return getDb()
    .select()
    .from(schema.contractors)
    .where(eq(schema.contractors.orgId, orgId));
}

export async function getContractor(orgId: string, id: string): Promise<Contractor | null> {
  const rows = await getDb()
    .select()
    .from(schema.contractors)
    .where(and(eq(schema.contractors.orgId, orgId), eq(schema.contractors.id, id)));
  return rows[0] ?? null;
}

export async function createContractor(
  orgId: string,
  data: Omit<typeof schema.contractors.$inferInsert, "id" | "orgId" | "createdAt" | "updatedAt">
): Promise<Contractor> {
  const rows = await getDb()
    .insert(schema.contractors)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

export async function updateContractor(
  orgId: string,
  id: string,
  data: Partial<typeof schema.contractors.$inferInsert>
): Promise<void> {
  await getDb()
    .update(schema.contractors)
    .set(data)
    .where(and(eq(schema.contractors.orgId, orgId), eq(schema.contractors.id, id)));
}
