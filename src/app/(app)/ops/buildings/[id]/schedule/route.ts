import { NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { requestBaseUrl } from "@/server/requestUrl";
import { generateSchedulePdf } from "@/server/scheduleService";

// The posted schedule, streamed inline so it can be checked before printing.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const org = await getCurrentOrg();
  const pdf = await generateSchedulePdf(org.id, id, await requestBaseUrl());
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="program-intretinere.pdf"',
    },
  });
}
