import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Building = typeof schema.buildings.$inferSelect;
export type BuildingInsert = Omit<
  typeof schema.buildings.$inferInsert,
  "id" | "orgId" | "createdAt" | "updatedAt"
>;

export async function listBuildings(
  orgId: string,
  opts?: { status?: Building["status"] }
): Promise<Building[]> {
  const where = opts?.status
    ? and(eq(schema.buildings.orgId, orgId), eq(schema.buildings.status, opts.status))
    : eq(schema.buildings.orgId, orgId);
  return getDb().select().from(schema.buildings).where(where);
}

export async function getBuilding(orgId: string, id: string): Promise<Building | null> {
  const rows = await getDb()
    .select()
    .from(schema.buildings)
    .where(and(eq(schema.buildings.orgId, orgId), eq(schema.buildings.id, id)));
  return rows[0] ?? null;
}

export async function createBuilding(orgId: string, data: BuildingInsert): Promise<Building> {
  const rows = await getDb()
    .insert(schema.buildings)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}

export async function updateBuilding(
  orgId: string,
  id: string,
  data: Partial<BuildingInsert>
): Promise<void> {
  await getDb()
    .update(schema.buildings)
    .set(data)
    .where(and(eq(schema.buildings.orgId, orgId), eq(schema.buildings.id, id)));
}

// --- public building page (add-on 2 §C5) ---

/**
 * Eight characters from an unambiguous alphabet: no O/0, I/1, L, U/V. The code
 * is read off a printed notice board and typed by hand as often as it is
 * scanned, and a resident who mistypes it once will not try twice.
 *
 * ~33 bits of entropy. That is enough to stop enumeration of a few hundred
 * buildings, which is all it needs to do — the page itself carries only
 * operational facts, never a resident name, an apartment number or a sum.
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTWXYZ23456789";

function mintPublicCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/**
 * Turn the page on, minting a code the first time. Re-enabling keeps the old
 * code so the QR already glued to a notice board keeps working.
 */
export async function setPublicPageEnabled(
  orgId: string,
  id: string,
  enabled: boolean
): Promise<string | null> {
  const building = await getBuilding(orgId, id);
  if (!building) return null;
  const code = building.publicCode ?? mintPublicCode();
  await getDb()
    .update(schema.buildings)
    .set({ publicPageEnabled: enabled, publicCode: code })
    .where(and(eq(schema.buildings.orgId, orgId), eq(schema.buildings.id, id)));
  return code;
}

/**
 * Look a building up from the public URL. Not org-scoped, because a resident
 * with a QR code has no session and no org — the code *is* the lookup. A
 * disabled page resolves to nothing, so switching it off takes the URL down
 * immediately rather than at the next print run.
 */
export async function getBuildingByPublicCode(code: string): Promise<Building | null> {
  if (!code) return null;
  const rows = await getDb()
    .select()
    .from(schema.buildings)
    .where(
      and(
        eq(schema.buildings.publicCode, code.toUpperCase()),
        eq(schema.buildings.publicPageEnabled, true)
      )
    );
  return rows[0] ?? null;
}
