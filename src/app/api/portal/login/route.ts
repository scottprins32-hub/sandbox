import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { getCleanerByPhonePin } from "@/server/repo/cleaners";

export async function POST(request: NextRequest) {
  const { phone, pin } = (await request.json()) as { phone?: string; pin?: string };
  if (!phone || !pin) return NextResponse.json({ ok: false }, { status: 400 });
  const org = await getCurrentOrg();
  const cleaner = await getCleanerByPhonePin(org.id, phone.trim(), pin.trim());
  if (!cleaner) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("scara_cleaner", cleaner.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
