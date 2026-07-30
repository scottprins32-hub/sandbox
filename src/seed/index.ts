// CLI entry: `npm run seed`. Migrates the database the env points at, then
// loads the §8 demo world.

import path from "node:path";
import fs from "node:fs";

async function migrateFirst() {
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
  } else {
    const { default: Database } = await import("better-sqlite3");
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    fs.mkdirSync(path.join(process.cwd(), ".data"), { recursive: true });
    const sqlite = new Database(path.join(process.cwd(), ".data", "scara.db"));
    migrate(drizzle(sqlite), { migrationsFolder: folder });
    sqlite.close();
  }
}

async function main() {
  await migrateFirst();
  const { seedDemo } = await import("./seed");
  const { orgId } = await seedDemo();
  console.log(`Seeded demo world for org ${orgId}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
