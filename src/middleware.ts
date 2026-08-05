import { NextRequest, NextResponse } from "next/server";

// Public routes (no passcode): the lead-gen page, the gate itself, the lead API,
// and static assets. Everything else is gated by the shared passcode (§3: no real
// auth in v1). If SCARA_PASSCODE is unset the gate is open, so a fresh clone runs
// with `npm i && npm run dev` and nothing else (acceptance script #1).
const PUBLIC_PATHS = [
  "/",
  "/gate",
  "/api/gate",
  "/api/leads",
  "/api/health",
  "/robots.txt",
];

// Public by prefix rather than by exact path: the building status page (add-on
// 2 §C5) is one route per building code, and a resident scanning a QR off a
// notice board has no passcode and never will. The code is the authorisation,
// and the page only resolves when the client has switched it on.
const PUBLIC_PREFIXES = ["/b/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Phone keyboards capitalise the first letter of a typed address, and Next
  // routes are case-sensitive: "/SIM" 404s. That bites hardest right after
  // the passcode, because the gate faithfully returns you to the path you
  // asked for. Normalise page routes to lowercase before anything else.
  // Never /api — file keys are case-sensitive (e.g. ...PROIECT-2026...pdf).
  const lower = pathname.toLowerCase();
  if (lower !== pathname && !pathname.startsWith("/api/")) {
    const normalized = request.nextUrl.clone();
    normalized.pathname = lower;
    return NextResponse.redirect(normalized, 308);
  }

  const passcode = process.env.SCARA_PASSCODE;
  // Unset OR empty string both leave the app open. An empty value is easy to
  // create by accident in a hosting dashboard, so treat it the same as unset
  // and let /api/health and the banner report it.
  if (!passcode) return NextResponse.next();

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

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
