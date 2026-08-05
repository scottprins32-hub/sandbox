// Drizzle schema (§7.1). Every table carries org_id — the multi-tenant seam
// (§3, §9): each future city/franchise unit is an org on the same deployment.
// Money columns are integer bani; timestamps are integer unix ms (UTC);
// calendar dates are ISO text (YYYY-MM-DD) in Europe/Bucharest terms.

import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const orgId = () => text("org_id").notNull();
const createdAt = () =>
  integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now());
const updatedAt = () =>
  integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now())
    .$onUpdateFn(() => Date.now());

export const orgs = sqliteTable("orgs", {
  id: id(),
  name: text("name").notNull(),
  cui: text("cui").notNull().default("CUI RO00000000"),
  localeDefault: text("locale_default").notNull().default("en"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// Feature flags and org-level overrides live here as one JSON blob (§3).
export const orgSettings = sqliteTable("org_settings", {
  id: id(),
  orgId: orgId(),
  json: text("json").notNull().default("{}"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const users = sqliteTable(
  "users",
  {
    id: id(),
    orgId: orgId(),
    name: text("name").notNull(),
    role: text("role", { enum: ["admin", "ops", "cleaner"] }).notNull(),
    locale: text("locale", { enum: ["en", "ro"] }).notNull().default("en"),
    pin: text("pin"), // 4-digit PIN for cleaner portal login (§3)
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("users_org_idx").on(t.orgId)]
);

export const clients = sqliteTable(
  "clients",
  {
    id: id(),
    orgId: orgId(),
    name: text("name").notNull(),
    type: text("type", {
      enum: ["landlord", "association", "developer", "office"],
    }).notNull(),
    contact: text("contact"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("clients_org_idx").on(t.orgId)]
);

export const buildings = sqliteTable(
  "buildings",
  {
    id: id(),
    orgId: orgId(),
    clientId: text("client_id"),
    label: text("label").notNull(), // "Fântânii 4A"
    address: text("address").notNull().default(""),
    locality: text("locality").notNull().default(""),
    floors: integer("floors").notNull().default(3),
    apartments: integer("apartments").notNull().default(11),
    residents: integer("residents").notNull().default(24),
    priceBani: integer("price_bani").notNull().default(0),
    visitsPerWeek: integer("visits_per_week").notNull().default(2),
    hoursPerVisit: real("hours_per_visit").notNull().default(1.5),
    checklistTemplateId: text("checklist_template_id"),
    status: text("status", { enum: ["active", "paused", "prospect"] })
      .notNull()
      .default("active"),
    notes: text("notes"),
    // Compliance flags (add-on §4): drive which obligations apply. Additive
    // columns on an existing table, see DECISIONS.md.
    hasGas: integer("has_gas", { mode: "boolean" }).notNull().default(false),
    hasLift: integer("has_lift", { mode: "boolean" }).notNull().default(false),
    hasPlayground: integer("has_playground", { mode: "boolean" }).notNull().default(false),
    hasBasement: integer("has_basement", { mode: "boolean" }).notNull().default(false),
    /**
     * Public building page (add-on 2 §C5). The code is short and unguessable
     * rather than secret: it is printed on a notice board, so it protects
     * against enumeration, not against a passer-by. Minted only when the page
     * is switched on, so a disabled building has no URL to leak.
     */
    publicCode: text("public_code"),
    publicPageEnabled: integer("public_page_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("buildings_org_idx").on(t.orgId)]
);

export const contracts = sqliteTable(
  "contracts",
  {
    id: id(),
    orgId: orgId(),
    clientId: text("client_id").notNull(),
    startDate: text("start_date").notNull(), // YYYY-MM-DD
    termMonths: integer("term_months").notNull().default(12),
    noticeDays: integer("notice_days").notNull().default(60),
    priceBani: integer("price_bani").notNull().default(0),
    indexationNote: text("indexation_note"),
    nextIndexationDate: text("next_indexation_date"), // YYYY-MM-DD
    signedFileKey: text("signed_file_key"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("contracts_org_idx").on(t.orgId)]
);

export const contractBuildings = sqliteTable(
  "contract_buildings",
  {
    id: id(),
    orgId: orgId(),
    contractId: text("contract_id").notNull(),
    buildingId: text("building_id").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("contract_buildings_org_idx").on(t.orgId)]
);

export const cleaners = sqliteTable(
  "cleaners",
  {
    id: id(),
    orgId: orgId(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull().default(""),
    workerModel: text("worker_model", {
      enum: ["fulltime_min", "parttime_standard", "parttime_student", "parttime_pensioner"],
    }).notNull(),
    hoursPerDay: real("hours_per_day").notNull().default(4),
    studentProofExpiry: text("student_proof_expiry"), // YYYY-MM-DD; adeverință renewal
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    /**
     * The named-cleaner notice (add-on 2 §C3). `showOnNotice` defaults false
     * and is the cleaner's own decision: publishing an employee's photo and
     * first name on a public board is their call, not the employer's.
     */
    displayName: text("display_name"),
    photoKey: text("photo_key"),
    introRo: text("intro_ro"),
    showOnNotice: integer("show_on_notice", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("cleaners_org_idx").on(t.orgId)]
);

export const checklistTemplates = sqliteTable(
  "checklist_templates",
  {
    id: id(),
    orgId: orgId(),
    name: text("name").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("checklist_templates_org_idx").on(t.orgId)]
);

export const checklistItems = sqliteTable(
  "checklist_items",
  {
    id: id(),
    orgId: orgId(),
    templateId: text("template_id").notNull(),
    textRo: text("text_ro").notNull(),
    sort: integer("sort").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("checklist_items_org_idx").on(t.orgId)]
);

export const visits = sqliteTable(
  "visits",
  {
    id: id(),
    orgId: orgId(),
    buildingId: text("building_id"), // nullable: turnover/one-off at a non-contracted address
    cleanerId: text("cleaner_id"),
    type: text("type", { enum: ["recurring", "turnover", "oneoff"] })
      .notNull()
      .default("recurring"),
    scheduledDate: text("scheduled_date").notNull(), // YYYY-MM-DD
    window: text("window", { enum: ["am", "pm"] }).notNull().default("am"),
    status: text("status", {
      enum: ["scheduled", "claimed", "in_progress", "done", "missed"],
    })
      .notNull()
      .default("scheduled"),
    priceBani: integer("price_bani"), // per-job price for turnover/oneoff; null for recurring
    locationLabel: text("location_label"), // turnover address when not a contracted building
    openOffer: integer("open_offer", { mode: "boolean" }).notNull().default(false),
    bonusBani: integer("bonus_bani"),
    startedAt: integer("started_at"),
    finishedAt: integer("finished_at"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("visits_org_idx").on(t.orgId),
    index("visits_org_date_idx").on(t.orgId, t.scheduledDate),
  ]
);

export const visitItems = sqliteTable(
  "visit_items",
  {
    id: id(),
    orgId: orgId(),
    visitId: text("visit_id").notNull(),
    checklistItemId: text("checklist_item_id").notNull(),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("visit_items_org_idx").on(t.orgId), index("visit_items_visit_idx").on(t.visitId)]
);

export const photos = sqliteTable(
  "photos",
  {
    id: id(),
    orgId: orgId(),
    visitId: text("visit_id").notNull(),
    fileKey: text("file_key").notNull(),
    takenAt: integer("taken_at").notNull(),
    kind: text("kind", { enum: ["before", "after", "issue"] }).notNull().default("after"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("photos_org_idx").on(t.orgId), index("photos_visit_idx").on(t.visitId)]
);

export const issues = sqliteTable(
  "issues",
  {
    id: id(),
    orgId: orgId(),
    buildingId: text("building_id"),
    source: text("source", { enum: ["tenant", "cleaner", "owner"] }).notNull(),
    description: text("description").notNull(),
    photoFileKey: text("photo_file_key"),
    status: text("status", { enum: ["open", "in_progress", "done"] })
      .notNull()
      .default("open"),
    resolvedAt: integer("resolved_at"),
    /**
     * Both columns exist so the C4 commitments can be measured instead of
     * merely printed: the bulb and bulky-waste promises need to know what an
     * issue is about, and "confirmed within one working day" needs a
     * confirmation timestamp distinct from resolution.
     */
    category: text("category", {
      enum: ["bec", "curatenie", "deseuri", "defectiune", "zapada", "altele"],
    })
      .notNull()
      .default("altele"),
    acknowledgedAt: integer("acknowledged_at"),
    /** Only for tenant reports from the public page; optional, never required. */
    reporterContact: text("reporter_contact"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("issues_org_idx").on(t.orgId)]
);

export const expenses = sqliteTable(
  "expenses",
  {
    id: id(),
    orgId: orgId(),
    date: text("date").notNull(), // YYYY-MM-DD
    category: text("category", {
      enum: ["consumables", "travel", "equipment", "other"],
    }).notNull(),
    amountBani: integer("amount_bani").notNull(),
    buildingId: text("building_id"),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("expenses_org_idx").on(t.orgId)]
);

export const protocols = sqliteTable(
  "protocols",
  {
    id: id(),
    orgId: orgId(),
    buildingId: text("building_id").notNull(),
    /** Sequential document number per org ("Nr. 47"). Additive column. */
    number: integer("number"),
    month: text("month").notNull(), // YYYY-MM
    pdfFileKey: text("pdf_file_key").notNull(),
    generatedAt: integer("generated_at").notNull(),
    signed: integer("signed", { mode: "boolean" }).notNull().default(false),
    signedFileKey: text("signed_file_key"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("protocols_org_idx").on(t.orgId)]
);

export const leads = sqliteTable(
  "leads",
  {
    id: id(),
    orgId: orgId(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    locality: text("locality"),
    buildingType: text("building_type", {
      enum: ["bloc", "asociatie", "birou", "altele"],
    }),
    message: text("message"),
    source: text("source").notNull().default("public_page"),
    status: text("status", { enum: ["new", "contacted", "won", "lost"] })
      .notNull()
      .default("new"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("leads_org_idx").on(t.orgId)]
);

// Walking routes for the field prospecting module (add-on 2 §3).
export const routes = sqliteTable(
  "routes",
  {
    id: id(),
    orgId: orgId(),
    name: text("name").notNull(),
    description: text("description"),
    parkAtLabel: text("park_at_label"),
    parkAtLat: real("park_at_lat"),
    parkAtLng: real("park_at_lng"),
    estBuildings: integer("est_buildings"),
    orderIndex: integer("order_index").notNull().default(0),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("routes_org_idx").on(t.orgId)]
);

export const prospects = sqliteTable(
  "prospects",
  {
    id: id(),
    orgId: orgId(),
    label: text("label").notNull(), // address or nickname
    commune: text("commune").notNull().default("Giroc"),
    floors: integer("floors"),
    apartmentsEst: integer("apartments_est"),
    currentCleaner: text("current_cleaner").notNull().default("unknown"), // unknown | none | a name
    contact: text("contact"),
    /**
     * Field-capture statuses (add-on 2 §3.1). Migration 0006 maps the original
     * five (spotted/contacted/quoted/won/lost) onto these.
     */
    status: text("status", {
      enum: [
        "de_vizitat",
        "vizitat",
        "contactat",
        "oferta_trimisa",
        "castigat",
        "pierdut",
      ],
    })
      .notNull()
      .default("de_vizitat"),
    quotedPriceBani: integer("quoted_price_bani"),
    notes: text("notes"),
    spottedDate: text("spotted_date"), // YYYY-MM-DD
    convertedBuildingId: text("converted_building_id"),
    // --- field capture (add-on 2 §3.1), additive on the original table ---
    routeId: text("route_id"),
    street: text("street"),
    number: text("number"),
    lat: real("lat"),
    lng: real("lng"),
    entrances: integer("entrances"),
    ownership: text("ownership", {
      enum: ["asociatie", "proprietar_unic", "dezvoltator", "necunoscut"],
    })
      .notNull()
      .default("necunoscut"),
    access: text("access", { enum: ["deschis", "interfon", "poarta", "necunoscut"] })
      .notNull()
      .default("necunoscut"),
    incumbent: text("incumbent", {
      enum: ["niciunul", "femeie_serviciu", "firma", "necunoscut"],
    })
      .notNull()
      .default("necunoscut"),
    incumbentName: text("incumbent_name"),
    /** 1-12, the month the general assembly meets (art. 47(1): Q1 by law). */
    assemblyMonth: integer("assembly_month"),
    firstSeenAt: integer("first_seen_at"),
    lastTouchAt: integer("last_touch_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("prospects_org_idx").on(t.orgId),
    index("prospects_route_idx").on(t.routeId),
  ]
);

/**
 * Contacts read off the entrance-hall notice board, which Legea 196/2018
 * art. 57 lit. m) requires the association to post. `informedAt` is the GDPR
 * art. 14 duty (inform within one month); `doNotContact` is permanent.
 */
export const prospectContacts = sqliteTable(
  "prospect_contacts",
  {
    id: id(),
    orgId: orgId(),
    prospectId: text("prospect_id").notNull(),
    role: text("role", {
      enum: ["administrator", "presedinte", "comitet", "proprietar", "dezvoltator"],
    }).notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    source: text("source", {
      enum: ["avizier", "site_public", "recomandare", "ne_a_contactat"],
    })
      .notNull()
      .default("avizier"),
    consentNote: text("consent_note"),
    informedAt: integer("informed_at"),
    doNotContact: integer("do_not_contact", { mode: "boolean" }).notNull().default(false),
    capturedAt: integer("captured_at").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("prospect_contacts_org_idx").on(t.orgId),
    index("prospect_contacts_prospect_idx").on(t.prospectId),
  ]
);

export const prospectPhotos = sqliteTable(
  "prospect_photos",
  {
    id: id(),
    orgId: orgId(),
    prospectId: text("prospect_id").notNull(),
    fileKey: text("file_key").notNull(),
    kind: text("kind", {
      enum: ["avizier", "pubele", "intrare", "scara", "exterior"],
    }).notNull(),
    takenAt: integer("taken_at").notNull(),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("prospect_photos_org_idx").on(t.orgId),
    index("prospect_photos_prospect_idx").on(t.prospectId),
  ]
);

export const prospectEvents = sqliteTable(
  "prospect_events",
  {
    id: id(),
    orgId: orgId(),
    prospectId: text("prospect_id").notNull(),
    kind: text("kind", { enum: ["vizita", "apel", "oferta", "raspuns", "nota"] }).notNull(),
    occurredAt: integer("occurred_at").notNull(),
    summary: text("summary"),
    outcome: text("outcome"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("prospect_events_org_idx").on(t.orgId),
    index("prospect_events_prospect_idx").on(t.prospectId),
  ]
);

// ---------------------------------------------------------------------------
// Compliance layer (add-on §4). Org-scoped like everything else.
// ---------------------------------------------------------------------------

export const contractors = sqliteTable(
  "contractors",
  {
    id: id(),
    orgId: orgId(),
    name: text("name").notNull(),
    /** Matches an obligation category. */
    trade: text("trade").notNull(),
    phone: text("phone"),
    email: text("email"),
    /** e.g. 'DSP + DSVSA, nr. ...'. Empty is a flag on the Problems tab. */
    authorisationNote: text("authorisation_note"),
    rating: integer("rating"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("contractors_org_idx").on(t.orgId)]
);

export const buildingObligations = sqliteTable(
  "building_obligations",
  {
    id: id(),
    orgId: orgId(),
    buildingId: text("building_id").notNull(),
    /** Key into the static catalogue in src/lib/compliance. */
    obligationKey: text("obligation_key").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    lastDoneAt: text("last_done_at"), // YYYY-MM-DD
    nextDueAt: text("next_due_at"), // YYYY-MM-DD, derived and cached
    responsible: text("responsible", { enum: ["us", "client", "third_party"] })
      .notNull()
      .default("us"),
    contractorId: text("contractor_id"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("building_obligations_org_idx").on(t.orgId),
    index("building_obligations_building_idx").on(t.buildingId),
  ]
);

export const complianceEvents = sqliteTable(
  "compliance_events",
  {
    id: id(),
    orgId: orgId(),
    buildingObligationId: text("building_obligation_id").notNull(),
    kind: text("kind", { enum: ["scheduled", "done", "skipped", "blocked"] }).notNull(),
    occurredAt: text("occurred_at").notNull(), // YYYY-MM-DD
    performedBy: text("performed_by", { enum: ["scara", "contractor", "client"] })
      .notNull()
      .default("scara"),
    contractorId: text("contractor_id"),
    costBani: integer("cost_bani"),
    documentFileKey: text("document_file_key"),
    photoKeys: text("photo_keys"), // JSON array
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("compliance_events_org_idx").on(t.orgId),
    index("compliance_events_bo_idx").on(t.buildingObligationId),
  ]
);

// ------------------- Control walks and checkpoints (add-on §5) -------------
// The evidence product: documented rounds with negative findings recorded
// ("Verificat, fără deficiențe"), imported from German inspection practice.

export const checkpoints = sqliteTable(
  "checkpoints",
  {
    id: id(),
    orgId: orgId(),
    buildingId: text("building_id").notNull(),
    labelRo: text("label_ro").notNull(), // 'Subsol - zona centrală'
    /** Short slug encoded in the printed QR. */
    code: text("code").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("checkpoints_org_idx").on(t.orgId),
    index("checkpoints_building_idx").on(t.buildingId),
    index("checkpoints_code_idx").on(t.orgId, t.code),
  ]
);

export const controlWalks = sqliteTable(
  "control_walks",
  {
    id: id(),
    orgId: orgId(),
    buildingId: text("building_id").notNull(),
    visitId: text("visit_id"),
    cleanerId: text("cleaner_id").notNull(),
    startedAt: integer("started_at").notNull(),
    finishedAt: integer("finished_at"),
    status: text("status", { enum: ["in_progress", "done"] })
      .notNull()
      .default("in_progress"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("control_walks_org_idx").on(t.orgId),
    index("control_walks_building_idx").on(t.buildingId),
  ]
);

export const walkCheckpoints = sqliteTable(
  "walk_checkpoints",
  {
    id: id(),
    orgId: orgId(),
    controlWalkId: text("control_walk_id").notNull(),
    checkpointId: text("checkpoint_id").notNull(),
    /** Stamped server-side — client clocks are never trusted for evidence. */
    scannedAt: integer("scanned_at").notNull(),
    condition: text("condition", { enum: ["ok", "issue"] }).notNull(),
    note: text("note"),
    photoKeys: text("photo_keys"), // JSON array
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("walk_checkpoints_org_idx").on(t.orgId),
    index("walk_checkpoints_walk_idx").on(t.controlWalkId),
  ]
);

export const walkFindings = sqliteTable(
  "walk_findings",
  {
    id: id(),
    orgId: orgId(),
    controlWalkId: text("control_walk_id").notNull(),
    checkpointId: text("checkpoint_id"),
    /** Matches obligation categories, plus 'other'. */
    category: text("category").notNull(),
    severity: text("severity", { enum: ["info", "attention", "urgent"] }).notNull(),
    descriptionRo: text("description_ro").notNull(),
    photoKeys: text("photo_keys"), // JSON array
    reportedAt: integer("reported_at").notNull(),
    reportedTo: text("reported_to", { enum: ["owner", "president", "none"] })
      .notNull()
      .default("none"),
    resolvedAt: integer("resolved_at"),
    resolutionNote: text("resolution_note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("walk_findings_org_idx").on(t.orgId),
    index("walk_findings_walk_idx").on(t.controlWalkId),
  ]
);

// ------------- Building record and annual report (add-on §6) ---------------
// Urmărirea comportării în timp: element scores, the events journal and the
// generated annual PROIECT reports that feed the digital Cartea Tehnică.

export const buildingElements = sqliteTable(
  "building_elements",
  {
    id: id(),
    orgId: orgId(),
    buildingId: text("building_id").notNull(),
    key: text("key").notNull(),
    nameRo: text("name_ro").notNull(),
    category: text("category", {
      enum: ["structura", "invelitoare", "fatada", "instalatii", "finisaje", "exterior"],
    }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("building_elements_org_idx").on(t.orgId),
    index("building_elements_building_idx").on(t.buildingId),
  ]
);

export const elementAssessments = sqliteTable(
  "element_assessments",
  {
    id: id(),
    orgId: orgId(),
    buildingElementId: text("building_element_id").notNull(),
    assessedAt: text("assessed_at").notNull(), // YYYY-MM-DD
    assessedBy: text("assessed_by").notNull().default(""),
    /** 1 Excelent … 6 Foarte slab (NEN 2767, adapted). */
    score: integer("score").notNull(),
    noteRo: text("note_ro"),
    photoKeys: text("photo_keys"), // JSON array
    source: text("source", { enum: ["walk", "annual"] }).notNull().default("annual"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("element_assessments_org_idx").on(t.orgId),
    index("element_assessments_element_idx").on(t.buildingElementId),
  ]
);

export const journalEntries = sqliteTable(
  "journal_entries",
  {
    id: id(),
    orgId: orgId(),
    buildingId: text("building_id").notNull(),
    occurredAt: text("occurred_at").notNull(), // YYYY-MM-DD
    kind: text("kind", {
      enum: ["observatie", "interventie", "modificare", "eveniment", "document"],
    }).notNull(),
    descriptionRo: text("description_ro").notNull(),
    relatedType: text("related_type"),
    relatedId: text("related_id"),
    photoKeys: text("photo_keys"), // JSON array
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("journal_entries_org_idx").on(t.orgId),
    index("journal_entries_building_idx").on(t.buildingId),
  ]
);

export const annualReports = sqliteTable(
  "annual_reports",
  {
    id: id(),
    orgId: orgId(),
    buildingId: text("building_id").notNull(),
    year: integer("year").notNull(),
    pdfFileKey: text("pdf_file_key").notNull(),
    generatedAt: integer("generated_at").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("annual_reports_org_idx").on(t.orgId),
    index("annual_reports_building_idx").on(t.buildingId),
  ]
);

// --------------------------- Service lines (add-on §7) ---------------------

export const serviceLines = sqliteTable(
  "service_lines",
  {
    id: id(),
    orgId: orgId(),
    key: text("key").notNull(),
    nameRo: text("name_ro").notNull(),
    nameEn: text("name_en").notNull(),
    unit: text("unit", {
      enum: [
        "per_building_month",
        "per_visit",
        "per_bin_clean",
        "per_season",
        "per_report",
        "per_apartment_month",
        "per_job",
      ],
    }).notNull(),
    defaultPriceBani: integer("default_price_bani").notNull(),
    costModel: text("cost_model"), // JSON
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("service_lines_org_idx").on(t.orgId)]
);

export const buildingServices = sqliteTable(
  "building_services",
  {
    id: id(),
    orgId: orgId(),
    buildingId: text("building_id").notNull(),
    serviceLineId: text("service_line_id").notNull(),
    priceBani: integer("price_bani").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    startedAt: text("started_at"),
    endedAt: text("ended_at"),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("building_services_org_idx").on(t.orgId),
    index("building_services_building_idx").on(t.buildingId),
  ]
);

// Commercial offers (ofertă de preț) sent to prospects. Not a fiscal document
// (§9 DO-NOT-BUILD #4); this records what was quoted so the pipeline is honest.
export const offers = sqliteTable(
  "offers",
  {
    id: id(),
    orgId: orgId(),
    prospectId: text("prospect_id"),
    clientName: text("client_name").notNull(),
    buildingLabel: text("building_label").notNull(),
    address: text("address").notNull().default(""),
    floors: integer("floors").notNull().default(3),
    apartments: integer("apartments").notNull().default(11),
    residents: integer("residents").notNull().default(24),
    visitsPerWeek: integer("visits_per_week").notNull().default(2),
    hoursPerVisit: real("hours_per_visit").notNull().default(1.5),
    priceBani: integer("price_bani").notNull(),
    validUntil: text("valid_until").notNull(), // YYYY-MM-DD
    pdfFileKey: text("pdf_file_key").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("offers_org_idx").on(t.orgId)]
);

export const documents = sqliteTable(
  "documents",
  {
    id: id(),
    orgId: orgId(),
    title: text("title").notNull(),
    tag: text("tag", { enum: ["research", "contract", "legal", "other"] })
      .notNull()
      .default("research"),
    fileKey: text("file_key").notNull(),
    date: text("date"), // YYYY-MM-DD
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("documents_org_idx").on(t.orgId)]
);
