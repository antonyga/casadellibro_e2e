# Project Guidelines: CasaDelLibro E2E Automation

## 1. Project Overview
This is a professional End-to-End (E2E) test automation project for the e-commerce site `www.casadellibro.com`. The goal is to demonstrate high-quality architecture, stability, and AI integration for portfolio purposes.

## 2. Tech Stack & Tools
- **Language:** TypeScript (Strict mode enabled).
- **Framework:** Playwright Test.
- **AI Integration:** OpenAI API (for semantic assertions).
- **CI/CD:** GitHub Actions.
- **Reporting:** Playwright HTML Report.
- **Package Manager:** npm.

## 3. Architecture Pattern
We strictly follow the **Page Object Model (POM)** design pattern.
- **`pages/`**: Contains class files representing web pages (e.g., `HomePage.ts`, `ProductPage.ts`).
- **`components/`**: Reusable UI parts shared across pages (e.g., `NavBar.ts`, `CookieBanner.ts`).
- **`tests/`**: Contains the actual spec files (e.g., `search.spec.ts`).
- **`utils/`**: Helper functions and AI clients.
- **`fixtures/`**: Custom Playwright fixtures to inject Page Objects into tests automatically.

## 4. Coding Standards & Best Practices

### A. TypeScript Rules
- **No `any`**: Explicitly define interfaces for data types.
- **Async/Await**: Always use `await` for Playwright actions. Never chain promises with `.then()`.
- **Naming**: 
  - Classes: `PascalCase` (e.g., `SearchResultsPage`).
  - Methods/Variables: `camelCase` (e.g., `searchForBook`).
  - File names: `kebab-case` (e.g., `search-results-page.ts`).

### B. Playwright Selector Strategy (Vital)
Do not use fragile selectors. Follow this priority order:
1. **User-facing locators**: `page.getByRole()`, `page.getByLabel()`, `page.getByPlaceholder()`.
2. **Text locators**: `page.getByText()`.
3. **Test IDs**: `page.locator('[data-test-id="..."]')` (Only if available).
4. **CSS Classes**: Use specific classes only if necessary. Avoid generic ones like `.div > .span`.
5. **NEVER use**: 
   - Full XPaths (`/html/body/div[2]/...`).
   - Dynamic IDs that change on reload.

### C. Stability & Waits
- **No Hard Waits**: Never use `page.waitForTimeout(5000)`.
- **Auto-waiting**: Rely on Playwright's built-in auto-waiting assertions (e.g., `await expect(locator).toBeVisible()`).
- **Cookie Handling**: The `BasePage` or `global-setup` must handle the Casa del Libro cookie consent banner immediately to prevent flaky tests.

### D. AI Integration Guidelines
- The AI logic is for **Semantic Assertions** only.
- Create a specific utility (e.g., `AiAsserter.ts`) that calls the LLM.
- **Example Use Case**: Searching for "Happy books" and using AI to verify the returned titles are semantically positive/happy, even if they don't contain the word "Happy".

## 5. Test Structure
Each test file should:
1. Use custom fixtures (`test({ homePage }) => ...`) rather than instantiating classes manually with `new`.
2. Be independent (state does not persist between tests).
3. Include descriptive steps using `test.step('description', async () => ...)` for better reporting.

## 6. Error Handling
- Use try/catch blocks in Utility functions where API calls (like OpenAI) might fail.
- If the AI API fails, the test should warn but not necessarily fail the suite (fail-safe).