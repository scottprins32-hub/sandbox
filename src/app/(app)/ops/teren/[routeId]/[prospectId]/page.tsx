import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentOrg } from "@/server/org";
import { getRoute, listContacts, listProspectPhotos } from "@/server/repo/prospecting";
import { getProspect } from "@/server/repo/prospects";
import { getStorage } from "@/server/storage";
import {
  CONTACT_ROLE_LABEL_RO,
  INFORM_DEADLINE_DAYS,
  PHOTO_KIND_LABEL_RO,
  STREETS_REFERENCE,
} from "@/lib/prospecting/field-data";
import { markContactInformedAction, suppressContactAction } from "../../../actions";
import { CaptureForm } from "../../CaptureForm";

export const metadata: Metadata = { title: "Clădire · Scara" };
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function EditCapture({
  params,
}: {
  params: Promise<{ routeId: string; prospectId: string }>;
}) {
  const { routeId, prospectId } = await params;
  const org = await getCurrentOrg();
  const [route, prospect] = await Promise.all([
    getRoute(org.id, routeId),
    getProspect(org.id, prospectId),
  ]);
  if (!route || !prospect) notFound();

  const [contacts, photos] = await Promise.all([
    listContacts(org.id, prospectId),
    listProspectPhotos(org.id, prospectId),
  ]);
  const storage = getStorage();

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/ops/teren/${routeId}`} className="text-xs text-ink-faint">
        ← {route.name}
      </Link>
      <h1 className="mt-1 text-lg font-semibold tracking-tight">{prospect.label}</h1>

      {contacts.length > 0 && (
        <div className="mt-3 rounded-xl bg-surface p-3.5 shadow-card">
          <h2 className="text-sm font-semibold">Contacte</h2>
          <ul className="mt-1.5 divide-y divide-line">
            {contacts.map((c) => {
              const overdue =
                !c.informedAt && Date.now() - c.capturedAt > INFORM_DEADLINE_DAYS * DAY_MS;
              return (
                <li key={c.id} className="py-2">
                  <p className="text-sm">
                    {c.name}{" "}
                    <span className="text-xs text-ink-faint">
                      · {CONTACT_ROLE_LABEL_RO[c.role]}
                    </span>
                  </p>
                  {c.phone && <p className="tnum text-sm text-ink-soft">{c.phone}</p>}
                  <p className="mt-0.5 text-xs text-ink-faint">
                    de pe {c.source === "avizier" ? "avizier" : c.source}
                  </p>
                  {c.informedAt ? (
                    <p className="mt-1 text-xs text-ok">
                      Notă de informare trimisă{" "}
                      {new Date(c.informedAt).toISOString().slice(0, 10)}
                    </p>
                  ) : (
                    <form
                      action={markContactInformedAction.bind(null, c.id, prospectId, routeId)}
                      className="mt-1.5"
                    >
                      <button
                        className={`rounded-md px-2.5 py-1 text-xs ${
                          overdue
                            ? "bg-danger-wash font-medium text-danger"
                            : "border border-line text-ink-soft"
                        }`}
                      >
                        Am trimis nota de informare
                      </button>
                    </form>
                  )}
                  <form
                    action={suppressContactAction.bind(null, c.id, prospectId, routeId)}
                    className="mt-1.5"
                  >
                    <button className="text-xs text-ink-faint underline">
                      Nu mai contacta
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {photos.length > 0 && (
        <div className="mt-3 rounded-xl bg-surface p-3.5 shadow-card">
          <h2 className="text-sm font-semibold">Fotografii</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {photos.map((p) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <figure key={p.id}>
                <img
                  src={storage.url(p.fileKey)}
                  alt={PHOTO_KIND_LABEL_RO[p.kind]}
                  className="h-28 w-full rounded-lg object-cover"
                />
                <figcaption className="mt-0.5 text-xs text-ink-faint">
                  {PHOTO_KIND_LABEL_RO[p.kind]}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      <h2 className="mt-5 text-sm font-semibold">Actualizează</h2>
      <div className="mt-2">
        <CaptureForm
          defaults={{
            id: prospect.id,
            routeId,
            label: prospect.label,
            street: prospect.street ?? "",
            number: prospect.number ?? "",
            floors: prospect.floors,
            entrances: prospect.entrances,
            apartmentsEst: prospect.apartmentsEst,
            ownership: prospect.ownership,
            access: prospect.access,
            incumbent: prospect.incumbent,
            incumbentName: prospect.incumbentName,
            assemblyMonth: prospect.assemblyMonth,
            notes: prospect.notes,
          }}
          streets={STREETS_REFERENCE.map((s) => s.name)}
        />
      </div>
    </div>
  );
}
