// Prospecting repo (add-on 2 §3): routes, the contacts read off a notice
// board, photos and the touch log. Org-scoped like every repo.
//
// Two GDPR rules are enforced here rather than in the UI, so no future screen
// can route around them: `doNotContact` contacts never appear in any list this
// module returns, and every contact carries its `source`.

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Route = typeof schema.routes.$inferSelect;
export type ProspectContact = typeof schema.prospectContacts.$inferSelect;
export type ProspectPhoto = typeof schema.prospectPhotos.$inferSelect;
export type ProspectEvent = typeof schema.prospectEvents.$inferSelect;

// ----------------------------------------------------------------- routes

export async function listRoutes(orgId: string): Promise<Route[]> {
  return getDb()
    .select()
    .from(schema.routes)
    .where(eq(schema.routes.orgId, orgId))
    .orderBy(asc(schema.routes.orderIndex));
}

export async function getRoute(orgId: string, id: string): Promise<Route | null> {
  const rows = await getDb()
    .select()
    .from(schema.routes)
    .where(and(eq(schema.routes.orgId, orgId), eq(schema.routes.id, id)));
  return rows[0] ?? null;
}

export async function createRoutes(
  orgId: string,
  rows: Omit<typeof schema.routes.$inferInsert, "id" | "orgId" | "createdAt" | "updatedAt">[]
): Promise<Route[]> {
  if (rows.length === 0) return [];
  return getDb()
    .insert(schema.routes)
    .values(rows.map((r) => ({ orgId, ...r })))
    .returning();
}

// --------------------------------------------------------------- contacts

/**
 * Contacts for one prospect. Suppressed contacts are filtered out here, not
 * by the caller — §3.4 requires they disappear from every list and export.
 */
export async function listContacts(
  orgId: string,
  prospectId: string,
  opts: { includeSuppressed?: boolean } = {}
): Promise<ProspectContact[]> {
  const rows = await getDb()
    .select()
    .from(schema.prospectContacts)
    .where(
      and(
        eq(schema.prospectContacts.orgId, orgId),
        eq(schema.prospectContacts.prospectId, prospectId)
      )
    )
    .orderBy(asc(schema.prospectContacts.capturedAt));
  return opts.includeSuppressed ? rows : rows.filter((c) => !c.doNotContact);
}

/** Every contact in the org, for the Problems check and the SAR export. */
export async function listAllContacts(
  orgId: string,
  opts: { includeSuppressed?: boolean } = {}
): Promise<ProspectContact[]> {
  const rows = await getDb()
    .select()
    .from(schema.prospectContacts)
    .where(eq(schema.prospectContacts.orgId, orgId))
    .orderBy(desc(schema.prospectContacts.capturedAt));
  return opts.includeSuppressed ? rows : rows.filter((c) => !c.doNotContact);
}

export async function listContactsForProspects(
  orgId: string,
  prospectIds: string[]
): Promise<ProspectContact[]> {
  if (prospectIds.length === 0) return [];
  const rows = await getDb()
    .select()
    .from(schema.prospectContacts)
    .where(
      and(
        eq(schema.prospectContacts.orgId, orgId),
        inArray(schema.prospectContacts.prospectId, prospectIds)
      )
    );
  return rows.filter((c) => !c.doNotContact);
}

/** Insert-if-missing on a client-generated id, for offline replay safety. */
export async function createContact(
  orgId: string,
  data: {
    id: string;
    prospectId: string;
    role: ProspectContact["role"];
    name: string;
    phone?: string | null;
    email?: string | null;
    source?: ProspectContact["source"];
    consentNote?: string | null;
  }
): Promise<void> {
  await getDb()
    .insert(schema.prospectContacts)
    .values({
      orgId,
      capturedAt: Date.now(),
      source: data.source ?? "avizier",
      ...data,
    })
    .onConflictDoNothing();
}

/** GDPR art. 14: stamp when the information notice went out. */
export async function markContactInformed(orgId: string, id: string): Promise<void> {
  await getDb()
    .update(schema.prospectContacts)
    .set({ informedAt: Date.now() })
    .where(
      and(eq(schema.prospectContacts.orgId, orgId), eq(schema.prospectContacts.id, id))
    );
}

/** Permanent, never reversed by this module. */
export async function suppressContact(orgId: string, id: string): Promise<void> {
  await getDb()
    .update(schema.prospectContacts)
    .set({ doNotContact: true })
    .where(
      and(eq(schema.prospectContacts.orgId, orgId), eq(schema.prospectContacts.id, id))
    );
}

// ----------------------------------------------------------------- photos

export async function listProspectPhotos(
  orgId: string,
  prospectId: string
): Promise<ProspectPhoto[]> {
  return getDb()
    .select()
    .from(schema.prospectPhotos)
    .where(
      and(
        eq(schema.prospectPhotos.orgId, orgId),
        eq(schema.prospectPhotos.prospectId, prospectId)
      )
    )
    .orderBy(desc(schema.prospectPhotos.takenAt));
}

export async function listPhotosForProspects(
  orgId: string,
  prospectIds: string[]
): Promise<ProspectPhoto[]> {
  if (prospectIds.length === 0) return [];
  return getDb()
    .select()
    .from(schema.prospectPhotos)
    .where(
      and(
        eq(schema.prospectPhotos.orgId, orgId),
        inArray(schema.prospectPhotos.prospectId, prospectIds)
      )
    );
}

export async function addProspectPhoto(
  orgId: string,
  data: {
    prospectId: string;
    fileKey: string;
    kind: ProspectPhoto["kind"];
    note?: string | null;
  }
): Promise<ProspectPhoto> {
  const rows = await getDb()
    .insert(schema.prospectPhotos)
    .values({ orgId, takenAt: Date.now(), ...data })
    .returning();
  return rows[0]!;
}

// ----------------------------------------------------------------- events

export async function listProspectEvents(
  orgId: string,
  prospectId: string
): Promise<ProspectEvent[]> {
  return getDb()
    .select()
    .from(schema.prospectEvents)
    .where(
      and(
        eq(schema.prospectEvents.orgId, orgId),
        eq(schema.prospectEvents.prospectId, prospectId)
      )
    )
    .orderBy(desc(schema.prospectEvents.occurredAt));
}

export async function addProspectEvent(
  orgId: string,
  data: {
    prospectId: string;
    kind: ProspectEvent["kind"];
    summary?: string | null;
    outcome?: string | null;
  }
): Promise<void> {
  await getDb()
    .insert(schema.prospectEvents)
    .values({ orgId, occurredAt: Date.now(), ...data });
}
