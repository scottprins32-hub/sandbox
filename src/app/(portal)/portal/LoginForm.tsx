"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ro } from "@/lib/i18n/ro";

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/portal/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, pin }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setWrong(true);
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-3">
      <h1 className="text-xl font-semibold tracking-tight">{ro.portal.login.title}</h1>
      <label className="block text-sm">
        <span className="text-ink-soft">{ro.portal.login.phone}</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setWrong(false);
          }}
          className="mt-1 w-full rounded-lg border border-line bg-surface px-4 py-3 text-base outline-none focus:border-moss"
        />
      </label>
      <label className="block text-sm">
        <span className="text-ink-soft">{ro.portal.login.pin}</span>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setWrong(false);
          }}
          className="mt-1 w-full rounded-lg border border-line bg-surface px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-moss"
        />
      </label>
      {wrong && <p className="text-sm text-danger">{ro.portal.login.wrong}</p>}
      <button
        disabled={busy || phone.length < 6 || pin.length !== 4}
        className="w-full rounded-lg bg-moss-deep px-4 py-3.5 text-base font-medium text-paper disabled:opacity-50"
      >
        {ro.portal.login.submit}
      </button>
    </form>
  );
}
