import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { getPortalCleaner } from "@/server/portalAuth";
import { getVisit, updateVisit } from "@/server/repo/visits";

// "Vreau eu" (§8): claim-with-approval, deliberately NOT auto-assignment (§9).
// The claim parks the job as 'claimed' until the admin confirms it in Ops.
export async function POST(request: NextRequest) {
  const cleaner = await getPortalCleaner();
  if (!cleaner) return NextResponse.json({ ok: false }, { status: 401 });
  const org = await getCurrentOrg();

  const { visitId } = (await request.json()) as { visitId?: string };
  if (!visitId) return NextResponse.json({ ok: false }, { status: 400 });

  const visit = await getVisit(org.id, visitId);
  if (!visit || !visit.openOffer) return NextResponse.json({ ok: false }, { status: 404 });
  if (visit.cleanerId && visit.cleanerId !== cleaner.id) {
    return NextResponse.json({ ok: false, reason: "taken" }, { status: 409 });
  }

  await updateVisit(org.id, visitId, { cleanerId: cleaner.id, status: "claimed" });
  return NextResponse.json({ ok: true });
}
