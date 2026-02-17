# Casa del Libro - E2E Test Automation

End-to-End test automation suite for [www.casadellibro.com](https://www.casadellibro.com) built with **Playwright** and **TypeScript**, following the **Page Object Model (POM)** design pattern.

## Tech Stack

| Tool              | Purpose                      |
| ----------------- | ---------------------------- |
| Playwright        | Browser automation framework |
| TypeScript        | Language (strict mode)       |
| Dotenv            | Environment variable loading |
| Playwright Report | HTML test reporting          |

## Project Structure

```
casadellibro_e2e/
├── fixtures/
│   └── index.ts              # Custom Playwright fixtures (homePage, loginPage, etc.)
├── pages/
│   ├── base-page.ts          # Base class — cookie banner handling
│   ├── home-page.ts          # Homepage — navigation and search
│   ├── login-page.ts         # Login form — credentials and submission
│   ├── account-page.ts       # Account area — post-login navigation
│   └── results-page.ts       # Search results — book title extraction
├── tests/
│   ├── search.spec.ts        # Book search test
│   └── login.spec.ts         # Login tests (valid & invalid credentials)
├── .env                      # Credentials (not committed)
├── playwright.config.ts      # Playwright configuration
└── tsconfig.json             # TypeScript configuration
```

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9

## Setup

```bash
# Install dependencies
npm install

# Install browser binaries
npx playwright install chromium firefox
```

Create a `.env` file in the project root with your test credentials:

```env
VALID_USER_EMAIL=your-email@example.com
VALID_USER_PASSWORD=your-password

INVALID_USER_EMAIL=fake@example.com
INVALID_USER_PASSWORD=wrongpassword
```

## Running Tests

```bash
# Run all tests (Chromium + Firefox)
npm test

# Run on a specific browser
npm run test:chrome
npm run test:firefox

# Run in headed mode (visible browser)
npm run test:headed

# Run a specific test file
npx playwright test search.spec.ts

# Run a specific test by name
npx playwright test -g "invalid credentials"
```

## Test Reports

```bash
# Open the HTML report after a test run
npm run report
```

## Test Coverage

| Test                              | Description                                                      |
| --------------------------------- | ---------------------------------------------------------------- |
| Search by title                   | Searches for "El Quijote" and verifies book results are returned |
| Login with invalid credentials    | Submits wrong credentials and asserts the error message          |
| Login with valid credentials      | Logs in, navigates to "Mis Datos", and verifies the account page |

## Architecture Decisions

- **Page Object Model** — Each page/component has its own class, keeping selectors and actions out of test files.
- **Custom Fixtures** — Page objects are injected via Playwright fixtures (`{ homePage, loginPage }`) instead of manual instantiation.
- **Shadow DOM** — Search results are rendered inside an Empathy X Shadow DOM widget (`.x-root-container`). Playwright auto-pierces shadow boundaries.
- **Cookie Handling** — The `BasePage` class handles the OneTrust cookie consent banner to prevent flaky tests.
- **Environment Variables** — Credentials are loaded from `.env` via `dotenv` and never hardcoded in tests.
- **Cross-Browser** — All tests run on both Chromium and Firefox. Navigation uses `waitUntil: "domcontentloaded"` for Firefox compatibility.
