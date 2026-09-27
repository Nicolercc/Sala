import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/checkin", "/staff", "/board", "/design-system", "/case-study"];

test("visits all routes", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
  }
});

test("root prototype check-in reaches the board without storage", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start check-in" }).click();
  await expect(page.getByRole("heading", { name: "Who’s checking in?" })).toBeVisible();
  await page.getByLabel(/First name/).fill("Lina");
  await page.getByLabel(/Last name/).fill("Campos");
  await page.getByLabel(/Date of birth/).fill("1990-04-12");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByTestId("visit-option-follow-up").click();
  await page.getByRole("button", { name: "Confirm check-in" }).click();
  const token = await page.getByTestId("root-issued-token").textContent();

  await expect(page.getByTestId("root-issued-token")).toBeVisible();
  await expect(page.getByRole("region", { name: "Waiting room" }).getByText(token ?? "", { exact: true })).toBeVisible();

  const storage = await page.evaluate(async () => {
    const indexedDbNames = indexedDB.databases ? await indexedDB.databases() : [];
    return {
      local: localStorage.length,
      session: sessionStorage.length,
      cookies: document.cookie,
      indexedDb: indexedDbNames.length
    };
  });
  expect(storage).toEqual({ local: 0, session: 0, cookies: "", indexedDb: 0 });
});

test("root prototype staff lens masks private fields", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("1975-11-02")).toBeVisible();
  await page.getByRole("button", { name: "Privacy lens: off" }).click();
  await expect(page.getByTestId("root-lens-banner")).toContainText("Identifiers hidden");
  await expect(page.getByText("1975-11-02")).toHaveCount(0);
});

test("blocks third-party requests", async ({ page }) => {
  const badOrigins: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:3000") {
      badOrigins.push(url.origin);
    }
  });

  await page.goto("/checkin");
  await page.goto("/staff");
  await page.goto("/board");
  await page.goto("/design-system");
  await page.goto("/case-study");
  expect(badOrigins).toEqual([]);
});

for (const theme of ["light", "dark", "high-contrast"] as const) {
  for (const route of routes) {
    test(`axe has zero violations on ${route} in ${theme}`, async ({ page }) => {
      await page.goto(route);
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
}

test("idle blur activates on staff and resumes", async ({ page }) => {
  await page.clock.install();
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Staff queue" })).toBeVisible();
  await page.clock.fastForward(61_000);
  await expect(page.getByRole("button", { name: "Resume" })).toBeFocused();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toHaveCount(0);
});
