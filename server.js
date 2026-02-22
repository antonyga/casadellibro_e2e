/**
 * TestPilot — Development Server
 *
 * Serves the UI, runs Playwright tests via SSE, and archives every
 * report to reports/{timestamp}/ so they can be consulted later.
 *
 * Start:  npm run ui
 * UI:     http://localhost:3001/tests.html
 */

'use strict';

require('dotenv').config();

const express    = require('express');
const { spawn }  = require('child_process');
const path       = require('path');
const fs         = require('fs');

const app         = express();
const PORT        = 3001;
const REPORTS_DIR = path.join(__dirname, 'reports');
const ENVS_FILE   = path.join(__dirname, 'environments.json');

// Ensure the reports directory always exists before we do anything else
fs.mkdirSync(REPORTS_DIR, { recursive: true });

// ── Global middleware ──────────────────────────────────────────────────────
app.use(express.json());
app.use((req, res, next) => {          // CORS
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Test definitions ───────────────────────────────────────────────────────
// grep values are space-free regexes — avoids Windows cmd.exe arg-splitting
// when the pattern is passed through shell:true.  "." is the regex wildcard.
const TEST_SPECS = {
  1: {
    label:    'Search by book title',
    specFile: 'tests/search.spec.ts',
    grep:     'searching.by.title',
    variables: [
      { key: 'SEARCH_QUERY', label: 'Search Query', type: 'text', default: 'El Quijote', description: 'Book title or keyword to search for' },
    ],
  },
  2: {
    label:    'Invalid credentials error',
    specFile: 'tests/login.spec.ts',
    grep:     'invalid.credentials',
    variables: [
      { key: 'INVALID_USER_EMAIL',    label: 'Email',    type: 'email',    default: process.env.INVALID_USER_EMAIL    || 'sample@sample.com', description: 'Email address expected to fail login' },
      { key: 'INVALID_USER_PASSWORD', label: 'Password', type: 'password', default: process.env.INVALID_USER_PASSWORD || '12345678',           description: 'Password expected to fail login'     },
    ],
  },
  3: {
    label:    'Login with valid credentials',
    specFile: 'tests/login.spec.ts',
    grep:     'access.account.page',
    variables: [
      { key: 'VALID_USER_EMAIL',    label: 'Email',    type: 'email',    default: process.env.VALID_USER_EMAIL    || '', description: 'Valid account email address' },
      { key: 'VALID_USER_PASSWORD', label: 'Password', type: 'password', default: process.env.VALID_USER_PASSWORD || '', description: 'Valid account password'      },
    ],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/\x1b[^[]/g, '');
}

function lineLevel(text) {
  if (/passed|\u2713|\u2714|ok\b/i.test(text))       return 'success';
  if (/failed|\u2718|\xd7|Error|error\b/i.test(text)) return 'error';
  if (/warn|\u26a0/i.test(text))                      return 'warn';
  if (/running|\u25b6|worker/i.test(text))            return 'info';
  return 'normal';
}

function sseWrite(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ── Report archiving ───────────────────────────────────────────────────────
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

function saveReport(results, totalMs) {
  const now = new Date();
  // ID format: 2026-02-19_14-32-15  (sortable, URL-safe)
  const id  = now.toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
  const dir = path.join(REPORTS_DIR, id);

  fs.mkdirSync(dir, { recursive: true });

  // Copy the Playwright HTML report that was just generated
  const playwrightReport = path.join(__dirname, 'playwright-report');
  const hasHtml = fs.existsSync(playwrightReport);
  if (hasHtml) {
    copyDir(playwrightReport, path.join(dir, 'html'));
  }

  // Per-report metadata
  const meta = {
    id,
    timestamp:  now.toISOString(),
    allPassed:  results.every(r => r.passed),
    totalMs,
    hasHtml,
    results: results.map(r => ({
      id:       r.id,
      label:    TEST_SPECS[r.id]?.label ?? `Test #${r.id}`,
      passed:   r.passed,
      duration: r.duration ?? '—',
    })),
  };

  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));

  // Update the global index (newest first)
  const indexPath = path.join(REPORTS_DIR, 'index.json');
  let index = [];
  if (fs.existsSync(indexPath)) {
    try { index = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch { /* ignore */ }
  }
  index.unshift(meta);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  console.log(`  ✓ Report archived → reports/${id}/`);
  return id;
}

// ── Environment helpers ────────────────────────────────────────────────────
const DEFAULT_ENVS = [
  { id: 'production', name: 'Production', url: 'https://www.casadellibro.com',     browsers: ['chromium', 'firefox'], status: 'active', color: '#10b981' },
  { id: 'staging',    name: 'Staging',    url: 'https://staging.casadellibro.com', browsers: ['chromium'],            status: 'idle',   color: '#f59e0b' },
  { id: 'preprod',    name: 'Pre-prod',   url: 'https://preprod.casadellibro.com', browsers: ['chromium'],            status: 'idle',   color: '#3b82f6' },
];

function loadEnvs() {
  if (!fs.existsSync(ENVS_FILE)) {
    fs.writeFileSync(ENVS_FILE, JSON.stringify(DEFAULT_ENVS, null, 2));
    return [...DEFAULT_ENVS];
  }
  try { return JSON.parse(fs.readFileSync(ENVS_FILE, 'utf8')); } catch { return [...DEFAULT_ENVS]; }
}

function saveEnvs(envs) {
  fs.writeFileSync(ENVS_FILE, JSON.stringify(envs, null, 2));
}

// ── GET /api/environments ─────────────────────────────────────────────────
app.get('/api/environments', (_req, res) => {
  res.json(loadEnvs());
});

// ── POST /api/environments ────────────────────────────────────────────────
app.post('/api/environments', (req, res) => {
  const { name, url, browsers, status, color } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'name and url are required' });
  const envs = loadEnvs();
  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
  const newEnv = { id, name, url, browsers: browsers || ['chromium'], status: status || 'idle', color: color || '#8b5cf6' };
  envs.push(newEnv);
  saveEnvs(envs);
  res.status(201).json(newEnv);
});

// ── PUT /api/environments/:id ─────────────────────────────────────────────
app.put('/api/environments/:id', (req, res) => {
  const { id } = req.params;
  const { name, url, browsers, status, color } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'name and url are required' });
  const envs = loadEnvs();
  const idx = envs.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Environment not found' });
  envs[idx] = { ...envs[idx], name, url, browsers: browsers || ['chromium'], status: status || 'idle', color: color || envs[idx].color };
  saveEnvs(envs);
  res.json(envs[idx]);
});

// ── DELETE /api/environments/:id ──────────────────────────────────────────
app.delete('/api/environments/:id', (req, res) => {
  const envs = loadEnvs();
  const idx = envs.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Environment not found' });
  envs.splice(idx, 1);
  saveEnvs(envs);
  res.json({ ok: true });
});

// ── GET /api/reports ── list all archived reports ──────────────────────────
app.get('/api/reports', (req, res) => {
  const indexPath = path.join(REPORTS_DIR, 'index.json');
  if (!fs.existsSync(indexPath)) return res.json([]);
  try {
    res.json(JSON.parse(fs.readFileSync(indexPath, 'utf8')));
  } catch {
    res.json([]);
  }
});

// ── DELETE /api/reports/:id ── delete a single archived report ─────────────
app.delete('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  // Validate ID to prevent path traversal
  if (!/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid report ID' });
  }

  const dir = path.join(REPORTS_DIR, id);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });

  // Remove from index
  const indexPath = path.join(REPORTS_DIR, 'index.json');
  if (fs.existsSync(indexPath)) {
    try {
      let index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      index = index.filter(r => r.id !== id);
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    } catch { /* ignore */ }
  }

  res.json({ ok: true });
});

// ── GET /api/run?ids=1,2,3 ── run tests and stream via SSE ────────────────
app.get('/api/run', (req, res) => {
  const rawIds  = (req.query.ids || '').split(',').map(Number).filter(Boolean);
  let   runVars = {};
  if (req.query.vars) { try { runVars = JSON.parse(req.query.vars); } catch { /* ignore malformed */ } }

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  const realIds   = rawIds.filter(id => TEST_SPECS[id]);
  const mockIds   = rawIds.filter(id => !TEST_SPECS[id]);
  const startedAt = Date.now();

  if (mockIds.length) {
    sseWrite(res, {
      type:  'line',
      text:  `\u26a0  Tests [${mockIds.join(', ')}] are placeholders \u2014 skipping.\n`,
      level: 'warn',
    });
  }

  if (!realIds.length) {
    sseWrite(res, { type: 'line', text: 'No real Playwright specs selected.\n', level: 'warn' });
    sseWrite(res, { type: 'done', results: [], totalMs: 0 });
    return res.end();
  }

  // Notify UI which rows are now "running"
  realIds.forEach(id => sseWrite(res, { type: 'start', id, label: TEST_SPECS[id].label }));

  // Build a single combined grep regex so all tests run in ONE playwright
  // call → ONE combined HTML report saved to playwright-report/
  const combinedGrep = realIds.length === 1
    ? TEST_SPECS[realIds[0]].grep
    : `(${realIds.map(id => TEST_SPECS[id].grep).join('|')})`;

  sseWrite(res, {
    type:  'line',
    text:  `\n\u25b6  Running ${realIds.length} test${realIds.length > 1 ? 's' : ''}\u2026\n${'─'.repeat(56)}\n`,
    level: 'info',
  });

  let fullOutput = '';

  // On Windows, shell:true joins args with spaces — we must quote the grep
  // value so cmd.exe doesn't split it at word boundaries.
  const proc = spawn('npx', [
    'playwright', 'test',
    `--grep="${combinedGrep}"`,
    '--project=chromium',
    '--reporter=list,html',   // list → one clean line per test (no cursor tricks); html → report
  ], {
    cwd:   __dirname,
    env:   { ...process.env, FORCE_COLOR: '0', ...runVars },
    shell: true,
  });

  const onData = chunk => {
    const text = stripAnsi(chunk.toString());
    fullOutput += text;
    if (text.trim()) sseWrite(res, { type: 'line', text, level: lineLevel(text) });
  };

  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);

  proc.on('error', err => {
    sseWrite(res, { type: 'line', text: `Process error: ${err.message}\n`, level: 'error' });
    sseWrite(res, { type: 'done', results: [], totalMs: Date.now() - startedAt });
    res.end();
  });

  proc.on('close', code => {
    // Parse individual pass/fail from playwright's line-reporter output.
    // Each result line looks like:
    //   ✓  1 [chromium] › login.spec.ts:23:3 › Login › should login... (13.9s)
    //   ✘  1 [chromium] › ...
    const lines   = fullOutput.split('\n');
    const results = realIds.map(id => {
      const grep      = TEST_SPECS[id].grep;
      const grepRegex = new RegExp(grep);   // '.' in grep matches any char, incl. spaces in output
      let verdictFound = false;
      let passed       = false;
      let duration     = '—';

      for (const line of lines) {
        if (!grepRegex.test(line)) continue;
        const isPassed = /[\u2713\u2714]/.test(line);
        const isFailed = /[\u2718\xd7]/.test(line);
        if (isPassed || isFailed) {
          verdictFound = true;
          passed = isPassed;
          const m = line.match(/\(([^)]+)\)\s*$/);
          if (m) duration = m[1];
          break;
        }
      }

      // No verdict line found — the reporter format was unparseable; trust the exit code.
      if (!verdictFound) {
        passed = code === 0;
        // Extract duration from the summary line, e.g. "1 passed (8.2s)"
        for (const line of lines) {
          const m = line.match(/\d+\s+(?:passed|failed)[^(]*\(([^)]+)\)/);
          if (m) { duration = m[1]; break; }
        }
      }

      return { id, passed, duration };
    });

    // Emit per-test result events so the UI can update each row immediately
    results.forEach(r => sseWrite(res, { type: 'result', id: r.id, passed: r.passed, duration: r.duration }));

    const passCount = results.filter(r => r.passed).length;
    sseWrite(res, {
      type:  'line',
      text:  `${'─'.repeat(56)}\n${passCount}/${results.length} passed\n`,
      level: passCount === results.length ? 'success' : 'error',
    });

    // Archive the report and send the ID back to the UI
    const reportId = saveReport(results, Date.now() - startedAt);
    sseWrite(res, { type: 'done', results, reportId, totalMs: Date.now() - startedAt });
    res.end();
  });

  req.on('close', () => proc.kill());
});

// ── GET /api/tests ─────────────────────────────────────────────────────────
app.get('/api/tests', (req, res) => {
  res.json(Object.entries(TEST_SPECS).map(([id, spec]) => ({ id: Number(id), ...spec })));
});

// ── Static files (after API routes so /api/* is never shadowed) ───────────
app.use(express.static(path.join(__dirname, 'ui')));
app.use('/playwright-report', express.static(path.join(__dirname, 'playwright-report')));
app.use('/reports',           express.static(REPORTS_DIR));

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  TestPilot server is running\n`);
  console.log(`  UI       →  http://localhost:${PORT}/tests.html`);
  console.log(`  API run  →  http://localhost:${PORT}/api/run?ids=3`);
  console.log(`  Reports  →  http://localhost:${PORT}/api/reports\n`);
});
