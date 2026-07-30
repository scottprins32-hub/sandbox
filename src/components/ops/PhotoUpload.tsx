"use client";

// Photo capture + client-side compression (§3): canvas, max 1600px long edge,
// JPEG q0.8 — cleaners are on mobile data.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.8)
  );
}

export function PhotoUpload({
  visitId,
  label = "Add photo",
  kind = "after",
}: {
  visitId: string;
  label?: string;
  kind?: "before" | "after" | "issue";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await compressImage(file);
      const form = new FormData();
      form.set("visitId", visitId);
      form.set("kind", kind);
      form.set("file", blob, "photo.jpg");
      const res = await fetch("/api/photos", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft hover:border-moss disabled:opacity-50"
      >
        {busy ? "Uploading…" : label}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
