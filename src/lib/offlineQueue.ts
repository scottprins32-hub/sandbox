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
 *  - 401/403: the session lapsed or the wrong cleaner is signed in on a
 *    shared phone; retry after the next sign-in;
 *  - 408/429: timeout or throttling, transient by definition;
 *  - 5xx: server trouble.
 * Only clean 2xx delivers; only the remaining 4xx is dropped as unfixable.
 */
export function retryable(res: Response): boolean {
  return (
    res.redirected ||
    res.status === 401 ||
    res.status === 403 ||
    res.status === 408 ||
    res.status === 429 ||
    res.status >= 500
  );
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
    for (;;) {
      // Re-read storage every iteration and remove by id, never by position
      // from a snapshot: sendOrQueue() appends to localStorage while our
      // fetch below is suspended, and writing a stale snapshot back would
      // erase those items without a single send attempt.
      const next = read()[0];
      if (!next) break;
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
      write(read().filter((q) => q.id !== next.id));
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
