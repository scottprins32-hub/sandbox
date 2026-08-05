import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentOrg } from "@/server/org";
import { listRoutes } from "@/server/repo/prospecting";
import { listProspects } from "@/server/repo/prospects";
import { seedRoutesAction } from "../actions";
import { FieldSyncChip } from "./SyncChip";

// Route picker (add-on 2 §3.3). Romanian: this is a field screen.

export const metadata: Metadata = { title: "Teren · Scara" };
export const dynamic = "force-dynamic";

export default async function TerenPage() {
  const org = await getCurrentOrg();
  const [routes, prospects] = await Promise.all([
    listRoutes(org.id),
    listProspects(org.id),
  ]);
  const countByRoute = new Map<string, number>();
  const visitedByRoute = new Map<string, number>();
  for (const p of prospects) {
    if (!p.routeId) continue;
    countByRoute.set(p.routeId, (countByRoute.get(p.routeId) ?? 0) + 1);
    if (p.status !== "de_vizitat") {
      visitedByRoute.set(p.routeId, (visitedByRoute.get(p.routeId) ?? 0) + 1);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Rute de teren</h1>
        <div className="flex items-center gap-2">
          <FieldSyncChip />
          <Link href="/ops/teren/harta" className="text-sm text-moss underline">
            Hartă
          </Link>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="mt-4 rounded-xl bg-surface p-6 text-center shadow-card">
          <p className="text-sm text-ink-soft">
            Nicio rută încărcată. Cele cinci rute din studiul de teren se încarcă o
            singură dată.
          </p>
          <form action={seedRoutesAction} className="mt-3">
            <button className="rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper">
              Încarcă rutele
            </button>
          </form>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {routes.map((r) => {
            const captured = countByRoute.get(r.id) ?? 0;
            const visited = visitedByRoute.get(r.id) ?? 0;
            return (
              <li key={r.id}>
                <Link
                  href={`/ops/teren/${r.id}`}
                  className="block rounded-xl bg-surface p-4 shadow-card"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-medium">{r.name}</h2>
                    <span className="tnum shrink-0 text-xs text-ink-faint">
                      {visited} / {r.estBuildings ?? "?"}
                    </span>
                  </div>
                  {r.description && (
                    <p className="mt-0.5 text-xs text-ink-soft">{r.description}</p>
                  )}
                  {r.parkAtLabel && (
                    <p className="mt-1 text-xs text-ink-faint">Parcare: {r.parkAtLabel}</p>
                  )}
                  {r.notes && (
                    <p className="mt-1.5 border-l-2 border-moss pl-2 text-xs leading-relaxed text-ink-soft">
                      {r.notes}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-ink-faint">
                    {captured} clădiri consemnate
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        Datele de contact se citesc de pe avizier, unde Legea 196/2018 art. 57 lit. m)
        obligă asociația să le afișeze. Nu fotografia lista de plată.
      </p>
    </div>
  );
}
