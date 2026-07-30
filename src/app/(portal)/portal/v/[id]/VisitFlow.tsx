"use client";

// The cleaner's visit flow (§8): Începe → checklist with big tap targets →
// photos → Am terminat. State is optimistic; mutations go through the offline
// queue so a dead spot in a stairwell never loses work.

import { useState } from "react";
import { ro } from "@/lib/i18n/ro";
import { sendOrQueue } from "@/lib/offlineQueue";
import { PhotoUpload } from "@/components/ops/PhotoUpload";

export interface FlowItem {
  id: string;
  text: string;
  done: boolean;
}

export function VisitFlow({
  visitId,
  initialStatus,
  items: initialItems,
  photoCount,
}: {
  visitId: string;
  initialStatus: string;
  items: FlowItem[];
  photoCount: number;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [items, setItems] = useState(initialItems);

  async function start() {
    setStatus("in_progress");
    await sendOrQueue("/api/portal/visit", { visitId, op: "start" });
  }

  async function finish() {
    setStatus("done");
    await sendOrQueue("/api/portal/visit", { visitId, op: "finish" });
  }

  async function toggle(item: FlowItem) {
    const done = !item.done;
    setItems((all) => all.map((i) => (i.id === item.id ? { ...i, done } : i)));
    await sendOrQueue("/api/portal/visit", { visitId, op: "item", itemId: item.id, done });
  }

  const allTicked = items.length > 0 && items.every((i) => i.done);

  return (
    <div className="space-y-4">
      {status === "scheduled" || status === "claimed" ? (
        <button
          onClick={start}
          className="w-full rounded-xl bg-moss-deep px-4 py-4 text-lg font-semibold text-paper"
        >
          {ro.portal.today.start}
        </button>
      ) : null}

      {status !== "scheduled" && status !== "claimed" && (
        <>
          <div className="rounded-xl bg-surface p-4 shadow-card">
            <h2 className="text-sm font-semibold">{ro.portal.today.checklist}</h2>
            <ul className="mt-1 divide-y divide-line">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => toggle(item)}
                    disabled={status === "done"}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <span
                      aria-hidden
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-sm ${
                        item.done
                          ? "border-moss bg-moss text-paper"
                          : "border-line-strong bg-surface"
                      }`}
                    >
                      {item.done ? "✓" : ""}
                    </span>
                    <span
                      className={`text-base leading-snug ${item.done ? "text-ink-faint line-through" : ""}`}
                    >
                      {item.text}
                    </span>
                  </button>
                </li>
              ))}
              {items.length === 0 && (
                <li className="py-2 text-sm text-ink-faint">Fără listă pentru jobul acesta.</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {ro.portal.today.photos}{" "}
                <span className="tnum font-normal text-ink-faint">({photoCount})</span>
              </h2>
              <div className="flex gap-2">
                <PhotoUpload visitId={visitId} kind="before" label={ro.portal.today.before} />
                <PhotoUpload visitId={visitId} kind="after" label={ro.portal.today.after} />
              </div>
            </div>
          </div>

          {status !== "done" && (
            <button
              onClick={finish}
              className={`w-full rounded-xl px-4 py-4 text-lg font-semibold text-paper ${
                allTicked ? "bg-moss-deep" : "bg-moss"
              }`}
            >
              {ro.portal.today.finish}
            </button>
          )}
          {status === "done" && (
            <p className="rounded-xl bg-moss-wash p-4 text-center text-base font-medium text-moss-deep">
              {ro.portal.today.done} ✓
            </p>
          )}
        </>
      )}
    </div>
  );
}
