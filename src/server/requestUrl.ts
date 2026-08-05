import { headers } from "next/headers";

/**
 * The origin a printed QR should point at (add-on 2 §C5).
 *
 * Taken from the request rather than an env var so a sheet printed from a
 * preview deployment carries that preview's URL, instead of silently pointing
 * residents at production — or worse, at localhost.
 */
export async function requestBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
