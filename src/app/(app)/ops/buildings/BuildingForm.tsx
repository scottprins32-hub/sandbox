// Shared create/edit form for buildings (server-action driven, no client JS).

import type { Building } from "@/server/repo/buildings";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-ink-soft">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-moss"
      />
    </label>
  );
}

export function BuildingForm({
  action,
  building,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  building?: Building;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label="Label" name="label" defaultValue={building?.label} />
      <Field label="Address" name="address" defaultValue={building?.address} />
      <Field
        label="Locality"
        name="locality"
        defaultValue={building?.locality ?? "Giroc, Timiș"}
      />
      <Field
        label="Price (lei/month)"
        name="priceLei"
        type="number"
        step="1"
        defaultValue={building ? building.priceBani / 100 : 3566}
      />
      <Field label="Floors" name="floors" type="number" defaultValue={building?.floors ?? 3} />
      <Field
        label="Apartments"
        name="apartments"
        type="number"
        defaultValue={building?.apartments ?? 11}
      />
      <Field
        label="Residents"
        name="residents"
        type="number"
        defaultValue={building?.residents ?? 24}
      />
      <Field
        label="Visits per week"
        name="visitsPerWeek"
        type="number"
        defaultValue={building?.visitsPerWeek ?? 2}
      />
      <Field
        label="Hours per visit"
        name="hoursPerVisit"
        type="number"
        step="0.25"
        defaultValue={building?.hoursPerVisit ?? 1.5}
      />
      <label className="block text-sm">
        <span className="text-ink-soft">Status</span>
        <select
          name="status"
          defaultValue={building?.status ?? "active"}
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
        >
          <option value="active">active</option>
          <option value="paused">paused</option>
          <option value="prospect">prospect</option>
        </select>
      </label>
      {/* Compliance flags: these decide which legal obligations apply. */}
      <fieldset className="sm:col-span-2">
        <legend className="text-sm text-ink-soft">The building has</legend>
        <div className="mt-1.5 flex flex-wrap gap-4">
          {[
            { name: "hasGas", label: "gas", on: building?.hasGas },
            { name: "hasLift", label: "a lift", on: building?.hasLift },
            { name: "hasBasement", label: "a basement", on: building?.hasBasement },
            { name: "hasPlayground", label: "a playground", on: building?.hasPlayground },
          ].map((f) => (
            <label key={f.name} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={f.name}
                defaultChecked={f.on ?? false}
                className="h-4 w-4 accent-[#2c523c]"
              />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          These decide which legal obligations apply to the building.
        </p>
      </fieldset>

      <label className="block text-sm sm:col-span-2">
        <span className="text-ink-soft">Notes</span>
        <textarea
          name="notes"
          defaultValue={building?.notes ?? ""}
          rows={2}
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-moss"
        />
      </label>
      <div className="sm:col-span-2">
        <button className="rounded-md bg-moss-deep px-4 py-2 text-sm font-medium text-paper">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
