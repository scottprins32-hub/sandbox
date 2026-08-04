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
  /**
   * Compliance sections (add-on §8): the applicable obligations subset with
   * citations and fine ranges, the summed statutory exposure, the selected
   * service lines and the honest boundaries list. The section that sells.
   */
  compliance?: {
    serviceLines: { name: string; unitLabel: string; priceBani: number }[];
    /** Core cleaning + recurring lines, per month. */
    monthlyTotalBani: number;
    obligations: { name: string; cadence: string; fineRange: string; citation: string }[];
    exposureBani: number;
  };
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

  // ---- Selected service lines (add-on §8, "Ce oferim") -------------------
  if (data.compliance && data.compliance.serviceLines.length > 0) {
    micro("Servicii incluse în ofertă");
    for (const s of data.compliance.serviceLines) {
      breakPage(18);
      page.drawText(s.name, { x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink });
      const price = `${lei(s.priceBani)} ${s.unitLabel}`;
      const pw = fonts.text.widthOfTextAtSize(price, 9);
      page.drawText(price, {
        x: A4[0] - MARGIN - pw, y, size: 9, font: fonts.text, color: COLORS.ink2,
      });
      y -= 8;
      rule(page, y, COLORS.line, 0.4);
      y -= 12;
    }
    breakPage(20);
    page.drawText("Total lunar cu serviciile recurente incluse", {
      x: MARGIN, y, size: 9.5, font: fonts.medium, color: COLORS.ink,
    });
    const tot = lei(data.compliance.monthlyTotalBani);
    const tw = fonts.display.widthOfTextAtSize(tot, 12);
    page.drawText(tot, {
      x: A4[0] - MARGIN - tw, y: y - 1, size: 12, font: fonts.display, color: COLORS.greenDeep,
    });
    y -= 18;
    rule(page, y); y -= 18;
  }

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
  micro(data.compliance ? "Ce primiți lunar" : "Ce primiți în plus față de o firmă obișnuită");
  const promises: [string, string][] = [
    ["Fotografii datate la fiecare vizită", "Fiecare curățenie e documentată în aplicație, cu ora și data."],
    ["Proces-verbal lunar semnat", "La final de lună primiți un document cu vizitele programate și cele efectuate."],
    ...(data.compliance
      ? ([
          [
            "Raport lunar de control și întreținere",
            "Tururi documentate pe puncte de control, cu constatări consemnate și anexă foto.",
          ],
          [
            "Calendarul obligațiilor legale, la zi",
            "Vedeți oricând ce este scadent, cine are voie să execute și ce documente există la dosar.",
          ],
        ] as [string, string][])
      : []),
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

  // ---- Compliance sections (add-on §8) -----------------------------------
  if (data.compliance) {
    // The applicable obligations, with citations — the section that sells.
    micro("Obligațiile legale ale imobilului dumneavoastră");
    for (const line of wrapText(
      fonts.text,
      "Conform datelor despre imobil, legislația în vigoare prevede următoarele obligații pentru asociație sau proprietar:",
      9,
      CONTENT_W
    )) {
      breakPage(13);
      page.drawText(line, { x: MARGIN, y, size: 9, font: fonts.text, color: COLORS.ink2 });
      y -= 12;
    }
    y -= 4;
    for (const o of data.compliance.obligations) {
      breakPage(34);
      const name = wrapText(fonts.semibold, o.name, 9.5, CONTENT_W - 130)[0] ?? o.name;
      page.drawText(name, { x: MARGIN, y, size: 9.5, font: fonts.semibold, color: COLORS.ink });
      const right = o.cadence;
      const rw = fonts.text.widthOfTextAtSize(right, 8.5);
      page.drawText(right, {
        x: A4[0] - MARGIN - rw, y, size: 8.5, font: fonts.text, color: COLORS.ink2,
      });
      y -= 11;
      page.drawText(`Sancțiune: ${o.fineRange} · ${o.citation}`, {
        x: MARGIN, y, size: 7.5, font: fonts.text, color: COLORS.ink3,
      });
      y -= 8;
      rule(page, y, COLORS.line, 0.4);
      y -= 11;
    }
    y -= 4;

    // The summed statutory maximum — labelled, never a prediction (§2.6).
    breakPage(56);
    micro("Expunerea maximă la sancțiuni");
    page.drawText("Expunere maximă conform legii", {
      x: MARGIN, y: y - 4, size: 10, font: fonts.text, color: COLORS.ink2,
    });
    const ex = lei(data.compliance.exposureBani);
    const exw = fonts.display.widthOfTextAtSize(ex, 16);
    page.drawText(ex, {
      x: A4[0] - MARGIN - exw, y: y - 5, size: 16, font: fonts.display, color: COLORS.ink,
    });
    y -= 22;
    for (const line of wrapText(
      fonts.text,
      "Suma valorilor maxime prevăzute de lege pentru obligațiile aplicabile imobilului, cu titlu informativ. Nu este o predicție și nu înlocuiește o opinie juridică.",
      8,
      CONTENT_W
    )) {
      breakPage(12);
      page.drawText(line, { x: MARGIN, y, size: 8, font: fonts.text, color: COLORS.ink3 });
      y -= 11;
    }
    y -= 6;
    rule(page, y); y -= 18;

    // Honest boundaries — a trust move, and legally protective (add-on §8.5).
    micro("Ce nu facem");
    const boundaries = [
      "Tratamentele DDD (dezinsecție, dezinfecție, deratizare) sunt executate exclusiv de parteneri atestați DSP. Noi le programăm, le însoțim și arhivăm documentele.",
      "Verificările tehnice (gaze, ascensor, PRAM, coșuri de fum) sunt efectuate de firme autorizate. Noi ținem calendarul și dosarul.",
      "Raportul anual de urmărire a comportării în timp se predă ca proiect și necesită semnătura persoanei responsabile desemnate.",
      "Nu oferim consultanță juridică; datele legale sunt citate cu titlu de referință, iar poziția juridică se confirmă cu un avocat sau cu contabilul asociației.",
    ];
    boundaries.forEach((b, i) => {
      for (const line of wrapText(fonts.text, `${i + 1}. ${b}`, 9, CONTENT_W)) {
        breakPage(13);
        page.drawText(line, { x: MARGIN, y, size: 9, font: fonts.text, color: COLORS.ink });
        y -= 12;
      }
      y -= 3;
    });
    y -= 5;
    rule(page, y); y -= 18;
  }

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
