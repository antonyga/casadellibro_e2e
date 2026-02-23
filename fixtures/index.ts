import { test as base } from "@playwright/test";
import { HomePage } from "../pages/home-page";
import { ResultsPage } from "../pages/results-page";
import { LoginPage } from "../pages/login-page";
import { AccountPage } from "../pages/account-page";
import { LibrariesPage } from "../pages/libraries-page";

interface PageFixtures {
  homePage: HomePage;
  resultsPage: ResultsPage;
  loginPage: LoginPage;
  accountPage: AccountPage;
  librariesPage: LibrariesPage;
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

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  accountPage: async ({ page }, use) => {
    const accountPage = new AccountPage(page);
    await use(accountPage);
  },

  librariesPage: async ({ page }, use) => {
    const librariesPage = new LibrariesPage(page);
    await use(librariesPage);
  },
});

export { expect } from "@playwright/test";
