import { expect, test } from "@playwright/test";

// The building status page (add-on 2 §C5), end to end along its definition of
// done: enable a building's public page, open the URL the QR encodes, submit
// an issue, watch it land on Problems.
test("public page: enable it, report an issue, watch it reach Ops", async ({ page }) => {
  await page.goto("/ops/buildings");
  // Hard navigation rather than a client-router click: the building page is
  // force-dynamic and does real work, and a cold first hit can outrun the
  // default expect timeout.
  const buildingHref = await page
    .getByRole("link", { name: /Fântânii 4A/ })
    .first()
    .getAttribute("href");
  await page.goto(buildingHref!);
  await expect(page.getByRole("heading", { name: "Fântânii 4A" })).toBeVisible();

  // The client decides. It starts off.
  const card = page.locator("div").filter({ hasText: /^Resident status page/ }).last();
  await card.getByRole("button", { name: "Turn on" }).click();

  const link = page.getByRole("link", { name: /^\/b\// });
  await expect(link).toBeVisible();
  const href = (await link.getAttribute("href"))!;
  expect(href).toMatch(/^\/b\/[a-z0-9]{8}$/);

  // What a resident sees off the notice board.
  await page.goto(href);
  await expect(page.getByRole("heading", { name: "Fântânii 4A" })).toBeVisible();
  await expect(page.getByText("Ultima vizită")).toBeVisible();
  await expect(page.getByText("Următoarea vizită")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ce facem, și cât de des" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Angajamentele noastre" })).toBeVisible();

  // The bounded-content rule (§C5): operational facts only. No sums of money
  // anywhere on a page anyone can open. ("alei" is a footpath, not a price.)
  const body = (await page.locator("body").innerText()).toLowerCase();
  expect(body).not.toMatch(/\blei\b/);
  expect(body).not.toMatch(/\bap\.\s*\d/);

  // A promise the app cannot prove carries no score.
  await expect(page.getByText("Deszăpezire la intrare înainte de ora 7:00.")).toBeVisible();

  // Romanian page, Romanian months: date-fns defaults to English and this is
  // the only audience the page has. "august" is spelled the same in both, so
  // it cannot appear in this list — only months whose English spelling is not
  // also the Romanian one.
  expect(body).not.toMatch(
    /\b(january|february|march|april|may|june|july|september|october|november|december)\b/
  );
  await expect(
    page.getByText(
      /\d{1,2} (ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie) \d{4}/
    ).first()
  ).toBeVisible();

  // Read the score off the page rather than hardcoding it: the assertion that
  // matters is that acknowledging moves it, not what the seed happens to hold.
  const scored = async () => {
    const text = await page
      .getByText(/Sesizări confirmate în 1 zi lucrătoare:/)
      .innerText();
    const [, met, total] = /: (\d+) din (\d+)/.exec(text)!;
    return { met: Number(met), total: Number(total) };
  };

  const stamp = `E2E-${Date.now()}`;
  await page.selectOption('select[name="categorie"]', "bec");
  await page.locator('textarea[name="descriere"]').fill(`Bec ars la etajul 3 ${stamp}`);
  await page.getByRole("button", { name: "Trimite sesizarea" }).click();
  await expect(page.getByText("Am primit sesizarea")).toBeVisible();

  // An unacknowledged report drags the published number down immediately.
  // That is the whole design: the promise is either true or it is a problem
  // the founders can see.
  const before = await scored();
  expect(before.met).toBeLessThan(before.total);

  // It reaches Ops as a tenant report, and acknowledging it is what makes the
  // published "confirmed within one working day" number true.
  await page.goto("/ops?tab=problems");
  const row = page.locator("li").filter({ hasText: stamp });
  await expect(row).toBeVisible();
  await expect(row.getByText(/tenant · bulb/)).toBeVisible();
  await row.getByRole("button", { name: "Acknowledge" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("li").filter({ hasText: stamp }).getByText(/acknowledged/)).toBeVisible();

  // And the count on the public page moves with it.
  await page.goto(href);
  const after = await scored();
  expect(after.total).toBe(before.total);
  expect(after.met).toBe(before.met + 1);
  expect(after.met).toBe(after.total);
});

// Switching the page off must take the URL down, not leave a stale one live.
test("public page: turning it off takes the URL down", async ({ page }) => {
  await page.goto("/ops/buildings");
  // Hard navigation rather than a client-router click: the building page is
  // force-dynamic and does real work, and a cold first hit can outrun the
  // default expect timeout.
  const buildingHref = await page
    .getByRole("link", { name: /Fântânii 4A/ })
    .first()
    .getAttribute("href");
  await page.goto(buildingHref!);
  await expect(page.getByRole("heading", { name: "Fântânii 4A" })).toBeVisible();

  const turnOn = page
    .locator("div")
    .filter({ hasText: /^Resident status page/ })
    .last()
    .getByRole("button", { name: "Turn on" });
  if (await turnOn.isVisible().catch(() => false)) await turnOn.click();

  const link = page.getByRole("link", { name: /^\/b\// });
  await expect(link).toBeVisible();
  const href = (await link.getAttribute("href"))!;
  const res = await page.goto(href);
  expect(res?.status()).toBe(200);

  await page.goto(buildingHref!);
  await page
    .locator("div")
    .filter({ hasText: /^Resident status page/ })
    .last()
    .getByRole("button", { name: "Turn off" })
    .click();
  await expect(page.getByRole("button", { name: "Turn on" })).toBeVisible();

  const after = await page.goto(href);
  expect(after?.status()).toBe(404);
});
