import { and, asc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type ChecklistTemplate = typeof schema.checklistTemplates.$inferSelect;
export type ChecklistItem = typeof schema.checklistItems.$inferSelect;

export async function listTemplates(orgId: string): Promise<ChecklistTemplate[]> {
  return getDb()
    .select()
    .from(schema.checklistTemplates)
    .where(eq(schema.checklistTemplates.orgId, orgId));
}

export async function listTemplateItems(
  orgId: string,
  templateId: string
): Promise<ChecklistItem[]> {
  return getDb()
    .select()
    .from(schema.checklistItems)
    .where(
      and(
        eq(schema.checklistItems.orgId, orgId),
        eq(schema.checklistItems.templateId, templateId)
      )
    )
    .orderBy(asc(schema.checklistItems.sort));
}

export async function getItemsById(
  orgId: string,
  ids: string[]
): Promise<Map<string, ChecklistItem>> {
  const all = await getDb()
    .select()
    .from(schema.checklistItems)
    .where(eq(schema.checklistItems.orgId, orgId));
  const map = new Map<string, ChecklistItem>();
  for (const item of all) if (ids.includes(item.id)) map.set(item.id, item);
  return map;
}
