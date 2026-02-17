import { test as base } from "@playwright/test";
import { HomePage } from "../pages/home-page";
import { ResultsPage } from "../pages/results-page";

interface PageFixtures {
  homePage: HomePage;
  resultsPage: ResultsPage;
}

export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  resultsPage: async ({ page }, use) => {
    const resultsPage = new ResultsPage(page);
    await use(resultsPage);
  },
});

export { expect } from "@playwright/test";
