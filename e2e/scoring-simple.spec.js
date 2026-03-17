// @ts-check
import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth.js";
import { createAndOpenGame } from "./helpers/game.js";
import { clickAction, verifyBSO, verifyScore, verifyInning } from "./helpers/scoring.js";

test.describe("Simple Mode Scoring", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Use unique team names per test run to avoid collisions
    const ts = Date.now().toString(36);
    await createAndOpenGame(page, { homeTeam: `SH-${ts}`, awayTeam: `SA-${ts}`, mode: "simple" });
  });

  test("initial state: 0-0 score, top 1, BSO all zero", async ({ page }) => {
    await verifyScore(page, 0, 0);
    await verifyBSO(page, 0, 0, 0);
    await verifyInning(page, "1");
  });

  test("ball increments ball count", async ({ page }) => {
    await clickAction(page, "btn-ball");
    await verifyBSO(page, 1, 0, 0);

    await clickAction(page, "btn-ball");
    await verifyBSO(page, 2, 0, 0);
  });

  test("strike increments strike count", async ({ page }) => {
    await clickAction(page, "btn-strike");
    await verifyBSO(page, 0, 1, 0);

    await clickAction(page, "btn-strike");
    await verifyBSO(page, 0, 2, 0);
  });

  test("foul increments strikes up to 2", async ({ page }) => {
    await clickAction(page, "btn-foul");
    await verifyBSO(page, 0, 1, 0);

    await clickAction(page, "btn-foul");
    await verifyBSO(page, 0, 2, 0);

    // Third foul should NOT increment past 2
    await clickAction(page, "btn-foul");
    await verifyBSO(page, 0, 2, 0);
  });

  test("walk: 4 balls → count resets, runner on 1st", async ({ page }) => {
    for (let i = 0; i < 4; i++) {
      await clickAction(page, "btn-ball");
    }
    // Count resets after walk
    await verifyBSO(page, 0, 0, 0);
  });

  test("strikeout: 3 strikes → out, count resets", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await clickAction(page, "btn-strike");
    }
    await verifyBSO(page, 0, 0, 1);
  });

  test("out increments outs", async ({ page }) => {
    await clickAction(page, "btn-out");
    await verifyBSO(page, 0, 0, 1);

    await clickAction(page, "btn-out");
    await verifyBSO(page, 0, 0, 2);
  });

  test("3 outs → side change (top to bottom)", async ({ page }) => {
    await verifyInning(page, "1");
    // Record 3 outs
    for (let i = 0; i < 3; i++) {
      await clickAction(page, "btn-out");
    }
    // Should flip to bottom of 1st
    await verifyBSO(page, 0, 0, 0);
    // Inning should still show 1 but half should change
    const inningText = await page.getByTestId("inning-display").textContent();
    expect(inningText).toContain("1");
  });

  test("6 outs → moves to top of 2nd inning", async ({ page }) => {
    // 3 outs = bottom of 1st
    for (let i = 0; i < 3; i++) {
      await clickAction(page, "btn-out");
    }
    // 3 more outs = top of 2nd
    for (let i = 0; i < 3; i++) {
      await clickAction(page, "btn-out");
    }
    await verifyInning(page, "2");
  });

  test("single → 1B hit recorded", async ({ page }) => {
    await clickAction(page, "btn-1b");
    // Count should reset
    await verifyBSO(page, 0, 0, 0);
  });

  test("home run → score increments", async ({ page }) => {
    await clickAction(page, "btn-hr");
    // Away team batting in top of 1st, so away score increments
    await verifyScore(page, 0, 1);
  });

  test("score adjust: +/- buttons", async ({ page }) => {
    await clickAction(page, "score-home-plus");
    await verifyScore(page, 1, 0);

    await clickAction(page, "score-away-plus");
    await verifyScore(page, 1, 1);

    await clickAction(page, "score-home-minus");
    await verifyScore(page, 0, 1);

    await clickAction(page, "score-away-minus");
    await verifyScore(page, 0, 0);
  });

  test("undo reverts last action", async ({ page }) => {
    await clickAction(page, "btn-ball");
    await verifyBSO(page, 1, 0, 0);

    await clickAction(page, "btn-undo");
    await verifyBSO(page, 0, 0, 0);
  });

  test("redo restores undone action", async ({ page }) => {
    await clickAction(page, "btn-ball");
    await verifyBSO(page, 1, 0, 0);

    await clickAction(page, "btn-undo");
    await verifyBSO(page, 0, 0, 0);

    await clickAction(page, "btn-redo");
    await verifyBSO(page, 1, 0, 0);
  });

  test("pitch count increments on ball-in-play events", async ({ page }) => {
    const pitchCountEl = page.getByTestId("pitch-count");
    await expect(pitchCountEl).toContainText("0");

    // Ball = 1 pitch
    await clickAction(page, "btn-ball");
    await expect(pitchCountEl).toContainText("1");

    // Strike = 1 pitch
    await clickAction(page, "btn-strike");
    await expect(pitchCountEl).toContainText("2");

    // Hit (single) = 1 pitch
    await clickAction(page, "btn-1b");
    await expect(pitchCountEl).toContainText("3");
  });

  test("multi-play sequence: walk + HR = 2 runs", async ({ page }) => {
    // Walk → runner on 1st
    for (let i = 0; i < 4; i++) {
      await clickAction(page, "btn-ball");
    }
    // Home run → 2-run HR (batter + runner on 1st)
    await clickAction(page, "btn-hr");
    await verifyScore(page, 0, 2);
  });
});
