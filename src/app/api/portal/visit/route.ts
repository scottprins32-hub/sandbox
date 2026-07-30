import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { getPortalCleaner } from "@/server/portalAuth";
import { getVisit, setVisitItemDone, updateVisit } from "@/server/repo/visits";

// Portal visit mutations (§8). Idempotent on purpose: the offline queue may
// replay a mutation that already landed, and that must be harmless.
export async function POST(request: NextRequest) {
  const cleaner = await getPortalCleaner();
  if (!cleaner) return NextResponse.json({ ok: false }, { status: 401 });
  const org = await getCurrentOrg();

  const body = (await request.json()) as {
    visitId?: string;
    op?: "start" | "finish" | "item";
    itemId?: string;
    done?: boolean;
  };
  if (!body.visitId || !body.op) return NextResponse.json({ ok: false }, { status: 400 });

  const visit = await getVisit(org.id, body.visitId);
  if (!visit || visit.cleanerId !== cleaner.id) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  if (body.op === "start") {
    await updateVisit(org.id, visit.id, {
      status: visit.status === "done" ? "done" : "in_progress",
      startedAt: visit.startedAt ?? Date.now(),
    });
  } else if (body.op === "finish") {
    await updateVisit(org.id, visit.id, {
      status: "done",
      startedAt: visit.startedAt ?? Date.now(),
      finishedAt: visit.finishedAt ?? Date.now(),
    });
  } else if (body.op === "item" && body.itemId) {
    await setVisitItemDone(org.id, body.itemId, body.done !== false);
  }
  return NextResponse.json({ ok: true });
}
