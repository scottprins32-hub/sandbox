import type { Metadata } from "next";
import { getCurrentOrg } from "@/server/org";
import { getOrgSettings } from "@/server/repo/settings";
import { FX, LABOUR, TARGETS } from "@/lib/constants";
import {
  reseedAction,
  updateCleanerNoticeAction,
  updateDataPolicyAction,
  updateSettingsAction,
} from "../actions";
import { listProspects } from "@/server/repo/prospects";
import { listCleaners } from "@/server/repo/cleaners";
import {
  INFORM_DEADLINE_DAYS,
  RETENTION_REVIEW_MONTHS,
} from "@/lib/prospecting/field-data";

export const metadata: Metadata = { title: "Settings · Scara" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const org = await getCurrentOrg();
  const settings = await getOrgSettings(org.id);
  const isDev = process.env.NODE_ENV !== "production";

  // Retention review (§3.4): surfaced, never auto-deleted.
  const retentionMonths = settings.retentionMonths ?? RETENTION_REVIEW_MONTHS;
  const cutoff = Date.now() - retentionMonths * 30 * 24 * 60 * 60 * 1000;
  const retentionReview = (await listProspects(org.id)).filter(
    (p) => p.status === "pierdut" && (p.lastTouchAt ?? p.updatedAt) < cutoff
  );

  const cleaners = await listCleaners(org.id);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>

      <form action={updateSettingsAction} className="space-y-3 rounded-xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">Org identity</h2>
        <label className="block text-sm">
          <span className="text-ink-soft">Company name (appears on the proces-verbal)</span>
          <input
            name="orgName"
            defaultValue={org.name}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">CUI</span>
          <input
            name="cui"
            defaultValue={org.cui}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">Contact line (printed on offers)</span>
          <input
            name="contactLine"
            defaultValue={settings.contactLine ?? ""}
            placeholder="0722 000 000 · contact@scara.ro"
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          />
        </label>

        <h2 className="pt-2 text-sm font-semibold">Document identity</h2>
        <p className="-mt-1 text-xs text-ink-faint">
          Printed in the header and signature blocks of the monthly protocol and the offer.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-ink-soft">Address</span>
            <input
              name="address"
              defaultValue={settings.address ?? ""}
              placeholder="Str. …, Giroc, jud. Timiș"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Nr. Reg. Com.</span>
            <input
              name="regCom"
              defaultValue={settings.regCom ?? ""}
              placeholder="J35/0000/2026"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Email</span>
            <input
              name="email"
              defaultValue={settings.email ?? ""}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Phone</span>
            <input
              name="phone"
              defaultValue={settings.phone ?? ""}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">IBAN (payment line on documents)</span>
            <input
              name="iban"
              defaultValue={settings.iban ?? ""}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Representative (signs as prestator)</span>
            <input
              name="representative"
              defaultValue={settings.representative ?? ""}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
        </div>
        <label className="flex items-center justify-between py-1 text-sm">
          <span className="text-ink-soft">
            Registered for VAT
            <span className="block text-xs text-ink-faint">
              Drives the VAT line on the offer. Off while under the 395,000 lei threshold.
            </span>
          </span>
          <input
            type="checkbox"
            name="vatRegistered"
            defaultChecked={settings.vatRegistered === true}
            className="h-5 w-5 shrink-0 accent-[#1F4A37]"
          />
        </label>

        <h2 className="pt-2 text-sm font-semibold">Constants overrides</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-ink-soft">RON per EUR</span>
            <input
              name="ronPerEur"
              type="number"
              step="0.0001"
              defaultValue={settings.ronPerEur ?? FX.RON_PER_EUR}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Part-time floor (lei)</span>
            <input
              name="partTimeFloorLei"
              type="number"
              step="0.25"
              defaultValue={(settings.partTimeFloorBani ?? LABOUR.PART_TIME_FLOOR_MONTHLY) / 100}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Platform fee, Scott (lei/month)</span>
            <input
              name="platformFeeLei"
              type="number"
              step="50"
              defaultValue={(settings.platformFeeBani ?? TARGETS.PLATFORM_FEE_MONTHLY_DEFAULT) / 100}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
        </div>
        <p className="text-xs leading-relaxed text-ink-faint">
          The platform fee is invoiced cross-border B2B by Scott&apos;s entity; under the micro
          regime it does not reduce her 1% revenue tax, it only moves cash. Accountant confirms.
          See DECISIONS.md.
        </p>

        <button className="rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper">
          Save settings
        </button>
      </form>

      {/* The named cleaner (add-on 2 §C3) */}
      <div className="rounded-xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">Îngrijitorul scării — notice board</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          A firm with 300 stairwells cannot put a name and a face on each one. You can.
          Publishing a cleaner&rsquo;s first name and photo on a public board is{" "}
          <strong>their decision, not yours</strong> — ask them, and leave the box unticked
          until they say yes. The intro is two sentences, written by them, in Romanian.
        </p>
        <div className="mt-3 space-y-3">
          {cleaners.map((c) => (
            <form
              key={c.id}
              action={updateCleanerNoticeAction.bind(null, c.id)}
              className="rounded-lg border border-line p-3"
            >
              <p className="text-sm font-medium">{c.name}</p>
              <label className="mt-2 block text-xs">
                <span className="text-ink-soft">Name on the notice</span>
                <input
                  name="displayName"
                  defaultValue={c.displayName ?? ""}
                  placeholder={c.name.trim().split(/\s+/)[0]}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                />
              </label>
              <label className="mt-2 block text-xs">
                <span className="text-ink-soft">Intro (Romanian, two sentences)</span>
                <textarea
                  name="introRo"
                  rows={2}
                  defaultValue={c.introRo ?? ""}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-[11px] text-ink-faint">
                  Don&rsquo;t name the days here — the sheet prints the real schedule
                  underneath, and a repeated one goes stale the first time a building
                  changes pattern.
                </span>
              </label>
              <label className="mt-2 flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  name="showOnNotice"
                  defaultChecked={c.showOnNotice}
                  className="mt-0.5"
                />
                <span className="text-ink-soft">
                  {c.name.trim().split(/\s+/)[0]} has agreed to appear on the notice board.
                </span>
              </label>
              <button className="mt-2 rounded-md border border-line px-3 py-1.5 text-xs">
                Save
              </button>
            </form>
          ))}
          {cleaners.length === 0 && (
            <p className="text-xs text-ink-faint">No cleaners yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">Access</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-faint">
          One shared passcode gates the app (SCARA_PASSCODE in the environment). Cleaners sign
          into the Portal with phone + 4-digit PIN. Real per-user auth is a later, deliberate
          step (docs/FRANCHISE_LATER.md).
        </p>
      </div>

      {isDev && (
        <form action={reseedAction} className="rounded-xl border border-dashed border-line-strong bg-surface p-4">
          <h2 className="text-sm font-semibold">Demo data</h2>
          <p className="mt-1 text-xs text-ink-faint">
            Wipes everything and reloads the seed world (dev only).
          </p>
          <button className="mt-2 rounded-md border border-danger px-3 py-1.5 text-sm text-danger">
            Reset demo data
          </button>
        </form>
      )}
    
      {/* Personal data (add-on 2 §3.4) */}
      <div className="mt-4 rounded-xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">Personal data</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          Field contacts come from entrance-hall notice boards, which Legea 196/2018
          art. 57 lit. m) requires associations to post. GDPR art. 14 gives you{" "}
          {INFORM_DEADLINE_DAYS} days to send an information notice; overdue ones appear
          on the Problems tab. Contacts marked do-not-contact are permanently excluded
          from every list and from this export.
        </p>
        <form action={updateDataPolicyAction} className="mt-3 space-y-3">
          <label className="block text-sm">
            <span className="text-ink-soft">Legitimate-interest note</span>
            <textarea
              name="legitimateInterestNote"
              rows={3}
              defaultValue={settings.legitimateInterestNote ?? ""}
              placeholder="De ce prelucrăm datele de contact ale administratorilor și pe ce temei."
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Retention period (months)</span>
            <input
              type="number"
              name="retentionMonths"
              defaultValue={settings.retentionMonths ?? RETENTION_REVIEW_MONTHS}
              className="tnum mt-1 w-28 rounded-md border border-line bg-surface px-3 py-2"
            />
          </label>
          <button className="rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper">
            Save data policy
          </button>
        </form>
        <div className="mt-3 border-t border-line pt-3">
          <a href="/api/contacts-export" className="text-sm text-moss underline">
            Export all stored contacts (CSV)
          </a>
          {retentionReview.length > 0 && (
            <p className="mt-2 text-xs text-warn">
              {retentionReview.length} lost prospects have had no contact for{" "}
              {settings.retentionMonths ?? RETENTION_REVIEW_MONTHS} months. Review them —
              nothing is deleted automatically.
            </p>
          )}
        </div>
      </div>
</div>
  );
}
