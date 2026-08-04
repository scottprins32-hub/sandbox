"use client";

// Pending state only. This is a client component, but unlike a hook such as
// useSearchParams it does not opt the form out of server rendering: the button
// is in the initial HTML and submits fine before (or without) hydration.
// Silence is the enemy here — "nothing happened" was the original complaint.

import { useFormStatus } from "react-dom";
import { en } from "@/lib/i18n/en";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-moss-deep px-4 py-3 font-medium text-paper disabled:opacity-60"
    >
      {pending ? `${en.gate.submit}…` : en.gate.submit}
    </button>
  );
}
