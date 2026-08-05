"use client";

// Pending state only, so the form stays server-rendered and submits before (or
// entirely without) hydration — a resident standing in a stairwell is on the
// worst connection in the building.

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-moss-deep px-5 py-3 font-semibold text-paper disabled:opacity-60"
    >
      {pending ? "Se trimite…" : "Trimite sesizarea"}
    </button>
  );
}
