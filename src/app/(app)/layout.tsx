import "../globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { RoleSwitcher, type RoleOption } from "@/components/RoleSwitcher";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: "Scara",
  description: "Building-services operations platform",
};

// Cleaner identities come from the DB; before the seed exists the switcher
// falls back to admin/ops only.
async function roleOptions(): Promise<RoleOption[]> {
  const base: RoleOption[] = [
    { value: "admin", label: en.roles.admin },
    { value: "ops", label: en.roles.ops },
  ];
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
  { href: "/portal", label: en.nav.portal },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const role = cookieStore.get("scara_role")?.value ?? "admin";
  const options = await roleOptions();

  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
            <Link href="/sim" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-block h-5 w-5 rounded-md bg-moss-deep align-middle" aria-hidden>
                <svg viewBox="0 0 32 32" className="h-5 w-5">
                  <path
                    d="M8 24h6v-5h5v-5h5V9"
                    fill="none"
                    stroke="#f6f5f1"
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
