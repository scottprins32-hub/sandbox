// Building elements and the condition scale (add-on §6). The element set is
// adapted for a 3-floor walk-up; the 1-6 scale follows NEN 2767, with a
// one-line Romanian definition per score so two different people score the
// same wall the same way.

export type ElementCategory =
  | "structura"
  | "invelitoare"
  | "fatada"
  | "instalatii"
  | "finisaje"
  | "exterior";

export interface ElementSeed {
  key: string;
  nameRo: string;
  category: ElementCategory;
}

export const STANDARD_ELEMENTS: ElementSeed[] = [
  { key: "fundatie", nameRo: "Fundație și soclu", category: "structura" },
  { key: "structura_pereti", nameRo: "Structură - pereți portanți", category: "structura" },
  { key: "plansee", nameRo: "Planșee", category: "structura" },
  { key: "acoperis", nameRo: "Acoperiș / terasă și scurgeri", category: "invelitoare" },
  { key: "fatada", nameRo: "Fațadă și tencuieli", category: "fatada" },
  { key: "tamplarie", nameRo: "Tâmplărie exterioară comună", category: "fatada" },
  { key: "casa_scarii", nameRo: "Casa scării - finisaje", category: "finisaje" },
  { key: "instalatie_electrica", nameRo: "Instalație electrică comună", category: "instalatii" },
  { key: "instalatie_sanitara", nameRo: "Instalație sanitară comună", category: "instalatii" },
  { key: "instalatie_gaze", nameRo: "Instalație de gaze - coloane comune", category: "instalatii" },
  { key: "subsol_umiditate", nameRo: "Subsol - umiditate", category: "structura" },
  { key: "trotuar", nameRo: "Trotuar de gardă și accese", category: "exterior" },
];

export const ELEMENT_BY_KEY: Record<string, ElementSeed> = Object.fromEntries(
  STANDARD_ELEMENTS.map((e) => [e.key, e])
);

export interface ScoreDef {
  score: number;
  labelRo: string;
  /** One-line definition, stored so scoring stays consistent between people. */
  definitionRo: string;
}

export const SCORE_SCALE: ScoreDef[] = [
  { score: 1, labelRo: "Excelent", definitionRo: "Stare ca nouă, fără uzură vizibilă." },
  { score: 2, labelRo: "Bun", definitionRo: "Uzură ușoară, fără efect asupra funcțiunii." },
  {
    score: 3,
    labelRo: "Satisfăcător",
    definitionRo: "Uzură vizibilă; funcțiunea nu este încă afectată.",
  },
  {
    score: 4,
    labelRo: "Mediocru",
    definitionRo: "Degradare locală; necesită lucrări în 1-3 ani.",
  },
  {
    score: 5,
    labelRo: "Slab",
    definitionRo: "Degradare extinsă; necesită intervenție planificată acum.",
  },
  {
    score: 6,
    labelRo: "Foarte slab",
    definitionRo: "Stare critică; risc pentru siguranță sau pentru funcțiune.",
  },
];

export const SCORE_BY_VALUE: Record<number, ScoreDef> = Object.fromEntries(
  SCORE_SCALE.map((s) => [s.score, s])
);

/**
 * Map a walk-finding category to the element it most plausibly concerns —
 * the default for the one-tap promote flow, always overridable by a human.
 */
export const FINDING_CATEGORY_TO_ELEMENT: Record<string, string> = {
  structure: "structura_pereti",
  facade: "fatada",
  water: "subsol_umiditate",
  electrical: "instalatie_electrica",
  gas: "instalatie_gaze",
  fire: "casa_scarii",
  winter: "trotuar",
  green: "trotuar",
};

/** Year-over-year movement on the 1-6 scale (lower is better). */
export function trendLabel(current: number, previous: number | null): string {
  if (previous === null) return "prima evaluare";
  if (current < previous) return "îmbunătățit";
  if (current > previous) return "în declin";
  return "stabil";
}
