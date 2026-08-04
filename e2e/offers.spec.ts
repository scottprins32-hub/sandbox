import { expect, test } from "@playwright/test";

// Sales happy path: quote a prospect from Atlas, watch the guardrails react,
// generate the ofertă PDF, and confirm the prospect moved to 'quoted'.
test.use({ viewport: { width: 1280, height: 900 } });

test("offer builder prices honestly and generates a PDF from a prospect", async ({
  page,
}) => {
  // The seed ships one prospect sitting in 'quoted'; start from the Atlas card.
  await page.goto("/atlas");
  const card = page
    .locator("div.rounded-lg.bg-surface", { hasText: "Complex Park Giroc" })
    .first();
  await card.getByRole("link", { name: "Offer" }).click();
  await expect(page.getByText("Prefilled from the Atlas prospect")).toBeVisible();

  // Guardrail: a price under direct cost must be called out, not silently sent.
  const price = page.locator('input[name="priceLei"]');
  await price.fill("300");
  await expect(page.getByText(/below the direct cost/)).toBeVisible();

  // Guardrail: the captive-landlord price is flagged as fragile in a pitch.
  await price.fill("3566");
  await expect(page.getByText(/More than 2x the market rate/)).toBeVisible();

  // A defensible number clears both warnings.
  await page.getByRole("button", { name: "Use recommended" }).click();
  await expect(page.getByText(/below the direct cost/)).toBeHidden();
  await expect(page.getByText(/More than 2x the market rate/)).toBeHidden();

  await page.fill('input[name="clientName"]', "Asociația de proprietari Park 2");
  await page.getByRole("button", { name: "Generate offer PDF" }).click();

  // The offer is recorded and downloadable.
  await expect(page.getByText("Offers sent")).toBeVisible();
  const row = page.locator("li", { hasText: "Complex Park Giroc" }).first();
  await expect(row.getByRole("link", { name: "PDF" })).toBeVisible();

  // Sending an offer moves the prospect to quoted and records the price on it.
  await page.goto("/atlas");
  const prospectCard = page
    .locator("div.rounded-lg.bg-surface", { hasText: "Complex Park Giroc" })
    .first();
  await expect(prospectCard.getByText(/quoted .* lei\/mo/)).toBeVisible();
});

test("the sample proces-verbal is served as a PDF for the proof pack", async ({
  request,
}) => {
  const res = await request.get("/ops/offers/sample");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  const body = await res.body();
  expect(body.subarray(0, 5).toString()).toBe("%PDF-");
});
