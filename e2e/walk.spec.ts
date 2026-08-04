import { expect, test } from "@playwright/test";

// Control walk (add-on §5): on a phone viewport, verify every checkpoint,
// record one urgent finding, finish. The finding must land on Ops Problems.
test("control walk: all points verified, urgent finding reaches Ops Problems", async ({
  page,
}) => {
  await page.goto("/portal");
  await page.fill('input[type="tel"]', "0721111111");
  await page.fill('input[type="password"]', "1111");
  await page.getByRole("button", { name: "Intră" }).click();
  await expect(page.getByRole("heading", { name: "Ziua mea" })).toBeVisible();

  // Open any of today's visits and enter the walk.
  await page.locator('a[href^="/portal/v/"]').first().click();
  await page.getByRole("link", { name: "Tur de control" }).click();
  await expect(page.getByRole("heading", { name: "Tur de control" })).toBeVisible();

  // Six points in order: "În regulă".
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "În regulă" }).nth(i).click();
    await page.waitForTimeout(150);
  }

  // The seventh gets an urgent finding.
  const lastCard = page.locator("li").filter({ hasText: "Fațadă" });
  await lastCard.getByRole("button", { name: "Am găsit ceva" }).click();
  await page.getByRole("button", { name: "Urgent" }).click();
  await lastCard.locator("input").fill("Bucată de tencuială desprinsă deasupra intrării E2E");
  await page.getByRole("button", { name: "Salvează constatarea" }).click();

  // Every checkpoint recorded → the walk can be closed.
  const finish = page.getByRole("button", { name: "Finalizează turul" });
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect(page.getByText("Tur finalizat")).toBeVisible();
  await page.waitForTimeout(1200); // let queued mutations land

  // The urgent finding surfaces on the Ops Problems tab with the owner line.
  await page.goto("/ops?tab=problems");
  await expect(
    page.getByText("Bucată de tencuială desprinsă deasupra intrării E2E").first()
  ).toBeVisible();
  await expect(
    page.getByText("De transmis proprietarului", { exact: false }).first()
  ).toBeVisible();
});

// The printable QR sheet: seven labelled codes for the standard checkpoints.
test("checkpoint QR sheet renders seven codes", async ({ page }) => {
  await page.goto("/ops/buildings");
  const href = await page
    .locator('a[href^="/ops/buildings/"]:not([href$="/new"])')
    .first()
    .getAttribute("href");
  await page.goto(`${href}/checkpoints/print`);
  await expect(page.getByText("Intrare și ușa de acces")).toBeVisible();
  await expect(page.locator("svg path").first()).toBeVisible();
  expect(await page.getByText("Scanează codul la fiecare tur de control.").count()).toBe(7);
});
