import type { Metadata } from "next";

export const metadata: Metadata = { title: "Portal · Scara" };

// Placeholder until Phase 3 builds the cleaner portal (§8, Romanian).
export default function PortalPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-xl font-semibold">Portal</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Portalul pentru echipă apare în Faza 3: Ziua mea, joburi libere, orele mele.
      </p>
    </main>
  );
}
