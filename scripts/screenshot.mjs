// Screenshot helper: node shot.mjs <url> <outfile> <width> <height> [waitMs]
import { chromium } from "@playwright/test";

const [url, out, w, h, waitMs] = process.argv.slice(2);
// In the remote environment a pinned Chromium lives at /opt/pw-browsers/chromium.
const executablePath = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(Number(waitMs ?? 800));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
if (errors.length) {
  console.log("ERRORS:\n" + errors.join("\n"));
} else {
  console.log("clean");
}
