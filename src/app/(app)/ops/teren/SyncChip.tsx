"use client";

// Field sync indicator. The founders need to know a capture is still in the
// queue before they walk out of range for the day.

import { useEffect, useState } from "react";
import { pendingCount, startFieldSync, subscribe } from "@/lib/fieldQueue";

export function FieldSyncChip() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    startFieldSync();
    const read = () => void pendingCount().then(setPending);
    read();
    const off = subscribe(read);
    const timer = window.setInterval(read, 3000);
    return () => {
      off();
      window.clearInterval(timer);
    };
  }, []);

  if (pending === 0) return null;
  return (
    <span className="rounded-full bg-warn-wash px-2.5 py-1 text-xs font-medium text-warn">
      se sincronizează… {pending}
    </span>
  );
}
