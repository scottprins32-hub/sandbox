// The service task catalogue (add-on 2 §2). This is the competitor audit
// turned into a product asset: 20 Romanian firms publish ~15 line items, the
// German Leistungsverzeichnis benchmark runs to ~60.
//
// `competitorCoverage` is real audit data — how many of the 20 surveyed
// Romanian firms publish that task. It is not an estimate and must not be
// "improved": it drives the offer's "ce facem în plus" section, which is only
// persuasive because the numbers are countable.
//
// nameRo is the exact wording that reaches the client-facing table. nameEn is
// for the admin app (§0 language rule).

export type TaskFrequency =
  | "fiecare_vizita"
  | "zilnic"
  | "saptamanal"
  | "bilunar"
  | "lunar"
  | "trimestrial"
  | "semestrial"
  | "anual"
  | "sezonier"
  | "la_nevoie"
  | "la_eveniment";

export type TaskZone =
  | "trepte"
  | "balustrade"
  | "lift"
  | "usi_geamuri"
  | "mobilier_scara"
  | "deseuri"
  | "exterior"
  | "subsol_tehnic"
  | "sezonier"
  | "ingrijire";

/** Building feature a task depends on. Absent means it always applies. */
export type TaskAppliesIf = "has_lift" | "has_basement" | "has_green" | "has_parking";

export type ServiceTask = {
  key: string;
  nameRo: string;
  nameEn: string;
  zone: TaskZone;
  defaultFrequency: TaskFrequency;
  /** Included in the standard monthly price. */
  inBasePackage: boolean;
  /** 0-20: how many of 20 surveyed Romanian firms publish it. Audit data. */
  competitorCoverage: number;
  visibilityToResident: "low" | "medium" | "high" | "very_high";
  /** Marginal minutes per occurrence. */
  effortMinutes: number;
  /** Why it matters that competitors skip it. */
  gapNote?: string;
  requiresConsumable?: string;
  appliesIf?: TaskAppliesIf;
};

export const SERVICE_TASKS: ServiceTask[] = [
  // ---------------------------------------------------------------- trepte
  {
    key: "maturat_trepte",
    nameRo: "Măturat trepte, paliere și holuri",
    nameEn: "Sweep stairs, landings and hallways",
    zone: "trepte",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 20,
    visibilityToResident: "high",
    effortMinutes: 20,
  },
  {
    key: "spalat_trepte",
    nameRo: "Spălat trepte, paliere și holuri",
    nameEn: "Wash stairs, landings and hallways",
    zone: "trepte",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 20,
    visibilityToResident: "high",
    effortMinutes: 30,
  },
  {
    key: "parter_lift_zilnic",
    nameRo: "Spălat parterul și zona liftului",
    nameEn: "Wash the ground floor and the lift area",
    zone: "trepte",
    defaultFrequency: "zilnic",
    inBasePackage: false,
    competitorCoverage: 4,
    visibilityToResident: "high",
    effortMinutes: 10,
  },
  {
    key: "presuri",
    nameRo: "Ridicat și curățat presurile de la intrare",
    nameEn: "Lift and clean the entrance mats",
    zone: "trepte",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 5,
    visibilityToResident: "high",
    effortMinutes: 3,
  },
  {
    key: "plinte",
    nameRo: "Șters plintele și soclurile",
    nameEn: "Wipe skirting boards and plinths",
    zone: "trepte",
    defaultFrequency: "lunar",
    inBasePackage: true,
    competitorCoverage: 0,
    visibilityToResident: "medium",
    effortMinutes: 10,
    gapNote: "Zero firme din 20 publică această operațiune. Este standard în Germania, lunar.",
  },
  {
    key: "contratrepte",
    nameRo: "Șters contratreptele",
    nameEn: "Wipe the stair risers",
    zone: "trepte",
    defaultFrequency: "lunar",
    inBasePackage: true,
    competitorCoverage: 1,
    visibilityToResident: "medium",
    effortMinutes: 15,
  },
  {
    key: "decapare_trepte",
    nameRo: "Decapare și tratare pardoseală",
    nameEn: "Strip and treat the floor",
    zone: "trepte",
    defaultFrequency: "anual",
    inBasePackage: false,
    competitorCoverage: 2,
    visibilityToResident: "very_high",
    effortMinutes: 240,
  },

  // ----------------------------------------------------------- balustrade
  {
    key: "sters_balustrade",
    nameRo: "Șters balustradele",
    nameEn: "Wipe the handrails",
    zone: "balustrade",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 20,
    visibilityToResident: "high",
    effortMinutes: 8,
  },
  {
    key: "dezinfectat_balustrade",
    nameRo: "Dezinfectat balustrade, mânere și interfon",
    nameEn: "Disinfect handrails, door handles and the intercom",
    zone: "balustrade",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 6,
    visibilityToResident: "high",
    effortMinutes: 8,
  },
  {
    key: "degresare_balustrade",
    nameRo: "Degresare balustrade (urme de mâini)",
    nameEn: "Degrease handrails (hand marks)",
    zone: "balustrade",
    defaultFrequency: "lunar",
    inBasePackage: true,
    competitorCoverage: 0,
    visibilityToResident: "medium",
    effortMinutes: 15,
  },
  {
    key: "glafuri",
    nameRo: "Șters glafurile și pervazurile",
    nameEn: "Wipe window ledges and sills",
    zone: "balustrade",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 2,
    visibilityToResident: "medium",
    effortMinutes: 6,
  },

  // ------------------------------------------------------------------ lift
  {
    key: "cabina_lift",
    nameRo: "Curățat cabina liftului",
    nameEn: "Clean the lift car",
    zone: "lift",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 17,
    visibilityToResident: "high",
    effortMinutes: 8,
    appliesIf: "has_lift",
  },
  {
    key: "dezinfectat_lift",
    nameRo: "Dezinfectat butoanele, oglinda și pereții",
    nameEn: "Disinfect the buttons, mirror and walls",
    zone: "lift",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 5,
    visibilityToResident: "high",
    effortMinutes: 5,
    appliesIf: "has_lift",
  },
  {
    key: "usi_lift_etaje",
    nameRo: "Șters ușile de lift la fiecare etaj",
    nameEn: "Wipe the lift doors on every floor",
    zone: "lift",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 3,
    visibilityToResident: "very_high",
    effortMinutes: 10,
    appliesIf: "has_lift",
    gapNote: "Locatarul de la etajul 7 nu vede niciodată cabina curățată. Vede ușa lui.",
  },

  // ----------------------------------------------------------- uși și geamuri
  {
    key: "usa_acces",
    nameRo: "Spălat ușa de acces",
    nameEn: "Wash the entrance door",
    zone: "usi_geamuri",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 19,
    visibilityToResident: "very_high",
    effortMinutes: 5,
  },
  {
    key: "geam_intrare",
    nameRo: "Spălat geamul de la intrare",
    nameEn: "Wash the entrance glass",
    zone: "usi_geamuri",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 14,
    visibilityToResident: "very_high",
    effortMinutes: 6,
  },
  {
    key: "geamuri_scara",
    nameRo: "Spălat geamurile de pe casa scării",
    nameEn: "Wash the stairwell windows",
    zone: "usi_geamuri",
    defaultFrequency: "trimestrial",
    inBasePackage: true,
    competitorCoverage: 8,
    visibilityToResident: "high",
    effortMinutes: 45,
    gapNote:
      "Frecvența variază sălbatic în piață: de la 3x/an la lunar. Cine publică un număr câștigă comparația.",
  },
  {
    key: "tamplarie",
    nameRo: "Spălat tâmplăria și ramele",
    nameEn: "Wash the frames and joinery",
    zone: "usi_geamuri",
    defaultFrequency: "trimestrial",
    inBasePackage: true,
    competitorCoverage: 3,
    visibilityToResident: "medium",
    effortMinutes: 20,
  },
  {
    key: "interfon_curatat",
    nameRo: "Curățat interfonul",
    nameEn: "Clean the intercom",
    zone: "usi_geamuri",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 3,
    visibilityToResident: "high",
    effortMinutes: 2,
  },
  {
    key: "toc_usi_apartament",
    nameRo: "Șters tocurile ușilor de apartament",
    nameEn: "Wipe the apartment door frames",
    zone: "usi_geamuri",
    defaultFrequency: "lunar",
    inBasePackage: true,
    competitorCoverage: 1,
    visibilityToResident: "high",
    effortMinutes: 15,
  },

  // -------------------------------------------------------- mobilier scară
  {
    key: "cutii_postale",
    nameRo: "Șters cutiile poștale",
    nameEn: "Wipe the letterboxes",
    zone: "mobilier_scara",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 18,
    visibilityToResident: "high",
    effortMinutes: 5,
  },
  {
    key: "avizier_sters",
    nameRo: "Șters avizierul",
    nameEn: "Wipe the notice board",
    zone: "mobilier_scara",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 5,
    visibilityToResident: "medium",
    effortMinutes: 2,
  },
  {
    key: "avizier_ordonat",
    nameRo: "Ordonat avizierul: anunțuri expirate scoase",
    nameEn: "Tidy the notice board: expired notices removed",
    zone: "mobilier_scara",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 0,
    visibilityToResident: "very_high",
    effortMinutes: 2,
  },
  {
    key: "panze_paianjen",
    nameRo: "Îndepărtat pânzele de păianjen",
    nameEn: "Remove cobwebs",
    zone: "mobilier_scara",
    defaultFrequency: "bilunar",
    inBasePackage: true,
    competitorCoverage: 16,
    visibilityToResident: "high",
    effortMinutes: 8,
  },
  {
    key: "contoare_tablouri",
    nameRo: "Șters contoarele și tablourile electrice",
    nameEn: "Wipe the meters and electrical panels",
    zone: "mobilier_scara",
    defaultFrequency: "lunar",
    inBasePackage: true,
    competitorCoverage: 4,
    visibilityToResident: "low",
    effortMinutes: 8,
  },
  {
    key: "tevi_gaze",
    nameRo: "Șters țevile de gaze",
    nameEn: "Wipe the gas pipes",
    zone: "mobilier_scara",
    defaultFrequency: "lunar",
    inBasePackage: true,
    competitorCoverage: 4,
    visibilityToResident: "low",
    effortMinutes: 10,
  },
  {
    key: "intrerupatoare",
    nameRo: "Șters întrerupătoarele",
    nameEn: "Wipe the light switches",
    zone: "mobilier_scara",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 3,
    visibilityToResident: "medium",
    effortMinutes: 4,
  },
  {
    key: "corpuri_iluminat",
    nameRo: "Curățat corpurile de iluminat",
    nameEn: "Clean the light fittings",
    zone: "mobilier_scara",
    defaultFrequency: "trimestrial",
    inBasePackage: true,
    competitorCoverage: 3,
    visibilityToResident: "medium",
    effortMinutes: 20,
  },
  {
    key: "scrumiera",
    nameRo: "Golit scrumiera și coșul de la intrare",
    nameEn: "Empty the ashtray and the entrance bin",
    zone: "mobilier_scara",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 5,
    visibilityToResident: "very_high",
    effortMinutes: 2,
  },
  {
    key: "pliante",
    nameRo: "Adunat pliantele și reclamele",
    nameEn: "Collect flyers and advertising",
    zone: "mobilier_scara",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 1,
    visibilityToResident: "very_high",
    effortMinutes: 2,
    gapNote:
      "O singură firmă din 20 o publică. Este cel mai vizibil morman de mizerie dintr-o scară românească și costă 20 de secunde.",
  },
  {
    key: "aerisire",
    nameRo: "Aerisit și odorizat spațiile comune",
    nameEn: "Air and freshen the common areas",
    zone: "mobilier_scara",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 1,
    visibilityToResident: "very_high",
    effortMinutes: 3,
  },
  {
    key: "banci_intrare",
    nameRo: "Șters băncile din fața blocului",
    nameEn: "Wipe the benches outside the block",
    zone: "mobilier_scara",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 1,
    visibilityToResident: "high",
    effortMinutes: 4,
  },

  // --------------------------------------------------------------- deșeuri
  {
    key: "pubele_scos",
    nameRo: "Scos pubelele în ziua de ridicare",
    nameEn: "Take the bins out on collection day",
    zone: "deseuri",
    defaultFrequency: "la_eveniment",
    inBasePackage: true,
    competitorCoverage: 15,
    visibilityToResident: "very_high",
    effortMinutes: 5,
  },
  {
    key: "pubele_readus",
    nameRo: "Readus pubelele după golire",
    nameEn: "Bring the bins back in after emptying",
    zone: "deseuri",
    defaultFrequency: "la_eveniment",
    inBasePackage: true,
    competitorCoverage: 2,
    visibilityToResident: "very_high",
    effortMinutes: 5,
    gapNote:
      "Doar 2 firme din 20 publică partea a doua a treburii. Locatarii văd pubelele abandonate pe trotuar toată ziua.",
  },
  {
    key: "pubele_spalat",
    nameRo: "Igienizat pubelele",
    nameEn: "Sanitise the bins",
    zone: "deseuri",
    defaultFrequency: "lunar",
    inBasePackage: true,
    competitorCoverage: 8,
    visibilityToResident: "high",
    effortMinutes: 20,
  },
  {
    key: "ghena_curatat",
    nameRo: "Curățat și igienizat zona ghenei",
    nameEn: "Clean and sanitise the refuse-chute area",
    zone: "deseuri",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 14,
    visibilityToResident: "very_high",
    effortMinutes: 15,
  },
  {
    key: "deseuri_voluminoase",
    nameRo: "Strâns deșeurile voluminoase abandonate",
    nameEn: "Clear abandoned bulky waste",
    zone: "deseuri",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 2,
    visibilityToResident: "very_high",
    effortMinutes: 15,
  },
  {
    key: "platforma_gospodareasca",
    nameRo: "Curățat platforma și zona din jurul recipientelor",
    nameEn: "Clean the waste platform and the area around the containers",
    zone: "deseuri",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 8,
    visibilityToResident: "very_high",
    effortMinutes: 10,
    gapNote:
      "Amendă documentată de 2.500 lei la Timișoara și sancțiuni la Giroc în aprilie 2026 exact pentru asta.",
  },

  // -------------------------------------------------------------- exterior
  {
    key: "alee_acces",
    nameRo: "Măturat aleea de acces",
    nameEn: "Sweep the access path",
    zone: "exterior",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 17,
    visibilityToResident: "high",
    effortMinutes: 10,
  },
  {
    key: "alee_jur",
    nameRo: "Măturat aleea din jurul blocului",
    nameEn: "Sweep the path around the block",
    zone: "exterior",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 6,
    visibilityToResident: "medium",
    effortMinutes: 15,
  },
  {
    key: "trotuar",
    nameRo: "Curățat trotuarul din dreptul imobilului",
    nameEn: "Clean the pavement in front of the building",
    zone: "exterior",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 2,
    visibilityToResident: "high",
    effortMinutes: 8,
  },
  {
    key: "litter_verde",
    nameRo: "Strâns hârtii și sticle din spațiul verde",
    nameEn: "Pick litter from the green space",
    zone: "exterior",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 6,
    visibilityToResident: "high",
    effortMinutes: 10,
    appliesIf: "has_green",
  },
  {
    key: "frunze",
    nameRo: "Strâns frunzele",
    nameEn: "Clear leaves",
    zone: "exterior",
    defaultFrequency: "sezonier",
    inBasePackage: true,
    competitorCoverage: 2,
    visibilityToResident: "high",
    effortMinutes: 25,
  },
  {
    key: "buruieni",
    nameRo: "Plivit buruienile de pe alei",
    nameEn: "Pull weeds from the paths",
    zone: "exterior",
    defaultFrequency: "sezonier",
    inBasePackage: true,
    competitorCoverage: 0,
    visibilityToResident: "medium",
    effortMinutes: 20,
  },
  {
    key: "rigole",
    nameRo: "Curățat rigolele și gurile de scurgere",
    nameEn: "Clear the gutters and yard drains",
    zone: "exterior",
    defaultFrequency: "trimestrial",
    inBasePackage: true,
    competitorCoverage: 0,
    visibilityToResident: "low",
    effortMinutes: 20,
    gapNote:
      "Zero firme din 20. O gură de scurgere înfundată la o furtună înseamnă subsol inundat — cea mai scumpă avarie a asociației.",
  },
  {
    key: "copertina",
    nameRo: "Curățat copertina de la intrare",
    nameEn: "Clean the entrance canopy",
    zone: "exterior",
    defaultFrequency: "semestrial",
    inBasePackage: true,
    competitorCoverage: 0,
    visibilityToResident: "medium",
    effortMinutes: 20,
  },

  // -------------------------------------------------------- subsol și tehnic
  {
    key: "subsol",
    nameRo: "Curățenie în subsol",
    nameEn: "Clean the basement",
    zone: "subsol_tehnic",
    defaultFrequency: "trimestrial",
    inBasePackage: true,
    competitorCoverage: 4,
    visibilityToResident: "low",
    effortMinutes: 60,
    appliesIf: "has_basement",
  },
  {
    key: "uscatorie_pod",
    nameRo: "Curățenie în uscătorie și pod",
    nameEn: "Clean the drying room and loft",
    zone: "subsol_tehnic",
    defaultFrequency: "trimestrial",
    inBasePackage: true,
    competitorCoverage: 2,
    visibilityToResident: "low",
    effortMinutes: 40,
  },
  {
    key: "spatii_tehnice",
    nameRo: "Curățat spațiile tehnice (centrală, contoare)",
    nameEn: "Clean the plant rooms (boiler, meters)",
    zone: "subsol_tehnic",
    defaultFrequency: "trimestrial",
    inBasePackage: true,
    competitorCoverage: 1,
    visibilityToResident: "low",
    effortMinutes: 30,
  },
  {
    key: "parcare_subterana",
    nameRo: "Spălat parcarea subterană",
    nameEn: "Wash the underground car park",
    zone: "subsol_tehnic",
    defaultFrequency: "semestrial",
    inBasePackage: false,
    competitorCoverage: 5,
    visibilityToResident: "medium",
    effortMinutes: 180,
    appliesIf: "has_parking",
  },

  // -------------------------------------------------------------- sezonier
  {
    key: "general_paste",
    nameRo: "Curățenie generală de Paște",
    nameEn: "Easter deep clean",
    zone: "sezonier",
    defaultFrequency: "anual",
    inBasePackage: true,
    competitorCoverage: 3,
    visibilityToResident: "very_high",
    effortMinutes: 300,
  },
  {
    key: "general_craciun",
    nameRo: "Curățenie generală de Crăciun",
    nameEn: "Christmas deep clean",
    zone: "sezonier",
    defaultFrequency: "anual",
    inBasePackage: true,
    competitorCoverage: 3,
    visibilityToResident: "very_high",
    effortMinutes: 300,
  },
  {
    key: "zapada",
    nameRo: "Deszăpezit accesul și trotuarul",
    nameEn: "Clear snow from the access and pavement",
    zone: "sezonier",
    defaultFrequency: "la_eveniment",
    inBasePackage: true,
    competitorCoverage: 6,
    visibilityToResident: "very_high",
    effortMinutes: 30,
  },
  {
    key: "antiderapant",
    nameRo: "Presărat material antiderapant",
    nameEn: "Spread anti-slip grit",
    zone: "sezonier",
    defaultFrequency: "la_eveniment",
    inBasePackage: true,
    competitorCoverage: 3,
    visibilityToResident: "very_high",
    effortMinutes: 10,
  },

  // ------------------------------------------------------------- îngrijire
  {
    key: "becuri",
    nameRo: "Înlocuit becurile arse",
    nameEn: "Replace burnt-out bulbs",
    zone: "ingrijire",
    defaultFrequency: "la_nevoie",
    inBasePackage: true,
    competitorCoverage: 0,
    visibilityToResident: "very_high",
    effortMinutes: 5,
    requiresConsumable: "bec furnizat de asociație",
    gapNote:
      "Zero firme din 20. O firmă mare o exclude explicit din contract. Un palier întunecat generează mai multe reclamații la administrator decât o balustradă prăfuită.",
  },
  {
    key: "control_vizual",
    nameRo: "Control vizual al scării la fiecare vizită",
    nameEn: "Visual check of the stairwell on every visit",
    zone: "ingrijire",
    defaultFrequency: "fiecare_vizita",
    inBasePackage: true,
    competitorCoverage: 1,
    visibilityToResident: "low",
    effortMinutes: 5,
  },
  {
    key: "raportare_defecte",
    nameRo: "Raportat defecțiunile cu fotografie, în aceeași zi",
    nameEn: "Report faults with a photo, the same day",
    zone: "ingrijire",
    defaultFrequency: "la_nevoie",
    inBasePackage: true,
    competitorCoverage: 0,
    visibilityToResident: "medium",
    effortMinutes: 3,
    gapNote:
      "Zero firme din România. Standard în orice Leistungsverzeichnis german. Vorbește direct despre răspunderea cumpărătorului, nu despre confortul locatarilor.",
  },
  {
    key: "plante_intrare",
    nameRo: "Udat plantele de la intrare",
    nameEn: "Water the plants at the entrance",
    zone: "ingrijire",
    defaultFrequency: "saptamanal",
    inBasePackage: true,
    competitorCoverage: 0,
    visibilityToResident: "high",
    effortMinutes: 3,
  },
];

export const TASK_BY_KEY: Record<string, ServiceTask> = Object.fromEntries(
  SERVICE_TASKS.map((t) => [t.key, t])
);

// ------------------------------------------------------------------ labels

export const ZONE_LABEL_RO: Record<TaskZone, string> = {
  trepte: "Trepte, paliere și holuri",
  balustrade: "Balustrade și pervazuri",
  lift: "Lift",
  usi_geamuri: "Uși și geamuri",
  mobilier_scara: "Mobilierul scării",
  deseuri: "Deșeuri",
  exterior: "Exterior",
  subsol_tehnic: "Subsol și spații tehnice",
  sezonier: "Sezonier",
  ingrijire: "Îngrijire",
};

export const ZONE_LABEL_EN: Record<TaskZone, string> = {
  trepte: "Stairs, landings and hallways",
  balustrade: "Handrails and sills",
  lift: "Lift",
  usi_geamuri: "Doors and glass",
  mobilier_scara: "Stairwell fittings",
  deseuri: "Waste",
  exterior: "Exterior",
  subsol_tehnic: "Basement and plant rooms",
  sezonier: "Seasonal",
  ingrijire: "Caretaking",
};

/** Zone order as it should read on the client-facing table. */
export const ZONE_ORDER: TaskZone[] = [
  "trepte",
  "balustrade",
  "lift",
  "usi_geamuri",
  "mobilier_scara",
  "deseuri",
  "exterior",
  "subsol_tehnic",
  "sezonier",
  "ingrijire",
];

export const FREQUENCY_LABEL_RO: Record<TaskFrequency, string> = {
  fiecare_vizita: "La fiecare vizită",
  zilnic: "Zilnic",
  saptamanal: "Săptămânal",
  bilunar: "La două săptămâni",
  lunar: "Lunar",
  trimestrial: "Trimestrial",
  semestrial: "De două ori pe an",
  anual: "Anual",
  sezonier: "Sezonier",
  la_nevoie: "La nevoie",
  la_eveniment: "La eveniment",
};

export const FREQUENCY_LABEL_EN: Record<TaskFrequency, string> = {
  fiecare_vizita: "Every visit",
  zilnic: "Daily",
  saptamanal: "Weekly",
  bilunar: "Fortnightly",
  lunar: "Monthly",
  trimestrial: "Quarterly",
  semestrial: "Twice a year",
  anual: "Annually",
  sezonier: "Seasonal",
  la_nevoie: "As needed",
  la_eveniment: "On occurrence",
};

/** Order the posted schedule reads in, most frequent first. */
export const FREQUENCY_ORDER: TaskFrequency[] = [
  "fiecare_vizita",
  "zilnic",
  "saptamanal",
  "bilunar",
  "lunar",
  "trimestrial",
  "semestrial",
  "anual",
  "sezonier",
  "la_nevoie",
  "la_eveniment",
];

// ----------------------------------------------------------------- helpers

export interface PackageFlags {
  hasLift?: boolean;
  hasBasement?: boolean;
  hasGreen?: boolean;
  hasParking?: boolean;
}

const FLAG_OF: Record<TaskAppliesIf, keyof PackageFlags> = {
  has_lift: "hasLift",
  has_basement: "hasBasement",
  has_green: "hasGreen",
  has_parking: "hasParking",
};

/**
 * The tasks that apply to one building. `baseOnly` (the default) keeps the
 * standard monthly package; pass false to include the priced extras.
 */
export function tasksForPackage(
  flags: PackageFlags,
  opts: { baseOnly?: boolean } = {}
): ServiceTask[] {
  const baseOnly = opts.baseOnly ?? true;
  return SERVICE_TASKS.filter((t) => {
    if (baseOnly && !t.inBasePackage) return false;
    if (!t.appliesIf) return true;
    return flags[FLAG_OF[t.appliesIf]] === true;
  });
}

/**
 * Minutes of work on a single visit: only the tasks done every visit. This is
 * the sanity check against the 1.5 h assumption the finance module prices on.
 */
export function totalMinutesPerVisit(tasks: ServiceTask[]): number {
  return tasks
    .filter((t) => t.defaultFrequency === "fiecare_vizita")
    .reduce((sum, t) => sum + t.effortMinutes, 0);
}

/** Tasks almost nobody in the market publishes — the offer's sharpest section. */
export function uniqueVsMarket(tasks: ServiceTask[] = SERVICE_TASKS): ServiceTask[] {
  return tasks
    .filter((t) => t.competitorCoverage <= 2)
    .sort((a, b) => a.competitorCoverage - b.competitorCoverage);
}

export interface ZoneGroup {
  zone: TaskZone;
  labelRo: string;
  tasks: ServiceTask[];
}

/** Grouped by zone in reading order, for the offer PDF and the /services page. */
export function frequencyTableRo(tasks: ServiceTask[] = SERVICE_TASKS): ZoneGroup[] {
  return ZONE_ORDER.flatMap((zone) => {
    const inZone = tasks.filter((t) => t.zone === zone);
    if (inZone.length === 0) return [];
    return [{ zone, labelRo: ZONE_LABEL_RO[zone], tasks: inZone }];
  });
}

export interface FrequencyGroup {
  frequency: TaskFrequency;
  labelRo: string;
  tasks: ServiceTask[];
}

/** Grouped by how often it happens — the posted schedule's structure (C1). */
export function scheduleGroupsRo(tasks: ServiceTask[]): FrequencyGroup[] {
  return FREQUENCY_ORDER.flatMap((frequency) => {
    const inFreq = tasks.filter((t) => t.defaultFrequency === frequency);
    if (inFreq.length === 0) return [];
    return [{ frequency, labelRo: FREQUENCY_LABEL_RO[frequency], tasks: inFreq }];
  });
}
