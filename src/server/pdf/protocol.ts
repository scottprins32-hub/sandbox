// The proces-verbal PDF (§7.2) — Romanian regardless of UI language (§0).
// pdf-lib + fontkit with Inter TTF bundled in the repo: the standard 14 PDF
// fonts would corrupt ș/ț (comma-below diacritics).

import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatInTimeZone } from "date-fns-tz";
import { APP_TZ, monthNameRo } from "@/lib/dates";

export interface ProtocolData {
  orgName: string;
  cui: string;
  clientName: string;
  buildingLabel: string;
  address: string;
  monthKey: string; // YYYY-MM
  scheduled: number;
  done: number;
  visitsPerWeek: number;
  photoCount: number;
  issuesResolved: number; // omit line when 0
}

const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");

export async function renderProtocolPdf(data: ProtocolData): Promise<Uint8Array> {
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

  const page = doc.addPage([595.28, 841.89]); // A4
  const ink = rgb(0.13, 0.13, 0.11);
  const margin = 64;
  let y = 780;

  const write = (
    text: string,
    opts?: { bold?: boolean; size?: number; gapAfter?: number; center?: boolean }
  ) => {
    const font = opts?.bold ? bold : regular;
    const size = opts?.size ?? 11;
    const x = opts?.center
      ? (595.28 - font.widthOfTextAtSize(text, size)) / 2
      : margin;
    page.drawText(text, { x, y, size, font, color: ink });
    y -= size + (opts?.gapAfter ?? 7);
  };

  const { luna, an } = monthNameRo(data.monthKey);

  write("PROCES-VERBAL DE RECEPȚIE A SERVICIILOR DE CURĂȚENIE", {
    bold: true,
    size: 13,
    center: true,
    gapAfter: 10,
  });
  write(`Luna: ${luna} ${an}`, { center: true, gapAfter: 26 });

  write(`Prestator: ${data.orgName}, ${data.cui}`);
  write(`Beneficiar: ${data.clientName}`);
  write(`Imobil: ${data.buildingLabel}, ${data.address}`, { gapAfter: 22 });

  write("Servicii prestate conform contract:", { bold: true, gapAfter: 10 });
  write(
    `- Vizite programate: ${data.scheduled}   Vizite efectuate: ${data.done}`
  );
  write(
    `- Curățenie casa scării și hol intrare: de ${data.visitsPerWeek} ori pe săptămână`
  );
  write(`- Fotografii de confirmare atașate în aplicație: ${data.photoCount}`, {
    gapAfter: data.issuesResolved > 0 ? 7 : 22,
  });
  if (data.issuesResolved > 0) {
    write(`Sesizări înregistrate și rezolvate în lună: ${data.issuesResolved}`, {
      gapAfter: 22,
    });
  }

  write("Beneficiarul confirmă prestarea serviciilor în luna menționată.", {
    gapAfter: 46,
  });

  write("Prestator: ____________     Beneficiar: ____________", { gapAfter: 14 });
  write(`Data: ${formatInTimeZone(new Date(), APP_TZ, "dd.MM.yyyy")}`);

  return doc.save();
}
