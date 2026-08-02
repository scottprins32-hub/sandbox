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
      "Coordonăm și programăm; execuția este făcută de firmă atestată DSP. Primiți procesul-verbal și fișele de securitate la dosar.",
    needsVerification: DDD_VERIFICATION,
    sourceNote:
      "Ordin ANRSC 97/2025 art. 94(1)(c) prevede 3 intervenții pe an la nivel național; HCL Timișoara 393/2023 art. 68(2)(a) cere trimestrial. Cadența înregistrată este cea trimestrială, mai strictă. Cost de piață 300-450 lei pe intervenție.",
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
      "Ordin ANRSC 97/2025 art. 95(b) și HCL 393/2023 art. 69(a). Cost de piață identic cu dezinsecția, 300-450 lei pe intervenție.",
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
      "Ordin ANRSC 97/2025 art. 96. Cost de piață identic cu celelalte intervenții DDD, 300-450 lei.",
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
    fineNote: "Aplicată de ISU.",
    typicalCostMinBani: 200_00,
    typicalCostMaxBani: 500_00,
    appliesIf: "always",
    salesNote:
      "Test de 200-500 lei care acoperă o expunere de până la 25.000 lei. Îl programăm, asistăm și arhivăm buletinul.",
    sourceNote:
      "Normativ P118-3. Banda de amendă ISU 5.000-25.000 lei și costul de piață 200-500 lei provin din cercetare.",
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
      "Sancțiuni conform Legii 307/2006; textul citat nu prevede o bandă distinctă. Reîncărcarea se face la maximum 3 ani.",
    appliesIf: "always",
    sourceNote:
      "OMAI 138/2015 art. 11 și art. 13: verificare anuală, reîncărcare la maximum 3 ani. Sancțiuni conform Legii 307/2006.",
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
    fineNote: "Sancțiuni conform Legii 307/2006.",
    appliesIf: "always",
    needsVerification:
      "Cadența semestrială provine din practica de piață, nu dintr-un text normativ identificat. De confirmat.",
    sourceNote:
      "Frecvența la 6 luni este practică de piață, consemnată ca atare în cercetare. Sancțiuni conform Legii 307/2006.",
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
    fineNote: "Administratorul este expus personal.",
    appliesIf: "always",
    salesNote:
      "Observăm și raportăm trimestrial în scris către președinte, exact cum cere legea de la administrator.",
    sourceNote:
      "Legea 196/2018 art. 66(1)(p). Obligație de observare și raportare, fără autorizare specială.",
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
    fineNote: "Sancțiuni conform Legii 307/2006.",
    appliesIf: "always",
    sourceNote: "OMAI 163/2007 art. 142. Obligație de ținere a registrului, stare continuă.",
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
      "5.000-10.000 lei pentru blocarea căilor de evacuare; 10.000-20.000 lei pentru uși de evacuare încuiate.",
    appliesIf: "always",
    sourceNote:
      "Legea 196/2018 art. 66(1)(p) și OMAI 163/2007. Două benzi distincte de amendă: blocare 5.000-10.000 lei, uși încuiate 10.000-20.000 lei.",
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
    fineNote: "Plus sistarea furnizării.",
    typicalCostMinBani: 150_00,
    typicalCostMaxBani: 250_00,
    appliesIf: "has_gas",
    salesNote:
      "Blocajul real nu e tehnicianul, ci faptul că nimeni nu e acasă. Noi programăm, deschidem și însoțim.",
    sourceNote:
      "ANRE Ordin 179/2015. Amendă 2.000-25.000 lei plus sistarea furnizării; cost de piață 150-250 lei pe apartament.",
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
    fineNote: "Plus sistarea furnizării.",
    typicalCostMinBani: 200_00,
    typicalCostMaxBani: 600_00,
    appliesIf: "has_gas",
    sourceNote:
      "ANRE Ordin 179/2015, la 10 ani. Aceeași bandă de amendă ca verificarea; cost de piață 200-600 lei.",
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
    fineNote: "Sancțiuni conform HG 537/2007.",
    appliesIf: "has_gas",
    sourceNote:
      "Doar 142 firme autorizate de coșerit la nivel național; unele județe nu au niciuna.",
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
    fineNote: "Legea 10/1995 art. 36.II.h, aplicată de ISC.",
    appliesIf: "always",
    salesNote:
      "Obligație anuală pe toată durata de existență a clădirii. Normativul P130 a fost rescris în iunie 2025 și încurajează explicit documentarea foto. Aproape nicio asociație nu o îndeplinește.",
    needsVerification:
      "Textul P130-2025 nu a fost obținut integral. Frecvența, calificarea semnatarului și formatul raportului se confirmă înainte de vânzare.",
    sourceNote:
      "Legea 10/1995 art. 27 și Normativ P130-2025 (Ordin MDLPA 770/2025, publicat 19 iunie 2025). Amenda 5.000-10.000 lei se aplică de ISC conform art. 36.II.h.",
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
    salesNote: "Dacă lipsește, Legea 196/2018 art. 8 obligă asociația să o reconstituie.",
    sourceNote:
      "Legea 10/1995 art. 27(b) și art. 36.II.g; obligația de reconstituire vine din Legea 196/2018 art. 8.",
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
      "HG 857/2011 art. 12(b). Se aplică imobilelor cu subsol; amendă 2.500-5.000 lei.",
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
      "Poliția Locală Timișoara a aplicat 158 de sancțiuni asociațiilor în 2026, peste 172.000 lei, inclusiv 2.500 lei exact pentru acest motiv. La Giroc, asociații au fost sancționate în aprilie 2026.",
    sourceNote:
      "HCL Timișoara 117/2024 art. 1(1)(j),(k), HCL 393/2023 art. 82 și HCL Giroc 166/2025. Se aplică în ambele piețe ale companiei.",
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
      "Persoane juridice. În plus, RETIM facturează dublul tarifului în luna cu sortare incorectă.",
    appliesIf: "always",
    sourceNote:
      "OUG 92/2021 și Legea 101/2006 art. 28¹⁴(5). Banda 20.000-60.000 lei este pentru persoane juridice; penalizarea RETIM de dublare a tarifului este contractuală.",
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
      "Obligație națională nouă, introdusă prin Ordinul ANRSC 97/2025. Multe asociații nu o cunosc încă.",
    sourceNote:
      "Ordin ANRSC 97/2025 art. 106(p). Consemnată în cercetare ca obligație națională nouă.",
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
    fineNote: "Persoane juridice.",
    appliesIf: "always",
    needsVerification:
      "Anexa adoptată a HCL 117/2024 și anexa HCL Giroc 166/2025 nu au fost obținute integral; benzile de amendă pentru persoane fizice vs juridice diferă între surse.",
    sourceNote:
      "HCL 393/2023 art. 82(r) și HCL 117/2024 art. 1(1)(h),(i). Obligație declanșată de eveniment meteo, în practică în sezonul noiembrie-martie.",
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
      "HCL 117/2024 art. 9(1)(d),(e),(o). Sezon de întreținere aprilie-octombrie.",
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
    fineNote: "Caz real consemnat: 4.000 lei.",
    appliesIf: "always",
    sourceNote:
      "HCL 117/2024 art. 1(1)(a),(d). Banda uzuală 1.500-2.500 lei; cercetarea a consemnat un caz real de 4.000 lei.",
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
    fineNote: "Separat, lipsa operatorului RSVTI se sancționează cu 30.000-40.000 lei.",
    appliesIf: "has_lift",
    needsVerification:
      "Surse contradictorii: verificare la 2 ani vs revizie generală anuală. Se confirmă cu ISCIR Timiș.",
    sourceNote:
      "Legea 64/2008 și PT R 2-2010. Executantul autorizat este dedus din cerința de atestare ISCIR.",
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
      "Cea mai mare amendă unitară din tot calendarul. Verificăm dacă asociația are operator desemnat.",
    sourceNote:
      "Legea 64/2008 art. 14-15. Operatorul RSVTI trebuie să fie atestat, deci nu poate fi personal Scara.",
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
    needsVerification: "A se confirma dacă I7-2011 a fost înlocuit.",
    sourceNote:
      "Normativ I7-2011 și Ordin ANRE 45/2016. Măsurătoarea cere laborator autorizat, deci executant terț.",
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
    fineNote: "Suspendarea utilizării și răspundere în caz de accident.",
    appliesIf: "has_playground",
    sourceNote:
      "HG 435/2010 și SR EN 1176/1177. Inspecția principală anuală cere organism competent, deci executant terț.",
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
    fineNote: "Nespecificat în textul citat.",
    appliesIf: "always",
    needsVerification:
      "Executantul nu este precizat în textul citat. Am consemnat 'us' pentru că este o activitate de inventariere și raportare, fără atestare cerută explicit. De confirmat.",
    sourceNote:
      "OG 7/2023 art. 10(3), termen 31 decembrie 2027. Sancțiunea nu este specificată în textul consultat.",
  },
];

/** Fast lookup by key. */
export const OBLIGATION_BY_KEY: Record<string, Obligation> = Object.fromEntries(
  OBLIGATIONS.map((o) => [o.key, o])
);
