import { expect, test } from "@playwright/test";

// Portal happy path on a phone viewport (§8 / Phase 3 DoD), including the
// offline-queue retry: a finish that fails to send must queue, show the
// "se sincronizează…" chip, and land once the network is back.
test("portal: PIN login, claim a job, finish a visit through the offline queue", async ({
  page,
}) => {
  // Login as Ioana (seed: phone 0721111111, PIN 1111).
  await page.goto("/portal");
  await page.fill('input[type="tel"]', "0721111111");
  await page.fill('input[type="password"]', "1111");
  await page.getByRole("button", { name: "Intră" }).click();
  await expect(page.getByRole("heading", { name: "Ziua mea" })).toBeVisible();

  // Claim the open one-off job (claim-with-approval, §9).
  await page.goto("/portal/joburi");
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Vreau eu" }).click();
  await expect(page.getByText("în așteptare de confirmare")).toBeVisible();

  // Open a visit that is not already done (the ops spec completes one).
  await page.goto("/portal");
  await page
    .locator('a[href^="/portal/v/"]')
    .filter({ hasNotText: "gata" })
    .first()
    .click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Începe" }).click();
  await expect(page.getByText("De făcut")).toBeVisible();

  // Kill the network for portal mutations, then finish: must queue + chip.
  await page.route("**/api/portal/visit", (route) => route.abort());
  await page.getByRole("button", { name: "Am terminat" }).click();
  await expect(page.getByText(/se sincronizează/)).toBeVisible();

  // Network returns; the queue flushes (5s loop) and the chip clears.
  await page.unroute("**/api/portal/visit");
  await expect(page.getByText(/se sincronizează/)).toBeHidden({ timeout: 15_000 });
});
