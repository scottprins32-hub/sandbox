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

export interface WalkReportRow {
  date: string; // dd.MM.yyyy
  time: string; // HH:mm
  points: number;
  findings: number;
}

export interface FindingReportRow {
  date: string;
  checkpointLabel: string | null;
  severity: "info" | "attention" | "urgent";
  description: string;
  photoCount: number;
}

export interface ObligationReportRow {
  name: string;
  /** Pre-formatted: a dd.MM.yyyy date, "permanent", or "nestabilit". */
  dueLabel: string;
  statusLabel: string;
  performer: string;
}

export interface AnnexPhoto {
  jpg: Uint8Array;
  caption: string;
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
  // ---- Raport lunar de control (add-on §5). When the month has control
  // walks, the document upgrades: new title, sections 2-5 and a photo annex.
  /** Active service lines, listed under the month-at-a-glance block. */
  serviceLinesActive?: string[];
  walks?: WalkReportRow[];
  findings?: FindingReportRow[];
  obligations?: ObligationReportRow[];
  /** Summed statutory maximums for uncovered obligations, in bani. */
  exposureBani?: number;
  recommendations?: string[];
  annexPhotos?: AnnexPhoto[];
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
  // With control walks in the month the document is the Raport lunar de
  // control (add-on §5); without them it stays the plain proces-verbal.
  const isRaport = (data.walks?.length ?? 0) > 0;
  const [titleA, titleB] = isRaport
    ? ["RAPORT LUNAR DE CONTROL", "ȘI ÎNTREȚINERE"]
    : ["PROCES-VERBAL DE RECEPȚIE", "A SERVICIILOR DE CURĂȚENIE"];
  page.drawText(titleA, {
    x: MARGIN, y, size: 17, font: fonts.bold, color: COLORS.ink,
  });
  y -= 21;
  page.drawText(titleB, {
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
  y -= boxH + 10;

  if (data.serviceLinesActive && data.serviceLinesActive.length > 0) {
    const servicesLine = `Servicii active: ${data.serviceLinesActive.join(" · ")}`;
    for (const line of wrapText(fonts.text, servicesLine, 9, CONTENT_W)) {
      breakPage(13);
      page.drawText(line, { x: MARGIN, y, size: 9, font: fonts.text, color: COLORS.ink2 });
      y -= 12;
    }
  }
  y -= 12;

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

  // ---- Raport lunar sections (add-on §5) ---------------------------------
  if (isRaport) {
    // 2. Control walks performed.
    micro("Tururi de control efectuate");
    for (const w of data.walks!) {
      breakPage(18);
      page.drawText(`${w.date}  ${w.time}`, {
        x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink,
      });
      page.drawText(`${w.points} puncte verificate`, {
        x: MARGIN + 130, y, size: 9.5, font: fonts.text, color: COLORS.ink,
      });
      const verdict = w.findings === 0
        ? "fără deficiențe"
        : `${w.findings} ${w.findings === 1 ? "constatare" : "constatări"}`;
      const vFont = w.findings === 0 ? fonts.text : fonts.medium;
      const vColor = w.findings === 0 ? COLORS.green : COLORS.amber;
      const vw = vFont.widthOfTextAtSize(verdict, 9.5);
      page.drawText(verdict, {
        x: A4[0] - MARGIN - vw, y, size: 9.5, font: vFont, color: vColor,
      });
      y -= 8;
      rule(page, y, COLORS.line, 0.5);
      y -= 14;
    }
    y -= 8;

    // 3. Findings.
    micro("Constatări");
    if ((data.findings?.length ?? 0) === 0) {
      breakPage(16);
      page.drawText("Nu au fost identificate deficiențe în luna raportată.", {
        x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink,
      });
      y -= 16;
    } else {
      const sevLabel = { info: "informativ", attention: "de urmărit", urgent: "urgent" };
      for (const f of data.findings!) {
        breakPage(34);
        const head = [f.date, f.checkpointLabel, sevLabel[f.severity]]
          .filter(Boolean)
          .join(" · ");
        page.drawText(head, {
          x: MARGIN, y, size: 8.5, font: fonts.medium,
          color: f.severity === "urgent" ? COLORS.rust : COLORS.ink2,
        });
        y -= 12;
        const body = f.photoCount > 0 ? `${f.description} (foto anexată)` : f.description;
        for (const line of wrapText(fonts.text, body, 9.5, CONTENT_W)) {
          breakPage(14);
          page.drawText(line, { x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink });
          y -= 13;
        }
        y -= 6;
      }
    }
    y -= 4;
    rule(page, y); y -= 18;

    // 4. Legal obligations as of today.
    if (data.obligations && data.obligations.length > 0) {
      micro(`Obligații legale — situația la ${formatInTimeZone(new Date(), APP_TZ, "dd.MM.yyyy")}`);
      for (const o of data.obligations) {
        breakPage(18);
        const name = wrapText(fonts.text, o.name, 8.5, 236)[0] ?? o.name;
        page.drawText(name, { x: MARGIN, y, size: 8.5, font: fonts.text, color: COLORS.ink });
        page.drawText(o.dueLabel, {
          x: MARGIN + 244, y, size: 8.5, font: fonts.text, color: COLORS.ink2,
        });
        page.drawText(o.statusLabel, {
          x: MARGIN + 302, y, size: 8.5, font: fonts.medium,
          color:
            o.statusLabel === "restant"
              ? COLORS.rust
              : o.statusLabel === "în regulă"
                ? COLORS.green
                : COLORS.ink2,
        });
        const pw = fonts.text.widthOfTextAtSize(o.performer, 8.5);
        page.drawText(o.performer, {
          x: A4[0] - MARGIN - pw, y, size: 8.5, font: fonts.text, color: COLORS.ink2,
        });
        y -= 7;
        rule(page, y, COLORS.line, 0.4);
        y -= 11;
      }
      y -= 4;
      if (data.exposureBani !== undefined) {
        breakPage(28);
        page.drawText(
          `Expunere maximă la sancțiuni pentru obligațiile neacoperite: ${lei(data.exposureBani)}`,
          { x: MARGIN, y, size: 9.5, font: fonts.medium, color: COLORS.ink }
        );
        y -= 12;
        page.drawText("(valori maxime prevăzute de lege, cu titlu informativ)", {
          x: MARGIN, y, size: 8, font: fonts.text, color: COLORS.ink3,
        });
        y -= 16;
      }
      rule(page, y); y -= 18;
    }

    // 5. Recommendations for next month.
    if (data.recommendations && data.recommendations.length > 0) {
      micro("Recomandări pentru luna următoare");
      data.recommendations.forEach((r, i) => {
        for (const line of wrapText(fonts.text, `${i + 1}. ${r}`, 9.5, CONTENT_W)) {
          breakPage(14);
          page.drawText(line, { x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink });
          y -= 13;
        }
      });
      y -= 8;
      rule(page, y); y -= 18;
    }
  }

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

  // ---- Photo annex (raport variant): contact sheet, four per page --------
  if (isRaport && data.annexPhotos && data.annexPhotos.length > 0) {
    const cellW = (CONTENT_W - 16) / 2;
    const cellH = 236;
    const imgMaxH = cellH - 34;
    let idx = 0;
    while (idx < data.annexPhotos.length) {
      page = doc.addPage(A4);
      pages.push(page);
      paintPaper(page);
      let ay = A4[1] - 64;
      drawMicroLabel(page, fonts.semibold, `Anexă foto — ${luna} ${an}`, MARGIN, ay);
      ay -= 10;
      rule(page, ay, COLORS.ink, 1);
      ay -= 16;
      for (let cell = 0; cell < 4 && idx < data.annexPhotos.length; cell++, idx++) {
        const { jpg, caption } = data.annexPhotos[idx]!;
        const col = cell % 2;
        const row = Math.floor(cell / 2);
        const cx = MARGIN + col * (cellW + 16);
        const cy = ay - row * (cellH + 14);
        try {
          const img = await doc.embedJpg(jpg);
          const scale = Math.min(cellW / img.width, imgMaxH / img.height);
          const w = img.width * scale;
          const hh = img.height * scale;
          page.drawImage(img, { x: cx + (cellW - w) / 2, y: cy - hh, width: w, height: hh });
          page.drawRectangle({
            x: cx + (cellW - w) / 2, y: cy - hh, width: w, height: hh,
            borderColor: COLORS.lineStrong, borderWidth: 0.6,
          });
        } catch {
          page.drawText("(fotografie indisponibilă)", {
            x: cx, y: cy - 20, size: 8.5, font: fonts.text, color: COLORS.ink3,
          });
        }
        const capLine = wrapText(fonts.text, caption, 8, cellW)[0] ?? caption;
        page.drawText(capLine, {
          x: cx, y: cy - imgMaxH - 14, size: 8, font: fonts.text, color: COLORS.ink2,
        });
      }
    }
  }

  // ---- Footer on every page ---------------------------------------------
  if (isRaport) {
    const foot1 = "Acest document atestă activitatea de întreținere și observațiile prestatorului.";
    const foot2 = "Nu constituie expertiză tehnică, verificare autorizată sau atestare de conformitate.";
    pages.forEach((p, i) => {
      rule(p, 56, COLORS.line, 0.7);
      p.drawText(foot1, { x: MARGIN, y: 44, size: 7.5, font: fonts.text, color: COLORS.ink3 });
      p.drawText(foot2, { x: MARGIN, y: 34, size: 7.5, font: fonts.text, color: COLORS.ink3 });
      const marker = `Pagina ${i + 1} din ${pages.length}`;
      const mw = fonts.text.widthOfTextAtSize(marker, 8);
      p.drawText(marker, {
        x: A4[0] - MARGIN - mw, y: 44, size: 8, font: fonts.text, color: COLORS.ink3,
      });
    });
  } else {
    const footerNote = data.sample
      ? "Model de document. Nu atestă servicii prestate."
      : `Cele ${data.photoCount} fotografii datate sunt disponibile în aplicație.`;
    pages.forEach((p, i) => drawDocFooter(p, fonts, footerNote, i + 1, pages.length));
  }

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
