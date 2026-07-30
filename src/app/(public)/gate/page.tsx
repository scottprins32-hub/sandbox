"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { en } from "@/lib/i18n/en";

function GateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setBusy(false);
    if (res.ok) {
      router.replace(params.get("next") || "/sim");
    } else {
      setWrong(true);
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-3">
      <input
        type="password"
        inputMode="text"
        autoFocus
        value={passcode}
        onChange={(e) => {
          setPasscode(e.target.value);
          setWrong(false);
        }}
        placeholder={en.gate.prompt}
        aria-label={en.gate.prompt}
        className="rounded-lg border border-line bg-surface px-4 py-3 text-base outline-none focus:border-moss"
      />
      {wrong && <p className="text-sm text-danger">{en.gate.wrong}</p>}
      <button
        type="submit"
        disabled={busy || passcode.length === 0}
        className="rounded-lg bg-moss-deep px-4 py-3 font-medium text-paper disabled:opacity-50"
      >
        {en.gate.submit}
      </button>
    </form>
  );
}

export default function GatePage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{en.gate.title}</h1>
      </div>
      <Suspense>
        <GateForm />
      </Suspense>
    </main>
  );
}
