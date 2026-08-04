// The proces-verbal PDF (§7.2), set in the approved Scara document design:
// logo + identity header, document number and period, two-column parties,
// month-at-a-glance stat boxes, the per-visit evidence table, included
// activities, observations, service value and signature blocks.
// Romanian regardless of UI language (§0); Instrument Sans + Space Grotesk
// cover comma-below ș/ț.

import { degrees, PDFDocument, type PDFFont, type PDFPage } from "pdf-lib";
import { formatInTimeZone } from "date-fns-tz";
import { APP_TZ, monthNameRo } from "@/lib/dates";
import {
  A4,
  COLORS,
  CONTENT_W,
  drawDocFooter,
  drawDocHeader,
  drawMicroLabel,
  embedDocFonts,
  MARGIN,
  rule,
  wrapText,
  type OrgIdentity,
} from "./theme";

export interface VisitRow {
  /** dd.MM.yyyy */
  date: string;
  /** "07:00 - 08:30" or null when the visit never happened. */
  interval: string | null;
  /** "Ioana M." or null. */
  operator: string | null;
  photoCount: number;
  status: "efectuata" | "ratata" | "programata";
}

export interface ProtocolData {
  org: OrgIdentity;
  /** Signs for the prestator; omitted line when empty. */
  representative?: string;
  clientName: string;
  buildingLabel: string;
  address: string;
  monthKey: string; // YYYY-MM
  documentNumber?: number;
  scheduled: number;
  done: number;
  missed: number;
  visitsPerWeek: number;
  photoCount: number;
  visits: VisitRow[];
  /** Numbered activity lines from the building's checklist template. */
  activities: string[];
  /** Composed observation sentences; empty array renders the "none" line. */
  observations: string[];
  /** Monthly subscription value in bani; hidden when 0. */
  priceBani: number;
  vatRegistered: boolean;
  iban?: string;
  issuesResolved: number;
  /**
   * Sales specimen: watermarked MODEL and captioned as not attesting to
   * services performed. Real protocols leave this false.
   */
  sample?: boolean;
}

const STATUS_LABEL: Record<VisitRow["status"], string> = {
  efectuata: "Efectuată",
  ratata: "Ratată",
  programata: "Programată",
};

function lei(bani: number): string {
  const value = bani / 100;
  return `${value.toLocaleString("ro-RO", { maximumFractionDigits: 2 })} lei`;
}

export async function renderProtocolPdf(data: ProtocolData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await embedDocFonts(doc);
  const { luna, an } = monthNameRo(data.monthKey);

  const pages: PDFPage[] = [doc.addPage(A4)];
  let page = pages[0]!;
  const paintPaper = (p: PDFPage) =>
    p.drawRectangle({ x: 0, y: 0, width: A4[0], height: A4[1], color: COLORS.white });
  paintPaper(page);

  let y = drawDocHeader(page, fonts, data.org);

  const breakPage = (needed: number) => {
    if (y - needed >= 64) return;
    page = doc.addPage(A4);
    pages.push(page);
    paintPaper(page);
    y = A4[1] - 64;
  };

  const micro = (label: string) => {
    breakPage(30);
    drawMicroLabel(page, fonts.semibold, label, MARGIN, y);
    y -= 14;
  };

  if (data.sample) {
    page.drawText("MODEL", {
      x: 96,
      y: 330,
      size: 120,
      font: fonts.display,
      color: COLORS.paper2,
      rotate: degrees(32),
    });
  }

  // ---- Title block -------------------------------------------------------
  page.drawText("PROCES-VERBAL DE RECEPȚIE", {
    x: MARGIN, y, size: 17, font: fonts.bold, color: COLORS.ink,
  });
  y -= 21;
  page.drawText("A SERVICIILOR DE CURĂȚENIE", {
    x: MARGIN, y, size: 17, font: fonts.bold, color: COLORS.ink,
  });
  y -= 17;
  const period = `perioada 01.${data.monthKey.slice(5, 7)}.${an} - ${lastDayOf(data.monthKey)}`;
  const nrLine = [
    data.documentNumber
      ? `Nr. ${data.documentNumber} din ${formatInTimeZone(new Date(), APP_TZ, "dd.MM.yyyy")}`
      : `${luna} ${an}`,
    period,
  ].join(" · ");
  page.drawText(nrLine, { x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink2 });
  y -= 14;
  if (data.sample) {
    page.drawText("MODEL DE DOCUMENT (nu atestă servicii prestate)", {
      x: MARGIN, y, size: 9, font: fonts.bold, color: COLORS.rust,
    });
    y -= 14;
  }
  rule(page, y); y -= 18;

  // ---- Parties, two columns ---------------------------------------------
  const colB = MARGIN + CONTENT_W / 2 + 8;
  drawMicroLabel(page, fonts.semibold, "Prestator", MARGIN, y);
  drawMicroLabel(page, fonts.semibold, "Beneficiar", colB, y);
  y -= 15;
  page.drawText(data.org.name, { x: MARGIN, y, size: 10, font: fonts.semibold, color: COLORS.ink });
  page.drawText(data.clientName, { x: colB, y, size: 10, font: fonts.semibold, color: COLORS.ink });
  y -= 13;
  const leftLines: string[] = [];
  if (data.representative) leftLines.push(`Reprezentat prin ${data.representative}`);
  if (data.org.address) leftLines.push(data.org.address);
  const rightLines: string[] = [`Imobil: ${data.buildingLabel}`];
  if (data.address) rightLines.push(data.address);
  const partyRows = Math.max(leftLines.length, rightLines.length);
  for (let i = 0; i < partyRows; i++) {
    if (leftLines[i])
      page.drawText(leftLines[i]!, { x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink2 });
    if (rightLines[i])
      page.drawText(rightLines[i]!, { x: colB, y, size: 9.5, font: fonts.text, color: COLORS.ink2 });
    y -= 12;
  }
  y -= 6;
  rule(page, y); y -= 20;

  // ---- Month at a glance: three stat boxes ------------------------------
  micro("Situația lunii");
  const boxH = 52;
  const boxW = CONTENT_W / 3;
  const stats: [string, string][] = [
    ["Vizite efectuate", `${data.done} / ${data.scheduled}`],
    ["Fotografii datate", String(data.photoCount)],
    ["Vizite ratate", String(data.missed)],
  ];
  breakPage(boxH + 16);
  page.drawRectangle({
    x: MARGIN, y: y - boxH, width: CONTENT_W, height: boxH,
    borderColor: COLORS.lineStrong, borderWidth: 0.8,
  });
  stats.forEach(([label, value], i) => {
    const bx = MARGIN + boxW * i;
    if (i > 0)
      page.drawLine({
        start: { x: bx, y: y - boxH }, end: { x: bx, y },
        thickness: 0.8, color: COLORS.lineStrong,
      });
    drawMicroLabel(page, fonts.medium, label, bx + 12, y - 17, COLORS.ink3, 7.5);
    page.drawText(value, {
      x: bx + 12, y: y - boxH + 12, size: 19, font: fonts.display, color: COLORS.ink,
    });
  });
  y -= boxH + 22;

  // ---- Visit evidence table ---------------------------------------------
  if (data.visits.length > 0) {
    micro("Evidența vizitelor");
    const cols = [
      { label: "Data", x: MARGIN, align: "left" as const },
      { label: "Interval", x: MARGIN + 92, align: "left" as const },
      { label: "Operator", x: MARGIN + 208, align: "left" as const },
      { label: "Foto", x: MARGIN + 320, align: "left" as const },
      { label: "Stare", x: A4[0] - MARGIN, align: "right" as const },
    ];
    const header = () => {
      for (const c of cols) {
        if (c.align === "right") {
          const w = microWidth(fonts.semibold, c.label, 7.5);
          drawMicroLabel(page, fonts.semibold, c.label, c.x - w, y, COLORS.ink3, 7.5);
        } else {
          drawMicroLabel(page, fonts.semibold, c.label, c.x, y, COLORS.ink3, 7.5);
        }
      }
      y -= 8;
      rule(page, y, COLORS.ink, 1);
      y -= 16;
    };
    header();
    for (const v of data.visits) {
      breakPage(20);
      const missedRow = v.status === "ratata";
      const color = missedRow ? COLORS.rust : COLORS.ink;
      const size = 9.5;
      page.drawText(v.date, { x: cols[0]!.x, y, size, font: fonts.text, color });
      page.drawText(v.interval ?? "-", { x: cols[1]!.x, y, size, font: fonts.text, color });
      page.drawText(v.operator ?? "-", { x: cols[2]!.x, y, size, font: fonts.text, color });
      page.drawText(String(v.photoCount), { x: cols[3]!.x, y, size, font: fonts.text, color });
      const st = STATUS_LABEL[v.status];
      const stFont = missedRow ? fonts.medium : fonts.text;
      const stW = stFont.widthOfTextAtSize(st, size);
      page.drawText(st, { x: A4[0] - MARGIN - stW, y, size, font: stFont, color });
      y -= 8;
      rule(page, y, COLORS.line, 0.5);
      y -= 14;
    }
    y -= 8;
  }

  // ---- Activities, two numbered columns ---------------------------------
  if (data.activities.length > 0) {
    micro("Activități incluse la fiecare vizită");
    const half = Math.ceil(data.activities.length / 2);
    const rowsNeeded = half * 15 + 10;
    breakPage(rowsNeeded);
    const startY = y;
    data.activities.forEach((a, i) => {
      const col = i < half ? 0 : 1;
      const ax = MARGIN + (col === 0 ? 0 : CONTENT_W / 2 + 8);
      const ay = startY - (i % half) * 15;
      page.drawText(`${i + 1}. ${a}`, {
        x: ax, y: ay, size: 9.5, font: fonts.text, color: COLORS.ink,
      });
    });
    y = startY - half * 15 - 10;
    rule(page, y); y -= 18;
  }

  // ---- Observations ------------------------------------------------------
  micro("Observații");
  const obs =
    data.observations.length > 0
      ? data.observations.join(" ")
      : "Nu au fost înregistrate observații în luna raportată.";
  for (const line of wrapText(fonts.text, obs, 9.5, CONTENT_W)) {
    breakPage(14);
    page.drawText(line, { x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink });
    y -= 13;
  }
  y -= 8;
  rule(page, y); y -= 18;

  // ---- Value -------------------------------------------------------------
  if (data.priceBani > 0) {
    micro("Valoare servicii");
    breakPage(44);
    page.drawText(`Abonament lunar, ${luna} ${an}`, {
      x: MARGIN, y: y - 6, size: 10, font: fonts.text, color: COLORS.ink2,
    });
    const amount = lei(data.priceBani);
    const aw = fonts.display.widthOfTextAtSize(amount, 17);
    page.drawText(amount, {
      x: A4[0] - MARGIN - aw, y: y - 8, size: 17, font: fonts.display, color: COLORS.ink,
    });
    y -= 24;
    rule(page, y, COLORS.line, 0.7); y -= 13;
    const vatText = data.vatRegistered
      ? "Prețurile nu includ TVA."
      : "Neplătitor de TVA.";
    const payText = data.iban
      ? `${vatText} Plata în 15 zile de la semnare, în contul ${data.iban}.`
      : `${vatText} Plata în 15 zile de la semnare.`;
    page.drawText(payText, { x: MARGIN, y, size: 8.5, font: fonts.text, color: COLORS.ink2 });
    y -= 24;
  }

  // ---- Confirmation + signatures ----------------------------------------
  breakPage(96);
  page.drawText("Beneficiarul confirmă prestarea serviciilor în luna menționată.", {
    x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink,
  });
  y -= 26;
  const sigColW = CONTENT_W / 2 - 12;
  rule(page, y, COLORS.ink, 1, MARGIN, MARGIN + sigColW);
  rule(page, y, COLORS.ink, 1, colB, colB + sigColW);
  y -= 14;
  drawMicroLabel(page, fonts.semibold, "Prestator", MARGIN, y);
  drawMicroLabel(page, fonts.semibold, "Beneficiar", colB, y);
  y -= 14;
  page.drawText(data.representative ?? data.org.name, {
    x: MARGIN, y, size: 10, font: fonts.text, color: COLORS.ink,
  });
  page.drawText(data.clientName, { x: colB, y, size: 10, font: fonts.text, color: COLORS.ink });
  y -= 22;
  page.drawText("Semnătura și data", { x: MARGIN, y, size: 8.5, font: fonts.text, color: COLORS.ink3 });
  page.drawText("Semnătura și data", { x: colB, y, size: 8.5, font: fonts.text, color: COLORS.ink3 });

  // ---- Footer on every page ---------------------------------------------
  const footerNote = data.sample
    ? "Model de document. Nu atestă servicii prestate."
    : `Cele ${data.photoCount} fotografii datate sunt disponibile în aplicație.`;
  pages.forEach((p, i) => drawDocFooter(p, fonts, footerNote, i + 1, pages.length));

  return doc.save();
}

function microWidth(font: PDFFont, text: string, size: number): number {
  let w = 0;
  for (const ch of text.toUpperCase()) w += font.widthOfTextAtSize(ch, size) + 0.9;
  return w - 0.9;
}

function lastDayOf(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const day = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  return `${String(day).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
}
