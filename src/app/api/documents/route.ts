import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { createDocument } from "@/server/repo/documents";
import { getStorage } from "@/server/storage";
import { todayYmd } from "@/lib/dates";

// Document shelf upload (§6b Cut 2). Plain multipart form post, then back to /atlas.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const tagRaw = String(form.get("tag") ?? "research");
  const tag = ["research", "contract", "legal", "other"].includes(tagRaw)
    ? (tagRaw as "research" | "contract" | "legal" | "other")
    : "research";

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.redirect(new URL("/atlas?error=nofile", request.url), 303);
  }

  const org = await getCurrentOrg();
  const safeName = (file.name || "document.pdf").replaceAll("/", "_");
  const key = `${org.id}/documents/${crypto.randomUUID()}-${safeName}`;
  await getStorage().put(
    key,
    new Uint8Array(await file.arrayBuffer()),
    file.type || "application/octet-stream"
  );
  await createDocument(org.id, {
    title: title || safeName,
    tag,
    fileKey: key,
    date: todayYmd(),
  });
  return NextResponse.redirect(new URL("/atlas", request.url), 303);
}
