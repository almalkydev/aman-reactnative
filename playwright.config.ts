import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 90000,
  expect: { timeout: 15000 },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:8081",
    channel: "chrome",
    headless: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
