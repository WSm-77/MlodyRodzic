// Wyciąga ilustrację z pulpitu (SVG z viewBox "40 40 432 432") do prezentacja/zrzuty/ilustracja.svg.
import fs from 'node:fs';
import {chromium} from '../../video/node_modules/playwright-core/index.mjs';
import {chromePath} from '../../video/capture/lib.mjs';
const BASE = process.env.ZRZUTY_BASE || 'http://127.0.0.1:3123';
const b = await chromium.launch({executablePath: chromePath()});
const p = await b.newPage();
await p.goto(BASE + '/logowanie');
await p.getByRole('button', {name: /Zaloguj jako Anna/}).click();
await p.waitForURL(/\/ezus/, {timeout: 30000});
await p.goto(BASE + '/plan'); await p.waitForLoadState('networkidle');
const svg = await p.locator('svg[viewBox="40 40 432 432"]').first().evaluate(e => {
  const c = e.cloneNode(true); c.removeAttribute('class'); c.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); return c.outerHTML;
});
fs.writeFileSync(new URL('../zrzuty/ilustracja.svg', import.meta.url), svg);
await b.close(); console.log('ok', svg.length);
