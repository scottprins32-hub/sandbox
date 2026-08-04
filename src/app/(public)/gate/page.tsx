// The passcode gate. Deliberately a plain server-rendered form posting to a
// server action: the input must exist in the initial HTML and must work with
// no JavaScript at all. The previous version read useSearchParams() inside a
// Suspense boundary, which made the whole form client-only — on a slow phone
// the page showed a heading and nothing to type into.

import type { Metadata } from "next";
import { en } from "@/lib/i18n/en";
import { submitPasscodeAction } from "./actions";

export const metadata: Metadata = { title: "Scara" };

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; wrong?: string }>;
}) {
  const { next, wrong } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{en.gate.title}</h1>
      </div>
      <form action={submitPasscodeAction} className="flex w-full max-w-xs flex-col gap-3">
        <input type="hidden" name="next" value={next ?? "/sim"} />
        <input
          type="password"
          name="passcode"
          inputMode="text"
          autoFocus
          required
          autoComplete="current-password"
          placeholder={en.gate.prompt}
          aria-label={en.gate.prompt}
          aria-invalid={wrong ? true : undefined}
          className="rounded-lg border border-line bg-surface px-4 py-3 text-base outline-none focus:border-moss"
        />
        {wrong && <p className="text-sm text-danger">{en.gate.wrong}</p>}
        <button
          type="submit"
          className="rounded-lg bg-moss-deep px-4 py-3 font-medium text-paper"
        >
          {en.gate.submit}
        </button>
      </form>
    </main>
  );
}
