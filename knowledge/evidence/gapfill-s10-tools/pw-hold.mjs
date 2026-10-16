// pw-hold.mjs <engine> <file-url> <seconds> - open a HEADED Playwright browser on a local page (all non-file
// requests aborted) and keep it open so uia-dump.ps1 can read its Windows accessibility tree.
import { firefox, webkit, chromium } from 'playwright';
const [engine, url, secs = '40'] = process.argv.slice(2);
const browser = await { firefox, webkit, chromium }[engine].launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
await page.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
await page.goto(url);
console.log('open', engine, browser.version(), await page.title());
await page.waitForTimeout(Number(secs) * 1000);
await browser.close();
