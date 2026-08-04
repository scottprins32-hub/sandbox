// Building-record orchestration (add-on §6): element seeding, score trends,
// the one-tap promote flow and the annual PROIECT report.

import { formatInTimeZone } from "date-fns-tz";
import { APP_TZ, todayYmd } from "@/lib/dates";
import {
  FINDING_CATEGORY_TO_ELEMENT,
  SCORE_BY_VALUE,
  STANDARD_ELEMENTS,
  trendLabel,
} from "@/lib/compliance/elements";
import { getBuilding } from "./repo/buildings";
import {
  createAssessment,
  createElements,
  createJournalEntry,
  listAssessments,
  listElements,
  listJournal,
  upsertAnnualReport,
  type AnnualReport,
  type BuildingElement,
  type ElementAssessment,
} from "./repo/record";
import { listBuildingObligations, listComplianceEvents } from "./repo/compliance";
import { listFindingsForWalks, listWalksForBuilding, type WalkFinding } from "./repo/walks";
import { getOrgSettings } from "./repo/settings";
import { getCurrentOrg } from "./org";
import { getStorage } from "./storage";
import { CATEGORY_LABEL_RO, OBLIGATION_BY_KEY } from "@/lib/compliance";
import { renderAnnualReportPdf, type AnnualReportData } from "./pdf/annual";

/** Seed the twelve standard elements. Idempotent per building. */
export async function seedElements(orgId: string, buildingId: string): Promise<number> {
  const existing = await listElements(orgId, buildingId);
  const have = new Set(existing.map((e) => e.key));
  const rows = STANDARD_ELEMENTS.filter((e) => !have.has(e.key)).map((e) => ({
    buildingId,
    key: e.key,
    nameRo: e.nameRo,
    category: e.category,
  }));
  await createElements(orgId, rows);
  return rows.length;
}

export interface ElementStatus {
  element: BuildingElement;
  latest: ElementAssessment | null;
  /** Latest score from the year before the latest assessment's year. */
  previousScore: number | null;
  trend: string;
  scoreLabel: string | null;
}

/** Latest score and year-over-year trend per element. */
export function elementStatuses(
  elements: BuildingElement[],
  assessments: ElementAssessment[]
): ElementStatus[] {
  const byElement = new Map<string, ElementAssessment[]>();
  for (const a of assessments) {
    if (!byElement.has(a.buildingElementId)) byElement.set(a.buildingElementId, []);
    byElement.get(a.buildingElementId)!.push(a);
  }
  return elements.map((element) => {
    const rows = (byElement.get(element.id) ?? []).sort((a, b) =>
      b.assessedAt.localeCompare(a.assessedAt)
    );
    const latest = rows[0] ?? null;
    let previousScore: number | null = null;
    if (latest) {
      const latestYear = latest.assessedAt.slice(0, 4);
      const prior = rows.find((r) => r.assessedAt.slice(0, 4) < latestYear);
      previousScore = prior?.score ?? null;
    }
    return {
      element,
      latest,
      previousScore,
      trend: latest ? trendLabel(latest.score, previousScore) : "neevaluat",
      scoreLabel: latest ? SCORE_BY_VALUE[latest.score]?.labelRo ?? null : null,
    };
  });
}

/**
 * Promote a walk finding into the building record: an element assessment plus
 * a journal entry, linked back to the finding (add-on §6: this is what makes
 * year two cheap).
 */
export async function promoteFinding(
  orgId: string,
  buildingId: string,
  finding: WalkFinding,
  opts: { elementId: string; score: number; assessedBy: string }
): Promise<void> {
  const date = todayYmd();
  await createAssessment(orgId, {
    buildingElementId: opts.elementId,
    assessedAt: date,
    assessedBy: opts.assessedBy,
    score: opts.score,
    noteRo: finding.descriptionRo,
    photoKeys: finding.photoKeys,
    source: "walk",
  });
  await createJournalEntry(orgId, {
    buildingId,
    occurredAt: date,
    kind: "observatie",
    descriptionRo: finding.descriptionRo,
    relatedType: "walk_finding",
    relatedId: finding.id,
    photoKeys: finding.photoKeys,
  });
}

export function defaultElementFor(
  category: string,
  elements: BuildingElement[]
): BuildingElement | null {
  const key = FINDING_CATEGORY_TO_ELEMENT[category];
  return elements.find((e) => e.key === key) ?? null;
}

/** The auto-drafted recommendations: elements scored 4-6 + open findings. */
export function draftRecommendations(
  statuses: ElementStatus[],
  openFindings: WalkFinding[]
): string[] {
  const out: string[] = [];
  for (const s of statuses) {
    if (s.latest && s.latest.score >= 4) {
      out.push(
        `${s.element.nameRo}: scor ${s.latest.score} (${SCORE_BY_VALUE[s.latest.score]?.labelRo}). Planificați lucrări de remediere.`
      );
    }
  }
  for (const f of openFindings) {
    out.push(`Rezolvați constatarea nerezolvată: ${f.descriptionRo}`);
  }
  if (out.length === 0) {
    out.push("Continuarea observării periodice; nu se impun lucrări în acest moment.");
  }
  return out.slice(0, 12);
}

export interface AnnualReportInput {
  year: number;
  /** Recommendations as edited by the human before generation. */
  recommendations: string[];
}

export async function buildAnnualReportData(
  orgId: string,
  buildingId: string,
  input: AnnualReportInput
): Promise<AnnualReportData> {
  const org = await getCurrentOrg();
  const settings = await getOrgSettings(orgId);
  const building = await getBuilding(orgId, buildingId);
  if (!building) throw new Error("Building not found");

  const [elements, journal, walks, obligations] = await Promise.all([
    listElements(orgId, buildingId),
    listJournal(orgId, buildingId),
    listWalksForBuilding(orgId, buildingId),
    listBuildingObligations(orgId, buildingId),
  ]);
  const assessments = await listAssessments(orgId, elements.map((e) => e.id));
  const statuses = elementStatuses(
    elements,
    // Trend for the report year: assessments up to the end of that year.
    assessments.filter((a) => a.assessedAt.slice(0, 4) <= String(input.year))
  );

  const yearStr = String(input.year);
  const walksInYear = walks.filter(
    (w) =>
      w.status === "done" &&
      formatInTimeZone(new Date(w.startedAt), APP_TZ, "yyyy") === yearStr
  );
  const findings = await listFindingsForWalks(orgId, walksInYear.map((w) => w.id));
  const elementById = new Map(elements.map((e) => [e.id, e]));

  const photoCount = assessments
    .filter((a) => a.assessedAt.startsWith(yearStr))
    .reduce((n, a) => n + (a.photoKeys ? (JSON.parse(a.photoKeys) as string[]).length : 0), 0)
    + findings.reduce(
      (n, f) => n + (f.photoKeys ? (JSON.parse(f.photoKeys) as string[]).length : 0),
      0
    );

  // Section 5: obligations recorded done in the year.
  const events = await listComplianceEvents(orgId, obligations.map((o) => o.id));
  const keyByObligationId = new Map(obligations.map((o) => [o.id, o.obligationKey]));
  const doneEvents = events
    .filter((e) => e.kind === "done" && e.occurredAt.startsWith(yearStr))
    .map((e) => ({
      date: e.occurredAt,
      name:
        OBLIGATION_BY_KEY[keyByObligationId.get(e.buildingObligationId) ?? ""]?.nameRo ??
        "Obligație",
      performer:
        e.performedBy === "contractor"
          ? "firmă autorizată"
          : e.performedBy === "client"
            ? "beneficiar"
            : "prestator",
      hasDocument: Boolean(e.documentFileKey),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    org: {
      name: org.name,
      cui: org.cui,
      regCom: settings.regCom,
      address: settings.address,
      email: settings.email,
      phone: settings.phone,
    },
    buildingLabel: building.label,
    address: [building.address, building.locality].filter(Boolean).join(", "),
    floors: building.floors,
    apartments: building.apartments,
    year: input.year,
    periodStart: `01.01.${input.year}`,
    periodEnd: `31.12.${input.year}`,
    walksCount: walksInYear.length,
    photoCount,
    elements: statuses.map((s) => ({
      name: s.element.nameRo,
      score: s.latest?.score ?? null,
      scoreLabel: s.scoreLabel,
      trend: s.trend,
      note: s.latest?.noteRo ?? null,
    })),
    findings: findings
      .sort((a, b) => a.reportedAt - b.reportedAt)
      .map((f) => ({
        date: formatInTimeZone(new Date(f.reportedAt), APP_TZ, "dd.MM.yyyy"),
        element:
          elementById.get(findingElementId(f.category, elements) ?? "")?.nameRo ??
          CATEGORY_LABEL_RO[f.category as keyof typeof CATEGORY_LABEL_RO] ??
          f.category,
        description: f.descriptionRo,
        photoCount: f.photoKeys ? (JSON.parse(f.photoKeys) as string[]).length : 0,
      })),
    journal: journal
      .filter((j) => j.occurredAt.startsWith(yearStr))
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
      .map((j) => ({
        date: j.occurredAt,
        kind: j.kind,
        description: j.descriptionRo,
      })),
    obligationsDone: doneEvents,
    recommendations: input.recommendations,
  };
}

function findingElementId(
  category: string,
  elements: BuildingElement[]
): string | null {
  const key = FINDING_CATEGORY_TO_ELEMENT[category];
  return elements.find((e) => e.key === key)?.id ?? null;
}

export async function generateAnnualReport(
  orgId: string,
  buildingId: string,
  input: AnnualReportInput
): Promise<AnnualReport> {
  const data = await buildAnnualReportData(orgId, buildingId, input);
  const pdf = await renderAnnualReportPdf(data);
  // PROIECT in the filename too — hard rule 4 of the add-on.
  const fileKey = `${orgId}/annual/raport-anual-PROIECT-${input.year}-${buildingId}.pdf`;
  await getStorage().put(fileKey, pdf, "application/pdf");
  return upsertAnnualReport(orgId, {
    buildingId,
    year: input.year,
    pdfFileKey: fileKey,
    generatedAt: Date.now(),
  });
}
