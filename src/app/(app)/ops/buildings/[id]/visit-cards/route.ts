import { NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { requestBaseUrl } from "@/server/requestUrl";
import { generateVisitCardsPdf } from "@/server/scheduleService";

// Pre-dated visit cards, four to an A4 sheet.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const weeksRaw = Number(new URL(request.url).searchParams.get("weeks"));
  const weeks = Number.isInteger(weeksRaw) && weeksRaw > 0 && weeksRaw <= 8 ? weeksRaw : 2;
  const org = await getCurrentOrg();
  const pdf = await generateVisitCardsPdf(org.id, id, weeks, await requestBaseUrl());
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="fise-vizita.pdf"',
    },
  });
}
