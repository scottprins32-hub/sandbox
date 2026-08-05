// The three sections add-on 2 §D adds to the ofertă, assembled as pure data so
// they can be tested without a database or a PDF renderer.
//
// Section 2 is the full task table. Section 3 is every task at most two of the
// twenty surveyed firms publish, each with the reason it matters. Section 6 is
// the §C4 response commitments, verbatim.

import { COMMITMENTS } from "./commitments";
import {
  FREQUENCY_LABEL_RO,
  frequencyTableRo,
  tasksForPackage,
  uniqueVsMarket,
  type PackageFlags,
} from "./services/task-catalogue";

export interface OfferCatalogue {
  zones: { labelRo: string; rows: { nameRo: string; frequencyRo: string }[] }[];
  unique: { nameRo: string; reasonRo: string }[];
  commitments: string[];
}

/**
 * Filtered by what the building actually has, so an offer never promises to
 * clean a lift the building does not own.
 */
export function offerCatalogue(flags: PackageFlags): OfferCatalogue {
  const tasks = tasksForPackage(flags);
  return {
    zones: frequencyTableRo(tasks).map((g) => ({
      labelRo: g.labelRo,
      rows: g.tasks.map((t) => ({
        nameRo: t.nameRo,
        frequencyRo: FREQUENCY_LABEL_RO[t.defaultFrequency],
      })),
    })),
    unique: uniqueVsMarket(tasks).map((t) => ({
      nameRo: t.nameRo,
      reasonRo: t.gapNote ?? "",
    })),
    commitments: COMMITMENTS.map((c) => c.textRo),
  };
}
