// The demo world (§8). Importable: `npm run seed` runs it from the CLI and the
// dev-only reset button in Ops Settings calls it too. Wipes org data first so
// re-seeding is deterministic.

import { encode } from "jpeg-js";
import { getDb, schema } from "../server/db";
import { getStorage } from "../server/storage";
import { generateWeekVisits } from "../server/repo/visits";
import { todayYmd, weekDays } from "../lib/dates";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Solid-color placeholder JPEG with a few darker stripes (§8: fine for seed). */
function placeholderJpeg(hue: number): Uint8Array {
  const w = 320;
  const h = 240;
  const data = Buffer.alloc(w * h * 4);
  const base = [
    [122, 138, 118],
    [156, 148, 130],
    [136, 128, 148],
    [148, 136, 118],
  ][hue % 4]!;
  for (let yPix = 0; yPix < h; yPix++) {
    for (let x = 0; x < w; x++) {
      const i = (yPix * w + x) * 4;
      const stripe = Math.floor((x + yPix) / 24) % 2 === 0 ? 0 : -14;
      data[i] = base[0]! + stripe;
      data[i + 1] = base[1]! + stripe;
      data[i + 2] = base[2]! + stripe;
      data[i + 3] = 255;
    }
  }
  return new Uint8Array(encode({ data, width: w, height: h }, 70).data);
}

export async function seedDemo(): Promise<{ orgId: string }> {
  const db = getDb();
  const storage = getStorage();

  // Wipe all tables (single-org demo world).
  for (const table of [
    schema.photos,
    schema.visitItems,
    schema.visits,
    schema.issues,
    schema.expenses,
    schema.protocols,
    schema.leads,
    schema.prospects,
    schema.documents,
    schema.contractBuildings,
    schema.contracts,
    schema.buildings,
    schema.checklistItems,
    schema.checklistTemplates,
    schema.cleaners,
    schema.clients,
    schema.users,
    schema.orgSettings,
    schema.orgs,
  ]) {
    await db.delete(table);
  }

  // Org
  const [org] = await db
    .insert(schema.orgs)
    .values({ name: "Scara Demo SRL", cui: "CUI RO00000000", localeDefault: "en" })
    .returning();
  const orgId = org!.id;
  await db.insert(schema.orgSettings).values({ orgId, json: "{}" });

  // Users
  const [, , ioanaUser, vasileUser] = await db
    .insert(schema.users)
    .values([
      { orgId, name: "Scott", role: "admin", locale: "en" },
      { orgId, name: "Adina", role: "ops", locale: "ro" },
      { orgId, name: "Ioana Mureșan", role: "cleaner", locale: "ro", pin: "1111" },
      { orgId, name: "Vasile Drăgan", role: "cleaner", locale: "ro", pin: "2222" },
    ])
    .returning();

  // Cleaners
  const [ioana, vasile] = await db
    .insert(schema.cleaners)
    .values([
      {
        orgId,
        userId: ioanaUser!.id,
        name: "Ioana Mureșan",
        phone: "0721111111",
        workerModel: "parttime_student" as const,
        hoursPerDay: 4,
        studentProofExpiry: "2026-10-15",
        active: true,
      },
      {
        orgId,
        userId: vasileUser!.id,
        name: "Vasile Drăgan",
        phone: "0722222222",
        workerModel: "parttime_pensioner" as const,
        hoursPerDay: 4,
        active: true,
      },
    ])
    .returning();

  // Client + checklist template
  const [client] = await db
    .insert(schema.clients)
    .values({
      orgId,
      name: "Proprietar privat — 4 clădiri",
      type: "landlord",
      contact: "0723000000",
    })
    .returning();

  const [template] = await db
    .insert(schema.checklistTemplates)
    .values({ orgId, name: "Standard scară de bloc" })
    .returning();
  const checklistTexts = [
    "Măturat și spălat scările și podestele",
    "Curățat holul de intrare și ușa",
    "Șters cutiile poștale",
    "Șters balustrada",
    "Verificat și curățat zona tomberoanelor",
    "Măturat trotuarul din fața intrării",
  ];
  const items = await db
    .insert(schema.checklistItems)
    .values(
      checklistTexts.map((textRo, i) => ({
        orgId,
        templateId: template!.id,
        textRo,
        sort: i,
      }))
    )
    .returning();

  // Buildings 4A-4D
  const buildingRows = await db
    .insert(schema.buildings)
    .values(
      (["4A", "4B", "4C", "4D"] as const).map((suffix) => ({
        orgId,
        clientId: client!.id,
        label: `Fântânii ${suffix}`,
        address: `Strada Fântânii ${suffix}`,
        locality: "Giroc, Timiș",
        floors: 3,
        apartments: 11,
        residents: 24,
        priceBani: 3566_00,
        visitsPerWeek: 2,
        hoursPerVisit: 1.5,
        checklistTemplateId: template!.id,
        status: "active" as const,
      }))
    )
    .returning();

  // Contract (12 months, 60-day notice, min-wage indexation)
  const [contract] = await db
    .insert(schema.contracts)
    .values({
      orgId,
      clientId: client!.id,
      startDate: "2026-07-01",
      termMonths: 12,
      noticeDays: 60,
      priceBani: 3566_00,
      indexationNote: "se indexează cu salariul minim",
      nextIndexationDate: "2027-01-01",
    })
    .returning();
  await db.insert(schema.contractBuildings).values(
    buildingRows.map((b) => ({ orgId, contractId: contract!.id, buildingId: b.id }))
  );

  // Prospect (Atlas field notebook)
  await db.insert(schema.prospects).values({
    orgId,
    label: "Complex Park Giroc — scara 2",
    commune: "Giroc",
    floors: 4,
    apartmentsEst: 16,
    currentCleaner: "asociația, intern",
    status: "quoted",
    quotedPriceBani: 850_00,
    notes: "Administrator deschis la ofertă; decizia la adunarea generală.",
    spottedDate: todayYmd(),
  });

  // Two weeks of history: visits Mon+Thu per building, ~90% done, photos.
  const today = todayYmd();
  const thisWeek = weekDays(today);
  const lastWeek = weekDays(
    new Date(new Date(`${today}T12:00:00Z`).getTime() - 7 * DAY_MS)
      .toISOString()
      .slice(0, 10)
  );
  const twoWeeksAgo = weekDays(
    new Date(new Date(`${today}T12:00:00Z`).getTime() - 14 * DAY_MS)
      .toISOString()
      .slice(0, 10)
  );
  const historyDays = [...twoWeeksAgo, ...lastWeek]
    .filter((_, i) => i % 7 === 0 || i % 7 === 3) // Mon + Thu
    .filter((d) => d < today);

  let photoHue = 0;
  let visitCount = 0;
  let missedBudget = Math.max(1, Math.round(historyDays.length * buildingRows.length * 0.1));
  for (const date of historyDays) {
    for (const [bi, b] of buildingRows.entries()) {
      const cleaner = bi % 2 === 0 ? ioana! : vasile!;
      const missed = missedBudget > 0 && (visitCount + 3) % 9 === 0;
      if (missed) missedBudget--;
      const startMs =
        new Date(`${date}T05:00:00Z`).getTime() + bi * 100 * 60 * 1000; // 08:00 RO + stagger
      const finishMs = startMs + 90 * 60 * 1000;
      const [visit] = await db
        .insert(schema.visits)
        .values({
          orgId,
          buildingId: b.id,
          cleanerId: cleaner.id,
          type: "recurring",
          scheduledDate: date,
          window: "am",
          status: missed ? "missed" : "done",
          startedAt: missed ? null : startMs,
          finishedAt: missed ? null : finishMs,
        })
        .returning();
      visitCount++;
      if (!missed) {
        await db.insert(schema.visitItems).values(
          items.map((item) => ({
            orgId,
            visitId: visit!.id,
            checklistItemId: item.id,
            done: true,
          }))
        );
        const photoCount = 2 + ((visitCount + bi) % 3); // 2-4
        for (let p = 0; p < photoCount; p++) {
          const key = `${orgId}/photos/${visit!.id}/${p}.jpg`;
          await storage.put(key, placeholderJpeg(photoHue++), "image/jpeg");
          await db.insert(schema.photos).values({
            orgId,
            visitId: visit!.id,
            fileKey: key,
            takenAt: startMs + p * 9 * 60 * 1000,
            kind: p === 0 ? "before" : "after",
          });
        }
      }
    }
  }

  // This week's visits (today's route included), scheduled.
  await generateWeekVisits(orgId, today);

  // A one-off open offer with a bonus (claimable in the Portal).
  await db.insert(schema.visits).values({
    orgId,
    buildingId: null,
    cleanerId: null,
    type: "turnover",
    scheduledDate: thisWeek[5]!, // Saturday
    window: "pm",
    status: "scheduled",
    priceBani: 180_00,
    locationLabel: "Ap. 2 camere, str. Mareșal C-tin Prezan 87, Timișoara",
    openOffer: true,
    bonusBani: 30_00,
  });

  // Issues: one open (tenant), one resolved.
  await db.insert(schema.issues).values([
    {
      orgId,
      buildingId: buildingRows[1]!.id,
      source: "tenant" as const,
      description: "bec ars etaj 2",
      status: "open" as const,
    },
    {
      orgId,
      buildingId: buildingRows[0]!.id,
      source: "cleaner" as const,
      description: "ușă intrare nu se închide bine",
      status: "done" as const,
      resolvedAt: Date.now() - 3 * DAY_MS,
    },
  ]);

  // Expenses this month.
  await db.insert(schema.expenses).values([
    {
      orgId,
      date: today,
      category: "consumables" as const,
      amountBani: 84_50,
      note: "detergent + saci menajeri",
    },
    {
      orgId,
      date: today,
      category: "travel" as const,
      amountBani: 60_00,
      note: "combustibil săptămâna curentă",
    },
  ]);

  // Leads: one of each status new/contacted/won.
  await db.insert(schema.leads).values([
    {
      orgId,
      name: "Adrian Petrescu",
      phone: "0745123456",
      locality: "Giroc",
      buildingType: "bloc" as const,
      message: "Bloc nou, 3 etaje, căutăm firmă de curățenie cu dovezi.",
      status: "new" as const,
    },
    {
      orgId,
      name: "Asociația Pictor Zaicu 12",
      phone: "0731987654",
      locality: "Timișoara",
      buildingType: "asociatie" as const,
      message: "Cerem ofertă pentru scară cu 4 etaje.",
      status: "contacted" as const,
    },
    {
      orgId,
      name: "Bianca Toma",
      phone: "0722334455",
      locality: "Dumbrăvița",
      buildingType: "birou" as const,
      message: "Birou mic, curățenie de două ori pe săptămână.",
      status: "won" as const,
    },
  ]);

  return { orgId };
}
