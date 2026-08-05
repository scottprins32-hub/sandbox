import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentOrg } from "@/server/org";
import { listRoutes } from "@/server/repo/prospecting";
import { listProspects } from "@/server/repo/prospects";
import { STATUS_LABEL_RO } from "@/lib/prospecting/field-data";
import { ProspectMap, type MapPark, type MapPin } from "./ProspectMap";

export const metadata: Metadata = { title: "Hartă teren · Scara" };
export const dynamic = "force-dynamic";

export default async function HartaPage() {
  const org = await getCurrentOrg();
  const [routes, prospects] = await Promise.all([
    listRoutes(org.id),
    listProspects(org.id),
  ]);

  const pins: MapPin[] = prospects.flatMap((p) =>
    p.lat != null && p.lng != null
      ? [
          {
            id: p.id,
            label: p.label,
            lat: p.lat,
            lng: p.lng,
            status: p.status,
            statusLabel: STATUS_LABEL_RO[p.status],
            href: p.routeId ? `/ops/teren/${p.routeId}/${p.id}` : "/ops/teren",
          },
        ]
      : []
  );
  const parks: MapPark[] = routes.flatMap((r) =>
    r.parkAtLat != null && r.parkAtLng != null
      ? [{ label: r.name, lat: r.parkAtLat, lng: r.parkAtLng }]
      : []
  );
  const withoutGps = prospects.length - pins.length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Hartă teren</h1>
        <Link href="/ops/teren" className="text-sm text-moss underline">
          Rute
        </Link>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        {pins.length} clădiri cu coordonate
        {withoutGps > 0 && ` · ${withoutGps} fără GPS, capturate fără permisiune de locație`}
      </p>
      <div className="mt-3">
        <ProspectMap pins={pins} parks={parks} />
      </div>
    </div>
  );
}
