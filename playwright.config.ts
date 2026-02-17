import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],

  timeout: 60_000,

  use: {
    baseURL: "https://www.casadellibro.com",
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    locale: "es-ES",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
