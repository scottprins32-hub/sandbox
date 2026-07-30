import { expect, test } from "@playwright/test";
import { encode } from "jpeg-js";

// Ops happy path (§7 DoD): create building → generate week → complete a visit
// with a photo → generate the month's protocol PDF.
test("ops: building, week generation, visit with photo, protocol", async ({ page }) => {
  // Create a building.
  await page.goto("/ops/buildings/new");
  await page.fill('input[name="label"]', "Teilor 7");
  await page.fill('input[name="address"]', "Strada Teilor 7");
  await page.fill('input[name="priceLei"]', "2900");
  await page.getByRole("button", { name: "Create building" }).click();
  await expect(page.getByRole("heading", { name: "Teilor 7" })).toBeVisible();

  // Generate this week's visits (idempotent).
  await page.goto("/ops");
  await page
    .getByRole("button", { name: /Generate this week's visits/ })
    .click();
  await expect(page.getByText("Today,")).toBeVisible();

  // Open the first scheduled visit of today and run it to done with a photo.
  // (Exclude the "Book a job" link, which also starts with /ops/visits/.)
  const visitLink = page
    .locator('a[href^="/ops/visits/"]:not([href$="/new"])')
    .first();
  await visitLink.click();
  await page.waitForTimeout(800);

  const startButton = page.getByRole("button", { name: "Start", exact: true });
  if (await startButton.count()) await startButton.click();
  await expect(page.getByRole("button", { name: "Finish", exact: true })).toBeVisible({
    timeout: 15_000,
  });

  // Tick the first checklist item (server-action form buttons).
  const checklist = page.locator("section, div").filter({ hasText: "Checklist" });
  const firstItem = page.locator("li form button").first();
  if (await firstItem.isVisible()) await firstItem.click();

  // Upload a generated photo through the hidden input (client compresses it).
  const w = 32;
  const h = 24;
  const raw = Buffer.alloc(w * h * 4, 180);
  const jpg = encode({ data: raw, width: w, height: h }, 80).data;
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: jpg });
  await expect(page.locator('img[alt^="Before"], img[alt^="After"]').first()).toBeVisible({
    timeout: 10_000,
  });

  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByText("done", { exact: true })).toBeVisible();

  // Generate the protocol for Fântânii 4A this month.
  await page.goto("/ops/protocols");
  const row = page.locator("li").filter({ hasText: "Fântânii 4A" });
  await row.getByRole("button", { name: /Generate PDF|Regenerate/ }).click();
  await expect(row.getByRole("link", { name: "Download PDF" })).toBeVisible();
});
