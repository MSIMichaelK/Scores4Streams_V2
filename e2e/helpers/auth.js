/**
 * Auth helpers for E2E tests.
 * Uses a real Firebase test account: claude-test@scores4streams.dev
 *
 * Firebase Auth persists in IndexedDB within the same browser context.
 * Each Playwright test gets a fresh context, so we must login each time.
 * To handle Firebase rate limiting, we retry with backoff.
 */

const TEST_EMAIL = "claude-test@scores4streams.dev";
const TEST_PASSWORD = "TestAccount2026!";

/**
 * Login with the test account. Retries on failure to handle Firebase rate limiting.
 */
async function login(page) {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto("/login");
      await page.getByTestId("auth-input-email").fill(TEST_EMAIL);
      await page.getByTestId("auth-input-password").fill(TEST_PASSWORD);
      await page.getByTestId("auth-btn-signin").click();
      await page.waitForURL("**/console", { timeout: 30000 });
      await page.getByTestId("game-list").waitFor({ state: "visible", timeout: 15000 });
      return; // Success
    } catch (err) {
      if (attempt === maxRetries) throw err;
      // Wait before retrying (exponential backoff)
      await page.waitForTimeout(5000 * attempt);
    }
  }
}

/**
 * Signup a new user. The form shows all fields at once —
 * team name + role are always visible alongside email/password.
 */
async function signup(page, email, password, teamName, role = "admin") {
  await page.goto("/login");
  await page.getByTestId("auth-input-email").fill(email);
  await page.getByTestId("auth-input-password").fill(password);
  await page.getByTestId("auth-input-team-name").fill(teamName);
  await page.getByTestId("auth-select-role").selectOption(role);
  await page.getByTestId("auth-btn-signup").click();
  await page.waitForURL("**/console", { timeout: 20000 });
}

/**
 * Sign out from settings page.
 */
async function logout(page) {
  await page.goto("/settings");
  await page.getByTestId("settings-btn-signout").click();
  await page.waitForURL("**/login", { timeout: 10000 });
}

export { login, signup, logout, TEST_EMAIL, TEST_PASSWORD };
