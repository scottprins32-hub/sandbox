// The ofertă de preț PDF — Romanian, because the audience is Romanian (§0).
// This is a commercial offer, NOT a fiscal invoice: no invoice series, no
// fiscal VAT breakdown, no payment instructions. Invoicing stays out of Scara
// (§9 DO-NOT-BUILD #4).

import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatInTimeZone } from "date-fns-tz";
import { APP_TZ } from "@/lib/dates";

export interface OfferPdfData {
  orgName: string;
  cui: string;
  vatRegistered: boolean;
  contactLine: string;
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

const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");
const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;

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
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(
    await fs.readFile(path.join(FONT_DIR, "Inter_400Regular.ttf")),
    { subset: false }
  );
  const bold = await doc.embedFont(
    await fs.readFile(path.join(FONT_DIR, "Inter_700Bold.ttf")),
    { subset: false }
  );

  let page: PDFPage = doc.addPage(A4);
  const ink = rgb(0.13, 0.13, 0.11);
  const soft = rgb(0.34, 0.33, 0.31);
  const moss = rgb(0.17, 0.32, 0.24);
  let y = A4[1] - 64;

  const ensureRoom = (needed: number) => {
    if (y - needed < 64) {
      page = doc.addPage(A4);
      y = A4[1] - 64;
    }
  };

  const write = (
    text: string,
    opts?: {
      font?: PDFFont;
      size?: number;
      gapAfter?: number;
      color?: ReturnType<typeof rgb>;
      center?: boolean;
      x?: number;
    }
  ) => {
    const font = opts?.font ?? regular;
    const size = opts?.size ?? 10.5;
    ensureRoom(size + 6);
    const x = opts?.center
      ? (A4[0] - font.widthOfTextAtSize(text, size)) / 2
      : (opts?.x ?? MARGIN);
    page.drawText(text, { x, y, size, font, color: opts?.color ?? ink });
    y -= size + (opts?.gapAfter ?? 6);
  };

  const rule = (gap = 12) => {
    ensureRoom(gap + 2);
    page.drawLine({
      start: { x: MARGIN, y: y + 4 },
      end: { x: A4[0] - MARGIN, y: y + 4 },
      thickness: 0.6,
      color: rgb(0.89, 0.88, 0.85),
    });
    y -= gap;
  };

  /** Label left, value right-aligned on the same baseline. */
  const row = (label: string, value: string, opts?: { strong?: boolean }) => {
    const size = opts?.strong ? 12 : 10.5;
    const valueFont = opts?.strong ? bold : regular;
    ensureRoom(size + 6);
    page.drawText(label, { x: MARGIN, y, size, font: regular, color: soft });
    const w = valueFont.widthOfTextAtSize(value, size);
    page.drawText(value, {
      x: A4[0] - MARGIN - w,
      y,
      size,
      font: valueFont,
      color: opts?.strong ? moss : ink,
    });
    y -= size + 6;
  };

  // Header
  write("OFERTĂ DE PREȚ", { font: bold, size: 20, gapAfter: 4 });
  write("Servicii de curățenie pentru casa scării", { size: 11, color: soft, gapAfter: 14 });

  write(`Prestator: ${data.orgName}, ${data.cui}`, { size: 10 });
  if (data.contactLine) write(`Contact: ${data.contactLine}`, { size: 10, color: soft });
  write(
    `Data: ${formatInTimeZone(new Date(), APP_TZ, "dd.MM.yyyy")}   Valabilă până la: ${roDate(data.validUntil)}`,
    { size: 10, color: soft, gapAfter: 16 }
  );

  rule();
  write("Pentru", { font: bold, size: 12, gapAfter: 8 });
  write(`Beneficiar: ${data.clientName}`, { size: 10.5 });
  write(`Imobil: ${data.buildingLabel}${data.address ? `, ${data.address}` : ""}`, {
    size: 10.5,
  });
  write(
    `${data.floors} etaje · ${data.apartments} apartamente · ${data.residents} locatari`,
    { size: 10, color: soft, gapAfter: 16 }
  );

  // Scope
  rule();
  write("Ce includem", { font: bold, size: 12, gapAfter: 8 });
  write(
    `Curățenie de ${data.visitsPerWeek} ori pe săptămână, aproximativ ${String(
      data.hoursPerVisit
    ).replace(".", ",")} ore pe vizită:`,
    { size: 10.5, color: soft, gapAfter: 8 }
  );
  for (const line of data.scope) {
    write(`•  ${line}`, { size: 10.5, gapAfter: 4 });
  }
  y -= 10;

  // Price
  rule();
  write("Preț", { font: bold, size: 12, gapAfter: 10 });
  row("Total pe lună", lei(data.priceBani), { strong: true });
  row("Pe apartament, pe lună", lei(data.perApartmentBani));
  row("Pe locatar, pe lună", lei(data.perPersonBani));
  write(
    data.vatRegistered
      ? "Prețurile nu includ TVA."
      : "Prestatorul nu este înregistrat în scopuri de TVA. Prețul de mai sus este prețul final.",
    { size: 9.5, color: soft, gapAfter: 16 }
  );

  // The differentiator: proof
  rule();
  write("Ce primiți în plus față de o firmă obișnuită", { font: bold, size: 12, gapAfter: 10 });
  const promises: [string, string][] = [
    [
      "Fotografii datate la fiecare vizită",
      "Fiecare curățenie e documentată în aplicație, cu ora și data.",
    ],
    [
      "Proces-verbal lunar semnat",
      "La final de lună primiți un document cu vizitele programate și cele efectuate.",
    ],
    [
      "O lună gratuită dacă nu suntem la nivel",
      "Dacă nu respectăm programul promis, luna aceea nu se plătește.",
    ],
    [
      "Personal angajat legal",
      "Contracte de muncă în regulă, nu muncă la negru. Fără risc pentru asociație.",
    ],
  ];
  for (const [title, body] of promises) {
    write(title, { font: bold, size: 10.5, gapAfter: 3 });
    write(body, { size: 10, color: soft, gapAfter: 7 });
  }

  y -= 2;
  rule(10);
  write("Contract", { font: bold, size: 12, gapAfter: 7 });
  write(
    "Durată 12 luni, cu preaviz de 60 de zile. Prețul se poate indexa cu salariul minim.",
    { size: 10.5, color: soft, gapAfter: 22 }
  );

  // Closing block, drawn directly. write() re-checks the bottom margin on every
  // line, which orphans the fine print onto a second page when the block starts
  // near the foot. Reserve once against a tighter foot margin, then draw both
  // lines unconditionally so signatures and disclaimer always stay together.
  const CLOSING_HEIGHT = 34;
  const FOOT_MARGIN = 44;
  if (y - CLOSING_HEIGHT < FOOT_MARGIN) {
    page = doc.addPage(A4);
    y = A4[1] - 64;
  }
  page.drawText("Prestator: ____________________          Beneficiar: ____________________", {
    x: MARGIN,
    y,
    size: 10.5,
    font: regular,
    color: ink,
  });
  y -= 22;
  page.drawText(
    "Prezentul document este o ofertă comercială și nu constituie factură fiscală.",
    { x: MARGIN, y, size: 8.5, font: regular, color: soft }
  );

  return doc.save();
}
