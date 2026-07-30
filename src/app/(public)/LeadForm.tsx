"use client";

// Lead form (§9): nume, telefon, localitate, tip clădire, mesaj. Honeypot
// field, no captcha, no dark patterns.

import { useState } from "react";

export function LeadForm() {
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("busy");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nume: form.get("nume"),
          telefon: form.get("telefon"),
          localitate: form.get("localitate"),
          tip: form.get("tip"),
          mesaj: form.get("mesaj"),
          website: form.get("website"),
        }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-2xl bg-moss-wash px-6 py-10 text-center">
        <p className="font-display text-2xl text-moss-deep">Mulțumim. Revenim azi.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {/* Honeypot: invisible to humans, irresistible to bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <label className="block text-sm">
        <span className="font-medium text-ink">Nume</span>
        <input
          name="nume"
          required
          autoComplete="name"
          className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-4 py-3 text-base outline-none focus:border-moss"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-ink">Telefon</span>
        <input
          name="telefon"
          type="tel"
          required
          autoComplete="tel"
          className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-4 py-3 text-base outline-none focus:border-moss"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-ink">Localitate</span>
        <input
          name="localitate"
          placeholder="Giroc, Timișoara…"
          className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-4 py-3 text-base outline-none focus:border-moss"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-ink">Tip clădire</span>
        <select
          name="tip"
          defaultValue="bloc"
          className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-4 py-3 text-base outline-none focus:border-moss"
        >
          <option value="bloc">Bloc</option>
          <option value="asociatie">Asociație de proprietari</option>
          <option value="birou">Birou</option>
          <option value="altele">Altele</option>
        </select>
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="font-medium text-ink">Mesaj</span>
        <textarea
          name="mesaj"
          rows={3}
          placeholder="Câte etaje are clădirea? De câte ori pe săptămână ați vrea curățenie?"
          className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-4 py-3 text-base outline-none focus:border-moss"
        />
      </label>
      {state === "error" && (
        <p className="text-sm text-danger sm:col-span-2">
          Nu a mers. Mai încearcă o dată, te rugăm.
        </p>
      )}
      <div className="sm:col-span-2">
        <button
          disabled={state === "busy"}
          className="w-full rounded-lg bg-moss-deep px-6 py-4 text-base font-semibold text-paper disabled:opacity-60 sm:w-auto"
        >
          {state === "busy" ? "Se trimite…" : "Cere ofertă"}
        </button>
      </div>
    </form>
  );
}
