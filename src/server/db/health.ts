// One question, answered honestly: can this deployment reach a database with
// data in it? The admin layout turns the answer into a banner with the exact
// next step, and /api/health reports it so a broken deployment can be
// diagnosed with curl instead of guesswork.

import { dbUnconfiguredReason, getDb, schema } from "./index";

export type DbStatus = "ok" | "unconfigured" | "unreachable" | "empty";

declare global {
  // Once a deployment has answered "ok" it stays ok for the life of the
  // process — re-pinging Turso on every admin page load would tax the thing
  // we're checking. Failures are NOT cached: each render re-checks, so the
  // banner clears the moment the fix lands.
  var __scaraDbOk: boolean | undefined;
}

export async function dbStatus(): Promise<DbStatus> {
  if (globalThis.__scaraDbOk) return "ok";
  if (dbUnconfiguredReason()) return "unconfigured";
  try {
    const rows = await getDb().select().from(schema.orgs).limit(1);
    if (rows.length === 0) return "empty";
    globalThis.__scaraDbOk = true;
    return "ok";
  } catch (e) {
    // A reachable database that was never migrated answers "no such table".
    // That is the same situation as zero rows — it needs `npm run seed`,
    // which migrates first — not a connectivity problem.
    if (e instanceof Error && /no such table/i.test(e.message)) return "empty";
    return "unreachable";
  }
}
