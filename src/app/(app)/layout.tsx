import "../globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { fontVars } from "../fonts";
import { RoleSwitcher, type RoleOption } from "@/components/RoleSwitcher";
import { dbStatus } from "@/server/db/health";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: "Scara",
  description: "Building-services operations platform",
};

// Cleaner identities come from the DB; before the seed exists the switcher
// falls back to admin/ops only. `dbOk` gates the lookup: dbStatus() has
// already probed with a timeout, and repeating the query against a dead or
// hanging database would stall every page render a second time.
async function roleOptions(dbOk: boolean): Promise<RoleOption[]> {
  const base: RoleOption[] = [
    { value: "admin", label: en.roles.admin },
    { value: "ops", label: en.roles.ops },
  ];
  if (!dbOk) return base;
  try {
    const { getCurrentOrg } = await import("@/server/org");
    const { listActiveCleaners } = await import("@/server/repo/cleaners");
    const org = await getCurrentOrg();
    for (const c of await listActiveCleaners(org.id)) {
      base.push({
        value: `cleaner:${c.userId}`,
        label: `${en.roles.cleanerPrefix}: ${c.name}`,
      });
    }
  } catch {
    // No database yet (fresh clone before `npm run seed`).
  }
  return base;
}

const NAV = [
  { href: "/sim", label: en.nav.sim },
  { href: "/atlas", label: en.nav.atlas },
  { href: "/ops", label: en.nav.ops },
  { href: "/compliance", label: en.nav.compliance },
  { href: "/services", label: en.nav.services },
  { href: "/portal", label: en.nav.portal },
];

// What the admin sees when the deployment has no working database. The
// database-backed screens (Ops, Portal, leads) crash into an error boundary
// whose message production redacts, so THIS is the only place the real cause
// and the exact fix can reach the person who can act on it.
const DB_BANNER: Record<string, { title: string; body: React.ReactNode }> = {
  unconfigured: {
    title: "No database connected.",
    body: (
      <>
        Simulator, Obligations and Services work; everything that stores data
        (Ops, Portal, leads) will fail until it exists. Create a free Turso
        database, set <code>TURSO_DATABASE_URL</code> and{" "}
        <code>TURSO_AUTH_TOKEN</code> in the hosting environment, redeploy,
        then run <code>npm run seed</code> against it once.
      </>
    ),
  },
  unreachable: {
    title: "The database is not answering.",
    body: (
      <>
        Check <code>TURSO_DATABASE_URL</code> and <code>TURSO_AUTH_TOKEN</code>{" "}
        in the hosting environment — a typo or an expired token looks exactly
        like this. Data-backed screens will fail until it responds.
      </>
    ),
  },
  empty: {
    title: "The database is connected but empty.",
    body: (
      <>
        Run{" "}
        <code>TURSO_DATABASE_URL=… TURSO_AUTH_TOKEN=… npm run seed</code> from
        the project folder once to create the tables and load the demo world.
      </>
    ),
  },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const role = cookieStore.get("scara_role")?.value ?? "admin";
  const db = await dbStatus();
  const options = await roleOptions(db === "ok");
  const dbBanner = DB_BANNER[db];

  // A production deployment with no passcode is publicly readable, including
  // the Simulator's margins. Fail loudly rather than silently.
  const ungatedInProduction =
    process.env.NODE_ENV === "production" && !process.env.SCARA_PASSCODE;

  return (
    <html lang="en" className={fontVars}>
      <body>
        {ungatedInProduction && (
          <div className="bg-danger px-4 py-2 text-center text-sm text-paper">
            <strong>This deployment has no passcode.</strong> Anyone with the URL can read
            your margins and client data. Set <code>SCARA_PASSCODE</code> in the hosting
            environment and redeploy.
          </div>
        )}
        {dbBanner && (
          <div className="bg-warn px-4 py-2 text-center text-sm text-paper">
            <strong>{dbBanner.title}</strong> {dbBanner.body}
          </div>
        )}
        <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
            <Link href="/sim" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-block h-5 w-5 rounded-md bg-moss-deep align-middle" aria-hidden>
                <svg viewBox="0 0 32 32" className="h-5 w-5">
                  <path
                    d="M8 24h6v-5h5v-5h5V9"
                    fill="none"
                    stroke="#F7F5F0"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Scara
            </Link>
            <nav className="flex items-center gap-1 overflow-x-auto text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2.5 py-1.5 text-ink-soft hover:bg-moss-wash hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto">
              <RoleSwitcher current={role} options={options} />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
