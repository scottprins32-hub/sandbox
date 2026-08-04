// The ofertă de preț PDF, set in the Scara document design system (theme.ts):
// same header, footer, micro-labels and type as the proces-verbal, so the
// sales pack reads as one family. Still a commercial offer, NOT a fiscal
// invoice (§9 DO-NOT-BUILD #4).

import { PDFDocument, type PDFPage } from "pdf-lib";
import { formatInTimeZone } from "date-fns-tz";
import { APP_TZ } from "@/lib/dates";
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

export interface OfferPdfData {
  orgName: string;
  cui: string;
  vatRegistered: boolean;
  contactLine: string;
  /** Extended identity for the themed header; optional, falls back to name+cui. */
  identity?: Partial<OrgIdentity>;
  representative?: string;
  clientName: string;
  buildingLabel: string;
  address: string;
  floors: number;
  apartments: number;
  residents: number;
  visitsPerWeek: number;
  hoursPerVisit: number;
  priceBani: number;
  perApartmentBani: number;
  perPersonBani: number;
  /** Romanian scope lines, taken from the org's checklist template. */
  scope: string[];
  /** YYYY-MM-DD */
  validUntil: string;
}

function lei(bani: number): string {
  const value = bani / 100;
  return `${value.toLocaleString("ro-RO", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} lei`;
}

function roDate(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}.${m}.${y}`;
}

export async function renderOfferPdf(data: OfferPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await embedDocFonts(doc);

  const pages: PDFPage[] = [doc.addPage(A4)];
  let page = pages[0]!;
  const paintPaper = (p: PDFPage) =>
    p.drawRectangle({ x: 0, y: 0, width: A4[0], height: A4[1], color: COLORS.white });
  paintPaper(page);

  const org: OrgIdentity = {
    name: data.orgName,
    cui: data.cui,
    regCom: data.identity?.regCom,
    address: data.identity?.address,
    email: data.identity?.email,
    phone: data.identity?.phone,
  };
  let y = drawDocHeader(page, fonts, org);

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
    y -= 15;
  };

  // ---- Title -------------------------------------------------------------
  page.drawText("OFERTĂ DE PREȚ", {
    x: MARGIN, y, size: 17, font: fonts.bold, color: COLORS.ink,
  });
  y -= 16;
  page.drawText(
    `Servicii de curățenie pentru casa scării · Data: ${formatInTimeZone(new Date(), APP_TZ, "dd.MM.yyyy")} · Valabilă până la: ${roDate(data.validUntil)}`,
    { x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink2 }
  );
  y -= 14;
  rule(page, y); y -= 18;

  // ---- For whom ----------------------------------------------------------
  micro("Pentru");
  page.drawText(data.clientName, { x: MARGIN, y, size: 10.5, font: fonts.semibold, color: COLORS.ink });
  y -= 13;
  page.drawText(`Imobil: ${data.buildingLabel}${data.address ? `, ${data.address}` : ""}`, {
    x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink,
  });
  y -= 12;
  page.drawText(
    `${data.floors} etaje · ${data.apartments} apartamente · ${data.residents} locatari`,
    { x: MARGIN, y, size: 9, font: fonts.text, color: COLORS.ink3 }
  );
  y -= 14;
  rule(page, y); y -= 18;

  // ---- Scope, two numbered columns ---------------------------------------
  micro("Ce includem");
  page.drawText(
    `Curățenie de ${data.visitsPerWeek} ori pe săptămână, aproximativ ${String(data.hoursPerVisit).replace(".", ",")} ore pe vizită:`,
    { x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink2 }
  );
  y -= 16;
  const half = Math.ceil(data.scope.length / 2);
  const startY = y;
  data.scope.forEach((line, i) => {
    const col = i < half ? 0 : 1;
    const ax = MARGIN + (col === 0 ? 0 : CONTENT_W / 2 + 8);
    const ay = startY - (i % half) * 15;
    page.drawText(`${i + 1}. ${line}`, { x: ax, y: ay, size: 9.5, font: fonts.text, color: COLORS.ink });
  });
  y = startY - half * 15 - 8;
  rule(page, y); y -= 18;

  // ---- Price -------------------------------------------------------------
  micro("Preț");
  const priceRow = (label: string, value: string, strong = false) => {
    const font = strong ? fonts.display : fonts.text;
    const size = strong ? 16 : 10;
    page.drawText(label, {
      x: MARGIN, y: y - (strong ? 3 : 0), size: 10,
      font: fonts.text, color: COLORS.ink2,
    });
    const w = font.widthOfTextAtSize(value, size);
    page.drawText(value, {
      x: A4[0] - MARGIN - w, y: y - (strong ? 4 : 0), size, font,
      color: strong ? COLORS.greenDeep : COLORS.ink,
    });
    y -= strong ? 24 : 16;
  };
  priceRow("Total pe lună", lei(data.priceBani), true);
  priceRow("Pe apartament, pe lună", lei(data.perApartmentBani));
  priceRow("Pe locatar, pe lună", lei(data.perPersonBani));
  page.drawText(
    data.vatRegistered
      ? "Prețurile nu includ TVA."
      : "Prestatorul nu este înregistrat în scopuri de TVA. Prețul de mai sus este prețul final.",
    { x: MARGIN, y, size: 8.5, font: fonts.text, color: COLORS.ink3 }
  );
  y -= 14;
  rule(page, y); y -= 18;

  // ---- The differentiator ------------------------------------------------
  micro("Ce primiți în plus față de o firmă obișnuită");
  const promises: [string, string][] = [
    ["Fotografii datate la fiecare vizită", "Fiecare curățenie e documentată în aplicație, cu ora și data."],
    ["Proces-verbal lunar semnat", "La final de lună primiți un document cu vizitele programate și cele efectuate."],
    ["O lună gratuită dacă nu suntem la nivel", "Dacă nu respectăm programul promis, luna aceea nu se plătește."],
    ["Personal angajat legal", "Contracte de muncă în regulă, nu muncă la negru. Fără risc pentru asociație."],
  ];
  for (const [title, body] of promises) {
    breakPage(26);
    page.drawText(title, { x: MARGIN, y, size: 9.5, font: fonts.semibold, color: COLORS.ink });
    y -= 12;
    page.drawText(body, { x: MARGIN, y, size: 9, font: fonts.text, color: COLORS.ink2 });
    y -= 15;
  }
  y -= 3;
  rule(page, y); y -= 18;

  // ---- Contract ----------------------------------------------------------
  micro("Contract");
  for (const line of wrapText(
    fonts.text,
    "Durată 12 luni, cu preaviz de 60 de zile. Prețul se poate indexa cu salariul minim.",
    9.5,
    CONTENT_W
  )) {
    page.drawText(line, { x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink2 });
    y -= 13;
  }
  y -= 16;

  // ---- Signatures, drawn as one block ------------------------------------
  breakPage(70);
  const colB = MARGIN + CONTENT_W / 2 + 8;
  const sigColW = CONTENT_W / 2 - 12;
  rule(page, y, COLORS.ink, 1, MARGIN, MARGIN + sigColW);
  rule(page, y, COLORS.ink, 1, colB, colB + sigColW);
  y -= 14;
  drawMicroLabel(page, fonts.semibold, "Prestator", MARGIN, y);
  drawMicroLabel(page, fonts.semibold, "Beneficiar", colB, y);
  y -= 14;
  page.drawText(data.representative ?? data.orgName, {
    x: MARGIN, y, size: 10, font: fonts.text, color: COLORS.ink,
  });
  page.drawText(data.clientName, { x: colB, y, size: 10, font: fonts.text, color: COLORS.ink });
  y -= 20;
  page.drawText("Semnătura și data", { x: MARGIN, y, size: 8.5, font: fonts.text, color: COLORS.ink3 });
  page.drawText("Semnătura și data", { x: colB, y, size: 8.5, font: fonts.text, color: COLORS.ink3 });

  pages.forEach((p, i) =>
    drawDocFooter(
      p,
      fonts,
      "Prezentul document este o ofertă comercială și nu constituie factură fiscală.",
      i + 1,
      pages.length
    )
  );

  return doc.save();
}
