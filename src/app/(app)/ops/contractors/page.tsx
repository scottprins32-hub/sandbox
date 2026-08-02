import type { Metadata } from "next";
import { getCurrentOrg } from "@/server/org";
import { listContractors, listComplianceEvents, listBuildingObligations } from "@/server/repo/compliance";
import { CATEGORY_LABEL_RO, type ObligationCategory } from "@/lib/compliance";
import { createContractorAction } from "../actions";

export const metadata: Metadata = { title: "Furnizori · Scara" };
export const dynamic = "force-dynamic";

const TRADES = Object.keys(CATEGORY_LABEL_RO) as ObligationCategory[];

export default async function ContractorsPage() {
  const org = await getCurrentOrg();
  const contractors = await listContractors(org.id);
  const obligations = await listBuildingObligations(org.id);
  const events = await listComplianceEvents(
    org.id,
    obligations.map((o) => o.id)
  );

  const byTrade = new Map<string, typeof contractors>();
  for (const c of contractors) {
    if (!byTrade.has(c.trade)) byTrade.set(c.trade, []);
    byTrade.get(c.trade)!.push(c);
  }

  const stats = (contractorId: string) => {
    const mine = events.filter((e) => e.contractorId === contractorId);
    const done = mine.filter((e) => e.kind === "done");
    const last = mine.map((e) => e.occurredAt).sort().at(-1);
    return { completed: done.length, last };
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-lg font-semibold tracking-tight">Furnizori</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Firmele autorizate care execută ce noi nu avem voie să executăm: DDD, verificări de
        gaze, ISCIR, PSI. Ținem evidența autorizării lor pentru că este apărarea asociației.
      </p>

      {contractors.length === 0 ? (
        <div className="mt-4 rounded-xl bg-surface p-6 text-center shadow-card">
          <p className="text-sm text-ink-soft">
            Niciun furnizor înregistrat. Adaugă-i pe cei cu care lucrezi deja.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {[...byTrade.entries()].map(([trade, list]) => (
            <section key={trade}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {CATEGORY_LABEL_RO[trade as ObligationCategory] ?? trade}
              </h2>
              <ul className="mt-1.5 space-y-2">
                {list.map((c) => {
                  const s = stats(c.id);
                  return (
                    <li key={c.id} className="rounded-xl bg-surface p-4 shadow-card">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-ink-faint">
                            {[c.phone, c.email].filter(Boolean).join(" · ") || "fără contact"}
                          </p>
                        </div>
                        <span className="tnum shrink-0 text-xs text-ink-soft">
                          {s.completed} lucrări{s.last ? ` · ultima ${s.last}` : ""}
                        </span>
                      </div>
                      {c.authorisationNote ? (
                        <p className="mt-1.5 text-xs text-moss-deep">
                          Autorizare: {c.authorisationNote}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-warn">
                          Fără autorizare consemnată. Cere numărul de atestat înainte de
                          următoarea lucrare.
                        </p>
                      )}
                      {c.notes && (
                        <p className="mt-1 text-xs text-ink-soft">{c.notes}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <details className="mt-4 rounded-xl bg-surface p-4 shadow-card">
        <summary className="cursor-pointer text-sm font-semibold">Adaugă furnizor</summary>
        <form action={createContractorAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-ink-soft">Nume</span>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Domeniu</span>
            <select
              name="trade"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            >
              {TRADES.map((t) => (
                <option key={t} value={t}>
                  {CATEGORY_LABEL_RO[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Telefon</span>
            <input
              name="phone"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Email</span>
            <input
              name="email"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-ink-soft">Autorizare (ex. DSP + DSVSA, nr. ...)</span>
            <input
              name="authorisationNote"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper">
              Adaugă
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
