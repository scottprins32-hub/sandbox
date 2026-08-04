import type { Metadata } from "next";
import { getCurrentOrg } from "@/server/org";
import { getOrgSettings } from "@/server/repo/settings";
import { FX, LABOUR, TARGETS } from "@/lib/constants";
import { reseedAction, updateSettingsAction } from "../actions";

export const metadata: Metadata = { title: "Settings · Scara" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const org = await getCurrentOrg();
  const settings = await getOrgSettings(org.id);
  const isDev = process.env.NODE_ENV !== "production";

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
          Printed in the header and signature blocks of the proces-verbal and the ofertă.
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
              Drives the TVA line on the ofertă. Off while under the 395,000 lei threshold.
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
    </div>
  );
}
