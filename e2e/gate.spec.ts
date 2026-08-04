import { expect, test } from "@playwright/test";

// The passcode gate must be usable with no JavaScript: the founders open this
// on phones with bad reception, and a client-only form once left the page
// showing a heading and nothing to type into. Asserting on the raw HTML
// catches that regression regardless of whether a passcode is configured for
// this run (the e2e server deliberately runs with the gate open).
test("gate: the passcode form is server-rendered, not client-only", async ({ request }) => {
  const res = await request.get("/gate?next=%2Fsim");
  expect(res.status()).toBe(200);
  const html = await res.text();

  expect(html).toContain("<form");
  expect(html).toContain('type="password"');
  expect(html).toContain('name="passcode"');
  // The redirect target travels in the markup, not via client-side routing.
  expect(html).toContain('name="next"');
  expect(html).toContain('value="/sim"');
});

test("gate: the form is visible and typeable in a browser", async ({ page }) => {
  await page.goto("/gate?next=%2Fsim");
  const input = page.locator('input[type="password"]');
  await expect(input).toBeVisible();
  await input.fill("something");
  await expect(input).toHaveValue("something");
  await expect(page.getByRole("button", { name: "Enter" })).toBeEnabled();
});
