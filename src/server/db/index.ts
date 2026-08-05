// Database access — driver chosen by env (§3):
//   production: Turso (libSQL) via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
//   dev:        local SQLite file via better-sqlite3 (.data/scara.db)
// Never assume a writable server filesystem in production.
// UI components never import this — repository functions in src/server/repo do.

import fs from "node:fs";
import path from "node:path";
import { drizzle as drizzleLibsql, type LibSQLDatabase } from "drizzle-orm/libsql";
import {
  drizzle as drizzleBetter,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { migrate as migrateBetter } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema> | BetterSQLite3Database<typeof schema>;

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

declare global {
  // Cached across HMR reloads in dev.
  var __scaraDb: Db | undefined;
}

/**
 * On serverless (Vercel) the SQLite fallback is a trap, not a fallback: the
 * filesystem is read-only, and even where it is writable each instance would
 * get its own private, empty database that vanishes on the next deploy. So
 * with no Turso URL configured there, fail with a sentence a person can act
 * on — not an EROFS from deep inside a native module.
 */
export function dbUnconfiguredReason(): string | null {
  if (process.env.TURSO_DATABASE_URL) return null;
  if (!process.env.VERCEL) return null;
  return "No database is configured: set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in the hosting environment and redeploy.";
}

function createDb(): Db {
  const unconfigured = dbUnconfiguredReason();
  if (unconfigured) throw new Error(unconfigured);

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    // Lazy CJS loads keep the unused driver out of the running process.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client") as typeof import("@libsql/client");
    const client = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzleLibsql(client, { schema });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  const dir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dir, { recursive: true });
  const sqlite = new Database(path.join(dir, "scara.db"));
  sqlite.pragma("journal_mode = WAL");
  const db = drizzleBetter(sqlite, { schema });
  // Dev convenience: keep the local file current so `npm run dev` after a fresh
  // clone works. Prod (Turso) migrations run via `npm run db:migrate`.
  migrateBetter(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
}

export function getDb(): Db {
  if (!globalThis.__scaraDb) globalThis.__scaraDb = createDb();
  return globalThis.__scaraDb;
}

export { schema };
