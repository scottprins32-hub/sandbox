import type { Metadata } from "next";
import { getCurrentOrg } from "@/server/org";
import { listOffers } from "@/server/repo/offers";
import { getProspect } from "@/server/repo/prospects";
import { getStorage } from "@/server/storage";
import { fmtLeiRound } from "@/lib/money";
import { generateOfferAction } from "../actions";
import { OfferBuilder, type OfferPrefill } from "./OfferBuilder";

export const metadata: Metadata = { title: "Offers · Scara" };
export const dynamic = "force-dynamic";

// The sales screen: build a priced ofertă for a specific building, generate the
// Romanian PDF, and keep a record of what was quoted.
export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ prospect?: string }>;
}) {
  const { prospect: prospectId } = await searchParams;
  const org = await getCurrentOrg();
  const offers = await listOffers(org.id);
  const storage = getStorage();

  let prefill: OfferPrefill = {};
  if (prospectId) {
    const p = await getProspect(org.id, prospectId);
    if (p) {
      prefill = {
        prospectId: p.id,
        clientName: p.contact ? `${p.commune} — ${p.contact}` : "Asociația de proprietari",
        buildingLabel: p.label,
        address: p.commune,
        floors: p.floors ?? 3,
        apartments: p.apartmentsEst ?? 11,
        quotedPriceBani: p.quotedPriceBani ?? undefined,
      };
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Offers</h1>
        <a
          href="/ops/offers/sample"
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft hover:border-moss"
        >
          Sample proces-verbal (proof pack)
        </a>
      </div>
      <p className="-mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Build a priced offer for one building. The panel on the right prices it against your
        real cost and the market rate while you type, so nothing goes out below cost or
        indefensibly above market. Hand the sample proces-verbal over with it: that document
        is the promise this company sells.
      </p>

      {prefill.prospectId && (
        <p className="rounded-lg bg-moss-wash px-4 py-2.5 text-sm text-moss-deep">
          Prefilled from the Atlas prospect <strong>{prefill.buildingLabel}</strong>. Generating
          the offer moves it to <strong>quoted</strong>.
        </p>
      )}

      <OfferBuilder action={generateOfferAction} prefill={prefill} />

      <section>
        <h2 className="text-sm font-semibold">Offers sent</h2>
        {offers.length === 0 ? (
          <div className="mt-2 rounded-xl bg-surface p-6 text-center shadow-card">
            <p className="text-sm text-ink-soft">
              Nothing quoted yet. Every offer you generate is recorded here, so you always know
              what you promised and at what price.
            </p>
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {offers.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-4 shadow-card"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.buildingLabel}</p>
                  <p className="tnum text-xs text-ink-faint">
                    {o.clientName} · {o.floors} floors · {o.visitsPerWeek}×/week · valid to{" "}
                    {o.validUntil}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="tnum font-semibold">{fmtLeiRound(o.priceBani)} lei</span>
                  <a
                    href={storage.url(o.pdfFileKey)}
                    className="rounded-md border border-line px-3 py-1.5 text-sm text-moss"
                  >
                    PDF
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
