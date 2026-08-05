// English dictionary — the only filled dictionary until Phase 3 (Portal ships `ro`).
// Keys are grouped by surface. Keep keys stable; the `ro` file must mirror this shape
// for the portal.* namespace when it ships.

export const en = {
  common: {
    appName: "Scara",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    loading: "Loading…",
    none: "None",
    today: "Today",
    month: "Month",
    download: "Download",
    generate: "Generate",
    buildings: "buildings",
    perMonth: "/month",
    lei: "lei",
  },
  nav: {
    sim: "Simulator",
    atlas: "Atlas",
    ops: "Ops",
    compliance: "Obligations",
    services: "Services",
    field: "Field",
    portal: "Portal",
    settings: "Settings",
  },
  roles: {
    admin: "Scott (admin)",
    ops: "Adina (ops)",
    cleanerPrefix: "Cleaner",
  },
  gate: {
    title: "Scara",
    prompt: "Enter the passcode",
    submit: "Enter",
    wrong: "Wrong passcode. Try again.",
  },
} as const;

export type Dictionary = typeof en;
