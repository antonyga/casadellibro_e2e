import { type Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class ResultsPage extends BasePage {
  readonly resultItems: Locator;
  readonly bookTitles: Locator;

  constructor(page: import("@playwright/test").Page) {
    super(page);
    this.resultItems = page.locator(".x-root-container article.x-result");
    this.bookTitles = page.locator(
      ".x-root-container h2.x-font-bold.x-uppercase",
    );
  }

  async waitForResults(): Promise<void> {
    await expect(this.bookTitles.first()).toBeVisible({ timeout: 15000 });
  }

  async getBookTitles(): Promise<string[]> {
    await this.waitForResults();
    const titles = await this.bookTitles.allTextContents();
    return titles.map((t) => t.trim()).filter((t) => t.length > 0);
  }
}
