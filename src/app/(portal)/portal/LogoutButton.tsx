"use client";

import { useRouter } from "next/navigation";
import { ro } from "@/lib/i18n/ro";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-xs text-ink-faint underline underline-offset-2"
      onClick={async () => {
        await fetch("/api/portal/logout", { method: "POST" });
        router.refresh();
      }}
    >
      {ro.portal.nav.logout}
    </button>
  );
}
