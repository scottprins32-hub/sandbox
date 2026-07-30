"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type RoleOption = { value: string; label: string };

export function RoleSwitcher({
  current,
  options,
}: {
  current: string;
  options: RoleOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function change(value: string) {
    await fetch("/api/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: value }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <select
      value={current}
      onChange={(e) => change(e.target.value)}
      disabled={pending}
      aria-label="Acting as"
      className="max-w-40 truncate rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink-soft outline-none focus:border-moss"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
