import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { OrgSettingsJson } from "../org";

export async function getOrgSettings(orgId: string): Promise<OrgSettingsJson> {
  const rows = await getDb()
    .select()
    .from(schema.orgSettings)
    .where(eq(schema.orgSettings.orgId, orgId));
  if (!rows[0]) return {};
  try {
    return JSON.parse(rows[0].json) as OrgSettingsJson;
  } catch {
    return {};
  }
}

export async function updateOrgSettings(
  orgId: string,
  patch: Partial<OrgSettingsJson>
): Promise<void> {
  const db = getDb();
  const current = await getOrgSettings(orgId);
  const next = JSON.stringify({ ...current, ...patch });
  const rows = await db
    .select()
    .from(schema.orgSettings)
    .where(eq(schema.orgSettings.orgId, orgId));
  if (rows[0]) {
    await db
      .update(schema.orgSettings)
      .set({ json: next })
      .where(eq(schema.orgSettings.id, rows[0].id));
  } else {
    await db.insert(schema.orgSettings).values({ orgId, json: next });
  }
}

export async function updateOrgIdentity(
  orgId: string,
  data: { name?: string; cui?: string }
): Promise<void> {
  await getDb().update(schema.orgs).set(data).where(eq(schema.orgs.id, orgId));
}
