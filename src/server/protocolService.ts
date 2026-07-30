// Orchestrates protocol generation: counts the month's delivery for a building,
// renders the proces-verbal PDF, stores it, records the protocols row.

import { getBuilding } from "./repo/buildings";
import { getClient } from "./repo/clients";
import { listVisitsInMonth, listPhotosForVisits } from "./repo/visits";
import { listIssuesForBuilding } from "./repo/issues";
import { upsertProtocol, type Protocol } from "./repo/protocols";
import { renderProtocolPdf } from "./pdf/protocol";
import { getStorage } from "./storage";
import { getCurrentOrg } from "./org";

export async function generateProtocol(
  orgId: string,
  buildingId: string,
  monthKey: string
): Promise<Protocol> {
  const org = await getCurrentOrg();
  const building = await getBuilding(orgId, buildingId);
  if (!building) throw new Error("Building not found");
  const client = building.clientId ? await getClient(orgId, building.clientId) : null;

  const monthVisits = (await listVisitsInMonth(orgId, monthKey)).filter(
    (v) => v.buildingId === buildingId && v.type === "recurring"
  );
  const scheduled = monthVisits.length;
  const done = monthVisits.filter((v) => v.status === "done").length;
  const photos = await listPhotosForVisits(
    orgId,
    monthVisits.map((v) => v.id)
  );

  const issues = await listIssuesForBuilding(orgId, buildingId);
  const issuesResolved = issues.filter(
    (i) =>
      i.status === "done" &&
      i.resolvedAt !== null &&
      new Date(i.resolvedAt).toISOString().slice(0, 7) === monthKey
  ).length;

  const pdf = await renderProtocolPdf({
    orgName: org.name,
    cui: org.cui,
    clientName: client?.name ?? "Beneficiar",
    buildingLabel: building.label,
    address: [building.address, building.locality].filter(Boolean).join(", "),
    monthKey,
    scheduled,
    done,
    visitsPerWeek: building.visitsPerWeek,
    photoCount: photos.length,
    issuesResolved,
  });

  const fileKey = `${orgId}/protocols/${monthKey}-${building.id}.pdf`;
  await getStorage().put(fileKey, pdf, "application/pdf");
  return upsertProtocol(orgId, { buildingId, month: monthKey, pdfFileKey: fileKey });
}
