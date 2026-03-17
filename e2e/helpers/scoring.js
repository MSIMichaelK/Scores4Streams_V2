/**
 * Scoring helpers for E2E tests.
 * Wrappers around common scoring actions with verification.
 */
import { expect } from "@playwright/test";

/**
 * Click an action button by test ID.
 */
async function clickAction(page, testId) {
  // Wait for element to be stable (handles React re-render detach)
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

export {
  clickAction,
  verifyBSO,
  verifyScore,
  verifyInning,
  selectFielders,
  selectRunner,
  selectRunnersMulti,
};
