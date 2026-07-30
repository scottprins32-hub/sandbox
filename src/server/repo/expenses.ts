import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Expense = typeof schema.expenses.$inferSelect;

export async function listExpensesInMonth(orgId: string, monthKey: string): Promise<Expense[]> {
  return getDb()
    .select()
    .from(schema.expenses)
    .where(
      and(
        eq(schema.expenses.orgId, orgId),
        gte(schema.expenses.date, `${monthKey}-01`),
        lte(schema.expenses.date, `${monthKey}-31`)
      )
    )
    .orderBy(desc(schema.expenses.date));
}

export async function createExpense(
  orgId: string,
  data: {
    date: string;
    category: Expense["category"];
    amountBani: number;
    buildingId?: string | null;
    note?: string | null;
  }
): Promise<Expense> {
  const rows = await getDb()
    .insert(schema.expenses)
    .values({ orgId, ...data })
    .returning();
  return rows[0]!;
}
