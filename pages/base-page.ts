import { type Page, type Locator } from "@playwright/test";

export class BasePage {
  readonly page: Page;
  readonly acceptCookiesButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.acceptCookiesButton = page.locator("#onetrust-accept-btn-handler");
  }

  async acceptCookies(): Promise<void> {
    try {
      await this.acceptCookiesButton.waitFor({ state: "visible", timeout: 5000 });
      await this.acceptCookiesButton.click();
      await this.acceptCookiesButton.waitFor({ state: "hidden", timeout: 3000 });
    } catch {
      // Cookie banner may not appear (already accepted or not shown)
    }
  }
}
