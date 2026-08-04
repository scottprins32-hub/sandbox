// Orchestrates protocol generation: gathers the month's delivery record for a
// building, renders the design-system proces-verbal, stores it, records the
// protocols row with its sequential document number.

import { formatInTimeZone } from "date-fns-tz";
import { APP_TZ } from "@/lib/dates";
import { getBuilding } from "./repo/buildings";
import { getClient } from "./repo/clients";
import { listVisitsInMonth, listPhotosForVisits } from "./repo/visits";
import { listIssuesForBuilding } from "./repo/issues";
import { listCleaners } from "./repo/cleaners";
import { listTemplateItems } from "./repo/checklists";
import { getOrgSettings } from "./repo/settings";
import { nextProtocolNumber, upsertProtocol, type Protocol } from "./repo/protocols";
import { renderProtocolPdf, type ProtocolData, type VisitRow } from "./pdf/protocol";
import { getStorage } from "./storage";
import { getCurrentOrg } from "./org";

function roDate(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}.${m}.${y}`;
}

function shortName(full: string): string {
  const [first, ...rest] = full.trim().split(/\s+/);
  const initial = rest.length > 0 ? ` ${rest[rest.length - 1]![0]}.` : "";
  return `${first}${initial}`;
}

export async function buildProtocolData(
  orgId: string,
  buildingId: string,
  monthKey: string
): Promise<ProtocolData> {
  const org = await getCurrentOrg();
  const settings = await getOrgSettings(orgId);
  const building = await getBuilding(orgId, buildingId);
  if (!building) throw new Error("Building not found");
  const client = building.clientId ? await getClient(orgId, building.clientId) : null;
  const cleaners = await listCleaners(orgId);
  const cleanerById = new Map(cleaners.map((c) => [c.id, c.name]));

  const monthVisits = (await listVisitsInMonth(orgId, monthKey))
    .filter((v) => v.buildingId === buildingId && v.type === "recurring")
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const photos = await listPhotosForVisits(
    orgId,
    monthVisits.map((v) => v.id)
  );
  const photosByVisit = new Map<string, number>();
  for (const p of photos) {
    photosByVisit.set(p.visitId, (photosByVisit.get(p.visitId) ?? 0) + 1);
  }

  const visits: VisitRow[] = monthVisits.map((v) => {
    const status: VisitRow["status"] =
      v.status === "done" ? "efectuata" : v.status === "missed" ? "ratata" : "programata";
    const interval =
      v.startedAt && v.finishedAt
        ? `${formatInTimeZone(new Date(v.startedAt), APP_TZ, "HH:mm")} - ${formatInTimeZone(new Date(v.finishedAt), APP_TZ, "HH:mm")}`
        : null;
    return {
      date: roDate(v.scheduledDate),
      interval,
      operator: v.cleanerId ? shortName(cleanerById.get(v.cleanerId) ?? "-") : null,
      photoCount: photosByVisit.get(v.id) ?? 0,
      status,
    };
  });

  const done = visits.filter((v) => v.status === "efectuata").length;
  const missed = visits.filter((v) => v.status === "ratata").length;

  const activities = building.checklistTemplateId
    ? (await listTemplateItems(orgId, building.checklistTemplateId)).map((i) => i.textRo)
    : [];

  // Observations, composed plainly from the month's record: missed visits and
  // the building's issues. No narrative invention.
  const observations: string[] = [];
  for (const v of visits.filter((x) => x.status === "ratata")) {
    observations.push(`Vizita din ${v.date} nu a fost efectuată.`);
  }
  const issues = await listIssuesForBuilding(orgId, buildingId);
  let issuesResolved = 0;
  for (const issue of issues) {
    const createdMonth = new Date(issue.createdAt).toISOString().slice(0, 7);
    const resolvedMonth = issue.resolvedAt
      ? new Date(issue.resolvedAt).toISOString().slice(0, 7)
      : null;
    if (resolvedMonth === monthKey) {
      issuesResolved++;
      observations.push(`Sesizarea „${issue.description}" a fost rezolvată.`);
    } else if (createdMonth === monthKey && issue.status !== "done") {
      observations.push(`Sesizare înregistrată: „${issue.description}" (în lucru).`);
    }
  }

  return {
    org: {
      name: org.name,
      cui: org.cui,
      regCom: settings.regCom,
      address: settings.address,
      email: settings.email,
      phone: settings.phone,
    },
    representative: settings.representative,
    clientName: client?.name ?? "Beneficiar",
    buildingLabel: building.label,
    address: [building.address, building.locality].filter(Boolean).join(", "),
    monthKey,
    scheduled: visits.length,
    done,
    missed,
    visitsPerWeek: building.visitsPerWeek,
    photoCount: photos.length,
    visits,
    activities,
    observations,
    priceBani: building.priceBani,
    vatRegistered: settings.vatRegistered === true,
    iban: settings.iban,
    issuesResolved,
  };
}

export async function generateProtocol(
  orgId: string,
  buildingId: string,
  monthKey: string
): Promise<Protocol> {
  const data = await buildProtocolData(orgId, buildingId, monthKey);
  const documentNumber = await nextProtocolNumber(orgId, buildingId, monthKey);
  const pdf = await renderProtocolPdf({ ...data, documentNumber });

  const fileKey = `${orgId}/protocols/${monthKey}-${buildingId}.pdf`;
  await getStorage().put(fileKey, pdf, "application/pdf");
  return upsertProtocol(orgId, {
    buildingId,
    month: monthKey,
    pdfFileKey: fileKey,
    number: documentNumber,
  });
}
