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
  });
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
  redirect(`/ops/buildings/${building.id}`);
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
  });
  revalidatePath("/ops/settings");
}

export async function reseedAction() {
  if (process.env.NODE_ENV === "production") return; // dev only (§7.2 Settings)
  const { seedDemo } = await import("@/seed/seed");
  await seedDemo();
  revalidatePath("/ops");
}
