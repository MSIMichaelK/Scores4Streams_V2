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
  verifyRunners,
  tapBase,
  moveRunner,
} from "./helpers/scoring.js";

test.describe("Advanced Scoring — Deep Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    const ts = Date.now().toString(36);
    await createAndOpenGame(page, { homeTeam: `DH-${ts}`, awayTeam: `DA-${ts}`, mode: "advanced" });
  });

  // ─── Runner Move via Diamond Tap ──────────────────────────

  test("runner_move: tap 3rd → tap home scores a run", async ({ page }) => {
    // Triple puts runner on 3rd
    await clickAction(page, "btn-3b");
    await verifyRunners(page, { third: true });
    // Tap 3rd to select, tap home to score
    await moveRunner(page, "third", "home");
    await verifyScore(page, 0, 1);
    await verifyRunners(page, { third: false });
  });

  test("runner_move: tap 1st → tap 2nd advances runner", async ({ page }) => {
    await clickAction(page, "btn-1b");
    await verifyRunners(page, { first: true });
    await moveRunner(page, "first", "second");
    await verifyRunners(page, { first: false, second: true });
  });

  test("runner_move: tap 2nd → tap 3rd advances runner", async ({ page }) => {
    await clickAction(page, "btn-2b");
    await verifyRunners(page, { second: true });
    await moveRunner(page, "second", "third");
    await verifyRunners(page, { second: false, third: true });
  });

  test("runner_move: deselect by tapping same base twice", async ({ page }) => {
    await clickAction(page, "btn-1b");
    await tapBase(page, "first"); // select
    await tapBase(page, "first"); // deselect
    // Runner should still be on first, no move
    await verifyRunners(page, { first: true });
  });

  // ─── Force-Chain: Walk with Loaded Bases ──────────────────

  test("walk with bases loaded: force-chain scores runner from 3rd", async ({ page }) => {
    // Load bases: single, single, single
    await clickAction(page, "btn-1b"); // runner on 1st
    await clickAction(page, "btn-1b"); // 1st→2nd, new on 1st
    await clickAction(page, "btn-1b"); // 2nd→3rd, 1st→2nd, new on 1st
    await verifyRunners(page, { first: true, second: true, third: true });
    // Walk = force all runners, 3rd scores
    for (let i = 0; i < 4; i++) {
      await clickAction(page, "btn-ball");
    }
    await verifyScore(page, 0, 1);
    // All bases should still be loaded (runners shifted + batter on 1st)
    await verifyRunners(page, { first: true, second: true, third: true });
  });

  test("HBP with bases loaded: force-chain scores runner from 3rd", async ({ page }) => {
    // Load bases
    await clickAction(page, "btn-1b");
    await clickAction(page, "btn-1b");
    await clickAction(page, "btn-1b");
    await verifyRunners(page, { first: true, second: true, third: true });
    // HBP = same force-chain
    await clickAction(page, "btn-hbp");
    await verifyScore(page, 0, 1);
    await verifyRunners(page, { first: true, second: true, third: true });
  });

  test("walk with runner on 1st only: no run scores", async ({ page }) => {
    await clickAction(page, "btn-1b"); // runner on 1st
    for (let i = 0; i < 4; i++) {
      await clickAction(page, "btn-ball");
    }
    await verifyScore(page, 0, 0);
    await verifyRunners(page, { first: true, second: true });
  });

  // ─── Undo/Redo of Advanced Actions ─────────────────────────

  test("undo ground out reverts out count", async ({ page }) => {
    await clickAction(page, "btn-go");
    await selectFielders(page, [6, 3]);
    await verifyBSO(page, 0, 0, 1);
    await clickAction(page, "btn-undo");
    await verifyBSO(page, 0, 0, 0);
  });

  test("undo sac fly reverts out and run", async ({ page }) => {
    await clickAction(page, "btn-3b"); // runner on 3rd
    await clickAction(page, "btn-sac"); // sac fly = out + run
    await verifyBSO(page, 0, 0, 1);
    await verifyScore(page, 0, 1);
    await clickAction(page, "btn-undo");
    await verifyBSO(page, 0, 0, 0);
    await verifyScore(page, 0, 0);
    await verifyRunners(page, { third: true });
  });

  test("undo double play reverts 2 outs", async ({ page }) => {
    await clickAction(page, "btn-1b"); // runner on 1st
    await clickAction(page, "btn-dp");
    await selectFielders(page, [6, 4, 3]);
    await verifyBSO(page, 0, 0, 2);
    await clickAction(page, "btn-undo");
    await verifyBSO(page, 0, 0, 0);
    await verifyRunners(page, { first: true });
  });

  test("redo after undo restores advanced action", async ({ page }) => {
    await clickAction(page, "btn-go");
    await selectFielders(page, [4, 3]);
    await verifyBSO(page, 0, 0, 1);
    await clickAction(page, "btn-undo");
    await verifyBSO(page, 0, 0, 0);
    await clickAction(page, "btn-redo");
    await verifyBSO(page, 0, 0, 1);
  });

  // ─── Multi-Inning Advanced Game ────────────────────────────

  test("full inning: top half with mixed plays, then bottom half", async ({ page }) => {
    // Top of 1st: single, GO 6-3, fly out 8, K
    await clickAction(page, "btn-1b"); // single
    await verifyRunners(page, { first: true });

    await clickAction(page, "btn-go");
    await selectFielders(page, [6, 3]);
    await verifyBSO(page, 0, 0, 1);

    await clickAction(page, "btn-fo");
    await selectFielders(page, [8]);
    await verifyBSO(page, 0, 0, 2);

    await clickAction(page, "btn-k");
    // 3 outs → flip to bottom of 1st
    await verifyBSO(page, 0, 0, 0);

    // Bottom of 1st: triple, sac fly (scores run), GO, K
    await clickAction(page, "btn-3b");
    await verifyRunners(page, { third: true });

    await clickAction(page, "btn-sac"); // out + run scores
    await verifyBSO(page, 0, 0, 1);
    await verifyScore(page, 1, 0);

    await clickAction(page, "btn-go");
    await selectFielders(page, [5, 3]);
    await verifyBSO(page, 0, 0, 2);

    await clickAction(page, "btn-k");
    // 3 outs → top of 2nd
    await verifyBSO(page, 0, 0, 0);
    await verifyInning(page, "2");
    await verifyScore(page, 1, 0);
  });

  // ─── Combo Scenarios ───────────────────────────────────────

  test("error + stolen base in same at-bat", async ({ page }) => {
    // Error puts batter on 1st
    await clickAction(page, "btn-error");
    await selectFielders(page, [6]);
    await verifyRunners(page, { first: true });
    // Stolen base
    await clickAction(page, "btn-more-plays");
    await clickAction(page, "btn-sb");
    await selectRunner(page, "first");
    await verifyRunners(page, { first: false, second: true });
  });

  test("single + runner_move from 1st to 3rd (manual advance)", async ({ page }) => {
    await clickAction(page, "btn-1b"); // runner on 1st
    await moveRunner(page, "first", "second"); // advance to 2nd
    await moveRunner(page, "second", "third"); // advance to 3rd
    await verifyRunners(page, { third: true });
  });

  test("walk + IBB back to back load bases", async ({ page }) => {
    // Walk
    for (let i = 0; i < 4; i++) {
      await clickAction(page, "btn-ball");
    }
    await verifyRunners(page, { first: true });
    // IBB
    await clickAction(page, "btn-more-plays");
    await clickAction(page, "btn-ibb");
    await verifyRunners(page, { first: true, second: true });
  });

  test("HR with runners on 1st and 3rd scores 3 runs", async ({ page }) => {
    // Use tap-to-toggle to manually place runners (avoids auto-advance)
    await tapBase(page, "first"); // toggle runner on 1st
    await tapBase(page, "third"); // toggle runner on 3rd
    await verifyRunners(page, { first: true, third: true });
    await clickAction(page, "btn-hr"); // HR = 3 runs (batter + 2 runners)
    await verifyScore(page, 0, 3);
    await verifyRunners(page, { first: false, second: false, third: false });
  });
});
