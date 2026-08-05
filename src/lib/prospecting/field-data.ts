// The Giroc/Chișoda field survey turned into seed data (add-on 2 §3.2).
// 248 multi-family buildings were mapped and clustered into five walkable
// routes; these are the routes exactly as surveyed, with their parking points.
//
// Romanian throughout: this is read on a phone, standing in a stairwell.

export interface RouteSeed {
  name: string;
  description: string;
  parkAtLabel: string;
  parkAtLat?: number;
  parkAtLng?: number;
  estBuildings: number;
  orderIndex: number;
  notes: string;
  /** Streets walked, in the order the route takes them. */
  streets: string[];
}

export const ROUTE_SEEDS: RouteSeed[] = [
  {
    name: "În spatele Lidl",
    description:
      "Cea mai densă zonă din comună: 42 de blocuri într-un dreptunghi de 500 × 230 m.",
    parkAtLabel: "Lidl, Calea Timișoarei 11",
    parkAtLat: 45.70778,
    parkAtLng: 21.2328,
    estBuildings: 53,
    orderIndex: 1,
    notes:
      "Se termină la contractul existent — poți arăta clientului o clădire pe care o întreținem deja.",
    streets: [
      "Dacilor",
      "Romanilor",
      "Remus",
      "Calea Timișoarei",
      "Romulus",
      "Decebal",
      "Planetei",
      "Cerului",
      "Rachetei",
      "Cosmos",
      "Fântânii",
    ],
  },
  {
    name: "Calea Timișoarei Nord",
    description: "41 de blocuri în jurul străzii Cucului, plus două grupuri la 370-380 m.",
    parkAtLabel: "Mega Image nord",
    parkAtLat: 45.71955,
    parkAtLng: 21.23644,
    estBuildings: 52,
    orderIndex: 2,
    notes:
      "Cea mai bună rută pentru vizite la rece — mult stoc vechi de 2 etaje, uși deschise, asociații constituite.",
    streets: [
      "Cucului",
      "Calea Timișoarei",
      "Rândunicii",
      "Ghirlandei",
      "Privighetorii",
      "Gospodarilor",
      "Libertății",
      "Aviației",
      "Aderării",
      "Visului",
    ],
  },
  {
    name: "Est / Soarelui-Urseni",
    description:
      "990 m de mers. Include Albăstrelelor, cel mai compact grup din tot setul de date.",
    parkAtLabel: "Parcările de pe Ioan Țuculescu",
    estBuildings: 55,
    orderIndex: 3,
    notes: "Fără magazin ancoră. Verifică parcarea înainte.",
    streets: [
      "Petalei",
      "Salcâmului",
      "Macilor",
      "Albăstrelelor",
      "Liliacului",
      "Ioan Țuculescu",
      "Rapiței",
      "Roiniței",
    ],
  },
  {
    name: "Cartier Planetelor",
    description: "67 de blocuri, dar 1,4 km între opriri.",
    parkAtLabel: "Grupul Planetei",
    estBuildings: 67,
    orderIndex: 4,
    notes: "Împarte pe două dimineți.",
    streets: [
      "Speranței",
      "Cupidon",
      "Marte",
      "Neptun",
      "Ecoului",
      "Gândului",
      "Inocenței",
    ],
  },
  {
    name: "Chișoda / Cartierul Armatei",
    description: "8 blocuri într-un pătrat de 157 × 219 m, plus două grupuri satelit.",
    parkAtLabel: "Profi Chișoda",
    estBuildings: 8,
    orderIndex: 5,
    notes: "Densitate mică. Doar combinat cu Bega.",
    streets: ["Aleea cu Plopi", "Bd. Armatei", "Bega", "Trandafirilor"],
  },
];

/**
 * Streets ranked by mapped block count, for the capture form's autocomplete.
 * Chișoda proper is almost entirely houses — the block stock filed under that
 * postcode is really the Calea Timișoarei corridor.
 */
export const STREETS_REFERENCE: { name: string; blocks: number }[] = [
  { name: "Calea Timișoarei", blocks: 23 },
  { name: "Liliacului", blocks: 16 },
  { name: "Aleea cu Plopi", blocks: 11 },
  { name: "Cucului", blocks: 11 },
  { name: "Dacilor", blocks: 11 },
  { name: "Romanilor", blocks: 9 },
  { name: "Rândunicii", blocks: 8 },
  { name: "Remus", blocks: 8 },
  { name: "Petalei", blocks: 8 },
  { name: "Orhideea", blocks: 7 },
  { name: "Albăstrelelor", blocks: 7 },
  { name: "Inocenței", blocks: 6 },
  { name: "Speranței", blocks: 5 },
  { name: "Macilor", blocks: 5 },
  { name: "Bega", blocks: 5 },
  { name: "Trandafirilor", blocks: 5 },
  { name: "Ioan Țuculescu", blocks: 5 },
  // Mapped but absent from the published street register (§10 of the pack).
  { name: "Romulus", blocks: 0 },
  { name: "Decebal", blocks: 0 },
  { name: "Anton Pavlovici Cehov", blocks: 0 },
  { name: "Salcâmului", blocks: 0 },
  { name: "Rapiței", blocks: 0 },
  { name: "Roiniței", blocks: 0 },
  { name: "Ghirlandei", blocks: 0 },
  { name: "Privighetorii", blocks: 0 },
  { name: "Gospodarilor", blocks: 0 },
  { name: "Libertății", blocks: 0 },
  { name: "Aviației", blocks: 0 },
  { name: "Aderării", blocks: 0 },
  { name: "Visului", blocks: 0 },
  { name: "Planetei", blocks: 0 },
  { name: "Cerului", blocks: 0 },
  { name: "Rachetei", blocks: 0 },
  { name: "Cosmos", blocks: 0 },
  { name: "Cupidon", blocks: 0 },
  { name: "Marte", blocks: 0 },
  { name: "Neptun", blocks: 0 },
  { name: "Ecoului", blocks: 0 },
  { name: "Gândului", blocks: 0 },
  { name: "Fântânii", blocks: 0 },
  { name: "Bd. Armatei", blocks: 0 },
];

// ---------------------------------------------------------------- labels

export type ProspectStatus =
  | "de_vizitat"
  | "vizitat"
  | "contactat"
  | "oferta_trimisa"
  | "castigat"
  | "pierdut";

export type Ownership = "asociatie" | "proprietar_unic" | "dezvoltator" | "necunoscut";
export type Access = "deschis" | "interfon" | "poarta" | "necunoscut";
export type Incumbent = "niciunul" | "femeie_serviciu" | "firma" | "necunoscut";
export type ContactRole =
  | "administrator"
  | "presedinte"
  | "comitet"
  | "proprietar"
  | "dezvoltator";
export type PhotoKind = "avizier" | "pubele" | "intrare" | "scara" | "exterior";

export const STATUS_LABEL_RO: Record<ProspectStatus, string> = {
  de_vizitat: "de vizitat",
  vizitat: "vizitat",
  contactat: "contactat",
  oferta_trimisa: "ofertă trimisă",
  castigat: "câștigat",
  pierdut: "pierdut",
};

export const OWNERSHIP_LABEL_RO: Record<Ownership, string> = {
  asociatie: "asociație",
  proprietar_unic: "proprietar unic",
  dezvoltator: "dezvoltator",
  necunoscut: "nu știu",
};

export const ACCESS_LABEL_RO: Record<Access, string> = {
  deschis: "deschis",
  interfon: "interfon",
  poarta: "poartă",
  necunoscut: "nu știu",
};

export const INCUMBENT_LABEL_RO: Record<Incumbent, string> = {
  niciunul: "niciunul",
  femeie_serviciu: "femeie de serviciu",
  firma: "firmă",
  necunoscut: "nu știu",
};

export const CONTACT_ROLE_LABEL_RO: Record<ContactRole, string> = {
  administrator: "administrator",
  presedinte: "președinte",
  comitet: "comitet",
  proprietar: "proprietar",
  dezvoltator: "dezvoltator",
};

export const PHOTO_KIND_LABEL_RO: Record<PhotoKind, string> = {
  avizier: "Avizier",
  pubele: "Pubele",
  intrare: "Intrare",
  scara: "Scară",
  exterior: "Exterior",
};

export const MONTHS_RO = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

/**
 * The legal reminder shown on the avizier capture button. Not a nicety: the
 * lista de plată carries owners' names, apartment numbers and arrears, which
 * is third-party financial data with no legitimate interest attached.
 */
export const AVIZIER_PHOTO_WARNING =
  "Fotografiază doar panoul cu datele de contact. Nu fotografia lista de plată.";

// ------------------------------------------------------------- scorecard

export interface ScorecardInput {
  access: Access;
  incumbent: Incumbent;
  hasBinPhoto: boolean;
  ownership: Ownership;
  assemblyMonth?: number | null;
  /** Month index 1-12 in Bucharest terms. */
  currentMonth: number;
}

export type PriorityTag = "prioritate_mare" | "sezon" | "prin_dezvoltator";

export interface Scorecard {
  tags: PriorityTag[];
  /** One sentence, always visible — never a number, never a grade (§7.5). */
  reasonRo: string;
}

export const PRIORITY_LABEL_RO: Record<PriorityTag, string> = {
  prioritate_mare: "Prioritate mare",
  sezon: "Sezon",
  prin_dezvoltator: "Prin dezvoltator",
};

/** Months until the assembly, wrapping the year. */
export function monthsUntil(assemblyMonth: number, currentMonth: number): number {
  return (assemblyMonth - currentMonth + 12) % 12;
}

/**
 * Plain-language priority. No score, no letter grade: a number invites the
 * client to argue with the methodology and hides the reasoning from the person
 * doing the walking (§7.5).
 */
export function scorecard(input: ScorecardInput): Scorecard {
  const tags: PriorityTag[] = [];
  const reasons: string[] = [];

  const noRealIncumbent =
    input.incumbent === "niciunul" || input.incumbent === "femeie_serviciu";

  if (input.access === "deschis" && noRealIncumbent && input.hasBinPhoto) {
    tags.push("prioritate_mare");
  }
  if (input.access === "deschis") reasons.push("acces liber");
  if (input.incumbent === "niciunul") reasons.push("fără firmă de curățenie");
  else if (input.incumbent === "femeie_serviciu") reasons.push("doar femeie de serviciu");

  if (
    input.assemblyMonth &&
    monthsUntil(input.assemblyMonth, input.currentMonth) <= 4
  ) {
    tags.push("sezon");
    reasons.push(`adunarea generală în ${MONTHS_RO[input.assemblyMonth - 1]}`);
  }

  if (input.ownership === "dezvoltator" || input.access === "poarta") {
    tags.push("prin_dezvoltator");
    reasons.push(
      input.ownership === "dezvoltator"
        ? "administrat de dezvoltator"
        : "acces cu poartă"
    );
  }

  if (input.hasBinPhoto) reasons.push("poză la pubele");

  const reasonRo =
    reasons.length > 0
      ? `${reasons[0]!.charAt(0).toUpperCase()}${reasons[0]!.slice(1)}${
          reasons.length > 1 ? `, ${reasons.slice(1).join(", ")}` : ""
        }.`
      : "Încă nimic consemnat.";

  return { tags, reasonRo };
}

/** Sort order for the route list: the most worth knocking on first. */
export function priorityRank(tags: PriorityTag[]): number {
  if (tags.includes("prioritate_mare")) return 0;
  if (tags.includes("sezon")) return 1;
  if (tags.includes("prin_dezvoltator")) return 3;
  return 2;
}

/** GDPR art. 14: inform within one month of collecting the data. */
export const INFORM_DEADLINE_DAYS = 30;

/** Retention review threshold for lost prospects (§3.4). Never auto-deletes. */
export const RETENTION_REVIEW_MONTHS = 24;
