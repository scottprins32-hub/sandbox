import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { passcode } = (await request.json()) as { passcode?: string };
  const expected = process.env.SCARA_PASSCODE;
  if (expected && passcode !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("scara_pass", passcode ?? "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
