import { NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { listAllContacts } from "@/server/repo/prospecting";
import { listProspects } from "@/server/repo/prospects";

// Subject-access export (add-on 2 §3.4): everything stored about the contacts
// this org holds. Suppressed contacts are excluded by the repo — a
// do-not-contact record must not travel any further, including into an export.

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export async function GET() {
  const org = await getCurrentOrg();
  const [contacts, prospects] = await Promise.all([
    listAllContacts(org.id),
    listProspects(org.id),
  ]);
  const buildingOf = new Map(prospects.map((p) => [p.id, p.label]));

  const header = [
    "nume",
    "rol",
    "telefon",
    "email",
    "sursa",
    "cladire",
    "capturat_la",
    "informat_la",
  ];
  const rows = contacts.map((c) =>
    [
      c.name,
      c.role,
      c.phone,
      c.email,
      c.source,
      buildingOf.get(c.prospectId) ?? "",
      new Date(c.capturedAt).toISOString(),
      c.informedAt ? new Date(c.informedAt).toISOString() : "",
    ]
      .map(csvCell)
      .join(",")
  );

  return new NextResponse([header.join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacte-teren.csv"',
    },
  });
}
