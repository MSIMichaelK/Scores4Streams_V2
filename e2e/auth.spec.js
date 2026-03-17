// @ts-check
import { test, expect } from "@playwright/test";
import { login, logout, TEST_EMAIL, TEST_PASSWORD } from "./helpers/auth.js";

test.describe("Auth Flow", () => {
  test("login with test account → console loads", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/console/);
    await expect(page.getByTestId("game-list")).toBeVisible();
  });

  test("sign out → redirected to login", async ({ page }) => {
    await login(page);
    await logout(page);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("auth-input-email")).toBeVisible();
  });

  test("auth guard: unauthenticated /console → redirect to /login", async ({ page }) => {
    await page.goto("/console");
    await page.waitForURL("**/login", { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("Google OAuth button exists and is clickable", async ({ page }) => {
    await page.goto("/login");
    const googleBtn = page.getByTestId("auth-btn-google");
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeEnabled();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("auth-input-email").fill(TEST_EMAIL);
    await page.getByTestId("auth-input-password").fill("WrongPassword!");
    await page.getByTestId("auth-btn-signin").click();
    await expect(page.getByTestId("auth-error")).toBeVisible({ timeout: 10000 });
  });

  test("signup without team name shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("auth-input-email").fill("test-noname@example.com");
    await page.getByTestId("auth-input-password").fill("TestPass123!");
    await page.getByTestId("auth-btn-signup").click();
    await expect(page.getByTestId("auth-error")).toBeVisible({ timeout: 5000 });
  });
});
