import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { getProspect } from "@/server/repo/prospects";
import { addProspectPhoto } from "@/server/repo/prospecting";
import { getStorage } from "@/server/storage";

const KINDS = ["avizier", "pubele", "intrare", "scara", "exterior"] as const;

export async function POST(request: NextRequest) {
  const org = await getCurrentOrg();
  const form = await request.formData();
  const prospectId = String(form.get("prospectId") ?? "");
  const kindRaw = String(form.get("kind") ?? "exterior");
  const file = form.get("file");
  if (!prospectId || !(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Org-scoped lookup before the id reaches a storage key.
  const prospect = await getProspect(org.id, prospectId);
  if (!prospect) return NextResponse.json({ ok: false }, { status: 404 });

  const kind = (KINDS as readonly string[]).includes(kindRaw)
    ? (kindRaw as (typeof KINDS)[number])
    : "exterior";
  const key = `${org.id}/prospects/${prospect.id}/${crypto.randomUUID()}.jpg`;
  await getStorage().put(key, new Uint8Array(await file.arrayBuffer()), "image/jpeg");
  await addProspectPhoto(org.id, { prospectId: prospect.id, fileKey: key, kind });
  return NextResponse.json({ ok: true });
}
