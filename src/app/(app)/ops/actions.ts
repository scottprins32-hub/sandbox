"use server";

// Ops server actions. Every repo call is org-scoped via getCurrentOrg (§3).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/server/org";
import { generateWeekVisits, createVisit, updateVisit } from "@/server/repo/visits";
import { createBuilding, updateBuilding } from "@/server/repo/buildings";
import { createIssue, setIssueStatus } from "@/server/repo/issues";
import { setLeadStatus } from "@/server/repo/leads";
import { generateProtocol } from "@/server/protocolService";
import { markProtocolSigned } from "@/server/repo/protocols";
import { createProspect, getProspect, updateProspect } from "@/server/repo/prospects";
import { updateOrgIdentity, updateOrgSettings } from "@/server/repo/settings";
import { createExpense } from "@/server/repo/expenses";
import { todayYmd } from "@/lib/dates";

export async function generateThisWeekAction() {
  const org = await getCurrentOrg();
  await generateWeekVisits(org.id, todayYmd());
  revalidatePath("/ops");
}

export async function startVisitAction(visitId: string) {
  const org = await getCurrentOrg();
  await updateVisit(org.id, visitId, { status: "in_progress", startedAt: Date.now() });
  revalidatePath(`/ops/visits/${visitId}`);
}

export async function finishVisitAction(visitId: string) {
  const org = await getCurrentOrg();
  await updateVisit(org.id, visitId, { status: "done", finishedAt: Date.now() });
  revalidatePath(`/ops/visits/${visitId}`);
  revalidatePath("/ops");
}

export async function markVisitMissedAction(visitId: string) {
  const org = await getCurrentOrg();
  await updateVisit(org.id, visitId, { status: "missed" });
  revalidatePath(`/ops/visits/${visitId}`);
  revalidatePath("/ops");
}

export async function rescheduleVisitAction(visitId: string, formData: FormData) {
  const org = await getCurrentOrg();
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  await updateVisit(org.id, visitId, { status: "scheduled", scheduledDate: date });
  revalidatePath(`/ops/visits/${visitId}`);
  revalidatePath("/ops");
}

export async function assignVisitCleanerAction(visitId: string, formData: FormData) {
  const org = await getCurrentOrg();
  const cleanerId = String(formData.get("cleanerId") ?? "");
  await updateVisit(org.id, visitId, {
    cleanerId: cleanerId || null,
    status: "scheduled",
    openOffer: cleanerId ? false : undefined,
  });
  revalidatePath(`/ops/visits/${visitId}`);
}

/** Confirm a portal claim: keep the cleaner, clear the open-offer flag. */
export async function confirmClaimAction(visitId: string) {
  const org = await getCurrentOrg();
  await updateVisit(org.id, visitId, { status: "scheduled", openOffer: false });
  revalidatePath(`/ops/visits/${visitId}`);
  revalidatePath("/ops");
}

export async function createVisitAction(formData: FormData) {
  const org = await getCurrentOrg();
  const type = String(formData.get("type") ?? "turnover") as "turnover" | "oneoff" | "recurring";
  const buildingId = String(formData.get("buildingId") ?? "");
  const priceLei = Number(formData.get("priceLei") ?? 0);
  const bonusLei = Number(formData.get("bonusLei") ?? 0);
  const visit = await createVisit(org.id, {
    type,
    buildingId: buildingId || null,
    cleanerId: String(formData.get("cleanerId") ?? "") || null,
    scheduledDate: String(formData.get("date") ?? todayYmd()),
    window: (String(formData.get("window") ?? "am") as "am" | "pm") || "am",
    status: "scheduled",
    priceBani: type === "recurring" ? null : Math.round(priceLei * 100),
    locationLabel: String(formData.get("locationLabel") ?? "") || null,
    openOffer: formData.get("openOffer") === "on",
    bonusBani: bonusLei > 0 ? Math.round(bonusLei * 100) : null,
    notes: String(formData.get("notes") ?? "") || null,
  });
  redirect(`/ops/visits/${visit.id}`);
}

export async function createBuildingAction(formData: FormData) {
  const org = await getCurrentOrg();
  const building = await createBuilding(org.id, {
    label: String(formData.get("label") ?? "New building"),
    address: String(formData.get("address") ?? ""),
    locality: String(formData.get("locality") ?? "Giroc, Timiș"),
    floors: Number(formData.get("floors") ?? 3),
    apartments: Number(formData.get("apartments") ?? 11),
    residents: Number(formData.get("residents") ?? 24),
    priceBani: Math.round(Number(formData.get("priceLei") ?? 0) * 100),
    visitsPerWeek: Number(formData.get("visitsPerWeek") ?? 2),
    hoursPerVisit: Number(formData.get("hoursPerVisit") ?? 1.5),
    status:
      (String(formData.get("status") ?? "active") as "active" | "paused" | "prospect") ||
      "active",
    notes: String(formData.get("notes") ?? "") || null,
    hasGas: formData.get("hasGas") === "on",
    hasLift: formData.get("hasLift") === "on",
    hasBasement: formData.get("hasBasement") === "on",
    hasPlayground: formData.get("hasPlayground") === "on",
  });
  // Seed the compliance calendar from the catalogue, filtered by the flags,
  // and the standard checkpoint set for control walks.
  const { seedBuildingObligations } = await import("@/server/complianceService");
  await seedBuildingObligations(org.id, building.id);
  const { seedCheckpoints } = await import("@/server/walkService");
  await seedCheckpoints(org.id, building.id);
  redirect(`/ops/buildings/${building.id}`);
}

export async function updateBuildingAction(buildingId: string, formData: FormData) {
  const org = await getCurrentOrg();
  await updateBuilding(org.id, buildingId, {
    label: String(formData.get("label") ?? ""),
    address: String(formData.get("address") ?? ""),
    locality: String(formData.get("locality") ?? ""),
    floors: Number(formData.get("floors") ?? 3),
    apartments: Number(formData.get("apartments") ?? 11),
    residents: Number(formData.get("residents") ?? 24),
    priceBani: Math.round(Number(formData.get("priceLei") ?? 0) * 100),
    visitsPerWeek: Number(formData.get("visitsPerWeek") ?? 2),
    hoursPerVisit: Number(formData.get("hoursPerVisit") ?? 1.5),
    status:
      (String(formData.get("status") ?? "active") as "active" | "paused" | "prospect") ||
      "active",
    notes: String(formData.get("notes") ?? "") || null,
    hasGas: formData.get("hasGas") === "on",
    hasLift: formData.get("hasLift") === "on",
    hasBasement: formData.get("hasBasement") === "on",
    hasPlayground: formData.get("hasPlayground") === "on",
  });
  revalidatePath(`/ops/buildings/${buildingId}`);
}

export async function createIssueAction(formData: FormData) {
  const org = await getCurrentOrg();
  await createIssue(org.id, {
    buildingId: String(formData.get("buildingId") ?? "") || null,
    source: (String(formData.get("source") ?? "tenant") as "tenant" | "cleaner" | "owner"),
    description: String(formData.get("description") ?? ""),
  });
  revalidatePath("/ops");
}

export async function setIssueStatusAction(issueId: string, status: "open" | "in_progress" | "done") {
  const org = await getCurrentOrg();
  await setIssueStatus(org.id, issueId, status);
  revalidatePath("/ops");
}

export async function setLeadStatusAction(
  leadId: string,
  status: "new" | "contacted" | "won" | "lost"
) {
  const org = await getCurrentOrg();
  await setLeadStatus(org.id, leadId, status);
  revalidatePath("/ops/leads");
}

export async function generateProtocolAction(buildingId: string, monthKey: string) {
  const org = await getCurrentOrg();
  await generateProtocol(org.id, buildingId, monthKey);
  revalidatePath("/ops/protocols");
}

export async function markProtocolSignedAction(protocolId: string) {
  const org = await getCurrentOrg();
  await markProtocolSigned(org.id, protocolId);
  revalidatePath("/ops/protocols");
}

export async function addExpenseAction(formData: FormData) {
  const org = await getCurrentOrg();
  await createExpense(org.id, {
    date: String(formData.get("date") ?? todayYmd()),
    category: (String(formData.get("category") ?? "other") as
      | "consumables"
      | "travel"
      | "equipment"
      | "other"),
    amountBani: Math.round(Number(formData.get("amountLei") ?? 0) * 100),
    note: String(formData.get("note") ?? "") || null,
  });
  revalidatePath("/ops");
}

// --- Atlas Cut 2 actions (prospects live in Atlas, §6b) ---

export async function createProspectAction(formData: FormData) {
  const org = await getCurrentOrg();
  await createProspect(org.id, {
    label: String(formData.get("label") ?? "Prospect"),
    commune: String(formData.get("commune") ?? "Giroc"),
    floors: Number(formData.get("floors") ?? 0) || null,
    apartmentsEst: Number(formData.get("apartments") ?? 0) || null,
    currentCleaner: String(formData.get("currentCleaner") ?? "unknown") || "unknown",
    contact: String(formData.get("contact") ?? "") || null,
    quotedPriceBani: Math.round(Number(formData.get("quotedLei") ?? 0) * 100) || null,
    notes: String(formData.get("notes") ?? "") || null,
    spottedDate: todayYmd(),
  });
  revalidatePath("/atlas");
}

export async function setProspectStatusAction(
  prospectId: string,
  status: "spotted" | "contacted" | "quoted" | "won" | "lost"
) {
  const org = await getCurrentOrg();
  await updateProspect(org.id, prospectId, { status });
  revalidatePath("/atlas");
}

/** "Won" offers one-tap conversion into an Ops building (§6b). */
export async function convertProspectAction(prospectId: string) {
  const org = await getCurrentOrg();
  const prospect = await getProspect(org.id, prospectId);
  if (!prospect) return;
  const building = await createBuilding(org.id, {
    label: prospect.label,
    address: prospect.label,
    locality: prospect.commune,
    floors: prospect.floors ?? 3,
    apartments: prospect.apartmentsEst ?? 11,
    residents: (prospect.apartmentsEst ?? 11) * 2,
    priceBani: prospect.quotedPriceBani ?? 0,
    visitsPerWeek: 2,
    hoursPerVisit: 1.5,
    status: "active",
    notes: prospect.notes,
  });
  await updateProspect(org.id, prospectId, {
    status: "won",
    convertedBuildingId: building.id,
  });
  // Seed the compliance calendar from the catalogue, filtered by the flags,
  // and the standard checkpoint set for control walks.
  const { seedBuildingObligations } = await import("@/server/complianceService");
  await seedBuildingObligations(org.id, building.id);
  const { seedCheckpoints } = await import("@/server/walkService");
  await seedCheckpoints(org.id, building.id);
  redirect(`/ops/buildings/${building.id}`);
}

// ---------------------------------------------------- compliance (add-on §4)

export async function seedBuildingObligationsAction(buildingId: string) {
  const org = await getCurrentOrg();
  const { seedBuildingObligations } = await import("@/server/complianceService");
  await seedBuildingObligations(org.id, buildingId);
  revalidatePath("/ops/compliance");
  revalidatePath(`/ops/buildings/${buildingId}`);
}

export async function markObligationDoneAction(
  buildingObligationId: string,
  formData: FormData
) {
  const org = await getCurrentOrg();
  const { markObligationDone } = await import("@/server/complianceService");
  const performedBy = String(formData.get("performedBy") ?? "scara");
  await markObligationDone(org.id, buildingObligationId, {
    performedBy:
      performedBy === "contractor" || performedBy === "client" ? performedBy : "scara",
  });
  revalidatePath("/ops/compliance");
  revalidatePath("/ops");
}

export async function scheduleObligationAction(
  buildingObligationId: string,
  formData: FormData
) {
  const org = await getCurrentOrg();
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const { scheduleObligation } = await import("@/server/complianceService");
  await scheduleObligation(org.id, buildingObligationId, {
    occurredAt: date,
    contractorId: String(formData.get("contractorId") ?? "") || null,
  });
  revalidatePath("/ops/compliance");
}

/**
 * Attach a certificate or proces-verbal to an obligation (add-on §4,
 * "Încarcă document"). The file lands on the latest event; when the
 * obligation has no history yet, the upload records the execution too —
 * a certificate in hand is evidence the work happened.
 */
export async function uploadObligationDocumentAction(
  buildingObligationId: string,
  formData: FormData
) {
  const org = await getCurrentOrg();
  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size === 0) return;

  // Validate the obligation org-scoped before its id goes anywhere near a
  // storage key, and so the performer can be derived from the catalogue.
  const { getBuildingObligation, latestEventFor, setEventDocument } = await import(
    "@/server/repo/compliance"
  );
  const record = await getBuildingObligation(org.id, buildingObligationId);
  if (!record) return;

  const name = "name" in file ? String((file as File).name) : "";
  const ext = name.toLowerCase().endsWith(".pdf")
    ? "pdf"
    : name.toLowerCase().endsWith(".png")
      ? "png"
      : "jpg";
  const key = `${org.id}/compliance/${record.id}/${crypto.randomUUID()}.${ext}`;
  const { getStorage } = await import("@/server/storage");
  await getStorage().put(
    key,
    new Uint8Array(await file.arrayBuffer()),
    ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg"
  );

  // Attach to the latest *done* event. With no execution on record, the
  // certificate itself is evidence the work happened — but who performed it
  // comes from the catalogue, never a default: an authorised_third_party
  // obligation must never be recorded as executed by Scara (hard rule 3).
  const latest = await latestEventFor(org.id, record.id, "done");
  if (latest) {
    await setEventDocument(org.id, latest.id, key);
  } else {
    const { markObligationDone } = await import("@/server/complianceService");
    const { OBLIGATION_BY_KEY } = await import("@/lib/compliance");
    const requirement = OBLIGATION_BY_KEY[record.obligationKey]?.performerRequirement;
    await markObligationDone(org.id, record.id, {
      documentFileKey: key,
      performedBy: requirement === "us" ? "scara" : "contractor",
      contractorId: record.contractorId,
    });
  }
  revalidatePath("/ops/compliance");
  revalidatePath("/ops");
}

export async function createContractorAction(formData: FormData) {
  const org = await getCurrentOrg();
  const { createContractor } = await import("@/server/repo/compliance");
  await createContractor(org.id, {
    name: String(formData.get("name") ?? "").trim() || "Furnizor",
    trade: String(formData.get("trade") ?? "ddd"),
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    authorisationNote: String(formData.get("authorisationNote") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath("/ops/contractors");
}

// ------------------------------------------------- control walks (add-on §5)

export async function seedCheckpointsAction(buildingId: string) {
  const org = await getCurrentOrg();
  const { seedCheckpoints } = await import("@/server/walkService");
  await seedCheckpoints(org.id, buildingId);
  revalidatePath(`/ops/buildings/${buildingId}`);
}

export async function resolveFindingAction(findingId: string, formData: FormData) {
  const org = await getCurrentOrg();
  const { resolveFinding } = await import("@/server/repo/walks");
  await resolveFinding(
    org.id,
    findingId,
    String(formData.get("resolutionNote") ?? "").trim() || null
  );
  revalidatePath("/ops");
}

// ---------------------------------------------- building record (add-on §6)

export async function seedElementsAction(buildingId: string) {
  const org = await getCurrentOrg();
  const { seedElements } = await import("@/server/recordService");
  await seedElements(org.id, buildingId);
  revalidatePath(`/ops/buildings/${buildingId}/record`);
}

/** One element scored in the guided annual walkthrough. */
export async function assessElementAction(
  buildingId: string,
  elementId: string,
  formData: FormData
) {
  const org = await getCurrentOrg();
  // Both ids must resolve org-scoped before either reaches a storage key or
  // an insert — action arguments are client-controlled.
  const { getBuilding } = await import("@/server/repo/buildings");
  const building = await getBuilding(org.id, buildingId);
  if (!building) return;
  const { createAssessment, listElements } = await import("@/server/repo/record");
  const element = (await listElements(org.id, building.id)).find((e) => e.id === elementId);
  if (!element) return;

  const score = Number(formData.get("score"));
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isInteger(score) || score < 1 || score > 6 || !note) return;

  let photoKeys: string | null = null;
  const file = formData.get("photo");
  if (file instanceof Blob && file.size > 0) {
    const key = `${org.id}/record/${building.id}/${crypto.randomUUID()}.jpg`;
    const { getStorage } = await import("@/server/storage");
    await getStorage().put(key, new Uint8Array(await file.arrayBuffer()), "image/jpeg");
    photoKeys = JSON.stringify([key]);
  }

  await createAssessment(org.id, {
    buildingElementId: element.id,
    assessedAt: todayYmd(),
    assessedBy: "Ops",
    score,
    noteRo: note,
    photoKeys,
    source: "annual",
  });
  revalidatePath(`/ops/buildings/${building.id}/record`);

  // Empty nextStep means the walkthrough is over — land on the record page,
  // not back on element zero (Number("") is 0).
  const nextRaw = String(formData.get("nextStep") ?? "");
  const next = Number(nextRaw);
  if (nextRaw !== "" && Number.isInteger(next) && next >= 0) {
    redirect(`/ops/buildings/${building.id}/record/assess?e=${next}`);
  }
  redirect(`/ops/buildings/${building.id}/record`);
}

/** One-tap promote: walk finding → element assessment + journal entry. */
export async function promoteFindingAction(
  buildingId: string,
  findingId: string,
  formData: FormData
) {
  const org = await getCurrentOrg();
  const elementId = String(formData.get("elementId") ?? "");
  const score = Number(formData.get("score"));
  if (!elementId || !Number.isInteger(score) || score < 1 || score > 6) return;
  const { getDb, schema } = await import("@/server/db");
  const { and, eq } = await import("drizzle-orm");
  const rows = await getDb()
    .select()
    .from(schema.walkFindings)
    .where(and(eq(schema.walkFindings.orgId, org.id), eq(schema.walkFindings.id, findingId)));
  const finding = rows[0];
  if (!finding) return;
  const { promoteFinding } = await import("@/server/recordService");
  await promoteFinding(org.id, buildingId, finding, {
    elementId,
    score,
    assessedBy: "Ops",
  });
  revalidatePath(`/ops/buildings/${buildingId}/record`);
}

export async function addJournalEntryAction(buildingId: string, formData: FormData) {
  const org = await getCurrentOrg();
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return;
  const kindRaw = String(formData.get("kind") ?? "observatie");
  const kind = (
    ["observatie", "interventie", "modificare", "eveniment", "document"].includes(kindRaw)
      ? kindRaw
      : "observatie"
  ) as "observatie" | "interventie" | "modificare" | "eveniment" | "document";
  const { createJournalEntry } = await import("@/server/repo/record");
  await createJournalEntry(org.id, {
    buildingId,
    occurredAt: String(formData.get("date") ?? "") || todayYmd(),
    kind,
    descriptionRo: description,
  });
  revalidatePath(`/ops/buildings/${buildingId}/record`);
}

export async function generateAnnualReportAction(buildingId: string, formData: FormData) {
  const org = await getCurrentOrg();
  const year = Number(formData.get("year"));
  if (!Number.isInteger(year) || year < 2020 || year > 2100) return;
  const recommendations = String(formData.get("recommendations") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const { generateAnnualReport } = await import("@/server/recordService");
  await generateAnnualReport(org.id, buildingId, { year, recommendations });
  revalidatePath(`/ops/buildings/${buildingId}/record`);
}

// -------------------------------------------------- service lines (add-on §7)

export async function attachServiceAction(buildingId: string, formData: FormData) {
  const org = await getCurrentOrg();
  const { attachBuildingService } = await import("@/server/repo/services");
  const serviceLineId = String(formData.get("serviceLineId") ?? "");
  if (!serviceLineId) return;
  const priceLei = Number(formData.get("priceLei") ?? 0);
  await attachBuildingService(org.id, {
    buildingId,
    serviceLineId,
    priceBani: Math.round(priceLei * 100),
    active: true,
    startedAt: todayYmd(),
  });
  revalidatePath(`/ops/buildings/${buildingId}`);
  revalidatePath("/ops");
}

export async function detachServiceAction(buildingId: string, id: string) {
  const org = await getCurrentOrg();
  const { setBuildingServiceActive } = await import("@/server/repo/services");
  await setBuildingServiceActive(org.id, id, false);
  revalidatePath(`/ops/buildings/${buildingId}`);
  revalidatePath("/ops");
}

export async function generateOfferAction(formData: FormData) {
  const org = await getCurrentOrg();
  const { generateOffer } = await import("@/server/offerService");
  const num = (key: string, fallback: number) => {
    const v = Number(formData.get(key));
    return Number.isFinite(v) && v > 0 ? v : fallback;
  };
  const offer = await generateOffer(org.id, {
    prospectId: String(formData.get("prospectId") ?? "") || null,
    clientName: String(formData.get("clientName") ?? "").trim() || "Beneficiar",
    buildingLabel: String(formData.get("buildingLabel") ?? "").trim() || "Imobil",
    address: String(formData.get("address") ?? "").trim(),
    floors: num("floors", 3),
    apartments: num("apartments", 11),
    residents: num("residents", 24),
    visitsPerWeek: num("visitsPerWeek", 2),
    hoursPerVisit: num("hoursPerVisit", 1.5),
    priceBani: Math.round(num("priceLei", 0) * 100),
    validDays: num("validDays", 30),
    // Compliance sections (add-on §8), on unless explicitly disabled.
    flags:
      formData.get("withCompliance") === "on"
        ? {
            hasGas: formData.get("hasGas") === "on",
            hasLift: formData.get("hasLift") === "on",
            hasBasement: formData.get("hasBasement") === "on",
            hasPlayground: formData.get("hasPlayground") === "on",
          }
        : undefined,
    extraServiceKeys: formData.getAll("extraService").map(String),
  });
  revalidatePath("/ops/offers");
  revalidatePath("/atlas");
  redirect(`/ops/offers?generated=${offer.id}`);
}

export async function updateSettingsAction(formData: FormData) {
  const org = await getCurrentOrg();
  await updateOrgIdentity(org.id, {
    name: String(formData.get("orgName") ?? org.name),
    cui: String(formData.get("cui") ?? org.cui),
  });
  await updateOrgSettings(org.id, {
    ronPerEur: Number(formData.get("ronPerEur") ?? 0) || undefined,
    partTimeFloorBani:
      Math.round(Number(formData.get("partTimeFloorLei") ?? 0) * 100) || undefined,
    platformFeeBani:
      Math.round(Number(formData.get("platformFeeLei") ?? 0) * 100) || undefined,
    vatRegistered: formData.get("vatRegistered") === "on",
    contactLine: String(formData.get("contactLine") ?? "").trim() || undefined,
    address: String(formData.get("address") ?? "").trim() || undefined,
    regCom: String(formData.get("regCom") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    iban: String(formData.get("iban") ?? "").trim() || undefined,
    representative: String(formData.get("representative") ?? "").trim() || undefined,
  });
  revalidatePath("/ops/settings");
}

export async function reseedAction() {
  if (process.env.NODE_ENV === "production") return; // dev only (§7.2 Settings)
  const { seedDemo } = await import("@/seed/seed");
  await seedDemo();
  revalidatePath("/ops");
}
