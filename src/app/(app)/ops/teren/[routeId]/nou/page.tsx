import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentOrg } from "@/server/org";
import { getRoute } from "@/server/repo/prospecting";
import { STREETS_REFERENCE } from "@/lib/prospecting/field-data";
import { CaptureForm } from "../../CaptureForm";

export const metadata: Metadata = { title: "Clădire nouă · Scara" };
export const dynamic = "force-dynamic";

export default async function NewCapture({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;
  const org = await getCurrentOrg();
  const route = await getRoute(org.id, routeId);
  if (!route) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/ops/teren/${routeId}`} className="text-xs text-ink-faint">
        ← {route.name}
      </Link>
      <h1 className="mt-1 text-lg font-semibold tracking-tight">Clădire nouă</h1>
      <div className="mt-4">
        <CaptureForm
          defaults={{ routeId }}
          streets={STREETS_REFERENCE.map((s) => s.name)}
        />
      </div>
    </div>
  );
}
