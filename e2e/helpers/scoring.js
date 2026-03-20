/**
 * Scoring helpers for E2E tests.
 * Wrappers around common scoring actions with verification.
 */
import { expect } from "@playwright/test";

// Buttons that live inside the OutcomePanel (require "In Play" to be open first)
const OUTCOME_PANEL_BUTTONS = new Set([
  "btn-1b", "btn-2b", "btn-3b", "btn-hr",
  "btn-go", "btn-fo", "btn-lo", "btn-po",
  "btn-k", "btn-kc", "btn-dp", "btn-tp",
  "btn-error", "btn-fc", "btn-sac", "btn-d3k",
  "btn-more-plays",
]);

// Buttons behind the "More" toggle inside the OutcomePanel
const MORE_PLAYS_BUTTONS = new Set([
  "btn-ff", "btn-if", "btn-int", "btn-out-generic",
  "btn-sac-b", "btn-bh", "btn-sl", "btn-ibb", "btn-obs", "btn-ip",
  "btn-sb", "btn-cs", "btn-pk", "btn-wp", "btn-pb",
]);

/**
 * Open the In Play outcome panel if not already visible.
 */
async function openInPlay(page) {
  const panel = page.locator(".outcome-panel");
  if (await panel.isVisible().catch(() => false)) return;
  await page.getByTestId("btn-in-play").click();
  await panel.waitFor({ state: "visible", timeout: 3000 });
}

/**
 * Click an action button by test ID.
 * Automatically opens the In Play panel and/or More toggle as needed.
 */
async function clickAction(page, testId) {
  // If this button is behind "More" in the OutcomePanel, open both
  if (MORE_PLAYS_BUTTONS.has(testId)) {
    await openInPlay(page);
    // Click "More" toggle if the button isn't visible yet
    const btn = page.getByTestId(testId);
    if (!(await btn.isVisible().catch(() => false))) {
      await page.getByTestId("btn-more-plays").click();
      await btn.waitFor({ state: "visible", timeout: 3000 });
    }
  } else if (OUTCOME_PANEL_BUTTONS.has(testId)) {
    await openInPlay(page);
  }
  const locator = page.getByTestId(testId);
  await locator.waitFor({ state: "visible", timeout: 5000 });
  await locator.click({ timeout: 10000 });
}

/**
 * Verify BSO counts using data-count attributes.
 */
async function verifyBSO(page, balls, strikes, outs) {
  await expect(page.getByTestId("bso-balls")).toHaveAttribute("data-count", String(balls));
  await expect(page.getByTestId("bso-strikes")).toHaveAttribute("data-count", String(strikes));
  await expect(page.getByTestId("bso-outs")).toHaveAttribute("data-count", String(outs));
}

/**
 * Verify home and away scores.
 */
async function verifyScore(page, home, away) {
  await expect(page.getByTestId("score-away")).toHaveText(String(away));
  await expect(page.getByTestId("score-home")).toHaveText(String(home));
}

/**
 * Verify inning display text (e.g., "▲ 1" for top of 1st).
 */
async function verifyInning(page, text) {
  await expect(page.getByTestId("inning-display")).toContainText(text);
}

/**
 * Select fielders in the fielder picker modal.
 * @param {number[]} positions - e.g., [6, 4, 3] for 6-4-3 double play
 */
async function selectFielders(page, positions) {
  for (const pos of positions) {
    // Find button that starts with fpm-btn-{pos}
    await page.locator(`[data-testid^="fpm-btn-${pos}-"]`).click();
  }
  await page.getByTestId("fpm-btn-confirm").click();
}

/**
 * Select a runner in the runner picker modal.
 */
async function selectRunner(page, base) {
  await page.getByTestId(`rpm-btn-${base}`).click();
}

/**
 * Select multiple runners and confirm (for WP/PB multi-select).
 */
async function selectRunnersMulti(page, bases) {
  for (const base of bases) {
    await page.getByTestId(`rpm-btn-${base}`).click();
  }
  await page.getByTestId("rpm-btn-confirm").click();
}

/**
 * Verify runner presence on bases.
 * @param {object} expected - { first: bool, second: bool, third: bool }
 */
async function verifyRunners(page, { first = false, second = false, third = false } = {}) {
  const bases = { first, second, third };
  for (const [base, shouldBeOccupied] of Object.entries(bases)) {
    const polygon = page.locator(`[data-testid="base-${base}"] polygon`);
    const fill = await polygon.getAttribute("fill");
    if (shouldBeOccupied) {
      expect(fill, `Expected runner on ${base}`).not.toBe("transparent");
    } else {
      expect(fill, `Expected no runner on ${base}`).toBe("transparent");
    }
  }
}

/**
 * Tap a base on the diamond (for runner_move: select then move).
 * Uses evaluate to dispatch click directly on the SVG element.
 */
async function tapBase(page, base) {
  await page.evaluate((b) => {
    const el = document.querySelector(`[data-testid="base-${b}"] polygon`);
    if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, base);
  // Allow React to process the state update
  await page.waitForTimeout(100);
}

/**
 * Move a runner from one base to another via tap-to-select, tap-to-move.
 * Waits for the selected state (orange fill) before tapping destination.
 */
async function moveRunner(page, from, to) {
  await tapBase(page, from);
  // Wait for selection to render (orange = #f39c12)
  await expect(page.locator(`[data-testid="base-${from}"] polygon`))
    .toHaveAttribute("fill", "#f39c12", { timeout: 3000 });
  await tapBase(page, to);
}

export {
  clickAction,
  openInPlay,
  verifyBSO,
  verifyScore,
  verifyInning,
  selectFielders,
  selectRunner,
  selectRunnersMulti,
  verifyRunners,
  tapBase,
  moveRunner,
};
