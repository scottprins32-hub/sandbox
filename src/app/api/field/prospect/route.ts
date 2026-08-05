import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { upsertProspect } from "@/server/repo/prospects";
import { addProspectEvent, createContact, getRoute } from "@/server/repo/prospecting";

// Field capture writes (add-on 2 §3.3). Ids are client-generated so a replay
// from the offline queue updates the same building instead of creating a
// second one. Contacts arrive with the prospect so a whole capture lands as
// one unit even after a long time offline.

const UUID = /^[0-9a-f-]{36}$/i;
const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const n = (v: unknown): number | null => {
  const x = Number(v);
  return Number.isFinite(x) ? Math.round(x) : null;
};

const OWNERSHIP = ["asociatie", "proprietar_unic", "dezvoltator", "necunoscut"] as const;
const ACCESS = ["deschis", "interfon", "poarta", "necunoscut"] as const;
const INCUMBENT = ["niciunul", "femeie_serviciu", "firma", "necunoscut"] as const;
const ROLES = ["administrator", "presedinte", "comitet", "proprietar", "dezvoltator"] as const;

type Body = {
  id?: string;
  routeId?: string;
  label?: string;
  street?: string;
  number?: string;
  commune?: string;
  floors?: number;
  entrances?: number;
  apartmentsEst?: number;
  ownership?: string;
  access?: string;
  incumbent?: string;
  incumbentName?: string;
  assemblyMonth?: number;
  notes?: string;
  lat?: number;
  lng?: number;
  contacts?: { id?: string; role?: string; name?: string; phone?: string }[];
};

export async function POST(request: NextRequest) {
  const org = await getCurrentOrg();
  const body = (await request.json()) as Body;
  if (!UUID.test(body.id ?? "")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // A route id that doesn't resolve in this org is discarded, never fatal.
  // Route ids are minted per seed, so after a re-seed every queued capture
  // carries a stale one — and losing the building over its grouping metadata
  // is the one failure this module may not have. The capture lands routeless
  // and shows up on the org-wide list instead of vanishing from the phone.
  let routeId: string | null = null;
  if (body.routeId) {
    const route = await getRoute(org.id, body.routeId);
    routeId = route?.id ?? null;
  }

  const street = s(body.street, 120);
  const number = s(body.number, 20);
  const label = s(body.label, 160) || [street, number].filter(Boolean).join(" ") || "Clădire";
  const month = n(body.assemblyMonth);

  await upsertProspect(org.id, body.id!, {
    label,
    routeId,
    street: street || null,
    number: number || null,
    commune: s(body.commune, 80) || "Giroc",
    floors: n(body.floors),
    entrances: n(body.entrances),
    apartmentsEst: n(body.apartmentsEst),
    ownership: (OWNERSHIP as readonly string[]).includes(body.ownership ?? "")
      ? (body.ownership as (typeof OWNERSHIP)[number])
      : "necunoscut",
    access: (ACCESS as readonly string[]).includes(body.access ?? "")
      ? (body.access as (typeof ACCESS)[number])
      : "necunoscut",
    incumbent: (INCUMBENT as readonly string[]).includes(body.incumbent ?? "")
      ? (body.incumbent as (typeof INCUMBENT)[number])
      : "necunoscut",
    incumbentName: s(body.incumbentName, 120) || null,
    assemblyMonth: month && month >= 1 && month <= 12 ? month : null,
    notes: s(body.notes, 1000) || null,
    lat: typeof body.lat === "number" ? body.lat : null,
    lng: typeof body.lng === "number" ? body.lng : null,
    status: "vizitat",
  });

  for (const c of body.contacts ?? []) {
    const name = s(c.name, 120);
    if (!name || !UUID.test(c.id ?? "")) continue;
    await createContact(org.id, {
      id: c.id!,
      prospectId: body.id!,
      role: (ROLES as readonly string[]).includes(c.role ?? "")
        ? (c.role as (typeof ROLES)[number])
        : "administrator",
      name,
      phone: s(c.phone, 40) || null,
      // Always recorded (§3.4): this came off the notice board.
      source: "avizier",
    });
  }

  await addProspectEvent(org.id, {
    prospectId: body.id!,
    kind: "vizita",
    summary: "Capturat pe teren",
  });

  return NextResponse.json({ ok: true });
}
