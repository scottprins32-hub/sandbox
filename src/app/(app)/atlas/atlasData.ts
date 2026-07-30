// Atlas Cut 1 — the Giroc belt, baked from constants + Scott's monthly research
// pass (§6b: curated monthly atlas, not a live data feed). Fields with no
// researched number yet say so explicitly; Scott fills them monthly.

import { MARKET } from "@/lib/constants";

export const ATLAS_LAST_UPDATED = "July 2026"; // Scott bumps this on his monthly pass

export interface CommuneCard {
  key: string;
  name: string;
  wave: string;
  population: string;
  growth: string;
  projectsPerYear: string;
  blocksEst: string;
  shortLets: string;
  rentLevel: string; // manual field, monthly
  note: string;
}

export const COMMUNES: CommuneCard[] = [
  {
    key: "giroc",
    name: "Giroc / Chișoda",
    wave: "Home base",
    population: `${MARKET.GIROC.population.toLocaleString("en-US")} (+65% in a decade)`,
    growth: "#1 commune in Romania for residential development",
    projectsPerYear: `${MARKET.GIROC.projectsPerYear} residential projects/yr`,
    blocksEst: `${MARKET.GIROC.blocksEst[0]}-${MARKET.GIROC.blocksEst[1]} apartment blocks (est.)`,
    shortLets: "no data. fill monthly",
    rentLevel: "no data. fill monthly",
    note: "First four buildings live here (Strada Fântânii). Density still climbing; every new block is a prospect.",
  },
  {
    key: "dumbravita",
    name: "Dumbrăvița",
    wave: "Wave 2",
    population: MARKET.DUMBRAVITA.population.toLocaleString("en-US"),
    growth: "#2 commune in Romania for residential development",
    projectsPerYear: `${MARKET.DUMBRAVITA.projectsPerYear} residential projects/yr`,
    blocksEst: "no data. fill monthly",
    shortLets: "no data. fill monthly",
    rentLevel: "no data. fill monthly",
    note: "Second route, own cleaner. Opposite side of the city, so it needs its own anchor before it pays.",
  },
  {
    key: "mosnita",
    name: "Moșnița Nouă",
    wave: "Wave 2",
    population: "no data. fill monthly",
    growth: "Fast-growing belt commune, mostly houses; blocks arriving",
    projectsPerYear: "no data. fill monthly",
    blocksEst: "no data. fill monthly",
    shortLets: "no data. fill monthly",
    rentLevel: "no data. fill monthly",
    note: "Watch list: fewer blocks today, but the belt's third growth corridor. Field pass needed.",
  },
  {
    key: "timisoara-sud",
    name: "Timișoara (south)",
    wave: "Wave 3",
    population: `~${MARKET.TIMISOARA.students.toLocaleString("en-US")} students citywide`,
    growth: "Mature stock, fragmented micro-firm competition",
    projectsPerYear: "no data. fill monthly",
    blocksEst: `${MARKET.TIMISOARA.blocks[0].toLocaleString("en-US")}-${MARKET.TIMISOARA.blocks[1].toLocaleString("en-US")} blocks, ${MARKET.TIMISOARA.associations[0].toLocaleString("en-US")}-${MARKET.TIMISOARA.associations[1].toLocaleString("en-US")} owners' associations citywide`,
    shortLets: `${MARKET.TIMISOARA.shortLets} short-let properties (turnover-clean demand)`,
    rentLevel: "no data. fill monthly",
    note: "Wave 3: enter via the southern neighborhoods bordering Giroc. Short-lets are the flex bench's daytime work.",
  },
];
