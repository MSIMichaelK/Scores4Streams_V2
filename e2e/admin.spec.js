// @ts-check
import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth.js";
import { createGameAndStayOnConsole } from "./helpers/game.js";

test.describe("Admin & Team Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("game creation: Simple mode → mode badge visible", async ({ page }) => {
    const ts = Date.now().toString(36);
    const homeTeam = `E2EH-${ts}`;
    const awayTeam = `E2EA-${ts}`;
    await createGameAndStayOnConsole(page, { homeTeam, awayTeam, mode: "simple" });
    const gameItem = page.locator("[data-testid^='game-item-']", { hasText: `${homeTeam} vs ${awayTeam}` });
    await expect(gameItem).toBeVisible({ timeout: 10000 });
    await expect(gameItem).toContainText("Simple");
  });

  test("game creation: Advanced mode → mode badge visible", async ({ page }) => {
    const ts = Date.now().toString(36);
    const homeTeam = `E2EAH-${ts}`;
    const awayTeam = `E2EAA-${ts}`;
    await createGameAndStayOnConsole(page, { homeTeam, awayTeam, mode: "advanced" });
    const gameItem = page.locator("[data-testid^='game-item-']", { hasText: `${homeTeam} vs ${awayTeam}` });
    await expect(gameItem).toBeVisible({ timeout: 10000 });
    await expect(gameItem).toContainText("Advanced");
  });

  test("navigate to settings → profile info visible", async ({ page }) => {
    await page.getByTestId("nav-settings").click();
    await expect(page.getByTestId("settings-email")).toBeVisible();
    await expect(page.getByTestId("settings-team")).toBeVisible();
  });

  test("team roster: add player", async ({ page }) => {
    await page.getByTestId("nav-settings").click();
    // Wait for roster section to load
    await page.waitForSelector("[data-testid='trm-btn-add']", { timeout: 10000 });
    await page.getByTestId("trm-btn-add").click();

    // Fill player form with unique name to avoid duplicates
    const ts = Date.now().toString(36);
    await page.getByTestId("trm-input-firstname").fill("E2E");
    await page.getByTestId("trm-input-lastname").fill(`Player-${ts}`);
    await page.getByTestId("trm-input-number").fill("99");
    await page.getByTestId("trm-btn-save").click();

    // Verify player appears in roster list
    await expect(page.getByText(`Player-${ts}`)).toBeVisible({ timeout: 5000 });
  });

  test("team roster: edit player", async ({ page }) => {
    await page.getByTestId("nav-settings").click();
    await page.waitForSelector("[data-testid='trm-btn-add']", { timeout: 10000 });

    // Find a player's edit button (first one in list)
    const editBtn = page.locator("[data-testid^='trm-btn-edit-']").first();
    if (await editBtn.count() === 0) {
      test.skip(true, "No players to edit");
      return;
    }
    await editBtn.click();

    // Change the number to a unique value
    const num = String(Math.floor(Math.random() * 90) + 10);
    await page.getByTestId("trm-input-number").fill(num);
    await page.getByTestId("trm-btn-save").click();

    // Verify updated number appears
    await expect(page.getByText(`#${num}`)).toBeVisible({ timeout: 5000 });
  });

  test("team roster: deactivate and reactivate player", async ({ page }) => {
    await page.getByTestId("nav-settings").click();
    await page.waitForSelector("[data-testid='trm-btn-add']", { timeout: 10000 });

    // Deactivate the first player
    const deactivateBtn = page.locator("[data-testid^='trm-btn-deactivate-']").first();
    if (await deactivateBtn.count() === 0) {
      test.skip(true, "No active players to deactivate");
      return;
    }

    await deactivateBtn.click();

    // Player should disappear from active list
    await page.waitForTimeout(1000);

    // Toggle to show inactive players
    await page.getByTestId("trm-toggle-inactive").check();
    await page.waitForTimeout(1000);

    // Player should be visible in inactive list
    const reactivateBtn = page.locator("[data-testid^='trm-btn-reactivate-']").first();
    await expect(reactivateBtn).toBeVisible({ timeout: 5000 });

    // Reactivate
    await reactivateBtn.click();
    await page.waitForTimeout(1000);

    // Uncheck inactive toggle — player should be back in active list
    await page.getByTestId("trm-toggle-inactive").uncheck();
    await page.waitForTimeout(1000);
  });

  test("nav tabs work: Score → Stats → Settings", async ({ page }) => {
    // Score tab (console)
    await expect(page).toHaveURL(/\/console/);

    // Stats tab
    await page.getByTestId("nav-stats").click();
    await expect(page).toHaveURL(/\/stats/);

    // Settings tab
    await page.getByTestId("nav-settings").click();
    await expect(page).toHaveURL(/\/settings/);

    // Back to Score
    await page.getByTestId("nav-score").click();
    await expect(page).toHaveURL(/\/console/);
  });
});
