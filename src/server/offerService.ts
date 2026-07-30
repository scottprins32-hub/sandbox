// Orchestrates offer generation: price it through the finance module, render
// the Romanian PDF, store it, record what was quoted, and move the prospect to
// 'quoted' so the Atlas pipeline stays true.

import { priceOffer } from "@/lib/finance";
import { todayYmd } from "@/lib/dates";
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
}

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

  const pdf = await renderOfferPdf({
    orgName: org.name,
    cui: org.cui,
    vatRegistered: settings.vatRegistered === true,
    contactLine: typeof settings.contactLine === "string" ? settings.contactLine : "",
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
  return renderProtocolPdf({
    orgName: org.name,
    cui: org.cui,
    clientName: "Asociația de proprietari (exemplu)",
    buildingLabel: "Bloc exemplu, scara 1",
    address: "Giroc, Timiș",
    monthKey: todayYmd().slice(0, 7),
    scheduled: 9,
    done: 9,
    visitsPerWeek: 2,
    photoCount: 24,
    issuesResolved: 1,
    sample: true,
  });
}
