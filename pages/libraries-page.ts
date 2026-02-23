import { type Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class LibrariesPage extends BasePage {
  // Nav link in the site header
  readonly libreriasLink: Locator;
  // Toggle that opens the province search input (input-group append icon)
  readonly provinceFilterToggle: Locator;

  constructor(page: import("@playwright/test").Page) {
    super(page);
    this.libreriasLink = page.getByRole("link", { name: /librerías/i });
    // CSS selector from codegen — opens the province search field
    this.provinceFilterToggle = page.locator(".append > .c-icon").first();
  }

  async goto(): Promise<void> {
    await this.page.goto("/", { waitUntil: "domcontentloaded" });
    await this.acceptCookies();
    await this.libreriasLink.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async filterByProvince(province: string): Promise<void> {
    await this.provinceFilterToggle.click();
    await this.page.getByRole("button", { name: province }).click();
  }

  async expectLibraryVisible(address: string): Promise<void> {
    await expect(
      this.page.getByText(address, { exact: false }),
    ).toBeVisible({ timeout: 10_000 });
  }
}
