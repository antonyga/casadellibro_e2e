import { type Locator } from "@playwright/test";
import { BasePage } from "./base-page";

export class HomePage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: import("@playwright/test").Page) {
    super(page);
    this.searchInput = page.locator("#empathy-search");
    this.searchButton = page.locator("button[name='buscar']");
  }

  async goto(): Promise<void> {
    await this.page.goto("/", { waitUntil: "domcontentloaded" });
    await this.acceptCookies();
  }

  async searchForBook(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
  }
}
