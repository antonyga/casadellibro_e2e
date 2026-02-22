import { test, expect } from "../fixtures";

test.describe("Visual Snapshots", () => {
  test("should capture homepage screenshot", async ({ homePage, page }) => {
    await test.step("Navigate to home page", async () => {
      await homePage.goto();
    });

    await test.step("Capture homepage snapshot", async () => {
      await expect(page).toHaveScreenshot("homepage.png", { fullPage: false });
    });
  });

  test("should capture search results screenshot", async ({
    homePage,
    page,
  }) => {
    await test.step("Navigate to home page", async () => {
      await homePage.goto();
    });

    await test.step("Search for a book", async () => {
      await homePage.searchForBook("El Quijote");
    });

    await test.step("Capture search results snapshot", async () => {
      await expect(page).toHaveScreenshot("search-results.png", {
        fullPage: false,
      });
    });
  });

  test("should capture login form screenshot", async ({ loginPage, page }) => {
    await test.step("Navigate to login page", async () => {
      await loginPage.goto();
    });

    await test.step("Capture login form snapshot", async () => {
      await expect(page).toHaveScreenshot("login-form.png", {
        fullPage: false,
      });
    });
  });
});
