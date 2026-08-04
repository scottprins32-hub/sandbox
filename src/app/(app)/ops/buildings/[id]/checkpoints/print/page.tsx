import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getCurrentOrg } from "@/server/org";
import { getBuilding } from "@/server/repo/buildings";
import { listCheckpoints } from "@/server/repo/walks";

// The A4 QR sheet (add-on §5): one labelled code per checkpoint, printed,
// laminated, stuck up. QR over NFC on purpose — zero hardware, reprintable.

export const metadata: Metadata = { title: "Checkpoint QR codes · Scara" };
export const dynamic = "force-dynamic";

export default async function CheckpointPrintSheet({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getCurrentOrg();
  const building = await getBuilding(org.id, id);
  if (!building) notFound();
  const checkpoints = await listCheckpoints(org.id, id);

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const base = `${proto}://${host}`;

  const cards = await Promise.all(
    checkpoints.map(async (c) => ({
      checkpoint: c,
      svg: await QRCode.toString(`${base}/portal/tur?c=${encodeURIComponent(c.code)}`, {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
        color: { dark: "#1E1B15", light: "#FFFFFF" },
      }),
    }))
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <h1 className="text-lg font-semibold tracking-tight">
          Checkpoint QR sheet · {building.label}
        </h1>
        <span className="text-sm text-ink-soft">
          Print on A4, laminate, stick each code at its point.
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 print:mt-0">
        {cards.map(({ checkpoint, svg }) => (
          <div
            key={checkpoint.id}
            className="break-inside-avoid rounded-xl border border-line-strong bg-white p-5 text-center"
          >
            <p className="micro">Scara · Tur de control</p>
            <div
              className="mx-auto mt-3 w-40 [&_svg]:h-40 [&_svg]:w-40"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <p className="mt-3 text-base font-semibold leading-snug">
              {checkpoint.labelRo}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {building.label} · Scanează codul la fiecare tur de control.
            </p>
          </div>
        ))}
      </div>

      {checkpoints.length === 0 && (
        <p className="mt-6 text-sm text-ink-soft">
          No checkpoints yet. Load them from the building page first.
        </p>
      )}
    </div>
  );
}
