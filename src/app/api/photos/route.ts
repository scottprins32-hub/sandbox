import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { getVisit, addPhoto } from "@/server/repo/visits";
import { getStorage } from "@/server/storage";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const visitId = String(form.get("visitId") ?? "");
  const kindRaw = String(form.get("kind") ?? "after");
  const kind = kindRaw === "before" || kindRaw === "issue" ? kindRaw : "after";
  const file = form.get("file");
  if (!visitId || !(file instanceof Blob)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const org = await getCurrentOrg();
  const visit = await getVisit(org.id, visitId);
  if (!visit) return NextResponse.json({ ok: false }, { status: 404 });

  const key = `${org.id}/photos/${visitId}/${crypto.randomUUID()}.jpg`;
  await getStorage().put(key, new Uint8Array(await file.arrayBuffer()), "image/jpeg");
  const photo = await addPhoto(org.id, {
    visitId,
    fileKey: key,
    takenAt: Date.now(),
    kind,
  });
  return NextResponse.json({ ok: true, photoId: photo.id });
}
