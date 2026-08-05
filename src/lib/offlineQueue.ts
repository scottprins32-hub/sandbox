"use client";

// Offline tolerance for the Portal (§8): failed mutations queue in
// localStorage and retry until they land — a finished visit must never be
// lost to a dead spot in a stairwell. Server mutations are idempotent, so a
// replay of something that already landed is harmless.

const KEY = "scara.portal.queue";

interface QueuedMutation {
  id: string;
  url: string;
  body: unknown;
}

function read(): QueuedMutation[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as QueuedMutation[];
  } catch {
    return [];
  }
}

function write(queue: QueuedMutation[]) {
  window.localStorage.setItem(KEY, JSON.stringify(queue));
  notify();
}

const listeners = new Set<() => void>();
function notify() {
  for (const l of listeners) l();
}

export function pendingCount(): number {
  if (typeof window === "undefined") return 0;
  return read().length;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * A response that must NOT count as delivered:
 *  - a followed redirect: some interstitial answered with its own 200, not our
 *    API — the write never landed;
 *  - 401/403: the passcode session lapsed, retry after the next sign-in;
 *  - 5xx: server trouble.
 * Only clean 2xx delivers; only non-auth 4xx is dropped as unfixable.
 */
function retryable(res: Response): boolean {
  return res.redirected || res.status === 401 || res.status === 403 || res.status >= 500;
}

/** POST JSON; on network failure, queue for retry. Returns true if it landed now. */
export async function sendOrQueue(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok && !res.redirected) return true;
    if (retryable(res)) throw new Error(String(res.status));
    return false;
  } catch {
    write([...read(), { id: crypto.randomUUID(), url, body }]);
    return false;
  }
}

let flushing = false;
export async function flush(): Promise<void> {
  if (flushing || typeof window === "undefined") return;
  flushing = true;
  try {
    let queue = read();
    while (queue.length > 0) {
      const next = queue[0]!;
      try {
        const res = await fetch(next.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next.body),
        });
        if (!res.ok || res.redirected) {
          if (retryable(res)) break; // still down or signed out; try later
          // Non-auth 4xx: unfixable, fall through and drop it.
        }
      } catch {
        break; // still offline
      }
      queue = queue.slice(1);
      write(queue);
    }
  } finally {
    flushing = false;
  }
}

let started = false;
export function startSyncLoop() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => void flush());
  window.setInterval(() => void flush(), 5000);
}
