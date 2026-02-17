import { type Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class LoginPage extends BasePage {
  readonly enterButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: import("@playwright/test").Page) {
    super(page);
    this.enterButton = page.getByRole("button", { name: "Entrar" });
    this.emailInput = page
      .locator("label")
      .filter({ hasText: "Email*" })
      .locator('[data-test="i-e-l"]');
    this.passwordInput = page.locator('[data-test="i-c-l"]');
    this.submitButton = page.getByRole("button", { name: "iniciar sesión" });
    this.errorMessage = page.getByText("Email o contraseña no válidos");
  }

  async goto(): Promise<void> {
    await this.page.goto("/login-access", { waitUntil: "domcontentloaded" });
    await this.acceptCookies();
    await this.enterButton.click();
    await this.emailInput.waitFor({ state: "visible" });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForSuccess(email: string, password: string): Promise<void> {
    await this.login(email, password);
    await expect(this.enterButton).toBeHidden({ timeout: 15000 });
  }

  async expectInvalidCredentialsError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
  }
}
