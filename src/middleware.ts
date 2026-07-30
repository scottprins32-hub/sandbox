import { NextRequest, NextResponse } from "next/server";

// Public routes (no passcode): the lead-gen page, the gate itself, the lead API,
// and static assets. Everything else is gated by the shared passcode (§3: no real
// auth in v1). If SCARA_PASSCODE is unset the gate is open, so a fresh clone runs
// with `npm i && npm run dev` and nothing else (acceptance script #1).
const PUBLIC_PATHS = ["/", "/gate", "/api/gate", "/api/leads", "/robots.txt"];

export function middleware(request: NextRequest) {
  const passcode = process.env.SCARA_PASSCODE;
  if (!passcode) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const cookie = request.cookies.get("scara_pass")?.value;
  if (cookie === passcode) return NextResponse.next();

  const gateUrl = request.nextUrl.clone();
  gateUrl.pathname = "/gate";
  gateUrl.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(gateUrl);
}

export const config = {
  // Skip Next internals and files with extensions (images, fonts, icons).
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
