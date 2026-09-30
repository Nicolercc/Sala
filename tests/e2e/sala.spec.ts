import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const routes = ["/", "/checkin", "/staff", "/board", "/design-system", "/case-study"];

test("visits all routes", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
  }
});

test("root prototype check-in reaches the board without storage", async ({ page }) => {
  await page.goto("/");
  const kiosk = page.locator("#kiosk");
  await page.getByRole("button", { name: "Start check-in" }).click();
  await expect(page.getByRole("heading", { name: "Who's checking in?" })).toBeVisible();
  await kiosk.getByLabel("First name").fill("Lina");
  await kiosk.getByLabel("Last name").fill("Campos");
  // Date of birth is a fieldset of three labelled inputs.
  await kiosk.getByLabel("Month").fill("04");
  await kiosk.getByLabel("Day").fill("12");
  await kiosk.getByLabel("Year").fill("1990");
  await page.getByRole("button", { name: "Continue" }).click();
  await kiosk.getByText("Follow-up", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Confirm check-in" }).click();
  await expect(page.getByRole("heading", { name: "You're checked in" })).toBeVisible();
  const issuedToken = kiosk.locator(".token-card .label");
  const token = await issuedToken.textContent();

  await expect(issuedToken).toBeVisible();
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
  // The seeded patient born 1975-11-02 is shown in the kiosk's MM/DD/YYYY format.
  await expect(page.getByText("11/02/1975")).toBeVisible();
  const lens = page.getByRole("switch", { name: /^Privacy lens/ });
  await expect(lens).toHaveAccessibleName("Privacy lens: off");
  await lens.click();
  await expect(lens).toHaveAttribute("aria-checked", "true");
  await expect(lens).toHaveAccessibleName("Privacy lens: on");
  await expect(page.locator("#staffLive")).toContainText("Identifiers hidden");
  await expect(page.getByText("11/02/1975")).toHaveCount(0);
});

test("blocks third-party requests", async ({ page }) => {
  const badOrigins: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:3000") {
      badOrigins.push(url.origin);
    }
  });

  await page.goto("/");
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

const narrowWidths = [320, 390, 430, 768];

async function expectNoPageOverflow(page: Page, context: string) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(scrollWidth, `${context} scrolls sideways`).toBeLessThanOrEqual(clientWidth);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

for (const width of narrowWidths) {
  test(`no page-level horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await expectNoPageOverflow(page, `${route} at ${width}px`);
    }
  });
}

// Walks the real kiosk flow and checks every screen a patient sees.
for (const width of [320, 390, 1440]) {
  test(`root check-in steps pass axe and reflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const kiosk = page.locator("#kiosk");
    const check = async (step: string) => {
      await expectNoAxeViolations(page);
      await expectNoPageOverflow(page, `${step} at ${width}px`);
    };

    await page.getByRole("button", { name: "Start check-in" }).click();
    await expect(page.getByRole("heading", { name: "Who's checking in?" })).toBeVisible();
    await check("step 1 form");

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(kiosk.getByRole("alert")).toBeVisible();
    await check("step 1 errors");

    await kiosk.getByLabel("First name").fill("Lina");
    await kiosk.getByLabel("Last name").fill("Campos");
    await kiosk.getByLabel("Month").fill("04");
    await kiosk.getByLabel("Day").fill("12");
    await kiosk.getByLabel("Year").fill("1990");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "What's the visit for?" })).toBeVisible();
    await check("step 2 visit");

    await kiosk.getByText("Follow-up", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Check your details" })).toBeVisible();
    await check("step 3 review");

    await page.getByRole("button", { name: "Confirm check-in" }).click();
    await expect(page.getByRole("heading", { name: "You're checked in" })).toBeVisible();
    await check("confirmation");
  });
}

test("review step pairs each label with its value and names each Edit button", async ({ page }) => {
  await page.goto("/");
  const kiosk = page.locator("#kiosk");
  await page.getByRole("button", { name: "Start check-in" }).click();
  await kiosk.getByLabel("First name").fill("Lina");
  await kiosk.getByLabel("Last name").fill("Campos");
  await kiosk.getByLabel("Month").fill("04");
  await kiosk.getByLabel("Day").fill("12");
  await kiosk.getByLabel("Year").fill("1990");
  await page.getByRole("button", { name: "Continue" }).click();
  await kiosk.getByText("Follow-up", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  const review = kiosk.locator("dl.review");
  await expect(review.getByRole("term")).toHaveText(["Name", "Date of birth", "Visit", "Note for staff"]);
  await expect(review.getByRole("definition").first()).toContainText("Lina Campos");
  for (const label of ["Name", "Date of birth", "Visit", "Note for staff"]) {
    await expect(review.getByRole("button", { name: `Edit ${label}`, exact: true })).toBeVisible();
  }

  await review.getByRole("button", { name: "Edit Visit", exact: true }).click();
  await expect(page.getByRole("heading", { name: "What's the visit for?" })).toBeVisible();
});

test("staff table scrolls inside its panel at phone width, with visible focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/staff");
  await expectNoPageOverflow(page, "/staff at 390px");

  const table = page.getByRole("table");
  const scrollBox = page.locator("div.overflow-x-auto").filter({ has: table });
  const overflow = await scrollBox.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow, "the table should scroll inside its panel").toBeGreaterThan(0);

  // Keyboard users reach the right-most column; focus brings it into view with a visible ring.
  const firstStatus = page.getByRole("combobox", { name: /^Status for / }).first();
  for (let i = 0; i < 40 && !(await firstStatus.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(firstStatus).toBeFocused();
  await expect(firstStatus).toBeInViewport();
  const outline = await firstStatus.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
  await expectNoPageOverflow(page, "/staff after keyboard focus");
});

test("home waiting-room board receives only public fields while staff keep the full record", async ({ page }) => {
  await page.goto("/");
  const kiosk = page.locator("#kiosk");
  await page.getByRole("button", { name: "Start check-in" }).click();
  await kiosk.getByLabel("First name").fill("Lina");
  await kiosk.getByLabel("Last name").fill("Campos");
  await kiosk.getByLabel("Month").fill("04");
  await kiosk.getByLabel("Day").fill("12");
  await kiosk.getByLabel("Year").fill("1990");
  await page.getByRole("button", { name: "Continue" }).click();
  await kiosk.getByText("Follow-up", { exact: true }).click();
  await kiosk.getByLabel(/Anything the front desk should know/).fill("Sentinel staff-only note");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Confirm check-in" }).click();
  const token = (await kiosk.locator(".token-card .label").textContent()) ?? "";
  expect(token).not.toBe("");

  const board = page.getByRole("region", { name: "Waiting room" });
  await expect(board.getByText(token, { exact: true })).toBeVisible();
  const boardHtml = await board.innerHTML();
  for (const privateValue of ["Lina", "Campos", "04/12/1990", "1990-04-12", "Follow-up", "Sentinel staff-only note", "James", "Okafor"]) {
    expect(boardHtml, `board markup contains ${privateValue}`).not.toContain(privateValue);
  }
  expect(boardHtml).not.toContain("data-id");

  const staff = page.locator("#staff");
  await expect(staff.getByText("Lina Campos")).toBeVisible();
  await expect(staff.getByText("04/12/1990")).toBeVisible();
  await expect(staff.getByText("Note: Sentinel staff-only note")).toBeVisible();
});

test("an attempt to send a name to the board is blocked by the display contract", async ({ page }) => {
  await page.goto("/");
  const board = page.getByRole("region", { name: "Waiting room" });
  const before = await board.innerHTML();
  await page.getByRole("button", { name: "Try to send a name" }).click();
  await expect(page.locator("#verdict")).toContainText("Blocked. firstName and lastName");
  expect(await board.innerHTML()).toBe(before);
});

test("root page asks for made-up details, not real ones", async ({ page }) => {
  await page.goto("/");
  const intro = page.locator("header .brand p");
  await expect(intro).toContainText("use a made-up name and birth date");
  await expect(intro).toContainText("never saved");
  await expect(intro).not.toContainText("real name");
});

test("idle blur activates on staff and resumes", async ({ page }) => {
  await page.clock.install();
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Staff queue" })).toBeVisible();
  await page.clock.fastForward(61_000);
  await expect(page.getByRole("button", { name: "Resume" })).toBeFocused();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toHaveCount(0);
});
