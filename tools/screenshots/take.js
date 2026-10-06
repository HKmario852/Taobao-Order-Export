// Regenerates the README screenshots in docs/screenshots/ from made-up demo orders (demo-page.html).
// It loads this extension into Chromium, serves the demo page at the real 已买到的宝贝 address
// (nothing is fetched from Taobao), and photographs the button, the dialog and an export in progress.
//
//   npm install --no-save playwright && npx playwright install chromium
//   node tools/screenshots/take.js
//
// Set CHROMIUM_PATH to use a Chromium you already have. Branded Google Chrome can't side-load extensions.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'docs/screenshots');
const page = fs.readFileSync(path.join(__dirname, 'demo-page.html'), 'utf8');
const PAGE_URL = 'https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm';

async function withBrowser(locale, fn) {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'te-shots-'));
  const ctx = await chromium.launchPersistentContext(dir, {
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--headless=new', `--disable-extensions-except=${root}`, `--load-extension=${root}`, `--lang=${locale}`],
    locale,
    viewport: { width: 1100, height: 760 },
    deviceScaleFactor: 2,
  });
  await ctx.route('https://buyertrade.taobao.com/**', (route) => {
    const req = route.request();
    if (req.url().includes('/h5/')) return route.fulfill({ contentType: 'application/json', body: req.postData() || '{}' });
    return route.fulfill({ contentType: 'text/html; charset=utf-8', body: page });
  });
  try {
    const p = await ctx.newPage();
    await p.goto(PAGE_URL);
    await p.locator('#te-toolbar-btn').waitFor({ timeout: 15000 });
    await fn(p);
  } finally {
    await ctx.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const dialog = (p) => p.locator('div[style*="2147483646"] > div');

// Shoot the dialog alone, with transparent rounded corners instead of the dimmed page behind it
async function shootDialog(p, file) {
  const undo = await p.evaluate(() => {
    const backdrop = document.querySelector('div[style*="2147483646"]');
    const old = [backdrop.style.background, document.documentElement.style.background, document.body.style.background];
    backdrop.style.background = document.documentElement.style.background = document.body.style.background = 'transparent';
    return old;
  });
  await dialog(p).screenshot({ path: path.join(out, file), omitBackground: true });
  await p.evaluate(([a, b, c]) => {
    document.querySelector('div[style*="2147483646"]').style.background = a;
    document.documentElement.style.background = b;
    document.body.style.background = c;
  }, undo);
}

(async () => {
  fs.mkdirSync(out, { recursive: true });

  await withBrowser('zh-CN', async (p) => {
    await p.locator('.toolbar').screenshot({ path: path.join(out, 'toolbar.png') });
    await p.locator('#te-toolbar-btn').click();
    await shootDialog(p, 'dialog-zh-CN.png');
  });

  await withBrowser('en-US', async (p) => {
    await p.locator('#te-toolbar-btn').click();
    await shootDialog(p, 'dialog-en.png');
    // Start an export and catch it while it turns the pages
    await dialog(p).getByRole('button', { name: 'Export', exact: true }).click();
    await p.waitForFunction(() => /Reading page/.test(document.body.innerText), null, { timeout: 15000 });
    await p.screenshot({ path: path.join(out, 'exporting.png') });
  });

  for (const f of fs.readdirSync(out)) console.log('docs/screenshots/' + f);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
