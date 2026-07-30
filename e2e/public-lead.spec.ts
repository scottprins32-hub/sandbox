import { expect, test } from "@playwright/test";

// Public page → leads inbox (§9 / acceptance #2).
test("a lead submitted on the public page lands in the Ops inbox", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Curățenie cu dovadă." })).toBeVisible();

  const name = "Elena Ciobanu";
  await page.fill('input[name="nume"]', name);
  await page.fill('input[name="telefon"]', "0744556677");
  await page.fill('input[name="localitate"]', "Giroc");
  await page.selectOption('select[name="tip"]', "asociatie");
  await page.fill('textarea[name="mesaj"]', "Scară cu 3 etaje, vrem ofertă.");
  await page.getByRole("button", { name: "Cere ofertă" }).click();
  await expect(page.getByText("Mulțumim. Revenim azi.")).toBeVisible();

  await page.goto("/ops/leads");
  await expect(page.getByText(name)).toBeVisible();
});
