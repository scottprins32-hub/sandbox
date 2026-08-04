"use client";

// The control-walk flow (add-on §5): per checkpoint, one of two taps —
// "În regulă" or "Am găsit ceva". Every tap writes an evidence row; a clean
// walk is a set of ok rows, never an empty record. Mutations ride the same
// offline queue as the visit flow; ids are client-generated so replays land
// idempotently. Timestamps are stamped by the server.

import { useState } from "react";
import { ro } from "@/lib/i18n/ro";
import { sendOrQueue } from "@/lib/offlineQueue";
import { CATEGORY_LABEL_RO } from "@/lib/compliance/types";

const t = ro.portal.walk;

export interface WalkCheckpointState {
  id: string;
  label: string;
  condition: "ok" | "issue" | null;
}

const FINDING_CATEGORIES = [
  ...Object.entries(CATEGORY_LABEL_RO),
  ["other", t.otherCategory],
] as [string, string][];

function FindingForm({
  onSave,
  onCancel,
}: {
  onSave: (data: { category: string; severity: "info" | "attention" | "urgent"; description: string }) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState("other");
  const [severity, setSeverity] = useState<"info" | "attention" | "urgent">("attention");
  const [description, setDescription] = useState("");

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-line bg-paper p-3">
      <label className="block text-xs text-ink-faint">
        {t.category}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-0.5 w-full rounded-md border border-line bg-surface px-2 py-2 text-sm"
        >
          {FINDING_CATEGORIES.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div>
        <span className="text-xs text-ink-faint">{t.severity}</span>
        <div className="mt-1 flex gap-1">
          {(["info", "attention", "urgent"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              className={`flex-1 rounded-md border px-2 py-2 text-sm ${
                severity === s
                  ? s === "urgent"
                    ? "border-danger bg-danger-wash font-medium text-danger"
                    : "border-moss bg-moss-wash font-medium text-moss-deep"
                  : "border-line bg-surface text-ink-soft"
              }`}
            >
              {t.severities[s]}
            </button>
          ))}
        </div>
      </div>
      <label className="block text-xs text-ink-faint">
        {t.description}
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-0.5 w-full rounded-md border border-line bg-surface px-2 py-2 text-sm"
          maxLength={500}
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!description.trim()}
          onClick={() => onSave({ category, severity, description: description.trim() })}
          className="flex-1 rounded-md bg-moss-deep px-3 py-2 text-sm font-medium text-paper disabled:opacity-40"
        >
          {t.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-line px-3 py-2 text-sm text-ink-soft"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}

export function WalkFlow({
  visitId,
  initialWalkId,
  initialStatus,
  checkpoints: initial,
  focusCheckpointId,
}: {
  visitId: string;
  /** Existing walk to resume, or null — the client mints the id then. */
  initialWalkId: string | null;
  initialStatus: "in_progress" | "done" | null;
  checkpoints: WalkCheckpointState[];
  focusCheckpointId?: string;
}) {
  const [walkId] = useState(() => initialWalkId ?? crypto.randomUUID());
  const [status, setStatus] = useState(initialStatus ?? "in_progress");
  const [checkpoints, setCheckpoints] = useState(initial);
  const [findingFor, setFindingFor] = useState<string | null>(null);
  const [findingCount, setFindingCount] = useState(0);

  async function markOk(checkpointId: string) {
    setCheckpoints((all) =>
      all.map((c) => (c.id === checkpointId ? { ...c, condition: "ok" } : c))
    );
    setFindingFor(null);
    await sendOrQueue("/api/portal/walk", {
      op: "checkpoint",
      walkId,
      visitId,
      checkpointId,
      condition: "ok",
    });
  }

  async function saveFinding(
    checkpointId: string,
    data: { category: string; severity: "info" | "attention" | "urgent"; description: string }
  ) {
    setCheckpoints((all) =>
      all.map((c) => (c.id === checkpointId ? { ...c, condition: "issue" } : c))
    );
    setFindingFor(null);
    setFindingCount((n) => n + 1);
    await sendOrQueue("/api/portal/walk", {
      op: "checkpoint",
      walkId,
      visitId,
      checkpointId,
      condition: "issue",
      note: data.description,
    });
    await sendOrQueue("/api/portal/walk", {
      op: "finding",
      walkId,
      visitId,
      checkpointId,
      findingId: crypto.randomUUID(),
      category: data.category,
      severity: data.severity,
      description: data.description,
    });
  }

  async function finish() {
    setStatus("done");
    await sendOrQueue("/api/portal/walk", { op: "finish", walkId, visitId });
  }

  const done = checkpoints.filter((c) => c.condition !== null).length;
  const allChecked = done === checkpoints.length && checkpoints.length > 0;
  const anyIssue = checkpoints.some((c) => c.condition === "issue") || findingCount > 0;

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-ink-soft">{t.intro}</p>
      <p className="tnum text-xs text-ink-faint">
        {done} / {checkpoints.length}
      </p>

      <ul className="space-y-2">
        {checkpoints.map((c) => (
          <li
            key={c.id}
            className={`rounded-xl bg-surface p-3.5 shadow-card ${
              focusCheckpointId === c.id ? "ring-2 ring-moss" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-medium leading-snug">{c.label}</span>
              {c.condition === "ok" && (
                <span className="shrink-0 rounded-full bg-moss-wash px-2 py-0.5 text-xs font-medium text-moss-deep">
                  {t.verified} ✓
                </span>
              )}
              {c.condition === "issue" && (
                <span className="shrink-0 rounded-full bg-warn-wash px-2 py-0.5 text-xs font-medium text-warn">
                  {t.found}
                </span>
              )}
            </div>
            {status !== "done" && (
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => markOk(c.id)}
                  className={`flex-1 rounded-lg px-3 py-3 text-sm font-semibold ${
                    c.condition === "ok"
                      ? "bg-moss text-paper"
                      : "border border-line bg-surface text-ink"
                  }`}
                >
                  {t.ok}
                </button>
                <button
                  type="button"
                  onClick={() => setFindingFor(findingFor === c.id ? null : c.id)}
                  className="flex-1 rounded-lg border border-line bg-surface px-3 py-3 text-sm font-semibold text-ink"
                >
                  {t.found}
                </button>
              </div>
            )}
            {findingFor === c.id && status !== "done" && (
              <FindingForm
                onSave={(data) => void saveFinding(c.id, data)}
                onCancel={() => setFindingFor(null)}
              />
            )}
          </li>
        ))}
      </ul>

      {status !== "done" ? (
        <button
          type="button"
          onClick={finish}
          disabled={!allChecked}
          className="w-full rounded-xl bg-moss-deep px-4 py-4 text-lg font-semibold text-paper disabled:opacity-40"
        >
          {t.finish}
        </button>
      ) : (
        <p className="rounded-xl bg-moss-wash p-4 text-center text-base font-medium text-moss-deep">
          {t.finished} ✓{!anyIssue && <span className="block text-sm">{t.noDeficiencies}</span>}
        </p>
      )}
    </div>
  );
}
