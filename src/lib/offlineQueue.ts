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

/** POST JSON; on network failure, queue for retry. Returns true if it landed now. */
export async function sendOrQueue(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return true;
    // Auth/validation failures won't heal by retrying; only queue server/network trouble.
    if (res.status >= 500) throw new Error(String(res.status));
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
        if (!res.ok && res.status >= 500) break; // still down; try later
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
