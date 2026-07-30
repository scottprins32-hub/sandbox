"use client";

import { useEffect, useState } from "react";
import { ro } from "@/lib/i18n/ro";
import { pendingCount, startSyncLoop, subscribe } from "@/lib/offlineQueue";

// "se sincronizează…" chip (§8): visible whenever offline mutations are queued.
export function SyncChip() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    startSyncLoop();
    setPending(pendingCount());
    return subscribe(() => setPending(pendingCount()));
  }, []);

  if (pending === 0) return null;
  return (
    <span className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-warn-wash px-3 py-1.5 text-xs font-medium text-warn shadow-card">
      {ro.portal.today.syncing} ({pending})
    </span>
  );
}
