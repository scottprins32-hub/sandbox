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
  if (!visit) return NextResponse.json({ ok: false }, { status: 404 });
  // Wrong cleaner signed in is 403, not 404: on a shared phone, cleaner B
  // logging in must not cause A's queued visit evidence to be dropped as
  // poison. 403 makes the queue hold it until A signs back in, when the
  // identical replay lands cleanly.
  if (visit.cleanerId !== cleaner.id) {
    return NextResponse.json({ ok: false }, { status: 403 });
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
