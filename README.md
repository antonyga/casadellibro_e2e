# Casa del Libro - E2E Test Automation

End-to-End test automation suite for [www.casadellibro.com](https://www.casadellibro.com) built with **Playwright** and **TypeScript**, following the **Page Object Model (POM)** design pattern.

A local **TestPilot** web UI lets you run, monitor, and review test reports entirely from the browser — no terminal required.

## Tech Stack

| Tool              | Purpose                                      |
| ----------------- | -------------------------------------------- |
| Playwright        | Browser automation framework                 |
| TypeScript        | Language (strict mode)                       |
| Express 5         | Local dev server powering the TestPilot UI   |
| Server-Sent Events| Real-time test output streaming to the UI    |
| Dotenv            | Environment variable loading                 |
| Playwright Report | HTML test reporting (archived per run)       |

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
├── ui/
│   ├── css/styles.css        # Shared stylesheet for all UI pages
│   ├── index.html            # Dashboard — run summary and quick actions
│   ├── tests.html            # Test Suites — select and run tests, live output
│   ├── codegen.html          # Code Generation — record new tests via Playwright
│   ├── visual.html           # Visual Regression — swipe/diff/compare snapshots
│   └── settings.html         # Settings — environments, scheduling, notifications
├── reports/                  # Archived HTML reports (auto-created at runtime)
│   ├── index.json            # Global report index (newest first)
│   └── <timestamp>/
│       ├── meta.json         # Run metadata (pass/fail, duration, timestamp)
│       └── html/             # Full Playwright HTML report for that run
├── server.js                 # TestPilot dev server (Express + SSE test runner)
├── .env                      # Credentials (not committed)
├── playwright.config.ts      # Playwright configuration
├── package.json
└── tsconfig.json
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

### Via the TestPilot UI (recommended)

```bash
npm run ui
```

Then open **http://localhost:3001/tests.html** in your browser.

- Select one or more tests from the list and click **Run Selected**.
- A terminal modal streams live Playwright output in real time.
- When the run finishes, click **View Report** to open the archived HTML report.
- The **History** button in the top bar lists every past run with pass/fail badges; individual reports can be opened or deleted.

### Via the command line

```bash
# Run all tests (Chromium + Firefox)
npm test

# Run on a specific browser
npm run test:chrome
npm run test:firefox

# Run in headed mode (visible browser)
npm run test:headed

# Run a specific test file
npx playwright test tests/search.spec.ts

# Run a specific test by name (regex)
npx playwright test --grep "invalid credentials"

# Open the latest HTML report
npm run report
```

## Test Coverage

| Test                              | Description                                                      |
| --------------------------------- | ---------------------------------------------------------------- |
| Search by title                   | Searches for "El Quijote" and verifies book results are returned |
| Login with invalid credentials    | Submits wrong credentials and asserts the error message          |
| Login with valid credentials      | Logs in, navigates to "Mis Datos", and verifies the account page |

## TestPilot UI — Page Reference

| Page              | URL                                    | Description                                              |
| ----------------- | -------------------------------------- | -------------------------------------------------------- |
| Dashboard         | `/index.html`                          | Run summary, recent results, and quick-access shortcuts  |
| Test Suites       | `/tests.html`                          | Select and run tests; live SSE terminal; report history  |
| Code Generation   | `/codegen.html`                        | Launch Playwright's codegen recorder for new tests       |
| Visual Regression | `/visual.html`                         | Swipe-to-compare, side-by-side, and diff overlay views   |
| Settings          | `/settings.html`                       | Environments, cron scheduling, notifications, danger zone|

## TestPilot Server API

The Express server (`server.js`) exposes the following endpoints:

| Method   | Path                  | Description                                              |
| -------- | --------------------- | -------------------------------------------------------- |
| `GET`    | `/api/tests`          | List all defined test specs                              |
| `GET`    | `/api/run?ids=1,2,3`  | Run selected tests; streams output via SSE               |
| `GET`    | `/api/reports`        | List all archived reports (newest first)                 |
| `DELETE` | `/api/reports/:id`    | Delete a single archived report by timestamp ID          |
| `GET`    | `/reports/:id/html/`  | Serve the archived Playwright HTML report for a run      |
| `GET`    | `/playwright-report/` | Serve the latest (non-archived) Playwright HTML report   |

## Architecture Decisions

- **Page Object Model** — Each page/component has its own class, keeping selectors and actions out of test files.
- **Custom Fixtures** — Page objects are injected via Playwright fixtures (`{ homePage, loginPage }`) instead of manual instantiation.
- **Shadow DOM** — Search results are rendered inside an Empathy X Shadow DOM widget (`.x-root-container`). Playwright auto-pierces shadow boundaries.
- **Cookie Handling** — The `BasePage` class handles the OneTrust cookie consent banner to prevent flaky tests.
- **Environment Variables** — Credentials are loaded from `.env` via `dotenv` and never hardcoded in tests.
- **Cross-Browser** — All tests run on both Chromium and Firefox. Navigation uses `waitUntil: "domcontentloaded"` for Firefox compatibility.
- **Server-Sent Events** — The test runner streams Playwright stdout/stderr line by line to the browser; no polling needed.
- **Report Archiving** — Every run copies `playwright-report/` to `reports/<timestamp>/html/` and writes `meta.json`, so historical reports survive subsequent runs.
- **Windows shell quoting** — Grep patterns use `.` as a regex wildcard (e.g., `access.account.page`) to avoid cmd.exe argument-splitting issues when `shell: true` is used with `spawn`.
