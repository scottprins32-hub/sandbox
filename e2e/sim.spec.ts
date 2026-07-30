import { expect, test } from "@playwright/test";

// Simulator happy path (§6 / acceptance #3): sliders drive tiles, the VAT
// ceiling reacts to price, capacity holds at 10.5. Desktop viewport: on mobile
// the control rail lives in the bottom sheet.
test.use({ viewport: { width: 1280, height: 800 } });

test("simulator reacts to price and pins a scenario", async ({ page }) => {
  await page.goto("/sim");
  await page.waitForTimeout(800); // hydration

  await expect(page.getByText("Monthly profit (now)")).toBeVisible();
  await expect(page.getByText("run 9 buildings before VAT")).toBeVisible();
  await expect(page.getByText("covers 10.5 buildings")).toBeVisible();

  // Drag price down to the market rate: 3,566 → 700 lei.
  const priceSlider = page.locator('input[type="range"]').first();
  await priceSlider.fill("700");
  await expect(page.getByText("run 47 buildings before VAT")).toBeVisible();
  await expect(page.getByText("covers 10.5 buildings")).toBeVisible();

  // Pin as A, change price, see the comparison chip.
  // (3575, not 3566: range fill must land on the slider's 25-lei step grid.)
  await page.getByRole("button", { name: "Pin as A" }).click();
  await priceSlider.fill("3575");
  await expect(page.getByText("Comparing to pinned A")).toBeVisible();
});
