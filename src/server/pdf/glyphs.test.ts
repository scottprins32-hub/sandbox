import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { describe, expect, it } from "vitest";
import { OBLIGATIONS } from "@/lib/compliance";
import { COMMITMENTS } from "@/lib/commitments";
import { SERVICE_TASKS } from "@/lib/services/task-catalogue";
import { SERVICE_LINES } from "@/lib/compliance/services";

// Every string in these catalogues is printed into a PDF with Instrument Sans.
// A character the font has no glyph for renders as an empty box — which is how
// "Legea 101/2006 art. 28¹⁴(5)" reached a client-facing offer as
// "art. 28□□(5)". Nothing in the render path can detect that: pdf-lib draws
// the missing glyph without complaint.
//
// So check the text against the actual font file, before it is ever drawn.

const FONT = path.join(
  process.cwd(),
  "src",
  "assets",
  "fonts",
  "InstrumentSans_400Regular.ttf"
);

type Font = { hasGlyphForCodePoint(cp: number): boolean };

function unsupported(text: string, font: Font): string[] {
  const missing = new Set<string>();
  for (const ch of text) {
    // Whitespace and newlines are laid out, never drawn as glyphs.
    if (/\s/.test(ch)) continue;
    if (!font.hasGlyphForCodePoint(ch.codePointAt(0)!)) missing.add(ch);
  }
  return [...missing];
}

describe("printed text stays inside the document font", () => {
  // @pdf-lib/fontkit exposes create(buffer), not openSync.
  const font = fontkit.create(fs.readFileSync(FONT)) as unknown as Font;

  const corpus: [string, string][] = [
    ...OBLIGATIONS.flatMap((o): [string, string][] => [
      [`obligation ${o.key} nameRo`, o.nameRo],
      [`obligation ${o.key} legalBasis`, o.legalBasis.join(" · ")],
      [`obligation ${o.key} fineNote`, o.fineNote ?? ""],
    ]),
    ...SERVICE_TASKS.flatMap((t): [string, string][] => [
      [`task ${t.key} nameRo`, t.nameRo],
      [`task ${t.key} gapNote`, t.gapNote ?? ""],
    ]),
    ...SERVICE_LINES.map((s): [string, string] => [`service ${s.key}`, s.nameRo]),
    ...COMMITMENTS.map((c): [string, string] => [`commitment ${c.key}`, c.textRo]),
  ];

  it.each(corpus.filter(([, text]) => text.length > 0))(
    "%s",
    (_label, text) => {
      expect(unsupported(text, font)).toEqual([]);
    }
  );
});
