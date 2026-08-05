import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { createLead } from "@/server/repo/leads";

// Public lead form endpoint (§9): honeypot field + per-IP rate limit, no
// captcha service. The limiter is in-memory, so on serverless it is
// per-instance — fine for this traffic level; the honeypot does the real work.
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

const BUILDING_TYPES = new Set(["bloc", "asociatie", "birou", "altele"]);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, reason: "rate" }, { status: 429 });
  }

  const body = (await request.json()) as {
    nume?: string;
    telefon?: string;
    localitate?: string;
    tip?: string;
    mesaj?: string;
    website?: string; // honeypot — humans never fill this
  };

  if (body.website) return NextResponse.json({ ok: true }); // silently drop bots

  const name = (body.nume ?? "").trim();
  const phone = (body.telefon ?? "").trim();
  if (name.length < 2 || phone.length < 6) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  // 503, not a crash: the form tells the visitor to try again, and 5xx means
  // "temporary" to anything that retries — a 500 error page tells a potential
  // client the company's own website is broken.
  try {
    const org = await getCurrentOrg();
    await createLead(org.id, {
      name: name.slice(0, 120),
      phone: phone.slice(0, 40),
      locality: (body.localitate ?? "").trim().slice(0, 80) || null,
      buildingType: BUILDING_TYPES.has(body.tip ?? "")
        ? (body.tip as "bloc" | "asociatie" | "birou" | "altele")
        : null,
      message: (body.mesaj ?? "").trim().slice(0, 2000) || null,
      source: "public_page",
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "db" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
