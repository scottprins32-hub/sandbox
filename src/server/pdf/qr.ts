// QR codes for the printables (add-on 2 §C1, §C2, §C5).
//
// `qrcode`'s own SVG renderer emits a *stroked* path — horizontal segments at
// y+0.5 with an implicit stroke-width of 1 — and pdf-lib's drawSvgPath fills
// by default, so handing that string straight to a PDF draws nothing at all.
// It also picks its own module count from the payload length, which makes any
// hardcoded scale factor wrong for a longer URL.
//
// So build the path here as filled rectangles, run-length merged per row, and
// report the module count alongside it. The caller scales by
// `size / modules`, which is correct for every payload.

import QRCode from "qrcode";

export interface QrPath {
  /** SVG path data in a `modules` x `modules` box, y increasing downward. */
  d: string;
  modules: number;
}

export function qrPath(text: string): QrPath {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const parts: string[] = [];

  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!data[row * size + col]) {
        col++;
        continue;
      }
      let run = 1;
      while (col + run < size && data[row * size + col + run]) run++;
      parts.push(`M${col} ${row}h${run}v1h-${run}Z`);
      col += run;
    }
  }

  return { d: parts.join(""), modules: size };
}

/** The public building URL a printed QR resolves to (§C5). */
export function publicBuildingUrl(baseUrl: string, publicCode: string): string {
  // Lowercase: middleware normalises page paths, and a QR that lands on a 308
  // wastes a round trip on the worst connection in the building.
  return `${baseUrl.replace(/\/$/, "")}/b/${publicCode.toLowerCase()}`;
}
