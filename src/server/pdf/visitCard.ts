// "Fișa de vizită" (add-on 2 §C2): a dated card left after every visit,
// printed four to an A4 sheet and cut.
//
// The monthly proces-verbal reaches the committee; the photo log reaches
// whoever opens the app. Neither reaches the 24 people whose opinion decides
// the renewal vote. This does, twice a week, for ten seconds of effort — the
// same mechanism the restroom-log industry has run on for decades. The
// handwritten signature is the product, so the blanks stay blanks.

import { PDFDocument } from "pdf-lib";
import { A4, COLORS, drawLogo, embedDocFonts, type DocFonts } from "./theme";
import type { PDFPage } from "pdf-lib";
import type { QrPath } from "./qr";

export interface VisitCardData {
  orgName: string;
  buildingLabel: string;
  /** Pre-printed dates, one card each. Empty means blank date lines. */
  dates?: string[];
  /** How many blank cards when no dates are given. */
  count?: number;
  qr?: QrPath;
}

/** A6: a quarter of A4, laid out 2 × 2. */
const CARD_W = A4[0] / 2;
const CARD_H = A4[1] / 2;

function drawCard(
  page: PDFPage,
  fonts: DocFonts,
  x: number,
  y: number,
  data: VisitCardData,
  date?: string
) {
  const pad = 26;
  const left = x + pad;
  let cy = y + CARD_H - 46;

  // Cut guides, hairline so they disappear when trimmed.
  page.drawRectangle({
    x, y, width: CARD_W, height: CARD_H,
    borderColor: COLORS.line, borderWidth: 0.4,
  });

  drawLogo(page, fonts, left, cy - 4, 14);
  cy -= 34;

  page.drawText("SCARA CURĂȚATĂ AZI", {
    x: left, y: cy, size: 15, font: fonts.bold, color: COLORS.ink,
  });
  cy -= 16;
  page.drawText(data.buildingLabel, {
    x: left, y: cy, size: 10, font: fonts.text, color: COLORS.ink2,
  });
  cy -= 26;

  const fieldW = CARD_W - pad * 2;
  const field = (label: string, prefilled?: string) => {
    page.drawText(label, {
      x: left, y: cy, size: 9.5, font: fonts.text, color: COLORS.ink3,
    });
    if (prefilled) {
      page.drawText(prefilled, {
        x: left + 62, y: cy, size: 12, font: fonts.semibold, color: COLORS.ink,
      });
    }
    page.drawLine({
      start: { x: left + 58, y: cy - 5 },
      end: { x: left + fieldW, y: cy - 5 },
      thickness: 0.6,
      color: COLORS.lineStrong,
    });
    cy -= 24;
  };

  field("Data", date);
  field("Ora");
  field("Efectuat de");
  field("Următoarea");

  // The footer sits on the baseline of the card, so the space above it stays
  // free for a handwritten signature — which is the point of the card.
  const footY = y + 34;
  page.drawLine({
    start: { x: left, y: footY + 20 },
    end: { x: left + fieldW, y: footY + 20 },
    thickness: 0.5,
    color: COLORS.line,
  });
  page.drawText(data.qr ? "Ați observat ceva? Scanați:" : "Ați observat ceva? Sunați-ne.", {
    x: left, y: footY, size: 9.5, font: fonts.text, color: COLORS.ink2,
  });
  page.drawText(data.orgName, {
    x: left, y: footY - 12, size: 8, font: fonts.text, color: COLORS.ink3,
  });

  if (data.qr) {
    const size = 44;
    page.drawSvgPath(data.qr.d, {
      x: x + CARD_W - pad - size,
      y: footY + size - 8,
      color: COLORS.ink,
      scale: size / data.qr.modules,
    });
  }
}

export async function renderVisitCardsPdf(data: VisitCardData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await embedDocFonts(doc);

  const dates = data.dates ?? [];
  const total = dates.length > 0 ? dates.length : data.count ?? 4;
  const sheets = Math.ceil(total / 4);

  for (let s = 0; s < sheets; s++) {
    const page = doc.addPage(A4);
    page.drawRectangle({
      x: 0, y: 0, width: A4[0], height: A4[1], color: COLORS.white,
    });
    for (let i = 0; i < 4; i++) {
      const index = s * 4 + i;
      if (index >= total) break;
      const col = i % 2;
      const row = Math.floor(i / 2);
      drawCard(
        page,
        fonts,
        col * CARD_W,
        // Row 0 is the top half of the page.
        A4[1] - (row + 1) * CARD_H,
        data,
        dates[index]
      );
    }
  }

  return doc.save();
}
