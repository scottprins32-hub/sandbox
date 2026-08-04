import type { Metadata } from "next";
import { getCurrentOrg } from "@/server/org";
import { listBuildings } from "@/server/repo/buildings";
import { listActiveCleaners } from "@/server/repo/cleaners";
import { todayYmd } from "@/lib/dates";
import { createVisitAction } from "../../actions";

export const metadata: Metadata = { title: "Book a job · Scara" };
export const dynamic = "force-dynamic";

// Books turnover / one-off jobs with a per-job price (§7: Airbnb turnover
// cleans are a locked service line), or an extra recurring visit.
export default async function NewVisitPage() {
  const org = await getCurrentOrg();
  const [buildings, cleaners] = await Promise.all([
    listBuildings(org.id, { status: "active" }),
    listActiveCleaners(org.id),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-lg font-semibold tracking-tight">Book a job</h1>
      <form action={createVisitAction} className="mt-4 space-y-3 rounded-xl bg-surface p-4 shadow-card">
        <label className="block text-sm">
          <span className="text-ink-soft">Type</span>
          <select
            name="type"
            defaultValue="turnover"
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          >
            <option value="turnover">Airbnb turnover</option>
            <option value="oneoff">One-off clean</option>
            <option value="recurring">Extra recurring visit</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink-soft">Building (for recurring / on-site one-offs)</span>
          <select
            name="buildingId"
            defaultValue=""
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          >
            <option value="">Not a contracted building</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink-soft">Location label (for turnovers)</span>
          <input
            name="locationLabel"
            placeholder="Ap. 2 camere, str. …, Timișoara"
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-ink-soft">Date</span>
            <input
              type="date"
              name="date"
              defaultValue={todayYmd()}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Window</span>
            <select
              name="window"
              defaultValue="am"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            >
              <option value="am">morning</option>
              <option value="pm">afternoon</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Price (lei, per job)</span>
            <input
              type="number"
              name="priceLei"
              defaultValue={150}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Bonus (lei, optional)</span>
            <input
              type="number"
              name="bonusLei"
              defaultValue={0}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-ink-soft">Cleaner</span>
          <select
            name="cleanerId"
            defaultValue=""
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          >
            <option value="">Leave open (assign later or offer to the team)</option>
            {cleaners.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="openOffer" className="h-4 w-4 accent-[#1F4A37]" />
          <span className="text-ink-soft">
            Open offer: let cleaners claim it in the Portal (you confirm the claim)
          </span>
        </label>

        <label className="block text-sm">
          <span className="text-ink-soft">Notes</span>
          <textarea
            name="notes"
            rows={2}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          />
        </label>

        <button className="rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper">
          Book job
        </button>
      </form>
    </div>
  );
}
