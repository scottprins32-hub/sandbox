import { NextRequest, NextResponse } from "next/server";

// Role switcher backend: stores the simulated identity in a cookie (§3).
export async function POST(request: NextRequest) {
  const { role } = (await request.json()) as { role?: string };
  if (
    !role ||
    (role !== "admin" && role !== "ops" && !role.startsWith("cleaner:"))
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("scara_role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
