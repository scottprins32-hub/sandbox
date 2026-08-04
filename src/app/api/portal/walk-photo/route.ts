import { NextRequest, NextResponse } from "next/server";
import { getPortalCleaner } from "@/server/portalAuth";
import { getCurrentOrg } from "@/server/org";
import { getStorage } from "@/server/storage";
import {
  appendFindingPhoto,
  appendWalkCheckpointPhoto,
  getWalk,
} from "@/server/repo/walks";

// Photos for walk evidence: attached to a checkpoint row or a finding.
// Uploads need connectivity (no offline queue for binary payloads), same as
// visit photos.

export async function POST(request: NextRequest) {
  const cleaner = await getPortalCleaner();
  if (!cleaner) return NextResponse.json({ ok: false }, { status: 401 });
  const org = await getCurrentOrg();

  const form = await request.formData();
  const walkId = String(form.get("walkId") ?? "");
  const walkCheckpointId = String(form.get("walkCheckpointId") ?? "");
  const findingId = String(form.get("findingId") ?? "");
  const file = form.get("file");
  if (!walkId || !(file instanceof Blob) || (!walkCheckpointId && !findingId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const walk = await getWalk(org.id, walkId);
  if (!walk || walk.cleanerId !== cleaner.id) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const key = `${org.id}/walks/${walkId}/${crypto.randomUUID()}.jpg`;
  await getStorage().put(key, new Uint8Array(await file.arrayBuffer()), "image/jpeg");
  if (findingId) await appendFindingPhoto(org.id, findingId, key);
  else await appendWalkCheckpointPhoto(org.id, walkCheckpointId, key);
  return NextResponse.json({ ok: true });
}
