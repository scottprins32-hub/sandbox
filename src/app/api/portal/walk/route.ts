import { NextRequest, NextResponse } from "next/server";
import { getPortalCleaner } from "@/server/portalAuth";
import { getCurrentOrg } from "@/server/org";
import { getVisit } from "@/server/repo/visits";
import {
  createFinding,
  ensureWalk,
  finishWalk,
  getWalk,
  recordWalkCheckpoint,
} from "@/server/repo/walks";

// Walk mutations from the Portal. Ids are client-generated so the offline
// queue can replay safely; every timestamp is stamped server-side (§5:
// never trust client clocks for evidence).

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(request: NextRequest) {
  const cleaner = await getPortalCleaner();
  if (!cleaner) return NextResponse.json({ ok: false }, { status: 401 });
  const org = await getCurrentOrg();

  const body = (await request.json()) as {
    op: "checkpoint" | "finding" | "finish";
    walkId: string;
    visitId?: string;
    checkpointId?: string;
    condition?: "ok" | "issue";
    note?: string;
    findingId?: string;
    category?: string;
    severity?: "info" | "attention" | "urgent";
    description?: string;
  };
  if (!UUID.test(body.walkId ?? "")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // The walk hangs off a visit that must belong to this cleaner.
  let walk = await getWalk(org.id, body.walkId);
  if (!walk) {
    const visit = body.visitId ? await getVisit(org.id, body.visitId) : null;
    if (!visit || visit.cleanerId !== cleaner.id || !visit.buildingId) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    walk = await ensureWalk(org.id, {
      id: body.walkId,
      buildingId: visit.buildingId,
      visitId: visit.id,
      cleanerId: cleaner.id,
    });
  }
  if (walk.cleanerId !== cleaner.id) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  if (body.op === "checkpoint") {
    if (!body.checkpointId || (body.condition !== "ok" && body.condition !== "issue")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const row = await recordWalkCheckpoint(org.id, {
      controlWalkId: walk.id,
      checkpointId: body.checkpointId,
      condition: body.condition,
      note: body.note?.slice(0, 500) || null,
    });
    return NextResponse.json({ ok: true, walkCheckpointId: row.id });
  }

  if (body.op === "finding") {
    if (
      !UUID.test(body.findingId ?? "") ||
      !body.description?.trim() ||
      !["info", "attention", "urgent"].includes(body.severity ?? "")
    ) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const finding = await createFinding(org.id, {
      id: body.findingId!,
      controlWalkId: walk.id,
      checkpointId: body.checkpointId ?? null,
      category: (body.category ?? "other").slice(0, 40),
      severity: body.severity as "info" | "attention" | "urgent",
      descriptionRo: body.description.trim().slice(0, 500),
    });
    return NextResponse.json({ ok: true, findingId: finding.id });
  }

  if (body.op === "finish") {
    await finishWalk(org.id, walk.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
