// "Programul de întreținere" (add-on 2 §C1): the A4 sheet that goes on the
// entrance-hall notice board.
//
// The whole point is legibility from a metre away, standing up: 12pt body
// minimum, 18pt headings. 73% of residents in the benchmark survey could not
// say how often their building was cleaned — this sheet is the answer, and it
// costs paper and toner.
//
// Romanian regardless of the admin's language (§1.4).

import { PDFDocument, type PDFPage } from "pdf-lib";
import {
  A4,
  COLORS,
  CONTENT_W,
  drawLogo,
  drawMicroLabel,
  embedDocFonts,
  MARGIN,
  rule,
  wrapText,
} from "./theme";

export interface ScheduleGroup {
  labelRo: string;
  lines: string[];
}

export interface ScheduleData {
  orgName: string;
  buildingLabel: string;
  address?: string;
  /** "luni și joi" */
  daysRo: string;
  windowFrom: string; // "07:00"
  windowTo: string; // "09:00"
  /** First name only — the notice is about a person, not a payroll record. */
  cleanerFirstName?: string;
  groups: ScheduleGroup[];
  /** Winter line is fixed by the commitments, printed when the org has it. */
  winterLine?: string;
  phone: string;
  /** Only set when the building's public page is live, so no QR ever 404s. */
  publicUrl?: string;
  qrSvgPath?: string;
}

export async function renderSchedulePdf(data: ScheduleData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await embedDocFonts(doc);

  const pages: PDFPage[] = [doc.addPage(A4)];
  let page = pages[0]!;
  const paint = (p: PDFPage) =>
    p.drawRectangle({ x: 0, y: 0, width: A4[0], height: A4[1], color: COLORS.white });
  paint(page);

  let y = A4[1] - 56;
  const breakPage = (needed: number) => {
    if (y - needed >= 70) return;
    page = doc.addPage(A4);
    pages.push(page);
    paint(page);
    y = A4[1] - 56;
  };

  // ---- Title ------------------------------------------------------------
  page.drawText("PROGRAMUL", { x: MARGIN, y, size: 30, font: fonts.bold, color: COLORS.ink });
  y -= 32;
  page.drawText("DE ÎNTREȚINERE", {
    x: MARGIN, y, size: 30, font: fonts.bold, color: COLORS.ink,
  });
  y -= 30;
  page.drawText(data.buildingLabel, {
    x: MARGIN, y, size: 18, font: fonts.semibold, color: COLORS.greenDeep,
  });
  y -= 20;
  if (data.address) {
    page.drawText(data.address, {
      x: MARGIN, y, size: 12, font: fonts.text, color: COLORS.ink2,
    });
    y -= 18;
  }
  y -= 4;
  rule(page, y, COLORS.ink, 2);
  y -= 26;

  // ---- Days and hours: the two facts residents cannot name ---------------
  page.drawText("Zile de lucru", {
    x: MARGIN, y, size: 12, font: fonts.text, color: COLORS.ink2,
  });
  page.drawText("Interval orar", {
    x: MARGIN + CONTENT_W / 2, y, size: 12, font: fonts.text, color: COLORS.ink2,
  });
  y -= 22;
  page.drawText(data.daysRo, {
    x: MARGIN, y, size: 17, font: fonts.semibold, color: COLORS.ink,
  });
  page.drawText(`${data.windowFrom} - ${data.windowTo}`, {
    x: MARGIN + CONTENT_W / 2, y, size: 17, font: fonts.semibold, color: COLORS.ink,
  });
  y -= 24;
  if (data.cleanerFirstName) {
    page.drawText(`Îngrijit de: ${data.cleanerFirstName}`, {
      x: MARGIN, y, size: 13, font: fonts.medium, color: COLORS.ink,
    });
    y -= 20;
  }
  y -= 4;
  rule(page, y, COLORS.lineStrong, 1);
  y -= 26;

  // ---- The work, grouped by how often it happens -------------------------
  for (const group of data.groups) {
    if (group.lines.length === 0) continue;
    breakPage(60);
    drawMicroLabel(page, fonts.bold, group.labelRo, MARGIN, y, COLORS.greenDeep, 12);
    y -= 20;
    for (const line of group.lines) {
      for (const [i, wrapped] of wrapText(fonts.text, line, 12.5, CONTENT_W - 18).entries()) {
        breakPage(20);
        if (i === 0) {
          page.drawText("·", {
            x: MARGIN + 2, y, size: 12.5, font: fonts.bold, color: COLORS.green,
          });
        }
        page.drawText(wrapped, {
          x: MARGIN + 18, y, size: 12.5, font: fonts.text, color: COLORS.ink,
        });
        y -= 17;
      }
    }
    y -= 12;
  }

  if (data.winterLine) {
    breakPage(60);
    drawMicroLabel(page, fonts.bold, "Iarna (1 noiembrie - 31 martie)", MARGIN, y, COLORS.greenDeep, 12);
    y -= 20;
    for (const wrapped of wrapText(fonts.text, data.winterLine, 12.5, CONTENT_W - 18)) {
      breakPage(20);
      page.drawText(wrapped, {
        x: MARGIN + 18, y, size: 12.5, font: fonts.text, color: COLORS.ink,
      });
      y -= 17;
    }
    y -= 12;
  }

  // ---- Contact block -----------------------------------------------------
  breakPage(110);
  y -= 6;
  rule(page, y, COLORS.ink, 2);
  y -= 28;
  page.drawText("Sesizări", { x: MARGIN, y, size: 12, font: fonts.text, color: COLORS.ink2 });
  y -= 24;
  page.drawText(data.phone, {
    x: MARGIN, y, size: 22, font: fonts.bold, color: COLORS.ink,
  });

  if (data.qrSvgPath && data.publicUrl) {
    const size = 92;
    const qx = A4[0] - MARGIN - size;
    const qy = y - 14;
    page.drawSvgPath(data.qrSvgPath, {
      x: qx,
      y: qy + size,
      color: COLORS.ink,
      scale: size / 25,
    });
    page.drawText("Starea scării, oricând:", {
      x: qx - 4, y: qy - 12, size: 9.5, font: fonts.text, color: COLORS.ink2,
    });
  }

  y -= 34;
  page.drawText(data.orgName, {
    x: MARGIN, y, size: 12, font: fonts.medium, color: COLORS.ink2,
  });

  return doc.save();
}
