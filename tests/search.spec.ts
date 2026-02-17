import { test, expect } from "../fixtures";

test.describe("Book Search", () => {
  test("should find books when searching by title", async ({
    homePage,
    resultsPage,
  }) => {
    await test.step("Navigate to the home page", async () => {
      await homePage.goto();
    });

    await test.step("Search for a book", async () => {
      await homePage.searchForBook("El Quijote");
    });

    await test.step("Verify search results are displayed", async () => {
      const titles = await resultsPage.getBookTitles();
      expect(titles.length).toBeGreaterThan(0);
      console.log(`Found ${titles.length} results:`, titles.slice(0, 5));
    });
  });
});
