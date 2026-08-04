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
  /** Admin UI is English (§0); the annual report renders nameRo. */
  nameEn: string;
  category: ElementCategory;
}

export const STANDARD_ELEMENTS: ElementSeed[] = [
  { key: "fundatie", nameRo: "Fundație și soclu", nameEn: "Foundation and plinth", category: "structura" },
  { key: "structura_pereti", nameRo: "Structură - pereți portanți", nameEn: "Structure - load-bearing walls", category: "structura" },
  { key: "plansee", nameRo: "Planșee", nameEn: "Floor slabs", category: "structura" },
  { key: "acoperis", nameRo: "Acoperiș / terasă și scurgeri", nameEn: "Roof / terrace and drainage", category: "invelitoare" },
  { key: "fatada", nameRo: "Fațadă și tencuieli", nameEn: "Facade and rendering", category: "fatada" },
  { key: "tamplarie", nameRo: "Tâmplărie exterioară comună", nameEn: "Shared exterior windows and doors", category: "fatada" },
  { key: "casa_scarii", nameRo: "Casa scării - finisaje", nameEn: "Stairwell - finishes", category: "finisaje" },
  { key: "instalatie_electrica", nameRo: "Instalație electrică comună", nameEn: "Shared electrical installation", category: "instalatii" },
  { key: "instalatie_sanitara", nameRo: "Instalație sanitară comună", nameEn: "Shared plumbing", category: "instalatii" },
  { key: "instalatie_gaze", nameRo: "Instalație de gaze - coloane comune", nameEn: "Gas installation - shared risers", category: "instalatii" },
  { key: "subsol_umiditate", nameRo: "Subsol - umiditate", nameEn: "Basement - damp", category: "structura" },
  { key: "trotuar", nameRo: "Trotuar de gardă și accese", nameEn: "Perimeter pavement and accesses", category: "exterior" },
];

export const ELEMENT_CATEGORY_LABEL_EN: Record<ElementCategory, string> = {
  structura: "Structure",
  invelitoare: "Roof",
  fatada: "Facade",
  instalatii: "Installations",
  finisaje: "Finishes",
  exterior: "Exterior",
};

export const ELEMENT_BY_KEY: Record<string, ElementSeed> = Object.fromEntries(
  STANDARD_ELEMENTS.map((e) => [e.key, e])
);

export interface ScoreDef {
  score: number;
  labelRo: string;
  /** One-line definition, stored so scoring stays consistent between people. */
  definitionRo: string;
  labelEn: string;
  definitionEn: string;
}

export const SCORE_SCALE: ScoreDef[] = [
  {
    score: 1,
    labelRo: "Excelent",
    definitionRo: "Stare ca nouă, fără uzură vizibilă.",
    labelEn: "Excellent",
    definitionEn: "As new; no visible wear.",
  },
  {
    score: 2,
    labelRo: "Bun",
    definitionRo: "Uzură ușoară, fără efect asupra funcțiunii.",
    labelEn: "Good",
    definitionEn: "Light wear; no effect on function.",
  },
  {
    score: 3,
    labelRo: "Satisfăcător",
    definitionRo: "Uzură vizibilă; funcțiunea nu este încă afectată.",
    labelEn: "Satisfactory",
    definitionEn: "Visible wear; function not yet affected.",
  },
  {
    score: 4,
    labelRo: "Mediocru",
    definitionRo: "Degradare locală; necesită lucrări în 1-3 ani.",
    labelEn: "Mediocre",
    definitionEn: "Local deterioration; work needed within 1-3 years.",
  },
  {
    score: 5,
    labelRo: "Slab",
    definitionRo: "Degradare extinsă; necesită intervenție planificată acum.",
    labelEn: "Poor",
    definitionEn: "Widespread deterioration; plan an intervention now.",
  },
  {
    score: 6,
    labelRo: "Foarte slab",
    definitionRo: "Stare critică; risc pentru siguranță sau pentru funcțiune.",
    labelEn: "Very poor",
    definitionEn: "Critical; a risk to safety or to function.",
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

export type TrendKey = "first" | "improved" | "declined" | "stable";

/**
 * Year-over-year movement on the 1-6 scale (lower is better). Returns a key,
 * not a label: the admin renders it in English, the annual report in Romanian.
 */
export function trendKey(current: number, previous: number | null): TrendKey {
  if (previous === null) return "first";
  if (current < previous) return "improved";
  if (current > previous) return "declined";
  return "stable";
}

export const TREND_LABEL_EN: Record<TrendKey, string> = {
  first: "first assessment",
  improved: "improved",
  declined: "declined",
  stable: "stable",
};

export const TREND_LABEL_RO: Record<TrendKey, string> = {
  first: "prima evaluare",
  improved: "îmbunătățit",
  declined: "în declin",
  stable: "stabil",
};
