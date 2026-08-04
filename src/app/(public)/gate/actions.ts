"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Only same-origin absolute paths may be redirected to after unlocking.
 * "//evil.com" and "https://evil.com" are both rejected — an open redirect on
 * a login screen is how phishing links get their credibility.
 */
function safeNext(raw: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/sim";
  return raw;
}

export async function submitPasscodeAction(formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/sim"));
  const expected = process.env.SCARA_PASSCODE;

  if (expected && passcode !== expected) {
    redirect(`/gate?next=${encodeURIComponent(next)}&wrong=1`);
  }

  const store = await cookies();
  store.set("scara_pass", passcode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  redirect(next);
}
