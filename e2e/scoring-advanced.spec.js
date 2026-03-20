// @ts-check
import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth.js";
import { createAndOpenGame } from "./helpers/game.js";
import {
  clickAction,
  verifyBSO,
  verifyScore,
  verifyInning,
  selectFielders,
  selectRunner,
  selectRunnersMulti,
} from "./helpers/scoring.js";

test.describe("Advanced Mode Scoring", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    const ts = Date.now().toString(36);
    await createAndOpenGame(page, { homeTeam: `AH-${ts}`, awayTeam: `AA-${ts}`, mode: "advanced" });
  });

  test("ground out with fielder chain: 6-3", async ({ page }) => {
    // Expand outs menu
    // Click GO
    await clickAction(page, "btn-go");
    // Fielder picker opens — select 6 (SS) then 3 (1B)
    await selectFielders(page, [6, 3]);
    // Verify out recorded
    await verifyBSO(page, 0, 0, 1);
  });

  test("fly out with single fielder: 8 (CF)", async ({ page }) => {
    await clickAction(page, "btn-fo");
    await selectFielders(page, [8]);
    await verifyBSO(page, 0, 0, 1);
  });

  test("strikeout swinging (K)", async ({ page }) => {
    await clickAction(page, "btn-k");
    // K doesn't open fielder picker — direct out
    await verifyBSO(page, 0, 0, 1);
  });

  test("strikeout looking (KC)", async ({ page }) => {
    await clickAction(page, "btn-kc");
    await verifyBSO(page, 0, 0, 1);
  });

  test("double play: 6-4-3", async ({ page }) => {
    // First, put a runner on 1st
    await clickAction(page, "btn-1b");
    // Now double play
    await clickAction(page, "btn-dp");
    await selectFielders(page, [6, 4, 3]);
    // DP = 2 outs
    await verifyBSO(page, 0, 0, 2);
  });

  test("error: fielder picker → batter on base", async ({ page }) => {
    await clickAction(page, "btn-error");
    // Fielder picker opens — select fielder 6 (SS)
    await selectFielders(page, [6]);
    // Error = batter reaches, no out
    await verifyBSO(page, 0, 0, 0);
  });

  test("HBP: batter reaches first", async ({ page }) => {
    await clickAction(page, "btn-hbp");
    // No picker needed — direct action
    await verifyBSO(page, 0, 0, 0);
  });

  test("fielder's choice: out + batter on 1st", async ({ page }) => {
    // Put runner on 1st
    await clickAction(page, "btn-1b");
    // FC
    await clickAction(page, "btn-fc");
    await selectFielders(page, [6, 4]);
    // FC records 1 out
    await verifyBSO(page, 0, 0, 1);
  });

  test("sac fly: out + runner scores from 3rd", async ({ page }) => {
    // Put runner on 3rd via triple
    await clickAction(page, "btn-3b");
    // Sac fly
    await clickAction(page, "btn-sac");
    // Sac fly = 1 out, runner from 3rd scores
    await verifyBSO(page, 0, 0, 1);
    await verifyScore(page, 0, 1);
  });

  test("more plays toggle shows extra buttons", async ({ page }) => {
    await clickAction(page, "btn-more-plays");
    // Should now see base running buttons if runners exist
    await expect(page.getByTestId("btn-sac-b")).toBeVisible();
    await expect(page.getByTestId("btn-bh")).toBeVisible();
    await expect(page.getByTestId("btn-ibb")).toBeVisible();
  });

  test("IBB: intentional walk", async ({ page }) => {
    await clickAction(page, "btn-more-plays");
    await clickAction(page, "btn-ibb");
    // Count resets, runner on 1st
    await verifyBSO(page, 0, 0, 0);
  });

  test("stolen base: runner advances", async ({ page }) => {
    // Put runner on 1st
    await clickAction(page, "btn-1b");
    // Open more plays
    await clickAction(page, "btn-more-plays");
    // SB
    await clickAction(page, "btn-sb");
    // Runner picker → select first base runner
    await selectRunner(page, "first");
    // No outs, runner should have advanced
    await verifyBSO(page, 0, 0, 0);
  });

  test("caught stealing: out recorded", async ({ page }) => {
    // Put runner on 1st
    await clickAction(page, "btn-1b");
    // Open more plays
    await clickAction(page, "btn-more-plays");
    // CS
    await clickAction(page, "btn-cs");
    await selectRunner(page, "first");
    // CS = 1 out
    await verifyBSO(page, 0, 0, 1);
  });

  test("wild pitch: runners advance", async ({ page }) => {
    // Put runner on 2nd
    await clickAction(page, "btn-2b");
    // Open more plays
    await clickAction(page, "btn-more-plays");
    // WP
    await clickAction(page, "btn-wp");
    // Multi-select runner picker → select second
    await selectRunnersMulti(page, ["second"]);
    // No out recorded
    await verifyBSO(page, 0, 0, 0);
  });

  test("line drive out (LO)", async ({ page }) => {
    await clickAction(page, "btn-lo");
    await selectFielders(page, [4]);
    await verifyBSO(page, 0, 0, 1);
  });

  test("popup out (PO)", async ({ page }) => {
    await clickAction(page, "btn-po");
    await selectFielders(page, [2]);
    await verifyBSO(page, 0, 0, 1);
  });

  test("foul fly out (FF)", async ({ page }) => {
    await clickAction(page, "btn-ff");
    await selectFielders(page, [5]);
    await verifyBSO(page, 0, 0, 1);
  });

  test("fielder picker: skip button sends null positions", async ({ page }) => {
    await clickAction(page, "btn-go");
    // Skip instead of selecting fielders
    await page.getByTestId("fpm-btn-skip").click();
    await verifyBSO(page, 0, 0, 1);
  });

  test("fielder picker: chain display shows selected positions", async ({ page }) => {
    await clickAction(page, "btn-go");
    // Select 6 (SS)
    await page.locator("[data-testid^='fpm-btn-6-']").click();
    // Chain display should show "6"
    await expect(page.getByTestId("fpm-chain-display")).toContainText("6");
    // Select 3 (1B)
    await page.locator("[data-testid^='fpm-btn-3-']").click();
    // Chain display should show "6-3"
    await expect(page.getByTestId("fpm-chain-display")).toContainText("6-3");
    // Confirm
    await page.getByTestId("fpm-btn-confirm").click();
    await verifyBSO(page, 0, 0, 1);
  });

  test("fielder picker: cancel returns to scoring without action", async ({ page }) => {
    await clickAction(page, "btn-go");
    // Cancel
    await page.getByTestId("fpm-btn-cancel").click();
    // No out recorded
    await verifyBSO(page, 0, 0, 0);
  });

  test("full half-inning: 3 outs via various plays", async ({ page }) => {
    // Out 1: Ground out 6-3
    await clickAction(page, "btn-go");
    await selectFielders(page, [6, 3]);
    await verifyBSO(page, 0, 0, 1);

    // Hit: single (keeps things interesting)
    await clickAction(page, "btn-1b");

    // Out 2: Fly out to CF
    await clickAction(page, "btn-fo");
    await selectFielders(page, [8]);
    await verifyBSO(page, 0, 0, 2);

    // Out 3: Strikeout
    await clickAction(page, "btn-k");
    // Should flip to bottom of inning
    await verifyBSO(page, 0, 0, 0);
  });
});
