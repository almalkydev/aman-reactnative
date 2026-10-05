import { test, expect } from "@playwright/test";
test("worker can create an inspection and recover an offline incident", async ({
  page,
  context,
}) => {
  const title = `E2E offline observation ${Date.now()}`;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Welcome back, Salim.")).toBeVisible();
  await expect(page.getByText("Incident trend")).toBeVisible();
  await page.screenshot({ path: "artifacts/home.png" });
  await page
    .getByRole("button", { name: "Start inspection", exact: true })
    .click();
  await page.getByLabel("Equipment name").fill("E2E demo pump");
  await page
    .getByRole("button", { name: "Start checklist", exact: true })
    .click();
  for (let i = 0; i < 9; i++) {
    await page.getByRole("button", { name: "Pass", exact: true }).click();
    await page
      .getByRole("button", {
        name: i === 8 ? "Review inspection" : "Next",
        exact: true,
      })
      .click();
  }
  await expect(page.getByText("Ready to submit")).toBeVisible();
  await page
    .getByRole("button", { name: "Submit inspection", exact: true })
    .click();
  await expect(page.getByText("Report saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to home", exact: true }).click();
  await page.getByRole("button", { name: "New report", exact: true }).click();
  await page
    .getByRole("button", { name: "Report incident", exact: true })
    .click();
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page
    .getByLabel("Description", { exact: true })
    .fill("Sample data: observation created without a connection.");
  await context.setOffline(true);
  await expect(page.getByText(/Offline ·/)).toBeVisible();
  await page
    .getByRole("button", { name: "Submit report", exact: true })
    .click();
  await expect(page.getByText("Report saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to home", exact: true }).click();
  await expect(
    page.getByText(/Offline · 1 reports waiting to sync/),
  ).toBeVisible();
  await context.setOffline(false);
  await expect(
    page.getByRole("button", { name: new RegExp(title) }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByRole("button", { name: "Sync now", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.screenshot({ path: "artifacts/settings-dark.png" });
  await page.getByRole("button", { name: "العربية", exact: true }).click();
  await expect(
    page.getByText("الإعدادات", { exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/settings-arabic.png" });
  await page.getByRole("tab", { name: "الرئيسية" }).click();
  await expect(page.getByText("اتجاه البلاغات")).toBeVisible();
  await page.screenshot({ path: "artifacts/home-arabic.png" });
  expect(errors).toEqual([]);
});

test("lists recover from errors and show a useful empty state", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Incident trend")).toBeVisible();
  await page.route("**/incidents", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Test connection failure" }),
    }),
  );
  await page.getByRole("tab", { name: "Incidents", exact: true }).click();
  await expect(page.getByText("Test connection failure")).toBeVisible();
  await page.unroute("**/incidents");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page
    .getByPlaceholder("Search reports…")
    .fill("no-matching-report-123456");
  await expect(page.getByText("No reports to show")).toBeVisible();
});

test("supervisor can assign and close a report, AI remains opt-in", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Supervisor", exact: true }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Incident trend")).toBeVisible();
  await page.getByRole("button", { name: "New report", exact: true }).click();
  await page
    .getByRole("button", { name: "Report incident", exact: true })
    .click();
  const title = `E2E supervisor observation ${Date.now()}`;
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page
    .getByLabel("Description", { exact: true })
    .fill("Sample observation for supervisor verification.");
  await page.route("**/incidents/suggest", (route) =>
    route.fulfill({
      json: {
        category: "Electrical",
        suggested_severity: "high",
        suggested_team: "Electrical maintenance",
      },
    }),
  );
  await page
    .getByRole("button", { name: "Suggest with AI", exact: true })
    .click();
  await expect(
    page.getByText("AI suggestions can be wrong. Please review."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page.getByRole("button", { name: "Add photo", exact: true }).click();
  const fileChooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Choose from library", exact: true })
    .click();
  await (await fileChooser).setFiles("mobile/assets/icon.png");
  await expect(page.getByText("1/4", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Submit report", exact: true })
    .click();
  await page.getByRole("button", { name: "Back to home", exact: true }).click();
  const photoResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/uploads/") &&
      response.request().method() === "GET",
  );
  await page.getByRole("button", { name: new RegExp(title) }).click();
  expect((await photoResponse).status()).toBe(200);
  await page.getByRole("img", { name: "Photos", exact: true }).click();
  await page.getByRole("button", { name: "Close photo", exact: true }).click();
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await page.getByRole("button", { name: "Closed", exact: true }).click();
  await page.getByRole("button", { name: "Unassigned", exact: true }).click();
  await page
    .getByRole("button", { name: "Noor Al Harthy", exact: true })
    .click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Status changed to Closed")).toBeVisible();
  await expect(
    page.getByText("Noor Al Harthy", { exact: true }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
