// The service catalogue (add-on §7), with researched prices in bani.
// Note the naming rule (§2.2): bin cleaning is `igienizare`, never
// `dezinfecție` — performing DDD without DSP notification and attested staff
// carries a 5,000-10,000 lei fine, and the app must never imply we do it.

export type ServiceUnit =
  | "per_building_month"
  | "per_visit"
  | "per_bin_clean"
  | "per_season"
  | "per_report"
  | "per_apartment_month"
  | "per_job";

export interface ServiceLineSeed {
  key: string;
  nameRo: string;
  nameEn: string;
  unit: ServiceUnit;
  defaultPriceBani: number;
  /** The researched range, shown as guidance in the UI. */
  note: string;
  /** True for the existing core cleaning line. */
  core?: boolean;
}

export const UNIT_LABEL_RO: Record<ServiceUnit, string> = {
  per_building_month: "pe imobil, pe lună",
  per_visit: "pe vizită",
  per_bin_clean: "pe pubelă",
  per_season: "pe sezon",
  per_report: "pe raport",
  per_apartment_month: "pe apartament, pe lună",
  per_job: "pe intervenție",
};

/** Units that contribute to a predictable monthly total for a building. */
export const RECURRING_UNITS: ServiceUnit[] = [
  "per_building_month",
  "per_apartment_month",
];

export const SERVICE_LINES: ServiceLineSeed[] = [
  {
    key: "curatenie_scara",
    nameRo: "Curățenie casa scării",
    nameEn: "Stairwell cleaning",
    unit: "per_building_month",
    defaultPriceBani: 3566_00,
    note: "Linia de bază existentă.",
    core: true,
  },
  {
    key: "tur_control",
    nameRo: "Tur de control documentat și raport lunar",
    nameEn: "Documented control walk and monthly report",
    unit: "per_building_month",
    defaultPriceBani: 200_00,
    note: "Interval 150-250 lei.",
  },
  {
    key: "calendar_conformitate",
    nameRo: "Calendar de conformitate și coordonare",
    nameEn: "Compliance calendar and coordination",
    unit: "per_building_month",
    defaultPriceBani: 300_00,
    note: "Interval 200-400 lei, plus 10-15% pe facturile furnizorilor.",
  },
  {
    key: "raport_anual",
    nameRo: "Raport anual de urmărire curentă",
    nameEn: "Annual building-monitoring report",
    unit: "per_report",
    defaultPriceBani: 1500_00,
    note: "Interval 800-2.500 lei pe an.",
  },
  {
    key: "carte_tehnica_reconstituire",
    nameRo: "Reconstituire carte tehnică",
    nameEn: "Reconstruction of the technical book",
    unit: "per_job",
    defaultPriceBani: 2500_00,
    note: "Interval 1.500-4.000 lei, o singură dată.",
  },
  {
    key: "igienizare_pubele",
    nameRo: "Igienizare pubele",
    nameEn: "Bin cleaning",
    unit: "per_bin_clean",
    defaultPriceBani: 32_00,
    note: "Interval 25-40 lei; pachet lunar 150-300 lei pe imobil.",
  },
  {
    key: "serviciu_iarna",
    nameRo: "Serviciu de iarnă cu protocol de intervenție",
    nameEn: "Winter service with intervention protocol",
    unit: "per_season",
    defaultPriceBani: 1800_00,
    note: "Interval 1.200-2.500 lei, sau 250-400 lei pe lună noiembrie-martie.",
  },
  {
    key: "spatiu_verde",
    nameRo: "Întreținere spațiu verde",
    nameEn: "Green space maintenance",
    unit: "per_building_month",
    defaultPriceBani: 350_00,
    note: "Sezonier aprilie-octombrie.",
  },
  {
    key: "campanie_periodica",
    nameRo: "Campanie de curățenie mecanizată",
    nameEn: "Periodic machine-cleaning campaign",
    unit: "per_job",
    defaultPriceBani: 1400_00,
    note: "Interval 800-2.000 lei, de 2 ori pe an.",
  },
  {
    key: "turnover_regim_hotelier",
    nameRo: "Curățenie regim hotelier",
    nameEn: "Short-let turnover cleaning",
    unit: "per_job",
    defaultPriceBani: 150_00,
    note: "Interval 120-600 lei, după suprafață.",
  },
  {
    key: "vizita_supraveghere",
    nameRo: "Vizită de supraveghere locuință nelocuită",
    nameEn: "Unoccupied property check visit",
    unit: "per_visit",
    defaultPriceBani: 125_00,
    note: "Sau 250-400 lei pe lună, săptămânal.",
  },
  {
    key: "vizita_verificare_varstnici",
    nameRo: "Vizită de verificare pentru persoane vârstnice",
    nameEn: "Wellbeing check visit for elderly residents",
    unit: "per_apartment_month",
    defaultPriceBani: 200_00,
    note: "Interval 150-250 lei; 400-600 lei cu comisioane.",
  },
  {
    key: "raport_predare_primire",
    nameRo: "Raport de predare-primire cu fotografii",
    nameEn: "Photographic handover report",
    unit: "per_report",
    defaultPriceBani: 300_00,
    note: "Interval 200-400 lei.",
  },
  {
    key: "curatenie_apartament",
    nameRo: "Curățenie în apartament",
    nameEn: "In-apartment cleaning",
    unit: "per_job",
    defaultPriceBani: 320_00,
    note: "Interval 250-400 lei; 800-1.400 lei pe lună, săptămânal.",
  },
  {
    key: "insotire_verificare_gaze",
    nameRo: "Însoțire verificare gaze",
    nameEn: "Escorting the gas inspection",
    unit: "per_apartment_month",
    defaultPriceBani: 50_00,
    note: "Interval 40-60 lei pe apartament, la eveniment.",
  },
];

export const SERVICE_LINE_BY_KEY: Record<string, ServiceLineSeed> = Object.fromEntries(
  SERVICE_LINES.map((s) => [s.key, s])
);
