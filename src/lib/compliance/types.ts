// Compliance layer types (add-on §3). Money in bani, like the rest of the app.

export type PerformerRequirement = "us" | "authorised_third_party" | "qualified_signatory";

export type Cadence =
  | { kind: "fixed"; perYear: number } // n times per year
  | { kind: "months"; every: number } // every n months
  | { kind: "years"; every: number }
  | { kind: "continuous" } // no due date, state-based
  | { kind: "seasonal"; fromMonth: number; toMonth: number }
  | { kind: "event" } // triggered (snowfall, storm)
  | { kind: "once"; byDate: string }; // ISO date

export type ObligationCategory =
  | "ddd"
  | "fire"
  | "gas"
  | "structure"
  | "waste"
  | "winter"
  | "green"
  | "facade"
  | "water"
  | "lift"
  | "playground"
  | "electrical";

export type AppliesIf =
  | "has_lift"
  | "has_gas"
  | "has_playground"
  | "has_basement"
  | "always";

export type Obligation = {
  key: string; // stable id, e.g. 'ddd_dezinsectie'
  nameRo: string; // shown in RO documents and UI
  nameEn: string; // admin UI
  category: ObligationCategory;
  cadence: Cadence;
  legalBasis: string[]; // exact citations
  scope: "national" | "timisoara" | "giroc";
  performerRequirement: PerformerRequirement;
  fineMinBani: number | null; // per statute, legal entities where distinguished
  fineMaxBani: number | null;
  fineNote?: string;
  typicalCostMinBani?: number; // market cost to comply
  typicalCostMaxBani?: number;
  appliesIf?: AppliesIf;
  /**
   * The research notes below are English: they are read in the admin app, not
   * printed. Anything that reaches a client document needs a Romanian
   * counterpart first — do not pipe these straight into a PDF.
   */
  salesNote?: string; // the angle to take when selling this obligation
  needsVerification?: string; // preserve research uncertainty honestly
  sourceNote: string; // where the number came from
};

/** Building flags the catalogue filters against. */
export interface BuildingFlags {
  hasLift?: boolean;
  hasGas?: boolean;
  hasPlayground?: boolean;
  hasBasement?: boolean;
}

export type ObligationStatus = "ok" | "due_soon" | "overdue" | "unknown";

/** Romanian labels for the performer requirement, shown wherever it appears. */
export const PERFORMER_LABEL_RO: Record<PerformerRequirement, string> = {
  us: "Executăm și consemnăm noi",
  authorised_third_party: "Firmă autorizată; noi coordonăm",
  qualified_signatory: "Necesită semnătura unei persoane calificate",
};

export const PERFORMER_LABEL_EN: Record<PerformerRequirement, string> = {
  us: "We perform and record it",
  authorised_third_party: "Authorised firm; we coordinate",
  qualified_signatory: "Requires a qualified signatory",
};

export const CATEGORY_LABEL_RO: Record<ObligationCategory, string> = {
  ddd: "DDD",
  fire: "Securitate la incendiu",
  gas: "Gaze și coșuri de fum",
  structure: "Structură și carte tehnică",
  waste: "Deșeuri și salubrizare",
  winter: "Serviciu de iarnă",
  green: "Spațiu verde",
  facade: "Fațadă",
  water: "Apă și subsol",
  lift: "Ascensor",
  playground: "Loc de joacă",
  electrical: "Instalații electrice",
};

/** The admin app is English (§0); documents and the Portal stay Romanian. */
export const CATEGORY_LABEL_EN: Record<ObligationCategory, string> = {
  ddd: "Pest control",
  fire: "Fire safety",
  gas: "Gas and flues",
  structure: "Structure and technical book",
  waste: "Waste and sanitation",
  winter: "Winter service",
  green: "Green space",
  facade: "Facade",
  water: "Water and basement",
  lift: "Lift",
  playground: "Playground",
  electrical: "Electrical installations",
};

export const STATUS_LABEL_EN: Record<ObligationStatus, string> = {
  overdue: "overdue",
  due_soon: "due soon",
  ok: "current",
  unknown: "not recorded",
};

export const STATUS_LABEL_RO: Record<ObligationStatus, string> = {
  overdue: "restant",
  due_soon: "scadent curând",
  ok: "în regulă",
  unknown: "neînregistrat",
};
