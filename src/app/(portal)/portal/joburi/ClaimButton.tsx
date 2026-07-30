"use client";

import { useState } from "react";
import { ro } from "@/lib/i18n/ro";

export function ClaimButton({ visitId }: { visitId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "claimed" | "taken">("idle");

  async function claim() {
    setState("busy");
    const res = await fetch("/api/portal/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitId }),
    });
    if (res.ok) setState("claimed");
    else if (res.status === 409) setState("taken");
    else setState("idle");
  }

  if (state === "claimed")
    return (
      <p className="rounded-lg bg-warn-wash px-3 py-2 text-center text-sm font-medium text-warn">
        {ro.portal.jobs.claimed}
      </p>
    );
  if (state === "taken")
    return <p className="text-sm text-ink-faint">L-a luat altcineva între timp.</p>;
  return (
    <button
      onClick={claim}
      disabled={state === "busy"}
      className="w-full rounded-lg bg-moss-deep px-4 py-3 text-base font-semibold text-paper disabled:opacity-50"
    >
      {ro.portal.jobs.claim}
    </button>
  );
}
