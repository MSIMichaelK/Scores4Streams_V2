/**
 * Game creation and navigation helpers for E2E tests.
 */

/**
 * Create a game from the console page and navigate into its scoring page.
 * The GameCreationForm auto-navigates to /manual/:gameId on success,
 * so we just need to wait for the scoring UI to appear.
 */
async function createAndOpenGame(page, { homeTeam = "Home", awayTeam = "Away", mode = "simple" } = {}) {
  // Fill required fields
  await page.getByTestId("gcf-input-home-team").fill(homeTeam);
  await page.getByTestId("gcf-input-away-team").fill(awayTeam);

  // Start time — set to now
  const now = new Date();
  const localISO = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0") + "T" +
    String(now.getHours()).padStart(2, "0") + ":" +
    String(now.getMinutes()).padStart(2, "0");
  await page.getByTestId("gcf-input-start-time").fill(localISO);

  // League
  await page.getByTestId("gcf-input-league").fill("E2E Test League");

  // Select scoring mode
  if (mode === "advanced") {
    await page.getByTestId("gcf-mode-advanced").click();
  } else {
    await page.getByTestId("gcf-mode-simple").click();
  }

  await page.getByTestId("gcf-btn-create").click();

  // Form auto-navigates to /manual/:gameId — wait for scoring page
  await page.waitForURL("**/manual/**", { timeout: 15000 });

  // Advanced mode shows a lineup prompt first — skip it
  if (mode === "advanced") {
    const skipBtn = page.locator("text=Skip Lineups");
    await skipBtn.waitFor({ state: "visible", timeout: 5000 });
    await skipBtn.click();
  }

  await page.getByTestId("bso-balls").waitFor({ state: "visible", timeout: 10000 });
}

/**
 * Create a game and stay on the console page (for admin tests that check the game list).
 * We intercept the navigation by going back after creation.
 */
async function createGameAndStayOnConsole(page, { homeTeam = "Home", awayTeam = "Away", mode = "simple" } = {}) {
  await page.getByTestId("gcf-input-home-team").fill(homeTeam);
  await page.getByTestId("gcf-input-away-team").fill(awayTeam);

  const now = new Date();
  const localISO = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0") + "T" +
    String(now.getHours()).padStart(2, "0") + ":" +
    String(now.getMinutes()).padStart(2, "0");
  await page.getByTestId("gcf-input-start-time").fill(localISO);
  await page.getByTestId("gcf-input-league").fill("E2E Test League");

  if (mode === "advanced") {
    await page.getByTestId("gcf-mode-advanced").click();
  } else {
    await page.getByTestId("gcf-mode-simple").click();
  }

  await page.getByTestId("gcf-btn-create").click();

  // Wait for navigation to scoring page, then go back to console
  await page.waitForURL("**/manual/**", { timeout: 15000 });
  await page.goto("/console");
  await page.getByTestId("game-list").waitFor({ state: "visible", timeout: 10000 });
}

export { createAndOpenGame, createGameAndStayOnConsole };
