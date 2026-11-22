// Zrzuty ekranu aplikacji w widoku telefonu (390×844, gęstość 2×) do prezentacji.
//   npm run demo   (w katalogu głównym: serwer na :3123)
//   node prezentacja/narzedzia/zrzuty.mjs [nazwa…]   → prezentacja/zrzuty/<nazwa>.png
//   ZRZUTY_CALE=1 … → całe strony (do podglądu kadrów)
// Korzysta z playwright-core i Chromium projektu filmu (video/).
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from '../../video/node_modules/playwright-core/index.mjs';
import {chromePath} from '../../video/capture/lib.mjs';

const BASE = (process.env.ZRZUTY_BASE || 'http://127.0.0.1:3123').replace(/\/$/, '');
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'zrzuty');
const CALE = !!process.env.ZRZUTY_CALE;
const HASLO = process.env.ADMIN_HASLO || 'demo';
fs.mkdirSync(OUT, {recursive: true});

const settle = async (page, ms = 1200) => {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms); // animacje wejścia
};

async function zaloguj(page, imie) {
  await page.goto(BASE + '/logowanie'); await settle(page, 300);
  await page.getByRole('button', {name: new RegExp(`Zaloguj jako ${imie}`)}).click();
  await page.waitForURL(/\/ezus/, {timeout: 30000});
  await page.getByRole('heading', {name: 'Pobraliśmy Twoje dane z ZUS'}).waitFor();
}

/** Przewija tak, żeby element był tuż pod przyklejonym paskiem. */
async function przewin(page, locator, odstep = 76) {
  const y = await locator.first().evaluate((e, o) => e.getBoundingClientRect().top + window.scrollY - o, odstep);
  await page.evaluate(y => window.scrollTo(0, y), y);
  await page.waitForTimeout(500);
}

const kadry = {
  logowanie: async page => { await page.goto(BASE + '/logowanie'); await settle(page); },
  start: async page => { await page.goto(BASE + '/'); await settle(page); },
  ezus: async page => { await zaloguj(page, 'Anna'); await settle(page); },
  pulpit: async page => { await zaloguj(page, 'Anna'); await page.goto(BASE + '/plan'); await settle(page, 2500); },
  swiadczenia: async page => { await zaloguj(page, 'Anna'); await page.goto(BASE + '/plan/swiadczenia'); await settle(page); },
  kalkulator: async page => { await zaloguj(page, 'Anna'); await page.goto(BASE + '/plan/kalkulator'); await settle(page); },
  'kalkulator-os': async page => {
    await zaloguj(page, 'Anna'); await page.goto(BASE + '/plan/kalkulator'); await settle(page);
    await przewin(page, page.getByRole('heading', {name: 'Urlop ojcowski'}), 110);
  },
  wnioski: async page => { await zaloguj(page, 'Anna'); await page.goto(BASE + '/plan/wnioski'); await settle(page); },
  'trudne-pulpit': async page => { await zaloguj(page, 'Aleksandra'); await page.goto(BASE + '/plan'); await settle(page, 2500); },
  'trudne-zaswiadczenie': async page => {
    await zaloguj(page, 'Aleksandra'); await settle(page, 2500);
    const roz = page.locator('details', {hasText: 'Stan rozliczeń'});
    await roz.locator('summary').click();
    await roz.getByRole('button', {name: 'Wystaw zaświadczenie'}).click();
    await page.waitForTimeout(400);
    await przewin(page, roz);
  },
  szybko: async page => { await page.goto(BASE + '/szybko'); await settle(page); },
  przewodnik: async page => { await page.goto(BASE + '/przewodnik/1'); await settle(page); },
  wsparcie: async page => { await zaloguj(page, 'Anna'); await page.goto(BASE + '/wsparcie'); await settle(page); },
  admin: async page => {
    await page.goto(BASE + '/admin/logowanie'); await settle(page, 300);
    await page.locator('input[type=password]').fill(HASLO); await page.keyboard.press('Enter');
    await page.waitForURL(/\/admin$/); await settle(page);
  },
};

const wybrane = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(kadry);
const browser = await chromium.launch({executablePath: chromePath(), args: ['--hide-scrollbars', '--force-color-profile=srgb']});
for (const nazwa of wybrane) {
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    locale: 'pl-PL', timezoneId: 'Europe/Warsaw', reducedMotion: 'reduce'});
  const page = await ctx.newPage();
  try {
    await kadry[nazwa](page);
    await page.screenshot({path: path.join(OUT, `${nazwa}${CALE ? '-cala' : ''}.png`), fullPage: CALE});
    console.log('ok', nazwa);
  } catch (e) { console.error('BŁĄD', nazwa, e.message.split('\n')[0]); }
  await ctx.close();
}
await browser.close();
