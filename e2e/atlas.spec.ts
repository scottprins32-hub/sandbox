import { expect, test } from "@playwright/test";

// Atlas (§6b DoD): commune cards baked in; prospect walks the pipeline and
// converts to a building; a document lands on the shelf.
test("atlas: commune cards, prospect pipeline to building", async ({ page }) => {
  await page.goto("/atlas");
  await expect(page.getByText("Giroc / Chișoda")).toBeVisible();
  await expect(page.getByText("484 residential projects/yr")).toBeVisible();

  // Add a prospect.
  await page.getByText("Add prospect").click();
  await page.fill('input[name="label"]', "Bulevardul Sudului 12");
  await page.fill('input[name="quotedLei"]', "1200");
  await page.getByRole("button", { name: "Add to notebook" }).click();
  await expect(page.getByText("Bulevardul Sudului 12")).toBeVisible();

  // Walk it: spotted → contacted → quoted → won (converts to building).
  // Scope every click to this prospect's card — the seed already has a card
  // in the "quoted" column.
  const card = () =>
    page.locator("div.rounded-lg.bg-surface", { hasText: "Bulevardul Sudului 12" }).first();
  await card().getByRole("button", { name: "Contacted →" }).click();
  await card().getByRole("button", { name: "Quoted →" }).click();
  await card().getByRole("button", { name: "Won → building" }).click();
  // Conversion redirects to the new Ops building page.
  await expect(page.getByRole("heading", { name: "Bulevardul Sudului 12" })).toBeVisible();

  // Upload a document to the shelf.
  await page.goto("/atlas");
  await page.fill('input[name="title"]', "Studiu piață Giroc");
  await page
    .locator('input[name="file"]')
    .setInputFiles({
      name: "studiu.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%test\n"),
    });
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByText("Studiu piață Giroc")).toBeVisible();
});
