// Issue categories (add-on 2 §C5). Residents choose one in Romanian on the
// public page; the admin app reads it in English (§0 language rule). Two label
// maps off one key so the languages cannot drift.

export const ISSUE_CATEGORIES = [
  "bec",
  "curatenie",
  "deseuri",
  "defectiune",
  "zapada",
  "altele",
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_CATEGORY_RO: Record<IssueCategory, string> = {
  bec: "Bec ars",
  curatenie: "Curățenie",
  deseuri: "Deșeuri voluminoase",
  defectiune: "Defecțiune",
  zapada: "Zăpadă / gheață",
  altele: "Altceva",
};

export const ISSUE_CATEGORY_EN: Record<IssueCategory, string> = {
  bec: "bulb",
  curatenie: "cleaning",
  deseuri: "bulky waste",
  defectiune: "fault",
  zapada: "snow / ice",
  altele: "other",
};
