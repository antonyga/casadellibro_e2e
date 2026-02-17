import { test, expect } from "../fixtures";

test.describe("Login", () => {
  test("should show error message for invalid credentials", async ({
    loginPage,
  }) => {
    await test.step("Navigate to the login page", async () => {
      await loginPage.goto();
    });

    await test.step("Submit invalid credentials", async () => {
      await loginPage.login(
        process.env.INVALID_USER_EMAIL!,
        process.env.INVALID_USER_PASSWORD!,
      );
    });

    await test.step("Verify error message is displayed", async () => {
      await loginPage.expectInvalidCredentialsError();
    });
  });

  test("should login and access account page with valid credentials", async ({
    loginPage,
    accountPage,
  }) => {
    const email = process.env.VALID_USER_EMAIL;
    const password = process.env.VALID_USER_PASSWORD;

    test.skip(!email || !password, "VALID_USER_EMAIL and VALID_USER_PASSWORD must be set in .env");

    await test.step("Navigate to the login page", async () => {
      await loginPage.goto();
    });

    await test.step("Login with valid credentials", async () => {
      await loginPage.loginAndWaitForSuccess(email!, password!);
    });

    await test.step("Navigate to My Data page", async () => {
      await accountPage.navigateToMyData();
    });

    await test.step("Verify account page is displayed", async () => {
      await accountPage.expectMyDataPageVisible();
    });
  });
});
