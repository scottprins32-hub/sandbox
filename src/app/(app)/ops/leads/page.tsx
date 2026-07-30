import type { Metadata } from "next";
import { getCurrentOrg } from "@/server/org";
import { listLeads } from "@/server/repo/leads";
import { fmtDateTime } from "@/lib/dates";
import { StatusChip } from "@/components/ops/StatusChip";
import { setLeadStatusAction } from "../actions";

export const metadata: Metadata = { title: "Leads · Scara" };
export const dynamic = "force-dynamic";

const NEXT_STATUSES: Record<string, ("contacted" | "won" | "lost")[]> = {
  new: ["contacted", "won", "lost"],
  contacted: ["won", "lost"],
  won: [],
  lost: ["contacted"],
};

// §7.2 leads inbox: the public page's form submissions land here.
export default async function LeadsPage() {
  const org = await getCurrentOrg();
  const leads = await listLeads(org.id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-lg font-semibold tracking-tight">Leads</h1>
      {leads.length === 0 ? (
        <div className="mt-4 rounded-xl bg-surface p-6 text-center shadow-card">
          <p className="text-sm text-ink-soft">
            No leads yet. They arrive here from the public page&apos;s form.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded-xl bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-xs text-ink-faint">
                    {lead.phone}
                    {lead.locality ? ` · ${lead.locality}` : ""}
                    {lead.buildingType ? ` · ${lead.buildingType}` : ""} ·{" "}
                    {fmtDateTime(lead.createdAt)}
                  </p>
                </div>
                <StatusChip status={lead.status} />
              </div>
              {lead.message && (
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{lead.message}</p>
              )}
              {NEXT_STATUSES[lead.status]!.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {NEXT_STATUSES[lead.status]!.map((s) => (
                    <form key={s} action={setLeadStatusAction.bind(null, lead.id, s)}>
                      <button className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft hover:border-moss">
                        Mark {s}
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
