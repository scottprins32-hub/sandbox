import { expect, test } from "@playwright/test";

// Field prospecting (add-on 2 §3). The acceptance script's hardest step:
// capture a building with no network at all, restore it, and watch the queue
// drain. A stairwell basement has no signal and losing a capture is the one
// failure this module may not have.
test("teren: a building captured offline syncs when the signal returns", async ({
  page,
  context,
}) => {
  await page.goto("/ops/teren");
  // Routes seed on first use.
  const seedButton = page.getByRole("button", { name: "Încarcă rutele" });
  if (await seedButton.isVisible().catch(() => false)) {
    await seedButton.click();
  }
  await expect(page.getByText("În spatele Lidl")).toBeVisible();

  // Route 2 is the cold-walking route.
  await page.getByText("Calea Timișoarei Nord").click();
  await page.getByRole("link", { name: "Clădire nouă" }).click();
  await expect(page.getByRole("heading", { name: "Clădire nouă" })).toBeVisible();

  // Go dark before typing anything.
  await context.setOffline(true);

  const stamp = `E2E-${Date.now()}`;
  await page.locator('input[list="strazi"]').fill("Cucului");
  await page.locator('input[placeholder="14"]').fill(stamp);
  await page.getByRole("button", { name: "deschis", exact: true }).click();
  await page.getByRole("button", { name: "asociație", exact: true }).click();
  await page.getByRole("button", { name: "niciunul", exact: true }).click();

  // Two contacts off the notice board.
  for (const [i, name] of [`Admin ${stamp}`, `Președinte ${stamp}`].entries()) {
    await page.getByRole("button", { name: "+ Adaugă contact" }).click();
    await page.locator('input[placeholder="Nume"]').nth(i).fill(name);
    await page.locator('input[placeholder="Telefon"]').nth(i).fill(`07000000${i}`);
  }

  await page.getByRole("button", { name: "Salvează clădirea" }).click();

  // Still offline: the capture is queued, and the chip says so.
  await expect(page.getByText(/se sincronizează/)).toBeVisible({ timeout: 10_000 });

  // Signal returns; the queue drains.
  await context.setOffline(false);
  await expect(page.getByText(/se sincronizează/)).toBeHidden({ timeout: 20_000 });

  // The capture screen stays put after an offline save — navigating with no
  // network hands the browser its own error page and Georgia loses the screen
  // mid-walk. So walk back to the route ourselves to check the write landed.
  const routeUrl = await page
    .getByRole("link", { name: /Calea Timișoarei Nord/ })
    .getAttribute("href");
  await page.goto(routeUrl!);

  // The building and both contacts landed.
  await expect(page.getByText(`Cucului ${stamp}`)).toBeVisible();
  await page.getByText(`Cucului ${stamp}`).click();
  await expect(page.getByText(`Admin ${stamp}`)).toBeVisible();
  await expect(page.getByText(`Președinte ${stamp}`)).toBeVisible();
  // Source is always recorded (§3.4).
  await expect(page.getByText("de pe avizier").first()).toBeVisible();
});

// The GDPR art. 14 duty is enforced where it will be seen, not in a settings page.
test("teren: a contact not informed after 30 days lands on Problems", async ({ page }) => {
  await page.goto("/ops?tab=problems");
  await expect(
    page.getByRole("heading", { name: /Contacts not yet informed/ })
  ).toBeVisible();

  // Marking the notice sent clears it.
  const card = page
    .locator("div")
    .filter({ hasText: /Contacts not yet informed/ })
    .last();
  await card.getByRole("button", { name: "Notice sent" }).first().click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Administrator (de pe avizier)")).toBeHidden();
});

// A suppressed contact must vanish from every list and from the export (§3.4).
test("teren: do-not-contact removes a contact from lists and the CSV export", async ({
  page,
  request,
}) => {
  await page.goto("/ops/teren");
  await page.getByText("Calea Timișoarei Nord").click();
  await page.getByText("Cucului 14").click();

  const name = "Administrator (de pe avizier)";
  await expect(page.getByText(name)).toBeVisible();

  const before = await (await request.get("/api/contacts-export")).text();
  expect(before).toContain(name);

  await page.getByRole("button", { name: "Nu mai contacta" }).first().click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(name)).toBeHidden();

  const after = await (await request.get("/api/contacts-export")).text();
  expect(after).not.toContain(name);
});
