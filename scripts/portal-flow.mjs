// Portal happy-path driver: logs in as a cleaner (phone+PIN), walks Ziua mea →
// visit → checklist → finish, then screenshots each step. Used at phase stop
// points; Playwright specs cover the same path in CI form.
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3100";
const outDir = process.argv[3] ?? ".";
const executablePath = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(`${base}/portal`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/portal-login.png` });

// Login as Ioana (seed: 0721111111 / PIN 1111)
await page.fill('input[type="tel"]', "0721111111");
await page.fill('input[type="password"]', "1111");
await page.click('button:has-text("Intră")');
await page.waitForLoadState("networkidle");
await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/portal-today.png` });

// Open the first visit card if there is one
const firstVisit = page.locator('a[href^="/portal/v/"]').first();
if ((await firstVisit.count()) > 0) {
  await firstVisit.click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000); // let React hydrate before interacting
  await page.screenshot({ path: `${outDir}/portal-visit.png` });

  const start = page.locator('button:has-text("Începe")');
  if ((await start.count()) > 0) {
    await start.click();
    await page.locator('text=De făcut').waitFor({ timeout: 5000 });
  }
  // Tick the first two checklist items
  const boxes = page.locator("ul.divide-y li button");
  const n = Math.min(2, await boxes.count());
  for (let i = 0; i < n; i++) {
    await boxes.nth(i).click();
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: `${outDir}/portal-visit-progress.png` });
  await page.click('button:has-text("Am terminat")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${outDir}/portal-visit-done.png` });
}

await page.goto(`${base}/portal/joburi`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/portal-jobs.png` });
await page.goto(`${base}/portal/ore`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/portal-hours.png` });

await browser.close();
console.log("portal flow done");
