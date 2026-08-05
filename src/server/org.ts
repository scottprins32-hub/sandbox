// getCurrentOrg — the multi-tenant seam's resolver (§3). Today it returns the
// single seeded org; later, real auth resolves the org from the session. No
// org-switching UI exists on purpose (see docs/FRANCHISE_LATER.md).

import { asc } from "drizzle-orm";
import { getDb, schema } from "./db";

export interface CurrentOrg {
  id: string;
  name: string;
  cui: string;
  localeDefault: string;
}

export interface OrgSettingsJson {
  ronPerEur?: number;
  partTimeFloorBani?: number;
  platformFeeBani?: number;
  /** Drives the TVA line on the ofertă. Micro-enterprise default is false. */
  vatRegistered?: boolean;
  /** Phone/email printed on the ofertă. */
  contactLine?: string;
  // Document identity (design-system header + signature blocks).
  address?: string;
  regCom?: string; // J35/0000/2026
  email?: string;
  phone?: string;
  iban?: string;
  /** Who signs for the prestator, e.g. "Adina Pop". */
  representative?: string;
  /** Posted-schedule visit window (add-on 2 §C1), e.g. "07:00". */
  visitWindowFrom?: string;
  visitWindowTo?: string;
  [key: string]: unknown;
}

export async function getCurrentOrg(): Promise<CurrentOrg> {
  const db = getDb();
  const rows = await db.select().from(schema.orgs).orderBy(asc(schema.orgs.createdAt)).limit(1);
  const org = rows[0];
  if (!org) {
    throw new Error("No org found. Run `npm run seed` to load the demo world.");
  }
  return { id: org.id, name: org.name, cui: org.cui, localeDefault: org.localeDefault };
}
