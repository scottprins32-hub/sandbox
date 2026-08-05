// One question, answered honestly: can this deployment reach a database with
// data in it? The admin layout turns the answer into a banner with the exact
// next step, and /api/health reports it so a broken deployment can be
// diagnosed with curl instead of guesswork.

import { dbUnconfiguredReason, getDb, schema } from "./index";

export type DbStatus = "ok" | "unconfigured" | "unreachable" | "empty";

/**
 * A probe that hangs is worse than one that fails: /sim and /compliance need
 * no database at all, and they must not wait on a blackholed Turso endpoint
 * before sending HTML. Past this, the verdict is "unreachable".
 */
const PROBE_TIMEOUT_MS = 2_500;

/**
 * "ok" is cached briefly — not forever. Forever meant a warm instance whose
 * database later died kept reporting ok: no banner, /api/health lying, while
 * every data screen crashed. Thirty seconds bounds the staleness at one
 * reload's worth; failures are never cached at all, so the banner clears the
 * moment a fix lands.
 */
const OK_TTL_MS = 30_000;

declare global {
  var __scaraDbOkUntil: number | undefined;
}

/**
 * Drizzle's libsql driver wraps failures in DrizzleQueryError whose message
 * is just "Failed query: …" — the real "no such table" text lives on the
 * cause chain. better-sqlite3 throws it raw. Walk the chain so both drivers
 * classify the same.
 */
function mentionsMissingTable(e: unknown, depth = 0): boolean {
  if (!(e instanceof Error) || depth > 5) return false;
  if (/no such table/i.test(e.message)) return true;
  return mentionsMissingTable(e.cause, depth + 1);
}

export async function dbStatus(opts: { fresh?: boolean } = {}): Promise<DbStatus> {
  if (!opts.fresh && globalThis.__scaraDbOkUntil && Date.now() < globalThis.__scaraDbOkUntil) {
    return "ok";
  }
  if (dbUnconfiguredReason()) return "unconfigured";
  try {
    const probe = getDb().select().from(schema.orgs).limit(1);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const rows = await Promise.race([
      probe,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("db probe timeout")), PROBE_TIMEOUT_MS);
      }),
    ]).finally(() => clearTimeout(timer));
    if (rows.length === 0) return "empty";
    globalThis.__scaraDbOkUntil = Date.now() + OK_TTL_MS;
    return "ok";
  } catch (e) {
    // A reachable database that was never migrated answers "no such table".
    // That is the same situation as zero rows — it needs `npm run seed`,
    // which migrates first — not a connectivity problem.
    if (mentionsMissingTable(e)) return "empty";
    return "unreachable";
  }
}
