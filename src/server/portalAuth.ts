// Portal identity (§8): a real phone+PIN session cookie, or the dev/demo role
// switcher simulating "cleaner-as-X" (§3). Employment is invite-only; there is
// no self-signup by design (§9 DO-NOT-BUILD: no gig-marketplace mechanics).

import { cookies } from "next/headers";
import { getCurrentOrg } from "./org";
import { getCleaner, getCleanerByUserId, type Cleaner } from "./repo/cleaners";

export async function getPortalCleaner(): Promise<Cleaner | null> {
  const store = await cookies();
  try {
    const org = await getCurrentOrg();
    const session = store.get("scara_cleaner")?.value;
    if (session) {
      const cleaner = await getCleaner(org.id, session);
      if (cleaner?.active) return cleaner;
    }
    const role = store.get("scara_role")?.value;
    if (role?.startsWith("cleaner:")) {
      const cleaner = await getCleanerByUserId(org.id, role.slice("cleaner:".length));
      if (cleaner?.active) return cleaner;
    }
  } catch {
    // No DB yet.
  }
  return null;
}
