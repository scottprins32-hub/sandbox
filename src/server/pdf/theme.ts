// The Scara document design system, extracted from the approved
// Procesverbal_Scara.html template. One place for tokens, fonts and the
// header/footer chrome so every generated document reads as one family.
//
// Fonts: Instrument Sans for text, Space Grotesk for display numbers.
// Diacritics verified — both cover comma-below ș/ț.

import fs from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// ------------------------------------------------------------------ tokens

const hex = (h: string): RGB => {
  const v = parseInt(h.slice(1), 16);
  return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
};

export const COLORS = {
  ink: hex("#1E1B15"),
  ink2: hex("#6B665A"),
  ink3: hex("#9A9488"),
  paper: hex("#F7F5F0"),
  paper2: hex("#EFECE4"),
  line: hex("#E2DED4"),
  lineStrong: hex("#CFC9BB"),
  green: hex("#2E6B4F"),
  greenDeep: hex("#1F4A37"),
  greenTint: hex("#EEF4F0"),
  rust: hex("#9C3B25"),
  amber: hex("#7C5A17"),
  white: hex("#FFFFFF"),
};

export const A4: [number, number] = [595.28, 841.89];
export const MARGIN = 52;
export const CONTENT_W = A4[0] - MARGIN * 2;

// Micro-labels (SITUAȚIA LUNII etc.): uppercase, letter-spaced, muted.
export const MICRO_TRACK = 0.9; // extra pt between chars at 8pt ≈ 0.06em+

// ------------------------------------------------------------------- fonts

const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");

export interface DocFonts {
  text: PDFFont; // Instrument Sans 400
  medium: PDFFont; // Instrument Sans 500
  semibold: PDFFont; // Instrument Sans 600
  bold: PDFFont; // Instrument Sans 700
  display: PDFFont; // Space Grotesk 700 (big numbers)
  displayMedium: PDFFont; // Space Grotesk 500
}

export async function embedDocFonts(doc: PDFDocument): Promise<DocFonts> {
  doc.registerFontkit(fontkit);
  // Ligatures off: pdf-lib mis-advances multi-codepoint glyphs (the fi ligature
  // rendered "Veri fi cat" and extracted as garbage). Verified fix.
  const NO_LIGATURES = { features: { liga: false, rlig: false, calt: false } };
  const load = async (file: string) =>
    doc.embedFont(await fs.readFile(path.join(FONT_DIR, file)), {
      subset: false,
      ...NO_LIGATURES,
    } as Parameters<typeof doc.embedFont>[1]);
  return {
    text: await load("InstrumentSans_400Regular.ttf"),
    medium: await load("InstrumentSans_500Medium.ttf"),
    semibold: await load("InstrumentSans_600SemiBold.ttf"),
    bold: await load("InstrumentSans_700Bold.ttf"),
    display: await load("SpaceGrotesk_700Bold.ttf"),
    displayMedium: await load("SpaceGrotesk_500Medium.ttf"),
  };
}

// ------------------------------------------------------------- primitives

/** Letter-spaced uppercase micro-label, the section marker of the system. */
export function drawMicroLabel(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  color: RGB = COLORS.ink3,
  size = 8
) {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    page.drawText(ch, { x: cx, y, size, font, color });
    cx += font.widthOfTextAtSize(ch, size) + MICRO_TRACK;
  }
  return cx - MICRO_TRACK; // end x
}

export function rule(
  page: PDFPage,
  y: number,
  color: RGB = COLORS.line,
  thickness = 0.7,
  x1 = MARGIN,
  x2 = A4[0] - MARGIN
) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
}

/** The Scara mark: green rounded square with the stair path, plus wordmark. */
export function drawLogo(page: PDFPage, fonts: DocFonts, x: number, y: number, size = 22) {
  const r = size * 0.22;
  page.drawSvgPath(
    `M ${r} 0 H ${size - r} Q ${size} 0 ${size} ${r} V ${size - r} Q ${size} ${size} ${size - r} ${size} H ${r} Q 0 ${size} 0 ${size - r} V ${r} Q 0 0 ${r} 0 Z`,
    { x, y: y + size, color: COLORS.green }
  );
  // Stair path from the app icon, scaled from a 32-unit grid.
  const s = size / 32;
  page.drawSvgPath("M8 24h6v-5h5v-5h5V9", {
    x,
    y: y + size,
    scale: s,
    borderColor: COLORS.paper,
    borderWidth: 2.6 * s,
    borderLineCap: 1,
  });
  page.drawText("scara", {
    x: x + size + 8,
    y: y + size * 0.18,
    size: size * 0.82,
    font: fonts.semibold,
    color: COLORS.ink,
  });
}

export interface OrgIdentity {
  name: string;
  cui: string;
  regCom?: string;
  address?: string;
  email?: string;
  phone?: string;
}

/**
 * Shared document header: logo left, right-aligned identity block, then the
 * heavy ink rule the template closes the header with. Returns the y below it.
 */
export function drawDocHeader(
  page: PDFPage,
  fonts: DocFonts,
  org: OrgIdentity,
  topY: number = A4[1] - 56
): number {
  drawLogo(page, fonts, MARGIN, topY - 24, 22);

  const right = A4[0] - MARGIN;
  const lines = [
    { text: org.name.toUpperCase(), font: fonts.semibold, size: 8.5, color: COLORS.ink2 },
    ...(org.address
      ? [{ text: org.address, font: fonts.text, size: 8.5, color: COLORS.ink2 }]
      : []),
    {
      text: [org.cui, org.regCom].filter(Boolean).join(" · "),
      font: fonts.text,
      size: 8.5,
      color: COLORS.ink2,
    },
    ...(org.email || org.phone
      ? [
          {
            text: [org.email, org.phone].filter(Boolean).join(" · "),
            font: fonts.text,
            size: 8.5,
            color: COLORS.ink2,
          },
        ]
      : []),
  ];
  let ly = topY;
  for (const l of lines) {
    const w = l.font.widthOfTextAtSize(l.text, l.size);
    page.drawText(l.text, { x: right - w, y: ly, size: l.size, font: l.font, color: l.color });
    ly -= 12;
  }

  const ruleY = Math.min(ly, topY - 34) - 6;
  rule(page, ruleY, COLORS.ink, 1.6);
  return ruleY - 24;
}

/** Shared footer: left note + right page marker above a hairline. */
export function drawDocFooter(
  page: PDFPage,
  fonts: DocFonts,
  leftNote: string,
  pageNo: number,
  pageCount: number
) {
  const y = 40;
  rule(page, y + 14, COLORS.line, 0.7);
  page.drawText(leftNote, { x: MARGIN, y, size: 8, font: fonts.text, color: COLORS.ink3 });
  const marker = `Pagina ${pageNo} din ${pageCount}`;
  const w = fonts.text.widthOfTextAtSize(marker, 8);
  page.drawText(marker, {
    x: A4[0] - MARGIN - w,
    y,
    size: 8,
    font: fonts.text,
    color: COLORS.ink3,
  });
}

export function textWidth(font: PDFFont, text: string, size: number): number {
  return font.widthOfTextAtSize(text, size);
}

/** Simple greedy wrap for paragraph text. */
export function wrapText(
  font: PDFFont,
  text: string,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
