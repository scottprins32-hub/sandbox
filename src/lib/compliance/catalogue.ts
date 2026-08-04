// THE OBLIGATIONS CATALOGUE (add-on §3).
//
// This is researched Romanian law, not invention. Citations, frequencies and
// fine amounts are entered verbatim from the research and must not be "tidied
// up" (add-on §1.4). Where the research flagged uncertainty, `needsVerification`
// preserves it honestly rather than hiding it.
//
// Money in bani, like the rest of the app. Fine figures are MAXIMUM STATUTORY
// RANGES, never predictions (add-on §2.6).
//
// Note on `dezinfecție`: the word is banned from bin-related service naming and
// UI copy (add-on §2.2) because performing DDD without DSP notification and
// attested staff carries a 5,000-10,000 lei fine. `ddd_dezinfectie` below is the
// legal obligation itself, which the company coordinates and never performs.
// Bin cleaning as a SERVICE is called `igienizare` (see the service catalogue).

import type { Obligation } from "./types";

export const CATALOGUE_VERSION = "2026-07-31";

const DDD_VERIFICATION =
  "Frecvența diferă între HCL 117/2024 (anual), HCL 393/2023 (trimestrial/semestrial) și Ordin ANRSC 97/2025. Se aplică cea mai strictă până la confirmarea juridică.";

const DDD_FINE_NOTE = "HG 857/2011 art. 57, persoane juridice.";

export const OBLIGATIONS: Obligation[] = [
  // ---------------------------------------------------------------- DDD (3)
  // Coordination only: authorised_third_party for all three.
  {
    key: "ddd_dezinsectie",
    nameRo: "Dezinsecție spații comune închise",
    nameEn: "Pest control (insects), enclosed common areas",
    category: "ddd",
    // National baseline is 3/year; Timisoara requires quarterly. The
    // verification note says apply the strictest until legal confirmation, so
    // the cadence encodes quarterly.
    cadence: { kind: "fixed", perYear: 4 },
    legalBasis: ["Ordin ANRSC 97/2025 art. 94(1)(c)", "HCL Timișoara 393/2023 art. 68(2)(a)"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: 3000_00,
    fineMaxBani: 8000_00,
    fineNote: DDD_FINE_NOTE,
    typicalCostMinBani: 300_00,
    typicalCostMaxBani: 450_00,
    appliesIf: "always",
    salesNote:
      "We coordinate and schedule it; the work itself is done by a DSP-accredited firm. You get the signed service record (proces-verbal) and the safety data sheets on file.",
    needsVerification: DDD_VERIFICATION,
    sourceNote:
      "Ordin ANRSC 97/2025 art. 94(1)(c) provides for 3 treatments a year nationally; HCL Timișoara 393/2023 art. 68(2)(a) requires quarterly. The cadence recorded here is the quarterly one, the stricter of the two. Market cost 300-450 lei per treatment.",
  },
  {
    key: "ddd_deratizare",
    nameRo: "Deratizare spații comune închise",
    nameEn: "Rodent control, enclosed common areas",
    category: "ddd",
    cadence: { kind: "months", every: 6 },
    legalBasis: ["Ordin ANRSC 97/2025 art. 95(b)", "HCL 393/2023 art. 69(a)"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: 3000_00,
    fineMaxBani: 8000_00,
    fineNote: DDD_FINE_NOTE,
    typicalCostMinBani: 300_00,
    typicalCostMaxBani: 450_00,
    appliesIf: "always",
    needsVerification: DDD_VERIFICATION,
    sourceNote:
      "Ordin ANRSC 97/2025 art. 95(b) and HCL 393/2023 art. 69(a). Market cost identical to insect control, 300-450 lei per treatment.",
  },
  {
    key: "ddd_dezinfectie",
    nameRo: "Dezinfecție spații comune",
    nameEn: "Disinfection, common areas",
    category: "ddd",
    cadence: { kind: "months", every: 3 },
    legalBasis: ["Ordin ANRSC 97/2025 art. 96"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: 3000_00,
    fineMaxBani: 8000_00,
    fineNote: DDD_FINE_NOTE,
    typicalCostMinBani: 300_00,
    typicalCostMaxBani: 450_00,
    appliesIf: "always",
    needsVerification: DDD_VERIFICATION,
    sourceNote:
      "Ordin ANRSC 97/2025 art. 96. Market cost identical to the other pest-control treatments, 300-450 lei.",
  },

  // ------------------------------------------------------- Fire safety (6)
  {
    key: "psi_iluminat_siguranta",
    nameRo: "Verificare anuală iluminat de siguranță",
    nameEn: "Annual emergency lighting test",
    category: "fire",
    cadence: { kind: "years", every: 1 },
    legalBasis: ["Normativ P118-3"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: 5000_00,
    fineMaxBani: 25000_00,
    fineNote: "Applied by ISU.",
    typicalCostMinBani: 200_00,
    typicalCostMaxBani: 500_00,
    appliesIf: "always",
    salesNote:
      "A 200-500 lei test covering an exposure of up to 25,000 lei. We schedule it, attend it and file the test report.",
    sourceNote:
      "Normativ P118-3. The ISU fine range of 5,000-25,000 lei and the market cost of 200-500 lei both come from the research.",
  },
  {
    key: "psi_stingatoare",
    nameRo: "Verificare stingătoare",
    nameEn: "Fire extinguisher inspection",
    category: "fire",
    cadence: { kind: "years", every: 1 },
    legalBasis: ["OMAI 138/2015 art. 11", "OMAI 138/2015 art. 13"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: null,
    fineMaxBani: null,
    fineNote:
      "Penalties under Legea 307/2006; the cited text gives no distinct range. Recharging at intervals of no more than 3 years.",
    appliesIf: "always",
    sourceNote:
      "OMAI 138/2015 art. 11 and art. 13: annual inspection, recharging at intervals of no more than 3 years. Penalties under Legea 307/2006.",
  },
  {
    key: "psi_hidranti",
    nameRo: "Verificare hidranți interiori",
    nameEn: "Internal hydrant inspection",
    category: "fire",
    cadence: { kind: "months", every: 6 },
    legalBasis: ["practică de piață"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: null,
    fineMaxBani: null,
    fineNote: "Penalties under Legea 307/2006.",
    appliesIf: "always",
    needsVerification:
      "The six-month cadence comes from market practice, not from an identified statutory text. To be confirmed.",
    sourceNote:
      "The 6-month frequency is market practice, recorded as such in the research. Penalties under Legea 307/2006.",
  },
  {
    key: "psi_control_periodic",
    nameRo: "Control periodic PSI și raport scris către președinte",
    nameEn: "Periodic fire-safety check and written report to the president",
    category: "fire",
    cadence: { kind: "months", every: 3 },
    legalBasis: ["Legea 196/2018 art. 66(1)(p)"],
    scope: "national",
    performerRequirement: "us",
    fineMinBani: null,
    fineMaxBani: null,
    fineNote: "The administrator is personally exposed.",
    appliesIf: "always",
    salesNote:
      "We observe and report in writing to the president every quarter, exactly as the law requires of the administrator.",
    sourceNote:
      "Legea 196/2018 art. 66(1)(p). An observation and reporting duty, with no special authorisation needed.",
  },
  {
    key: "psi_registru_control",
    nameRo: "Registru de control instalații de semnalizare și stingere",
    nameEn: "Control register for detection and suppression systems",
    category: "fire",
    cadence: { kind: "continuous" },
    legalBasis: ["OMAI 163/2007 art. 142"],
    scope: "national",
    performerRequirement: "us",
    fineMinBani: null,
    fineMaxBani: null,
    fineNote: "Penalties under Legea 307/2006.",
    appliesIf: "always",
    sourceNote: "OMAI 163/2007 art. 142. A duty to keep the register; an ongoing state.",
  },
  {
    key: "psi_cai_evacuare",
    nameRo: "Căi de evacuare libere, la gabaritul proiectat",
    nameEn: "Escape routes kept clear at design width",
    category: "fire",
    cadence: { kind: "continuous" },
    legalBasis: ["Legea 196/2018 art. 66(1)(p)", "OMAI 163/2007"],
    scope: "national",
    performerRequirement: "us",
    fineMinBani: 5000_00,
    fineMaxBani: 20000_00,
    fineNote:
      "5,000-10,000 lei for blocking escape routes; 10,000-20,000 lei for locked escape doors.",
    appliesIf: "always",
    sourceNote:
      "Legea 196/2018 art. 66(1)(p) and OMAI 163/2007. Two distinct fine ranges: blocking 5,000-10,000 lei, locked doors 10,000-20,000 lei.",
  },

  // -------------------------------------------------------------- Gas (3)
  {
    key: "gaz_verificare",
    nameRo: "Verificare tehnică instalație gaze",
    nameEn: "Gas installation technical verification",
    category: "gas",
    cadence: { kind: "years", every: 2 },
    legalBasis: ["ANRE Ordin 179/2015"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: 2000_00,
    fineMaxBani: 25000_00,
    fineNote: "Plus suspension of supply.",
    typicalCostMinBani: 150_00,
    typicalCostMaxBani: 250_00,
    appliesIf: "has_gas",
    salesNote:
      "The real bottleneck is not the technician, it is that nobody is home. We schedule it, open up and escort.",
    sourceNote:
      "ANRE Ordin 179/2015. Fine 2,000-25,000 lei plus suspension of supply; market cost 150-250 lei per apartment.",
  },
  {
    key: "gaz_revizie",
    nameRo: "Revizie tehnică instalație gaze",
    nameEn: "Gas installation technical overhaul",
    category: "gas",
    cadence: { kind: "years", every: 10 },
    legalBasis: ["ANRE Ordin 179/2015"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: 2000_00,
    fineMaxBani: 25000_00,
    fineNote: "Plus suspension of supply.",
    typicalCostMinBani: 200_00,
    typicalCostMaxBani: 600_00,
    appliesIf: "has_gas",
    sourceNote:
      "ANRE Ordin 179/2015, every 10 years. The same fine range as the check; market cost 200-600 lei.",
  },
  {
    key: "cos_fum",
    nameRo: "Verificare și curățare coșuri de fum",
    nameEn: "Chimney inspection and sweeping",
    category: "gas",
    cadence: { kind: "years", every: 1 },
    legalBasis: ["OMAI 163/2007 art. 85(3)"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: null,
    fineMaxBani: null,
    fineNote: "Penalties under HG 537/2007.",
    appliesIf: "has_gas",
    sourceNote:
      "Only 142 authorised chimney-sweep firms nationally; some counties have none at all.",
  },

  // -------------------------------------------------------- Structure (3)
  {
    key: "urmarire_curenta",
    nameRo: "Raport anual de urmărire curentă a comportării în timp",
    nameEn: "Annual building-monitoring report",
    category: "structure",
    cadence: { kind: "years", every: 1 },
    legalBasis: [
      "Legea 10/1995 art. 27",
      "Normativ P130-2025 (Ordin MDLPA 770/2025)",
    ],
    scope: "national",
    performerRequirement: "qualified_signatory",
    fineMinBani: 5000_00,
    fineMaxBani: 10000_00,
    fineNote: "Legea 10/1995 art. 36.II.h, applied by ISC.",
    appliesIf: "always",
    salesNote:
      "An annual obligation for the whole life of the building. Normativ P130 was rewritten in June 2025 and explicitly encourages photographic documentation. Almost no association complies with it.",
    needsVerification:
      "The full text of P130-2025 was not obtained. The frequency, the signatory's qualification and the report format must be confirmed before selling this.",
    sourceNote:
      "Legea 10/1995 art. 27 and Normativ P130-2025 (Ordin MDLPA 770/2025, published 19 June 2025). The 5,000-10,000 lei fine is applied by ISC under art. 36.II.h.",
  },
  {
    key: "carte_tehnica",
    nameRo: "Cartea tehnică a construcției completată și păstrată",
    nameEn: "Technical book of the building kept up to date",
    category: "structure",
    cadence: { kind: "continuous" },
    legalBasis: [
      "Legea 10/1995 art. 27(b)",
      "Legea 10/1995 art. 36.II.g",
      "Legea 196/2018 art. 8",
    ],
    scope: "national",
    performerRequirement: "qualified_signatory",
    fineMinBani: 5000_00,
    fineMaxBani: 10000_00,
    appliesIf: "always",
    salesNote: "If it is missing, Legea 196/2018 art. 8 obliges the association to reconstruct it.",
    sourceNote:
      "Legea 10/1995 art. 27(b) and art. 36.II.g; the duty to reconstruct comes from Legea 196/2018 art. 8.",
  },
  {
    key: "subsol_apa",
    nameRo: "Evacuarea apei acumulate în subsol",
    nameEn: "Evacuation of water accumulated in the basement",
    category: "water",
    cadence: { kind: "continuous" },
    legalBasis: ["HG 857/2011 art. 12(b)"],
    scope: "national",
    performerRequirement: "us",
    fineMinBani: 2500_00,
    fineMaxBani: 5000_00,
    appliesIf: "has_basement",
    sourceNote:
      "HG 857/2011 art. 12(b). Applies to buildings with a basement; fine 2,500-5,000 lei.",
  },

  // ------------------------------------------ Waste and local sanitation (6)
  // Enforcement hot zone. performer: 'us' throughout.
  {
    key: "deseuri_platforma",
    nameRo: "Curățenie permanentă la platforma gospodărească și în jurul recipientelor",
    nameEn: "Continuous cleanliness of the bin platform and around the containers",
    category: "waste",
    cadence: { kind: "continuous" },
    legalBasis: [
      "HCL Timișoara 117/2024 art. 1(1)(j),(k)",
      "HCL 393/2023 art. 82",
      "HCL Giroc 166/2025",
    ],
    scope: "timisoara",
    performerRequirement: "us",
    fineMinBani: 1500_00,
    fineMaxBani: 2500_00,
    appliesIf: "always",
    salesNote:
      "Poliția Locală Timișoara issued 158 penalties to associations in 2026, over 172,000 lei, including 2,500 lei for exactly this. In Giroc, associations were penalised in April 2026.",
    sourceNote:
      "HCL Timișoara 117/2024 art. 1(1)(j),(k), HCL 393/2023 art. 82 and HCL Giroc 166/2025. Applies in both of the company's markets.",
  },
  {
    key: "deseuri_sortare",
    nameRo: "Colectare separată corectă",
    nameEn: "Correct separate waste collection",
    category: "waste",
    cadence: { kind: "continuous" },
    legalBasis: ["OUG 92/2021", "Legea 101/2006 art. 28¹⁴(5)"],
    scope: "national",
    performerRequirement: "us",
    fineMinBani: 20000_00,
    fineMaxBani: 60000_00,
    fineNote:
      "Legal entities. In addition, RETIM bills double the tariff for a month with incorrect sorting.",
    appliesIf: "always",
    sourceNote:
      "OUG 92/2021 and Legea 101/2006 art. 28¹⁴(5). The 20,000-60,000 lei range is for legal entities; RETIM's tariff-doubling penalty is contractual.",
  },
  {
    key: "trotuar_curatenie",
    nameRo: "Curățenia trotuarului din dreptul condominiului",
    nameEn: "Cleanliness of the pavement in front of the condominium",
    category: "waste",
    cadence: { kind: "continuous" },
    legalBasis: ["Ordin ANRSC 97/2025 art. 106(p)"],
    scope: "national",
    performerRequirement: "us",
    fineMinBani: 1500_00,
    fineMaxBani: 2500_00,
    appliesIf: "always",
    salesNote:
      "A new national obligation, introduced by Ordin ANRSC 97/2025. Many associations are not yet aware of it.",
    sourceNote:
      "Ordin ANRSC 97/2025 art. 106(p). Recorded in the research as a new national obligation.",
  },
  {
    key: "zapada_gheata",
    nameRo: "Îndepărtare zăpadă, gheață și țurțuri; material antiderapant",
    nameEn: "Snow, ice and icicle removal; anti-slip material",
    category: "winter",
    cadence: { kind: "event" },
    legalBasis: ["HCL 393/2023 art. 82(r)", "HCL 117/2024 art. 1(1)(h),(i)"],
    scope: "timisoara",
    performerRequirement: "us",
    fineMinBani: 1500_00,
    fineMaxBani: 2500_00,
    fineNote: "Legal entities.",
    appliesIf: "always",
    needsVerification:
      "The adopted annex to HCL 117/2024 and the annex to HCL Giroc 166/2025 were not obtained in full; the fine ranges for individuals versus legal entities differ between sources.",
    sourceNote:
      "HCL 393/2023 art. 82(r) and HCL 117/2024 art. 1(1)(h),(i). Triggered by a weather event, in practice during the November-March season.",
  },
  {
    key: "spatiu_verde",
    nameRo: "Întreținere zonă verde limitrofă până la carosabil; ambalare deșeuri vegetale",
    nameEn: "Maintenance of the adjacent green area up to the roadway",
    category: "green",
    cadence: { kind: "seasonal", fromMonth: 4, toMonth: 10 },
    legalBasis: ["HCL 117/2024 art. 9(1)(d),(e),(o)"],
    scope: "timisoara",
    performerRequirement: "us",
    fineMinBani: 2000_00,
    fineMaxBani: 2500_00,
    appliesIf: "always",
    sourceNote:
      "HCL 117/2024 art. 9(1)(d),(e),(o). Maintenance season April-October.",
  },
  {
    key: "fatada_siguranta",
    nameRo: "Îndepărtare elemente de fațadă cu risc de desprindere; plasă de protecție",
    nameEn: "Removal of façade elements at risk of detaching; protective netting",
    category: "facade",
    cadence: { kind: "continuous" },
    legalBasis: ["HCL 117/2024 art. 1(1)(a),(d)"],
    scope: "timisoara",
    performerRequirement: "us",
    fineMinBani: 1500_00,
    fineMaxBani: 2500_00,
    fineNote: "A real case on record: 4,000 lei.",
    appliesIf: "always",
    sourceNote:
      "HCL 117/2024 art. 1(1)(a),(d). The usual range is 1,500-2,500 lei; the research recorded a real case of 4,000 lei.",
  },

  // ------------------------------------------------ Conditional obligations (5)
  {
    key: "lift_iscir",
    nameRo: "Verificare tehnică periodică ISCIR ascensor",
    nameEn: "ISCIR periodic technical inspection of the lift",
    category: "lift",
    cadence: { kind: "years", every: 2 },
    legalBasis: ["Legea 64/2008", "PT R 2-2010"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: 2000_00,
    fineMaxBani: 15000_00,
    fineNote: "Separately, having no RSVTI operator carries a 30,000-40,000 lei penalty.",
    appliesIf: "has_lift",
    needsVerification:
      "Sources conflict: a check every 2 years versus an annual general overhaul. To be confirmed with ISCIR Timiș.",
    sourceNote:
      "Legea 64/2008 and PT R 2-2010. The authorised performer is inferred from the ISCIR accreditation requirement.",
  },
  {
    key: "lift_rsvti",
    nameRo: "Operator RSVTI desemnat",
    nameEn: "Designated RSVTI operator",
    category: "lift",
    cadence: { kind: "continuous" },
    legalBasis: ["Legea 64/2008 art. 14-15"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: 30000_00,
    fineMaxBani: 40000_00,
    appliesIf: "has_lift",
    salesNote:
      "The largest single fine in the whole calendar. We check whether the association has a designated operator.",
    sourceNote:
      "Legea 64/2008 art. 14-15. The RSVTI operator must be accredited, so it cannot be Scara staff.",
  },
  {
    key: "pram",
    nameRo: "Verificare PRAM / priză de pământ",
    nameEn: "Earthing and insulation (PRAM) measurement",
    category: "electrical",
    cadence: { kind: "years", every: 2 },
    legalBasis: ["Normativ I7-2011", "Ordin ANRE 45/2016"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: null,
    fineMaxBani: null,
    appliesIf: "always",
    needsVerification: "To be confirmed whether I7-2011 has been superseded.",
    sourceNote:
      "Normativ I7-2011 and Ordin ANRE 45/2016. The measurement requires an authorised laboratory, hence a third-party performer.",
  },
  {
    key: "loc_joaca",
    nameRo: "Inspecție principală anuală loc de joacă",
    nameEn: "Annual main playground inspection",
    category: "playground",
    cadence: { kind: "years", every: 1 },
    legalBasis: ["HG 435/2010", "SR EN 1176/1177"],
    scope: "national",
    performerRequirement: "authorised_third_party",
    fineMinBani: null,
    fineMaxBani: null,
    fineNote: "Suspension of use, and liability in the event of an accident.",
    appliesIf: "has_playground",
    sourceNote:
      "HG 435/2010 and SR EN 1176/1177. The annual main inspection requires a competent body, hence a third-party performer.",
  },
  {
    key: "plumb_inventar",
    nameRo: "Identificarea componentelor din plumb și raportare la primărie",
    nameEn: "Identification of lead components and reporting to the municipality",
    category: "water",
    cadence: { kind: "once", byDate: "2027-12-31" },
    legalBasis: ["OG 7/2023 art. 10(3)"],
    scope: "national",
    performerRequirement: "us",
    fineMinBani: null,
    fineMaxBani: null,
    fineNote: "Not specified in the cited text.",
    appliesIf: "always",
    needsVerification:
      "The performer is not stated in the cited text. We recorded 'us' because this is an inventory and reporting activity with no accreditation explicitly required. To be confirmed.",
    sourceNote:
      "OG 7/2023 art. 10(3), deadline 31 December 2027. The penalty is not specified in the text consulted.",
  },
];

/** Fast lookup by key. */
export const OBLIGATION_BY_KEY: Record<string, Obligation> = Object.fromEntries(
  OBLIGATIONS.map((o) => [o.key, o])
);
