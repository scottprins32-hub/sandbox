const STYLES: Record<string, string> = {
  scheduled: "bg-paper text-ink-soft border border-line",
  claimed: "bg-warn-wash text-warn",
  in_progress: "bg-moss-wash text-moss-deep",
  done: "bg-moss-wash text-moss-deep",
  missed: "bg-danger-wash text-danger",
  open: "bg-danger-wash text-danger",
  new: "bg-moss-wash text-moss-deep",
  contacted: "bg-warn-wash text-warn",
  won: "bg-moss-wash text-moss-deep",
  lost: "bg-paper text-ink-faint border border-line",
  spotted: "bg-paper text-ink-soft border border-line",
  quoted: "bg-warn-wash text-warn",
};

const LABELS: Record<string, string> = {
  scheduled: "scheduled",
  claimed: "claimed, confirm",
  in_progress: "in progress",
  done: "done",
  missed: "missed",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? "bg-paper text-ink-soft"}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
