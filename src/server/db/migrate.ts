// Standalone migration runner: `npm run db:migrate`.
// Applies drizzle/ SQL migrations to whichever database the env points at
// (Turso when TURSO_DATABASE_URL is set, else the local dev SQLite file).

import path from "node:path";
import fs from "node:fs";

async function main() {
  const folder = path.join(process.cwd(), "drizzle");
  if (process.env.TURSO_DATABASE_URL) {
    const { createClient } = await import("@libsql/client");
    const { drizzle } = await import("drizzle-orm/libsql");
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    await migrate(drizzle(client), { migrationsFolder: folder });
    console.log("Migrated Turso database.");
  } else {
    const { default: Database } = await import("better-sqlite3");
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    fs.mkdirSync(path.join(process.cwd(), ".data"), { recursive: true });
    const sqlite = new Database(path.join(process.cwd(), ".data", "scara.db"));
    migrate(drizzle(sqlite), { migrationsFolder: folder });
    console.log("Migrated local SQLite database (.data/scara.db).");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
