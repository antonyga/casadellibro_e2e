import { type Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class AccountPage extends BasePage {
  readonly accountButton: Locator;
  readonly myDataLink: Locator;
  readonly myDataHeading: Locator;

  constructor(page: import("@playwright/test").Page) {
    super(page);
    this.accountButton = page.getByRole("button", { name: "login" });
    this.myDataLink = page.getByRole("link", { name: "Mis datos" });
    this.myDataHeading = page.getByRole("heading", { name: "Mis Datos" });
  }

  async navigateToMyData(): Promise<void> {
    await this.accountButton.click();
    await this.myDataLink.click();
  }

  async expectMyDataPageVisible(): Promise<void> {
    await expect(this.myDataHeading).toBeVisible({ timeout: 10000 });
  }
}
