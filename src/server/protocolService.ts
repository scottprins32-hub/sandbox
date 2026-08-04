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
import { listBuildingObligations } from "./repo/compliance";
import { listBuildingServices, listServiceLines } from "./repo/services";
import { nextProtocolNumber, upsertProtocol, type Protocol } from "./repo/protocols";
import { decorate, exposureFor } from "./complianceService";
import { walkSummaryForMonth } from "./walkService";
import {
  renderProtocolPdf,
  type AnnexPhoto,
  type ProtocolData,
  type VisitRow,
} from "./pdf/protocol";
import { getStorage } from "./storage";
import { getCurrentOrg } from "./org";

const STATUS_LABEL_RO: Record<string, string> = {
  overdue: "restant",
  due_soon: "scadent curând",
  ok: "în regulă",
  unknown: "neînregistrat",
};

/** Compact performer labels for the report's table column. */
const PERFORMER_SHORT_RO: Record<string, string> = {
  us: "executăm noi",
  authorised_third_party: "firmă autorizată",
  qualified_signatory: "semnatar calificat",
};

/** The annex stays a bounded document even in a photo-heavy month. */
const ANNEX_PHOTO_CAP = 40;

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

  // ---- Raport lunar de control data (add-on §5). With no walks in the
  // month, everything below stays undefined and the plain proces-verbal
  // renders exactly as before.
  const walkSummary = await walkSummaryForMonth(orgId, buildingId, monthKey);
  const isRaport = walkSummary.walks.length > 0;

  let raport: Partial<ProtocolData> = {};
  if (isRaport) {
    const [obligationRows, exposure, lines, attached] = await Promise.all([
      listBuildingObligations(orgId, buildingId),
      exposureFor(orgId, buildingId),
      listServiceLines(orgId),
      listBuildingServices(orgId, buildingId),
    ]);
    const decorated = decorate(obligationRows);
    const lineById = new Map(lines.map((l) => [l.id, l]));
    const serviceLinesActive = [
      "Curățenie casa scării",
      ...attached
        .filter((s) => s.active)
        .map((s) => lineById.get(s.serviceLineId)?.nameRo)
        .filter((n): n is string => Boolean(n) && n !== "Curățenie casa scării"),
    ];

    const recommendations: string[] = [];
    for (const r of decorated) {
      if (recommendations.length >= 8) break;
      if (r.status === "overdue") {
        recommendations.push(`Recuperați „${r.obligation.nameRo}” — scadența a trecut.`);
      } else if (r.status === "due_soon" && r.nextDue) {
        recommendations.push(
          `Programați „${r.obligation.nameRo}” până la ${roDate(r.nextDue)}.`
        );
      }
    }
    for (const f of walkSummary.findings) {
      if (recommendations.length >= 8) break;
      if (!f.finding.resolvedAt) {
        recommendations.push(
          `Urmăriți constatarea din ${f.date}: ${f.finding.descriptionRo}`
        );
      }
    }

    // Photo annex: the month's photographs with timestamp and label.
    const storage = getStorage();
    const annexSources: { key: string; caption: string }[] = [];
    const kindRo = { before: "înainte", after: "după", issue: "problemă" } as const;
    for (const p of photos) {
      annexSources.push({
        key: p.fileKey,
        caption: `Vizită · ${formatInTimeZone(new Date(p.takenAt), APP_TZ, "dd.MM.yyyy HH:mm")} · ${kindRo[p.kind]}`,
      });
    }
    for (const wc of walkSummary.walkCheckpoints) {
      const keys = wc.photoKeys ? (JSON.parse(wc.photoKeys) as string[]) : [];
      const label = walkSummary.checkpointById.get(wc.checkpointId)?.labelRo ?? "Punct de control";
      for (const key of keys) {
        annexSources.push({
          key,
          caption: `${label} · ${formatInTimeZone(new Date(wc.scannedAt), APP_TZ, "dd.MM.yyyy HH:mm")}`,
        });
      }
    }
    for (const f of walkSummary.findings) {
      const keys = f.finding.photoKeys ? (JSON.parse(f.finding.photoKeys) as string[]) : [];
      for (const key of keys) {
        annexSources.push({
          key,
          caption: `Constatare · ${f.checkpointLabel ?? "general"} · ${f.date}`,
        });
      }
    }
    const annexPhotos: AnnexPhoto[] = [];
    for (const s of annexSources.slice(0, ANNEX_PHOTO_CAP)) {
      if (!s.key.endsWith(".jpg") && !s.key.endsWith(".jpeg")) continue;
      const file = await storage.get(s.key);
      if (file) annexPhotos.push({ jpg: file.data, caption: s.caption });
    }

    raport = {
      serviceLinesActive,
      walks: walkSummary.walks.map((w) => ({
        date: w.date,
        time: w.time,
        points: w.points,
        findings: w.findings,
      })),
      findings: walkSummary.findings.map((f) => ({
        date: f.date,
        checkpointLabel: f.checkpointLabel,
        severity: f.finding.severity,
        description: f.finding.descriptionRo,
        photoCount: f.photoCount,
      })),
      obligations: decorated.map((r) => ({
        name: r.obligation.nameRo,
        due: r.nextDue,
        statusLabel: STATUS_LABEL_RO[r.status] ?? r.status,
        performer:
          PERFORMER_SHORT_RO[r.obligation.performerRequirement] ??
          r.obligation.performerRequirement,
      })),
      exposureBani: exposure.totalBani,
      recommendations,
      annexPhotos,
    };
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
    ...raport,
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
