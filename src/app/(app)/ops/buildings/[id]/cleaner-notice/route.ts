import { NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { generateCleanerNoticePdf } from "@/server/scheduleService";

// "Îngrijitorul scării dumneavoastră" (add-on 2 §C3), A5 for the board.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const org = await getCurrentOrg();
  const pdf = await generateCleanerNoticePdf(org.id, id);
  // No consenting cleaner, no sheet. 404 rather than a blank page, so a
  // mis-set consent flag is obvious instead of quietly printing nothing.
  if (!pdf) {
    return new NextResponse(
      "No cleaner on this building has agreed to appear on the notice.",
      { status: 404 }
    );
  }
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="ingrijitorul-scarii.pdf"',
    },
  });
}
