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
    status: text("status", {
      enum: ["spotted", "contacted", "quoted", "won", "lost"],
    })
      .notNull()
      .default("spotted"),
    quotedPriceBani: integer("quoted_price_bani"),
    notes: text("notes"),
    spottedDate: text("spotted_date"), // YYYY-MM-DD
    convertedBuildingId: text("converted_building_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("prospects_org_idx").on(t.orgId)]
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
