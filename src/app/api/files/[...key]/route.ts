import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/server/storage";

// Serves stored files (photos, protocol PDFs, documents). Passcode-gated by
// middleware like every non-public route.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ key: string[] }> }
) {
  const { key } = await ctx.params;
  const joined = key.join("/");
  if (joined.includes("..")) return new NextResponse("Bad key", { status: 400 });
  const file = await getStorage().get(joined);
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(Buffer.from(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
