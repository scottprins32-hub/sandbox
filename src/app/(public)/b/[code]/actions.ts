"use server";

// The resident's report-an-issue form (add-on 2 §C5).
//
// This is the only public write in the whole app that reaches a client's
// operational data, so it is deliberately narrow: an issue row against one
// building, nothing else. No account is created, no contact is required, and
// what a resident types about themselves is optional and capped.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ISSUE_CATEGORIES, type IssueCategory } from "@/lib/issues";
import { getBuildingByPublicCode } from "@/server/repo/buildings";
import { createIssue } from "@/server/repo/issues";

const CATEGORIES = new Set<string>(ISSUE_CATEGORIES);

// Per-IP limiter, same shape as the lead endpoint: in-memory, so on serverless
// it is per-instance. The honeypot does the real work; this stops one bored
// person with a phone from filling the Problems tab.
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 4;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function reportIssueAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const back = `/b/${encodeURIComponent(code.toLowerCase())}`;

  // Honeypot: hidden from humans, filled by bots. Answer as if it worked —
  // telling a bot it was caught only teaches it.
  if (String(formData.get("website") ?? "")) redirect(`${back}?trimis=1`);

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) redirect(`${back}?eroare=prea-multe`);

  const description = String(formData.get("descriere") ?? "").trim();
  if (description.length < 5) redirect(`${back}?eroare=scurt`);

  // The code is the authorisation: an unknown or switched-off page cannot
  // write. Resolving it again here means the form cannot be replayed against
  // a building whose page was taken down.
  let building;
  try {
    building = await getBuildingByPublicCode(code);
  } catch {
    // Database down. Tell the resident to try later — a raw 500 reads as
    // "this company's thing is broken", which is the impression the whole
    // page exists to prevent.
    redirect(`${back}?eroare=indisponibil`);
  }
  if (!building) redirect(back);

  const raw = String(formData.get("categorie") ?? "altele");
  const contact = String(formData.get("contact") ?? "").trim();

  // The write gets the same guard as the read: the lookup succeeding is no
  // proof the insert will (read-only token, mid-request outage). The form
  // works without JavaScript, so an unhandled throw here would hand the
  // resident a raw error page and lose their report.
  try {
    await createIssue(building.orgId, {
      buildingId: building.id,
      source: "tenant",
      category: (CATEGORIES.has(raw) ? raw : "altele") as IssueCategory,
      description: description.slice(0, 2000),
      // Optional and never asked for twice. A resident who leaves nothing
      // here still gets their stairwell cleaned.
      reporterContact: contact ? contact.slice(0, 120) : null,
    });
  } catch {
    redirect(`${back}?eroare=indisponibil`);
  }

  revalidatePath("/ops");
  redirect(`${back}?trimis=1`);
}
