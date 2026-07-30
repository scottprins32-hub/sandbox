import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ops — Scara" };

// Placeholder until Phase 2 builds the Today screen (§7.2).
export default function OpsPage() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-xl font-semibold">Ops</h1>
      <p className="mt-2 text-sm text-ink-soft">
        The daily operating system arrives in Phase 2: routes, visits, photos, protocols,
        payroll.
      </p>
    </div>
  );
}
