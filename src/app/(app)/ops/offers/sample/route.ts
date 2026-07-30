import { NextResponse } from "next/server";
import { renderSampleProtocol } from "@/server/offerService";

// The proof pack's specimen proces-verbal. Watermarked MODEL by the renderer.
export async function GET() {
  const pdf = await renderSampleProtocol();
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="model-proces-verbal.pdf"',
    },
  });
}
