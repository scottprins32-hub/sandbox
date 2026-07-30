import { defineConfig, devices } from "@playwright/test";

// Smoke flows: one happy path per module (§3). Requires a build:
//   npm run build && npm run e2e
// The webServer seeds nothing itself — global-setup reloads the demo world so
// runs are deterministic. Tests share one seeded DB, so they run serially.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3105",
    ...devices["Pixel 7"],
    // The remote dev environment pins Chromium outside Playwright's registry.
    ...(process.env.CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    command: "npm run start -- -p 3105",
    url: "http://localhost:3105/",
    reuseExistingServer: true,
    env: { ...process.env, SCARA_PASSCODE: "" },
    timeout: 30_000,
  },
});
