"use client";

export default function PortalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-24 text-center">
      <p className="text-sm text-ink-soft">Ceva n-a mers. Mai încearcă o dată.</p>
      <button
        onClick={reset}
        className="mt-4 rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink-soft"
      >
        Reîncearcă
      </button>
    </div>
  );
}
