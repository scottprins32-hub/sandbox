import Link from "next/link";
import { getPortalCleaner } from "@/server/portalAuth";
import { ro } from "@/lib/i18n/ro";
import { SyncChip } from "./SyncChip";
import { LogoutButton } from "./LogoutButton";

// Portal chrome: warm, short, phone-first (§8). Bottom tab bar only when a
// cleaner is signed in.
export default async function PortalShell({ children }: { children: React.ReactNode }) {
  const cleaner = await getPortalCleaner();

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md pb-24">
      <header className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-5 w-5 rounded-md bg-moss-deep" aria-hidden>
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
        </span>
        {cleaner && (
          <span className="flex items-center gap-3 text-sm text-ink-soft">
            {cleaner.name.split(" ")[0]}
            <LogoutButton />
          </span>
        )}
      </header>

      <main className="px-4">{children}</main>
      <SyncChip />

      {cleaner && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface">
          <div className="mx-auto grid max-w-md grid-cols-4 text-center text-xs">
            {[
              { href: "/portal", label: ro.portal.nav.today },
              { href: "/portal/joburi", label: ro.portal.nav.jobs },
              { href: "/portal/ore", label: ro.portal.nav.hours },
              { href: "/portal/contract", label: ro.portal.nav.contract },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-3.5 font-medium text-ink-soft hover:text-moss-deep"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
