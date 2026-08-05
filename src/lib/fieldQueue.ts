"use client";

// Offline queue for the field capture screen (add-on 2 §3.3).
//
// The Portal's queue (src/lib/offlineQueue.ts) is localStorage-backed and
// carries JSON only. This one is IndexedDB-backed because field capture also
// queues photos, and a stairwell basement has no signal: losing a building's
// capture is the one failure this module may not have.
//
// Writes are ordered and replayed oldest-first, so a prospect is always
// created before the contacts and photos that reference it. Ids are minted on
// the client, so a replay updates rather than duplicates.

const DB_NAME = "scara.field";
const STORE = "queue";
const VERSION = 1;

export interface QueuedJson {
  kind: "json";
  url: string;
  body: unknown;
}

export interface QueuedUpload {
  kind: "upload";
  url: string;
  /** Text fields sent alongside the file. */
  fields: Record<string, string>;
  blob: Blob;
  filename: string;
}

type QueuedItem = (QueuedJson | QueuedUpload) & { id?: number };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const store = db.transaction(STORE, mode).objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const listeners = new Set<() => void>();
function notify() {
  for (const l of listeners) l();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function pendingCount(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  try {
    return await tx("readonly", (s) => s.count());
  } catch {
    return 0;
  }
}

async function enqueue(item: QueuedItem): Promise<void> {
  await tx("readwrite", (s) => s.add(item));
  notify();
  void flush();
}

/**
 * true = remove from the queue (delivered, or unfixable), false = keep and
 * retry. Three classes:
 *  - ok, and genuinely ours: delivered.
 *  - 401/403 or a redirect: the passcode session lapsed. The capture is fine;
 *    the phone isn't signed in. Hold it — it lands after the next login.
 *  - other 4xx: malformed forever; drop rather than poison the queue.
 *  - 5xx / network: server or signal trouble; hold it.
 */
function settle(res: Response): boolean {
  // A followed redirect means some interstitial answered, not our API.
  // Whatever it said, the write did not land.
  if (res.redirected) return false;
  if (res.ok) return true;
  if (res.status === 401 || res.status === 403) return false;
  if (res.status < 500) return true;
  return false;
}

async function send(item: QueuedItem): Promise<boolean> {
  if (item.kind === "json") {
    const res = await fetch(item.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item.body),
    });
    return settle(res);
  }
  const form = new FormData();
  for (const [k, v] of Object.entries(item.fields)) form.append(k, v);
  form.append("file", item.blob, item.filename);
  const res = await fetch(item.url, { method: "POST", body: form });
  return settle(res);
}

let flushing = false;

/** Replay oldest-first; stop at the first item that cannot land yet. */
export async function flush(): Promise<void> {
  if (flushing || typeof indexedDB === "undefined") return;
  flushing = true;
  try {
    for (;;) {
      const items = await tx<QueuedItem[]>("readonly", (s) =>
        s.getAll(undefined, 1) as IDBRequest<QueuedItem[]>
      );
      const next = items[0];
      if (!next) break;
      let ok = false;
      try {
        ok = await send(next);
      } catch {
        ok = false; // still offline
      }
      if (!ok) break;
      await tx("readwrite", (s) => s.delete(next.id!));
      notify();
    }
  } finally {
    flushing = false;
  }
}

/** Queue a JSON write. Always queues first, so ordering survives a flaky link. */
export async function sendJson(url: string, body: unknown): Promise<void> {
  await enqueue({ kind: "json", url, body });
}

/** Queue a photo upload with its metadata. */
export async function sendUpload(
  url: string,
  fields: Record<string, string>,
  blob: Blob,
  filename = "photo.jpg"
): Promise<void> {
  await enqueue({ kind: "upload", url, fields, blob, filename });
}

let started = false;
export function startFieldSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => void flush());
  window.setInterval(() => void flush(), 5000);
  void flush();
}
