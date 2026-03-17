/**
 * Global setup: Login once with the test account and save storage state.
 * All tests reuse this state to avoid Firebase Auth rate limiting.
 */
import { chromium } from "@playwright/test";

const TEST_EMAIL = "claude-test@scores4streams.dev";
const TEST_PASSWORD = "TestAccount2026!";
const STORAGE_STATE_PATH = "e2e/.auth-state.json";

async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto("http://localhost:5173/login");
  await page.getByTestId("auth-input-email").fill(TEST_EMAIL);
  await page.getByTestId("auth-input-password").fill(TEST_PASSWORD);
  await page.getByTestId("auth-btn-signin").click();
  await page.waitForURL("**/console", { timeout: 30000 });
  await page.getByTestId("game-list").waitFor({ state: "visible", timeout: 15000 });

  // Save storage state (cookies + localStorage)
  await context.storageState({ path: STORAGE_STATE_PATH });

  await browser.close();
}

export default globalSetup;
