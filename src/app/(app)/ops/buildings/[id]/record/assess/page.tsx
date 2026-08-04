import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentOrg } from "@/server/org";
import { getBuilding } from "@/server/repo/buildings";
import { listElements } from "@/server/repo/record";
import { SCORE_SCALE } from "@/lib/compliance/elements";
import { assessElementAction } from "../../../../actions";

// Annual assessment mode (add-on §6): a guided walkthrough, one element per
// step, requiring a score, a note and a photo. Designed for one focused visit.

export const metadata: Metadata = { title: "Annual assessment · Scara" };
export const dynamic = "force-dynamic";

export default async function AnnualAssess({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { id } = await params;
  const { e } = await searchParams;
  const org = await getCurrentOrg();
  const building = await getBuilding(org.id, id);
  if (!building) notFound();

  const elements = (await listElements(org.id, id)).sort((a, b) =>
    a.createdAt === b.createdAt ? a.key.localeCompare(b.key) : a.createdAt - b.createdAt
  );
  if (elements.length === 0) redirect(`/ops/buildings/${id}/record`);

  const step = Math.min(Math.max(0, Number(e ?? 0) || 0), elements.length - 1);
  const element = elements[step]!;
  const isLast = step === elements.length - 1;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <Link href={`/ops/buildings/${id}/record`} className="text-xs text-ink-faint">
          ← Building record
        </Link>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-lg font-semibold tracking-tight">Annual assessment</h1>
          <span className="tnum text-sm text-ink-soft">
            {step + 1} / {elements.length}
          </span>
        </div>
        <p className="text-sm text-ink-soft">{building.label}</p>
      </div>

      <div className="rounded-xl bg-surface p-4 shadow-card">
        <h2 className="text-base font-semibold">{element.nameRo}</h2>
        <form
          action={assessElementAction.bind(null, id, element.id)}
          className="mt-3 space-y-3"
        >
          <input type="hidden" name="nextStep" value={isLast ? "" : String(step + 1)} />
          <fieldset>
            <legend className="text-xs text-ink-faint">Score (1 excelent … 6 foarte slab)</legend>
            <div className="mt-1.5 space-y-1.5">
              {SCORE_SCALE.map((s) => (
                <label
                  key={s.score}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line px-3 py-2 text-sm has-[:checked]:border-moss has-[:checked]:bg-moss-wash"
                >
                  <input
                    type="radio"
                    name="score"
                    value={s.score}
                    required
                    className="mt-0.5 accent-[#1F4A37]"
                  />
                  <span>
                    <span className="tnum font-medium">
                      {s.score} · {s.labelRo}
                    </span>
                    <span className="block text-xs text-ink-faint">{s.definitionRo}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-xs">
            <span className="text-ink-faint">Note (required, Romanian — lands on the report)</span>
            <textarea
              name="note"
              rows={2}
              required
              className="mt-0.5 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="text-ink-faint">Photo (at least one)</span>
            <input
              type="file"
              name="photo"
              accept="image/jpeg"
              required
              className="mt-0.5 block text-xs"
            />
          </label>
          <button className="w-full rounded-xl bg-moss-deep px-4 py-3 text-base font-semibold text-paper">
            {isLast ? "Save and finish" : "Save and next element"}
          </button>
        </form>
      </div>
    </div>
  );
}
