// Raport anual de urmărire curentă — PROIECT (add-on §6). Generated as a
// draft for a qualified signatory: the word PROIECT is in the filename, the
// header and a footer on every page (hard rule 4). Scara staff cannot sign
// this document and it says so on its face.

import { PDFDocument, type PDFPage } from "pdf-lib";
import { formatInTimeZone } from "date-fns-tz";
import { APP_TZ } from "@/lib/dates";
import {
  A4,
  COLORS,
  CONTENT_W,
  drawDocHeader,
  drawMicroLabel,
  embedDocFonts,
  MARGIN,
  rule,
  wrapText,
  type OrgIdentity,
} from "./theme";

export interface AnnualReportData {
  org: OrgIdentity;
  buildingLabel: string;
  address: string;
  floors: number;
  apartments: number;
  year: number;
  periodStart: string; // dd.MM.yyyy
  periodEnd: string;
  walksCount: number;
  photoCount: number;
  elements: {
    name: string;
    score: number | null;
    scoreLabel: string | null;
    trend: string;
    note: string | null;
  }[];
  findings: { date: string; element: string; description: string; photoCount: number }[];
  journal: { date: string; kind: string; description: string }[];
  obligationsDone: { date: string; name: string; performer: string; hasDocument: boolean }[];
  recommendations: string[];
}

const KIND_LABEL: Record<string, string> = {
  observatie: "observație",
  interventie: "intervenție",
  modificare: "modificare",
  eveniment: "eveniment",
  document: "document",
};

function roDate(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return d && m ? `${d}.${m}.${y}` : ymd;
}

export async function renderAnnualReportPdf(data: AnnualReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await embedDocFonts(doc);

  const pages: PDFPage[] = [doc.addPage(A4)];
  let page = pages[0]!;
  const paintPaper = (p: PDFPage) =>
    p.drawRectangle({ x: 0, y: 0, width: A4[0], height: A4[1], color: COLORS.white });
  paintPaper(page);

  let y = drawDocHeader(page, fonts, data.org);

  const breakPage = (needed: number) => {
    if (y - needed >= 72) return;
    page = doc.addPage(A4);
    pages.push(page);
    paintPaper(page);
    y = A4[1] - 64;
  };

  const micro = (label: string) => {
    breakPage(34);
    drawMicroLabel(page, fonts.semibold, label, MARGIN, y);
    y -= 14;
  };

  const para = (text: string, size = 9.5, color = COLORS.ink) => {
    for (const line of wrapText(fonts.text, text, size, CONTENT_W)) {
      breakPage(14);
      page.drawText(line, { x: MARGIN, y, size, font: fonts.text, color });
      y -= size + 3.5;
    }
  };

  // ---- Title -------------------------------------------------------------
  page.drawText("RAPORT DE URMĂRIRE CURENTĂ", {
    x: MARGIN, y, size: 16, font: fonts.bold, color: COLORS.ink,
  });
  y -= 20;
  page.drawText("A COMPORTĂRII ÎN TIMP", {
    x: MARGIN, y, size: 16, font: fonts.bold, color: COLORS.ink,
  });
  y -= 16;
  page.drawText(`Anul ${data.year}  —  PROIECT, necesită semnătura persoanei responsabile`, {
    x: MARGIN, y, size: 10, font: fonts.semibold, color: COLORS.rust,
  });
  y -= 16;
  rule(page, y); y -= 16;

  // ---- Identification ----------------------------------------------------
  const regim = data.floors > 1 ? `P+${data.floors - 1}` : "P";
  // Romanian numeral agreement: "de" before the noun for 20+, except
  // compounds ending 01-19 ("un tur", "19 tururi", "20 de tururi").
  const n = data.walksCount;
  const rem = n % 100;
  const needsDe = n >= 20 && (rem === 0 || rem >= 20);
  const walksPhrase =
    n === 1 ? "un tur de control" : `${n}${needsDe ? " de" : ""} tururi de control`;
  const idLines = [
    `Imobil: ${data.buildingLabel}${data.address ? `, ${data.address}` : ""}`,
    `Regim de înălțime: ${regim}    Nr. apartamente: ${data.apartments}`,
    `Perioada observată: ${data.periodStart} - ${data.periodEnd}`,
    `Întocmit de: ${data.org.name}, pe baza observațiilor din ${walksPhrase}`,
  ];
  for (const line of idLines) {
    breakPage(14);
    page.drawText(line, { x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink });
    y -= 13;
  }
  y -= 8;
  rule(page, y); y -= 18;

  // ---- 1. Method ---------------------------------------------------------
  micro("1. Metoda");
  para(
    "Observare vizuală periodică, consemnată la fiecare vizită, cu fotografii datate."
  );
  para(`Număr total de tururi de control în perioadă: ${data.walksCount}`);
  para(`Număr total de fotografii la dosar: ${data.photoCount}`);
  y -= 6;
  rule(page, y); y -= 18;

  // ---- 2. Element condition ---------------------------------------------
  micro("2. Starea elementelor");
  for (const e of data.elements) {
    breakPage(20);
    const name = wrapText(fonts.text, e.name, 9, 200)[0] ?? e.name;
    page.drawText(name, { x: MARGIN, y, size: 9, font: fonts.text, color: COLORS.ink });
    const scoreText = e.score
      ? `Scor ${e.score} (${e.scoreLabel})`
      : "neevaluat";
    page.drawText(scoreText, {
      x: MARGIN + 208, y, size: 9, font: fonts.medium,
      color: e.score && e.score >= 4 ? COLORS.amber : COLORS.ink,
    });
    page.drawText(e.trend, {
      x: MARGIN + 310, y, size: 9, font: fonts.text,
      color:
        e.trend === "în declin"
          ? COLORS.rust
          : e.trend === "îmbunătățit"
            ? COLORS.green
            : COLORS.ink2,
    });
    y -= 11;
    if (e.note) {
      const noteLine = wrapText(fonts.text, e.note, 8, CONTENT_W - 8)[0] ?? e.note;
      breakPage(12);
      page.drawText(noteLine, { x: MARGIN + 8, y, size: 8, font: fonts.text, color: COLORS.ink3 });
      y -= 10;
    }
    rule(page, y + 2, COLORS.line, 0.4);
    y -= 8;
  }
  y -= 8;
  rule(page, y); y -= 18;

  // ---- 3. Findings in the period ----------------------------------------
  micro("3. Constatări în perioadă");
  if (data.findings.length === 0) {
    para("Nu au fost înregistrate constatări în perioada observată.");
  } else {
    for (const f of data.findings) {
      breakPage(28);
      page.drawText(`${f.date} · ${f.element}`, {
        x: MARGIN, y, size: 8.5, font: fonts.medium, color: COLORS.ink2,
      });
      y -= 12;
      para(f.photoCount > 0 ? `${f.description} (${f.photoCount} foto)` : f.description);
      y -= 3;
    }
  }
  y -= 6;
  rule(page, y); y -= 18;

  // ---- 4. Journal --------------------------------------------------------
  micro("4. Evenimente înregistrate (Jurnalul evenimentelor)");
  if (data.journal.length === 0) {
    para("Nicio înregistrare în jurnal în perioada observată.");
  } else {
    for (const j of data.journal) {
      breakPage(16);
      page.drawText(`${roDate(j.date)} · ${KIND_LABEL[j.kind] ?? j.kind}`, {
        x: MARGIN, y, size: 8.5, font: fonts.medium, color: COLORS.ink2,
      });
      y -= 12;
      para(j.description);
      y -= 2;
    }
  }
  y -= 6;
  rule(page, y); y -= 18;

  // ---- 5. Obligations fulfilled in the period ---------------------------
  micro("5. Obligații legale îndeplinite în perioadă");
  if (data.obligationsDone.length === 0) {
    para("Nicio obligație consemnată ca îndeplinită în perioada observată.");
  } else {
    for (const o of data.obligationsDone) {
      breakPage(16);
      const name = wrapText(fonts.text, o.name, 9, 270)[0] ?? o.name;
      page.drawText(`${roDate(o.date)}`, {
        x: MARGIN, y, size: 9, font: fonts.text, color: COLORS.ink2,
      });
      page.drawText(name, { x: MARGIN + 62, y, size: 9, font: fonts.text, color: COLORS.ink });
      const right = o.hasDocument ? `${o.performer} · document atașat` : o.performer;
      const rw = fonts.text.widthOfTextAtSize(right, 8.5);
      page.drawText(right, {
        x: A4[0] - MARGIN - rw, y, size: 8.5, font: fonts.text, color: COLORS.ink2,
      });
      y -= 8;
      rule(page, y, COLORS.line, 0.4);
      y -= 10;
    }
  }
  y -= 8;
  rule(page, y); y -= 18;

  // ---- 6. Recommendations ------------------------------------------------
  micro("6. Recomandări");
  data.recommendations.forEach((r, i) => {
    para(`${i + 1}. ${r}`);
  });
  y -= 10;

  // ---- Closing + signature -----------------------------------------------
  breakPage(92);
  page.drawText(
    `Întocmit: ${data.org.name}, ${formatInTimeZone(new Date(), APP_TZ, "dd.MM.yyyy")}`,
    { x: MARGIN, y, size: 9.5, font: fonts.text, color: COLORS.ink }
  );
  y -= 34;
  rule(page, y, COLORS.ink, 1, MARGIN, MARGIN + CONTENT_W / 2);
  y -= 13;
  page.drawText("Verificat și însușit (persoană responsabilă cu urmărirea curentă)", {
    x: MARGIN, y, size: 8.5, font: fonts.text, color: COLORS.ink3,
  });

  // ---- PROIECT footer on every page (hard rule 4) ------------------------
  const foot1 =
    "PROIECT — necesită verificarea și semnătura persoanei responsabile desemnate, conform reglementărilor în vigoare.";
  const foot2 =
    "Document întocmit în baza Legii 10/1995 și a Normativului P130. Constituie o consemnare de observații și fotografii, nu o expertiză tehnică.";
  pages.forEach((p, i) => {
    rule(p, 56, COLORS.line, 0.7);
    p.drawText(foot1, { x: MARGIN, y: 44, size: 7.5, font: fonts.semibold, color: COLORS.rust });
    p.drawText(foot2, { x: MARGIN, y: 34, size: 7, font: fonts.text, color: COLORS.ink3 });
    const marker = `Pagina ${i + 1} din ${pages.length}`;
    const mw = fonts.text.widthOfTextAtSize(marker, 8);
    p.drawText(marker, {
      x: A4[0] - MARGIN - mw, y: 44, size: 8, font: fonts.text, color: COLORS.ink3,
    });
  });

  return doc.save();
}
