import { chromium } from 'playwright-core';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3333';
const executablePath = process.env.CHROME_PATH ?? '/usr/local/bin/google-chrome';
const forbidden = /node_modules\/(react|react-dom|styled-components|sanity)\//g;

function unavailableBody(error) {
  const message = String(error);
  return (
    message.includes('No resource with given identifier') || message.includes('navigated away')
  );
}

const browser = await chromium.launch({ executablePath });
let failed = false;

async function visit(path, ready) {
  const page = await browser.newPage();
  const errors = [];
  const pulled = new Set();
  const pending = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (!response.headers()['content-type']?.includes('javascript')) return;
    pending.push(
      response.text().catch((error) => {
        if (unavailableBody(error)) return '';
        throw error;
      })
    );
  });
  await page.goto(baseUrl + path, { waitUntil: 'networkidle' });
  const rendered = await page
    .waitForSelector(ready, { timeout: 60_000 })
    .then(() => true)
    .catch(() => false);
  const bodies = await Promise.all(pending);
  for (const body of bodies) {
    for (const [, name] of body.matchAll(forbidden)) pulled.add(name);
  }
  await page.close();
  return { errors, pulled: [...pulled].sort(), rendered };
}

function report(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? `: ${detail}` : ''}`);
  if (!ok) failed = true;
}

const query = await visit('/query-only', '[data-testid="buildings"] li');
report('/query-only renders', query.rendered);
report('/query-only has no page errors', query.errors.length === 0, query.errors.join('; '));
report(
  '/query-only loads no React, Studio or styled-components',
  query.pulled.length === 0,
  query.pulled.join(', ')
);

const studio = await visit('/studio', '[data-ui]');
report('/studio renders', studio.rendered);
report('/studio has no page errors', studio.errors.length === 0, studio.errors.join('; '));

await browser.close();
process.exit(failed ? 1 : 0);
