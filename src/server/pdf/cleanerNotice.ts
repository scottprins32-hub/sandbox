// "Îngrijitorul scării dumneavoastră" — the named-cleaner notice (add-on 2 §C3).
//
// A5, for the entrance-hall board next to the maintenance schedule. A firm
// with 300 stairwells physically cannot put a name and a face on each one; a
// two-person company can, and that is the one advantage that gets harder to
// copy the larger the competitor grows. It also changes the complaint channel:
// residents complain to a company, but they talk to a person.
//
// Consent is not a formality here. This sheet only renders for a cleaner who
// has said yes, and the photo is optional even then — see §C3.

import { PDFDocument } from "pdf-lib";
import {
  COLORS,
  drawLogo,
  drawMicroLabel,
  embedDocFonts,
  rule,
  wrapText,
} from "./theme";

/** A5 portrait, half of A4. */
export const A5: [number, number] = [419.53, 595.28];
const MARGIN = 40;
const CONTENT_W = A5[0] - MARGIN * 2;

export interface CleanerNoticeData {
  orgName: string;
  buildingLabel: string;
  /** The cleaner's own preferred name, not the payroll one. */
  displayName: string;
  /** Two sentences, written by them (§C3). */
  introRo: string;
  daysRo: string;
  windowFrom: string;
  windowTo: string;
  /** JPEG/PNG bytes. Optional: a name alone is most of the value. */
  photo?: { bytes: Uint8Array; type: "jpg" | "png" };
  phone?: string;
}

export async function renderCleanerNoticePdf(
  data: CleanerNoticeData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await embedDocFonts(doc);
  const page = doc.addPage(A5);

  let y = A5[1] - MARGIN;

  drawLogo(page, fonts, MARGIN, y - 20, 18);
  y -= 46;

  drawMicroLabel(page, fonts.medium, "Îngrijitorul scării dumneavoastră", MARGIN, y);
  y -= 18;
  rule(page, y, COLORS.ink, 2, MARGIN, A5[0] - MARGIN);
  y -= 30;

  page.drawText(data.buildingLabel, {
    x: MARGIN, y, size: 13, font: fonts.medium, color: COLORS.ink2,
  });
  y -= 30;

  // Photo, when the cleaner supplied one. Square, left-aligned, with the name
  // beside it so the sheet still reads at a metre if the photo is missing.
  let textX = MARGIN;
  let nameY = y;
  if (data.photo) {
    const size = 108;
    const img =
      data.photo.type === "png"
        ? await doc.embedPng(data.photo.bytes)
        : await doc.embedJpg(data.photo.bytes);
    page.drawImage(img, { x: MARGIN, y: y - size, width: size, height: size });
    textX = MARGIN + size + 18;
    nameY = y - 30;
  }

  page.drawText(data.displayName, {
    x: textX, y: nameY - 4, size: 26, font: fonts.display, color: COLORS.ink,
  });

  y = data.photo ? y - 108 - 26 : nameY - 34;

  const intro = wrapText(fonts.text, data.introRo, 12, CONTENT_W);
  for (const line of intro) {
    page.drawText(line, { x: MARGIN, y, size: 12, font: fonts.text, color: COLORS.ink2 });
    y -= 18;
  }

  y -= 18;
  rule(page, y, COLORS.line);
  y -= 26;

  drawMicroLabel(page, fonts.medium, "Program", MARGIN, y);
  y -= 24;
  page.drawText(`Vine ${data.daysRo},`, {
    x: MARGIN, y, size: 17, font: fonts.semibold, color: COLORS.ink,
  });
  y -= 22;
  page.drawText(`între ${data.windowFrom} și ${data.windowTo}.`, {
    x: MARGIN, y, size: 17, font: fonts.semibold, color: COLORS.ink,
  });

  if (data.phone) {
    y -= 40;
    rule(page, y + 16, COLORS.line);
    page.drawText("Sesizări", {
      x: MARGIN, y, size: 10, font: fonts.text, color: COLORS.ink2,
    });
    y -= 22;
    page.drawText(data.phone, {
      x: MARGIN, y, size: 19, font: fonts.bold, color: COLORS.ink,
    });
  }

  page.drawText(data.orgName, {
    x: MARGIN, y: MARGIN, size: 10, font: fonts.medium, color: COLORS.ink3,
  });

  return doc.save();
}
