// Orchestrates offer generation: price it through the finance module, render
// the Romanian PDF, store it, record what was quoted, and move the prospect to
// 'quoted' so the Atlas pipeline stays true.

import { priceOffer } from "@/lib/finance";
import { todayYmd } from "@/lib/dates";
import { applicableObligations, type BuildingFlags, type Obligation } from "@/lib/compliance";
import { SERVICE_LINE_BY_KEY, UNIT_LABEL_RO } from "@/lib/compliance/services";
import { fmtLeiRound } from "@/lib/money";
import { getCurrentOrg } from "./org";
import { getOrgSettings } from "./repo/settings";
import { listTemplates, listTemplateItems } from "./repo/checklists";
import { getProspect, updateProspect } from "./repo/prospects";
import { createOffer, type Offer } from "./repo/offers";
import { renderOfferPdf } from "./pdf/offer";
import { renderProtocolPdf } from "./pdf/protocol";
import { getStorage } from "./storage";

export interface OfferRequest {
  prospectId?: string | null;
  clientName: string;
  buildingLabel: string;
  address?: string;
  floors: number;
  apartments: number;
  residents: number;
  visitsPerWeek: number;
  hoursPerVisit: number;
  priceBani: number;
  /** Days the offer stays valid. */
  validDays?: number;
  /**
   * Building facts for the compliance sections (add-on §8). When present the
   * offer carries the applicable obligations subset, the summed statutory
   * exposure and the honest boundaries list.
   */
  flags?: BuildingFlags;
  /** Extra service-line keys included in the offer, priced at catalogue default. */
  extraServiceKeys?: string[];
}

const cadenceRo = (o: Obligation): string => {
  const c = o.cadence;
  switch (c.kind) {
    case "fixed":
      return c.perYear === 1 ? "o dată pe an" : `de ${c.perYear} ori pe an`;
    case "months":
      return c.every === 1 ? "lunar" : `la ${c.every} luni`;
    case "years":
      return c.every === 1 ? "anual" : `la ${c.every} ani`;
    case "continuous":
      return "permanent";
    case "seasonal":
      return `sezonier, lunile ${c.fromMonth}-${c.toMonth}`;
    case "event":
      return "la eveniment";
    case "once":
      return `o singură dată, până la ${c.byDate.split("-").reverse().join(".")}`;
  }
};

const fineRangeRo = (o: Obligation): string => {
  if (o.fineMinBani === null && o.fineMaxBani === null) return "nespecificată";
  if (o.fineMinBani !== null && o.fineMaxBani !== null) {
    return `${fmtLeiRound(o.fineMinBani)} - ${fmtLeiRound(o.fineMaxBani)} lei`;
  }
  return `${fmtLeiRound((o.fineMaxBani ?? o.fineMinBani)!)} lei`;
};

/** Fallback scope if the org has no checklist template yet. */
const DEFAULT_SCOPE = [
  "Măturat și spălat scările și podestele",
  "Curățat holul de intrare și ușa",
  "Șters cutiile poștale",
  "Șters balustrada",
  "Verificat și curățat zona tomberoanelor",
  "Măturat trotuarul din fața intrării",
];

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d! + days));
  return date.toISOString().slice(0, 10);
}

async function scopeLines(orgId: string): Promise<string[]> {
  const templates = await listTemplates(orgId);
  const first = templates[0];
  if (!first) return DEFAULT_SCOPE;
  const items = await listTemplateItems(orgId, first.id);
  return items.length > 0 ? items.map((i) => i.textRo) : DEFAULT_SCOPE;
}

export async function generateOffer(orgId: string, req: OfferRequest): Promise<Offer> {
  const org = await getCurrentOrg();
  const settings = await getOrgSettings(orgId);

  const pricing = priceOffer({
    floors: req.floors,
    apartments: req.apartments,
    residents: req.residents,
    visitsPerWeek: req.visitsPerWeek,
    hoursPerVisit: req.hoursPerVisit,
    priceBani: req.priceBani,
  });

  const validUntil = addDays(todayYmd(), req.validDays ?? 30);

  // Compliance sections (add-on §8): obligations subset by the building's
  // facts, summed statutory maximums, the selected service lines.
  let compliance: Parameters<typeof renderOfferPdf>[0]["compliance"];
  if (req.flags) {
    const obligations = applicableObligations(req.flags);
    const extras = (req.extraServiceKeys ?? [])
      .map((key) => SERVICE_LINE_BY_KEY[key])
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const serviceLines = [
      {
        name: "Curățenie casa scării",
        unitLabel: UNIT_LABEL_RO.per_building_month,
        priceBani: req.priceBani,
      },
      ...extras.map((s) => ({
        name: s.nameRo,
        unitLabel: UNIT_LABEL_RO[s.unit],
        priceBani: s.defaultPriceBani,
      })),
    ];
    const monthlyTotalBani =
      req.priceBani +
      extras.reduce((sum, s) => {
        if (s.unit === "per_building_month") return sum + s.defaultPriceBani;
        if (s.unit === "per_apartment_month") return sum + s.defaultPriceBani * req.apartments;
        return sum;
      }, 0);
    compliance = {
      serviceLines,
      monthlyTotalBani,
      obligations: obligations.map((o) => ({
        name: o.nameRo,
        cadence: cadenceRo(o),
        fineRange: fineRangeRo(o),
        citation: o.legalBasis.join(" · "),
      })),
      exposureBani: obligations.reduce((sum, o) => sum + (o.fineMaxBani ?? 0), 0),
    };
  }

  const pdf = await renderOfferPdf({
    orgName: org.name,
    cui: org.cui,
    vatRegistered: settings.vatRegistered === true,
    contactLine: typeof settings.contactLine === "string" ? settings.contactLine : "",
    identity: {
      regCom: settings.regCom,
      address: settings.address,
      email: settings.email,
      phone: settings.phone,
    },
    representative: settings.representative,
    clientName: req.clientName,
    buildingLabel: req.buildingLabel,
    address: req.address ?? "",
    floors: req.floors,
    apartments: req.apartments,
    residents: req.residents,
    visitsPerWeek: req.visitsPerWeek,
    hoursPerVisit: req.hoursPerVisit,
    priceBani: req.priceBani,
    perApartmentBani: pricing.perApartmentBani,
    perPersonBani: pricing.perPersonBani,
    scope: await scopeLines(orgId),
    validUntil,
    compliance,
  });

  const offer = await createOffer(orgId, {
    prospectId: req.prospectId ?? null,
    clientName: req.clientName,
    buildingLabel: req.buildingLabel,
    address: req.address ?? "",
    floors: req.floors,
    apartments: req.apartments,
    residents: req.residents,
    visitsPerWeek: req.visitsPerWeek,
    hoursPerVisit: req.hoursPerVisit,
    priceBani: req.priceBani,
    validUntil,
    pdfFileKey: "pending",
  });

  const fileKey = `${orgId}/offers/oferta-${offer.id}.pdf`;
  await getStorage().put(fileKey, pdf, "application/pdf");
  const { getDb, schema } = await import("./db");
  const { eq, and } = await import("drizzle-orm");
  await getDb()
    .update(schema.offers)
    .set({ pdfFileKey: fileKey })
    .where(and(eq(schema.offers.orgId, orgId), eq(schema.offers.id, offer.id)));

  // Sending an offer means the prospect is quoted. Keep the pipeline honest.
  if (req.prospectId) {
    const prospect = await getProspect(orgId, req.prospectId);
    if (prospect && prospect.status !== "won" && prospect.status !== "lost") {
      await updateProspect(orgId, req.prospectId, {
        status: "quoted",
        quotedPriceBani: req.priceBani,
      });
    }
  }

  return { ...offer, pdfFileKey: fileKey };
}

/**
 * The proof pack's second half: a specimen proces-verbal so a prospect can see
 * exactly what they will receive each month. Watermarked MODEL — it must never
 * read as a record of work delivered.
 */
export async function renderSampleProtocol(): Promise<Uint8Array> {
  const org = await getCurrentOrg();
  const { getOrgSettings } = await import("./repo/settings");
  const settings = await getOrgSettings(org.id);
  const monthKey = todayYmd().slice(0, 7);
  const mm = monthKey.slice(5, 7);
  const yyyy = monthKey.slice(0, 4);
  // Obviously-specimen content: placeholder names, plausible record shape.
  return renderProtocolPdf({
    org: {
      name: org.name,
      cui: org.cui,
      regCom: settings.regCom,
      address: settings.address,
      email: settings.email,
      phone: settings.phone,
    },
    representative: settings.representative,
    clientName: "Asociația de proprietari (exemplu)",
    buildingLabel: "Bloc exemplu, scara 1",
    address: "Giroc, Timiș",
    monthKey,
    scheduled: 9,
    done: 8,
    missed: 1,
    visitsPerWeek: 2,
    photoCount: 24,
    visits: [
      { date: `02.${mm}.${yyyy}`, interval: "07:00 - 08:30", operator: "Exemplu I.", photoCount: 3, status: "efectuata" },
      { date: `06.${mm}.${yyyy}`, interval: "07:05 - 08:25", operator: "Exemplu I.", photoCount: 3, status: "efectuata" },
      { date: `09.${mm}.${yyyy}`, interval: "07:00 - 08:40", operator: "Exemplu V.", photoCount: 4, status: "efectuata" },
      { date: `13.${mm}.${yyyy}`, interval: "07:10 - 08:30", operator: "Exemplu I.", photoCount: 3, status: "efectuata" },
      { date: `16.${mm}.${yyyy}`, interval: null, operator: null, photoCount: 0, status: "ratata" },
      { date: `17.${mm}.${yyyy}`, interval: "07:00 - 08:55", operator: "Exemplu I.", photoCount: 4, status: "efectuata" },
      { date: `20.${mm}.${yyyy}`, interval: "07:00 - 08:20", operator: "Exemplu V.", photoCount: 3, status: "efectuata" },
      { date: `24.${mm}.${yyyy}`, interval: "07:00 - 08:30", operator: "Exemplu I.", photoCount: 2, status: "efectuata" },
      { date: `30.${mm}.${yyyy}`, interval: "07:00 - 08:30", operator: "Exemplu I.", photoCount: 2, status: "efectuata" },
    ],
    activities: DEFAULT_SCOPE,
    observations: [
      `Vizita din 16.${mm}.${yyyy} nu a fost efectuată din cauza accesului blocat; a fost recuperată pe 17.${mm}.${yyyy}, cu acordul președintelui asociației.`,
    ],
    priceBani: 1250_00,
    vatRegistered: settings.vatRegistered === true,
    iban: settings.iban,
    issuesResolved: 1,
    sample: true,
  });
}
