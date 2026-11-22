// Eksport prezentacji: prezentacja/MlodyRodzic-prezentacja.pdf (tekst wektorowy, 1920×1080 na stronę).
//   node prezentacja/narzedzia/pdf.mjs            → PDF
//   node prezentacja/narzedzia/pdf.mjs --podglad  → dodatkowo PNG każdego slajdu w prezentacja/podglad/
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chromium} from '../../video/node_modules/playwright-core/index.mjs';
import {chromePath} from '../../video/capture/lib.mjs';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL_ = pathToFileURL(path.join(DIR, 'index.html')).href;
const b = await chromium.launch({executablePath: chromePath()});
const page = await b.newPage({viewport: {width: 1920, height: 1080}});
await page.goto(URL_, {waitUntil: 'networkidle'});
await page.evaluate(() => document.fonts.ready);

if (process.argv.includes('--podglad')) {
  const out = path.join(DIR, 'podglad'); fs.mkdirSync(out, {recursive: true});
  const n = await page.locator('.slide').count();
  for (let i = 1; i <= n; i++) {
    await page.evaluate(i => { location.hash = '#' + i; dispatchEvent(new KeyboardEvent('keydown', {key: 'Home'})); for (let k = 1; k < i; k++) dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight'})); }, i);
    await page.waitForTimeout(2600);
    await page.screenshot({path: path.join(out, `slajd-${String(i).padStart(2, '0')}.png`)});
  }
  console.log('podgląd:', n, 'slajdów');
}
await page.emulateMedia({media: 'print', reducedMotion: 'reduce'});
await page.pdf({path: path.join(DIR, 'MlodyRodzic-prezentacja.pdf'), width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true});
await b.close();
console.log('PDF:', path.join(DIR, 'MlodyRodzic-prezentacja.pdf'));
