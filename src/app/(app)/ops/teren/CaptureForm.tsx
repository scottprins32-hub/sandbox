"use client";

// The field capture form (add-on 2 §3.3). Ninety seconds per building, one
// thumb, standing in a stairwell, possibly with no signal.
//
// Everything queues to IndexedDB first and syncs when the signal returns, so
// the save always succeeds from the user's point of view. The id is minted
// here, so a replay updates the same building.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ACCESS_LABEL_RO,
  AVIZIER_PHOTO_WARNING,
  CONTACT_ROLE_LABEL_RO,
  INCUMBENT_LABEL_RO,
  MONTHS_RO,
  OWNERSHIP_LABEL_RO,
  PHOTO_KIND_LABEL_RO,
  type Access,
  type ContactRole,
  type Incumbent,
  type Ownership,
  type PhotoKind,
} from "@/lib/prospecting/field-data";
import { sendJson, sendUpload, startFieldSync } from "@/lib/fieldQueue";
import { FieldSyncChip } from "./SyncChip";

export interface CaptureDefaults {
  id?: string;
  routeId: string;
  label?: string;
  street?: string;
  number?: string;
  floors?: number | null;
  entrances?: number | null;
  apartmentsEst?: number | null;
  ownership?: Ownership;
  access?: Access;
  incumbent?: Incumbent;
  incumbentName?: string | null;
  assemblyMonth?: number | null;
  notes?: string | null;
}

const PHOTO_KINDS: PhotoKind[] = ["avizier", "pubele", "intrare", "scara"];

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <p className="text-xs text-ink-faint">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-12 w-12 rounded-lg border border-line bg-surface text-xl"
          aria-label={`Scade ${label}`}
        >
          −
        </button>
        <span className="tnum w-10 text-center text-lg font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-12 w-12 rounded-lg border border-line bg-surface text-xl"
          aria-label={`Crește ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs text-ink-faint">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-3 py-2.5 text-sm ${
              o.value === value
                ? "bg-moss-deep font-medium text-paper"
                : "border border-line bg-surface text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ContactRow {
  id: string;
  role: ContactRole;
  name: string;
  phone: string;
}

export function CaptureForm({
  defaults,
  streets,
}: {
  defaults: CaptureDefaults;
  streets: string[];
}) {
  const router = useRouter();
  const [id, setId] = useState(() => defaults.id ?? crypto.randomUUID());
  const [saved, setSaved] = useState(false);
  const isNew = !defaults.id;

  const [street, setStreet] = useState(defaults.street ?? "");
  const [number, setNumber] = useState(defaults.number ?? "");
  const [floors, setFloors] = useState(defaults.floors ?? 3);
  const [entrances, setEntrances] = useState(defaults.entrances ?? 1);
  const [apartments, setApartments] = useState(defaults.apartmentsEst ?? 12);
  const [access, setAccess] = useState<Access>(defaults.access ?? "necunoscut");
  const [ownership, setOwnership] = useState<Ownership>(defaults.ownership ?? "necunoscut");
  const [incumbent, setIncumbent] = useState<Incumbent>(defaults.incumbent ?? "necunoscut");
  const [incumbentName, setIncumbentName] = useState(defaults.incumbentName ?? "");
  const [assemblyMonth, setAssemblyMonth] = useState<number>(defaults.assemblyMonth ?? 0);
  const [notes, setNotes] = useState(defaults.notes ?? "");
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [photos, setPhotos] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const coords = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    startFieldSync();
    // GPS stamp on create, with permission — the map then builds itself.
    if (isNew && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          coords.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        () => {
          /* denied or unavailable: the capture still saves */
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [isNew]);

  const addContact = () =>
    setContacts((c) => [
      ...c,
      { id: crypto.randomUUID(), role: "administrator", name: "", phone: "" },
    ]);

  const setContact = (index: number, patch: Partial<ContactRow>) =>
    setContacts((c) => c.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  async function capturePhoto(kind: PhotoKind, file: File) {
    setPhotos((p) => ({ ...p, [kind]: (p[kind] ?? 0) + 1 }));
    // The prospect row must exist before its photo, so save first.
    await save({ silent: true });
    await sendUpload("/api/field/photo", { prospectId: id, kind }, file, `${kind}.jpg`);
  }

  async function save(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setSaving(true);
    await sendJson("/api/field/prospect", {
      id,
      routeId: defaults.routeId,
      label: [street, number].filter(Boolean).join(" "),
      street,
      number,
      floors,
      entrances,
      apartmentsEst: apartments,
      ownership,
      access,
      incumbent,
      incumbentName: incumbent === "firma" ? incumbentName : "",
      assemblyMonth: assemblyMonth || undefined,
      notes,
      lat: coords.current?.lat,
      lng: coords.current?.lng,
      contacts: contacts.filter((c) => c.name.trim()),
    });
    if (!opts.silent) {
      setSaving(false);
      // Never navigate while offline: the RSC fetch fails and the browser
      // replaces the app with its own error page, which looks like lost work
      // even though the capture is safely queued.
      if (typeof navigator === "undefined" || navigator.onLine) {
        router.push(`/ops/teren/${defaults.routeId}`);
        router.refresh();
        return;
      }
      setSaved(true);
    }
  }

  /** Clear down for the next building without a round trip. */
  function nextBuilding() {
    setId(crypto.randomUUID());
    setStreet("");
    setNumber("");
    setAccess("necunoscut");
    setOwnership("necunoscut");
    setIncumbent("necunoscut");
    setIncumbentName("");
    setAssemblyMonth(0);
    setNotes("");
    setContacts([]);
    setPhotos({});
    setSaved(false);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="space-y-5 pb-28">
      {/* Address */}
      <div>
        <label className="block text-xs text-ink-faint">
          Stradă
          <input
            list="strazi"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-3 text-base"
            placeholder="Cucului"
          />
        </label>
        <datalist id="strazi">
          {streets.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <label className="mt-2 block text-xs text-ink-faint">
          Număr
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-3 text-base"
            placeholder="14"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stepper label="Etaje" value={floors} onChange={setFloors} />
        <Stepper label="Scări" value={entrances} onChange={setEntrances} min={1} />
        <Stepper label="Apart." value={apartments} onChange={setApartments} max={200} />
      </div>

      <Segmented
        label="Acces"
        value={access}
        onChange={setAccess}
        options={(["deschis", "interfon", "poarta", "necunoscut"] as Access[]).map((v) => ({
          value: v,
          label: ACCESS_LABEL_RO[v],
        }))}
      />

      <Segmented
        label="Proprietate"
        value={ownership}
        onChange={setOwnership}
        options={(
          ["asociatie", "proprietar_unic", "dezvoltator", "necunoscut"] as Ownership[]
        ).map((v) => ({ value: v, label: OWNERSHIP_LABEL_RO[v] }))}
      />

      {/* Contacts from the notice board */}
      <div>
        <p className="text-xs text-ink-faint">Contacte de pe avizier</p>
        <div className="mt-1 space-y-2">
          {contacts.map((c, i) => (
            <div key={c.id} className="rounded-lg border border-line bg-surface p-2.5">
              <select
                value={c.role}
                onChange={(e) => setContact(i, { role: e.target.value as ContactRole })}
                className="w-full rounded-md border border-line bg-surface px-2 py-2 text-sm"
              >
                {(
                  [
                    "administrator",
                    "presedinte",
                    "comitet",
                    "proprietar",
                    "dezvoltator",
                  ] as ContactRole[]
                ).map((r) => (
                  <option key={r} value={r}>
                    {CONTACT_ROLE_LABEL_RO[r]}
                  </option>
                ))}
              </select>
              <input
                value={c.name}
                onChange={(e) => setContact(i, { name: e.target.value })}
                placeholder="Nume"
                className="mt-1.5 w-full rounded-md border border-line bg-surface px-2 py-2 text-base"
              />
              <input
                value={c.phone}
                onChange={(e) => setContact(i, { phone: e.target.value })}
                placeholder="Telefon"
                type="tel"
                inputMode="tel"
                className="mt-1.5 w-full rounded-md border border-line bg-surface px-2 py-2 text-base"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addContact}
          className="mt-2 w-full rounded-lg border border-dashed border-line-strong px-3 py-3 text-sm text-ink-soft"
        >
          + Adaugă contact
        </button>
      </div>

      <div>
        <Segmented
          label="Cine face curățenia acum?"
          value={incumbent}
          onChange={setIncumbent}
          options={(
            ["niciunul", "femeie_serviciu", "firma", "necunoscut"] as Incumbent[]
          ).map((v) => ({ value: v, label: INCUMBENT_LABEL_RO[v] }))}
        />
        {incumbent === "firma" && (
          <input
            value={incumbentName}
            onChange={(e) => setIncumbentName(e.target.value)}
            placeholder="Numele firmei"
            className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-3 text-base"
          />
        )}
      </div>

      <label className="block text-xs text-ink-faint">
        Luna adunării generale
        <select
          value={assemblyMonth}
          onChange={(e) => setAssemblyMonth(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-3 text-base"
        >
          <option value={0}>nu e afișată</option>
          {MONTHS_RO.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </label>

      {/* Photos */}
      <div>
        <p className="text-xs text-ink-faint">Fotografii</p>
        <p className="mt-1 rounded-lg bg-warn-wash px-3 py-2 text-xs leading-relaxed text-warn">
          {AVIZIER_PHOTO_WARNING}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PHOTO_KINDS.map((kind) => (
            <label
              key={kind}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-line bg-surface px-3 py-3 text-sm"
            >
              <span>{PHOTO_KIND_LABEL_RO[kind]}</span>
              <span className="tnum text-xs text-ink-faint">
                {photos[kind] ? `${photos[kind]} ✓` : "＋"}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void capturePhoto(kind, f);
                  e.target.value = "";
                }}
              />
            </label>
          ))}
        </div>
      </div>

      <label className="block text-xs text-ink-faint">
        Observații
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-base"
        />
      </label>

      {/* Save bar stays reachable with one thumb. The sync chip lives here
          too: offline, the navigation away stalls, so this is the only place
          the queue state would be seen. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 p-3 backdrop-blur">
        <div className="mb-2 flex justify-center empty:mb-0">
          <FieldSyncChip />
        </div>
        {saved ? (
          <div className="space-y-2">
            <p className="rounded-lg bg-moss-wash px-3 py-2 text-center text-sm font-medium text-moss-deep">
              Salvat. Se trimite când revine semnalul.
            </p>
            <button
              type="button"
              onClick={nextBuilding}
              className="w-full rounded-xl bg-moss-deep px-4 py-4 text-lg font-semibold text-paper"
            >
              Următoarea clădire
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="w-full rounded-xl bg-moss-deep px-4 py-4 text-lg font-semibold text-paper disabled:opacity-60"
          >
            {saving ? "Se salvează…" : "Salvează clădirea"}
          </button>
        )}
      </div>
    </div>
  );
}
