import { test, expect } from "../fixtures";

test.describe("Libraries Search", () => {
  test("should filter libraries by province", async ({ librariesPage }) => {
    await test.step("Navigate to the Libraries page", async () => {
      await librariesPage.goto();
    });

    await test.step("Open the province filter and select Barcelona", async () => {
      await librariesPage.filterByProvince("Barcelona");
    });

    await test.step("Verify a Barcelona library is displayed in the results", async () => {
      await librariesPage.expectLibraryVisible("Gran Via");
    });
  });
});
