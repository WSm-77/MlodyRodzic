// Sceny filmu MłodyRodzic. Każda funkcja nagrywa public/captures/<nazwa>.mp4 + .json.
//   DEMO_BASE=http://127.0.0.1:3124 node capture/scenes.mjs            → wszystkie sceny
//   DEMO_BASE=http://127.0.0.1:3124 node capture/scenes.mjs kalkulator → jedna scena
// Serwer do nagrania działa BEZ DATABASE_URL: zmiana w panelu ustawień trafia do data/parametry.json
// i jest cofana zaraz po nagraniu sceny `panel`.
import {launch, Recorder, BASE, settle} from './lib.mjs';

if (!BASE) { console.error('Ustaw DEMO_BASE, np. http://127.0.0.1:3124'); process.exit(1); }
const OPTS = {locale: 'pl-PL', timezoneId: 'Europe/Warsaw'};

/** Logowanie jako persona – poza nagraniem albo w nim (gdy `rec` podany, robi to realnie, w czasie rzeczywistym). */
async function zaloguj(page, imie) {
  await page.goto(BASE + '/logowanie'); await settle(page);
  await page.getByRole('button', {name: new RegExp(`Zaloguj jako ${imie}`)}).click();
  await page.waitForURL(/\/ezus/, {timeout: 30000});
  await page.getByRole('heading', {name: 'Pobraliśmy Twoje dane z ZUS'}).waitFor();
}

/** Prostokąt obejmujący wszystkie elementy pasujące do selektora (współrzędne okna). */
const wszystkie = (page, sel) => () => page.evaluate(s => {
  const rs = [...document.querySelectorAll(s)].map(e => e.getBoundingClientRect()).filter(r => r.width && r.height);
  const x = Math.min(...rs.map(r => r.left)), y = Math.min(...rs.map(r => r.top));
  return {x, y, w: Math.max(...rs.map(r => r.right)) - x, h: Math.max(...rs.map(r => r.bottom)) - y};
}, sel);

/** Przewija tak, żeby górna krawędź elementu była tuż pod przyklejonym menu. */
async function przewinDo(rec, target, top = 84, ms = 800) {
  const r = await rec.rect(target);
  await rec.scrollBy(Math.round(r.y - top), ms);
}

async function scena(name, fn) {
  const {ctx, page} = await launch(OPTS);
  // Bez czerwonych podkreśleń sprawdzania pisowni w polach, w które piszemy.
  await ctx.addInitScript(() => document.addEventListener('focusin', e => { if (e.target instanceof HTMLElement) e.target.spellcheck = false; }, true));
  try { await fn(page); } finally { await ctx.close(); }
}

const scenes = {
  /** Logowanie mObywatel → pobranie danych z ZUS → e-ZLA → pytanie o płatnika → pulpit. */
  logowanie: () => scena('logowanie', async page => {
    await page.goto(BASE + '/logowanie'); await settle(page);
    const rec = new Recorder(page, 'logowanie', {base: BASE}); await rec.start();
    await rec.mark('konta', '[aria-label="Konta"]');
    await rec.wait(1800);
    await rec.clickOn(page.getByRole('button', {name: /Zaloguj jako Anna/}), {fx: 0.5, fy: 0.85});   // click 0
    await rec.realtime(async () => {
      await page.getByRole('heading', {name: /Potwierdź logowanie/}).waitFor();
      await rec.mark('potwierdz', 'main');
      await page.getByRole('heading', {name: /Pobieram Twoje dane/}).waitFor();
      await rec.mark('pobieram', 'main');
      await page.waitForURL(/\/ezus/, {timeout: 30000});
      await page.getByRole('heading', {name: 'Pobraliśmy Twoje dane z ZUS'}).waitFor();
      await page.waitForTimeout(300);
    });
    await rec.mark('dane', wszystkie(page, 'main details'));
    await rec.wait(2600);
    const zla = page.locator('details', {hasText: 'Zwolnienia lekarskie'});
    await rec.clickOn(zla.locator('summary'), {fx: 0.3});                                               // click 1
    await rec.wait(500);
    await przewinDo(rec, zla, 90);
    await rec.wait(300);
    await rec.mark('ezla', zla);
    await rec.wait(3200);
    const platnik = page.locator('section', {hasText: 'zgłasza ponad 20 osób'});
    await przewinDo(rec, platnik, 120);
    await rec.mark('platnik', platnik);
    await rec.moveToRect(await rec.rect(platnik.getByText('Zasiłek wypłaci ZUS')), {fx: 0.9});
    await rec.wait(3400);
    const plan = page.getByRole('link', {name: /Pokaż mój plan/}).or(page.getByRole('button', {name: /Pokaż mój plan/})).first();
    await przewinDo(rec, plan, 400);
    await rec.clickOn(plan);                                                                           // click 2
    await rec.realtime(async () => {
      await page.waitForURL(/\/plan$/, {timeout: 15000});
      await page.locator('[aria-label="Podsumowanie planu"]').waitFor();
      await page.waitForTimeout(300);
    });
    await rec.mark('pulpit', '[aria-label="Podsumowanie planu"]');
    await rec.moveToRect(await rec.rect('[aria-label="Podsumowanie planu"]'), {fx: 0.85, fy: 0.9});
    await rec.wait(3800);
    await rec.stop();
  }),

  /** Kalkulator: wariant stawki, podział urlopu (suwak), oś czasu, łączenie z pracą. */
  kalkulator: () => scena('kalkulator', async page => {
    await zaloguj(page, 'Anna');
    await page.goto(BASE + '/plan/kalkulator'); await settle(page);
    const rec = new Recorder(page, 'kalkulator', {base: BASE}); await rec.start();
    const warianty = page.locator('section', {has: page.getByRole('radiogroup', {name: 'Wariant stawki'})});
    const suma = page.locator('[aria-label="Szacowana suma"]');
    await rec.mark('start');
    await rec.mark('warianty', warianty);
    await rec.mark('suma', suma);
    await rec.wait(2600);
    await rec.clickOn(page.getByRole('radiogroup', {name: 'Wariant stawki'}).getByText('100% potem 70%'), {fx: 0.4});  // click 0
    await rec.wait(600);
    await rec.mark('po-wariancie', warianty);
    await rec.mark('suma2', suma);
    await rec.wait(3000);

    // Suwak podziału (kierunek rtl: wartość = tygodnie drugiego rodzica, liczone od prawej).
    const podzial = page.locator('section', {hasText: 'Podział urlopu rodzicielskiego'});
    const suwak = page.locator('input[type=range]');
    const [r, max, val] = [await rec.rect(suwak), Number(await suwak.getAttribute('max')), Number(await suwak.inputValue())];
    const xNa = v => r.x + r.w * (1 - v / max);
    await rec.mark('podzial', podzial);
    await rec.moveTo(xNa(val), r.y + r.h / 2);
    await rec.wait(200);
    rec.log('click', {...rec.pos});                                                                   // click 1 (chwyt suwaka)
    await page.mouse.down();
    await rec.moveTo(xNa(val + 8), r.y + r.h / 2, 1300);
    await page.mouse.up();
    await rec.wait(700);
    await rec.mark('po-podziale', podzial);
    await rec.mark('os', page.locator('section', {hasText: 'Oś czasu'}));
    await rec.moveToRect(await rec.rect(page.locator('section', {hasText: 'Oś czasu'})), {fx: 0.92, fy: 0.15});
    await rec.wait(3600);

    // Łączenie pracy z urlopem.
    const praca = page.locator('section', {has: page.getByRole('button', {name: /Praca w czasie urlopu/})});
    await przewinDo(rec, praca, 300);
    await rec.clickOn(page.getByRole('button', {name: /Praca w czasie urlopu/}), {fx: 0.3});          // click 2
    await rec.wait(500);
    await przewinDo(rec, praca, 250, 700);
    await rec.clickOn(praca.locator('label', {hasText: 'Anna'}));                                     // click 3
    await rec.wait(700);
    await rec.mark('praca', praca);
    await rec.moveToRect(await rec.rect(praca), {fx: 0.95, fy: 0.1});
    await rec.wait(3000);
    // z powrotem na górę: nowa suma po łączeniu pracy z urlopem
    await rec.scrollBy(-(await page.evaluate(() => window.scrollY)), 800);
    await rec.mark('suma3', suma);
    await rec.mark('wynik', wszystkie(page, '[aria-label="Szacowana suma"], [role="radiogroup"]'));
    await rec.moveToRect(await rec.rect(suma), {fx: 0.8, fy: 0.85});
    await rec.wait(3200);
    await rec.stop();
  }),

  /** Świadczenia (kwoty, szczegóły z przepisem) → Wnioski i terminy. */
  swiadczenia: () => scena('swiadczenia', async page => {
    await zaloguj(page, 'Anna');
    await page.goto(BASE + '/plan/swiadczenia'); await settle(page);
    const rec = new Recorder(page, 'swiadczenia', {base: BASE}); await rec.start();
    const karty = page.locator('article');
    const mac = karty.filter({hasText: 'Zasiłek za urlop macierzyński'});
    await rec.mark('lista', wszystkie(page, 'main article'));
    await rec.mark('naglowek', 'main h1');
    await rec.wait(2800);
    await przewinDo(rec, mac, 90);
    await rec.clickOn(mac.locator('summary'));                                                          // click 0
    await rec.wait(600);
    await rec.mark('szczegoly', mac);
    await rec.wait(800);
    await rec.moveToRect(await rec.rect(mac), {fx: 0.96, fy: 0.5});
    await rec.wait(3400);
    await rec.clickOn(page.getByRole('link', {name: 'Wnioski', exact: true}).filter({visible: true}).first());                // click 1
    await rec.realtime(async () => {
      await page.waitForURL(/\/plan\/wnioski/);
      await page.getByRole('heading', {name: 'Wnioski i terminy'}).waitFor();
      await page.waitForTimeout(300);
    });
    await rec.mark('wnioski', wszystkie(page, 'main li[id] > article'));
    await rec.mark('kto', page.locator('main').getByText(/wniosek składasz/).first());
    await rec.wait(2800);
    const zam = page.locator('main li[id]').filter({hasText: 'Wniosek o urlop macierzyński i zasiłek'});
    await rec.mark('pilne', wszystkie(page, 'main li[id]:nth-of-type(-n+2) > article'));
    await rec.wait(800);
    await rec.clickOn(zam.locator('summary'));                                                          // click 2
    await rec.wait(600);
    await przewinDo(rec, zam.locator('article'), 90, 800);
    await rec.mark('przygotuj', zam.locator('article'));
    await rec.moveToRect(await rec.rect(zam.locator('article')), {fx: 0.96, fy: 0.3});
    await rec.wait(3600);
    await rec.stop();
  }),

  /** Persona z działalnością: zaległość, zaświadczenie, pytanie do ZUS, wstrzymany zasiłek, wsparcie. */
  trudne: () => scena('trudne', async page => {
    await zaloguj(page, 'Aleksandra');
    await page.waitForTimeout(3000);   // animacje wejścia kończą się w czasie rzeczywistym, przed nagraniem
    const rec = new Recorder(page, 'trudne', {base: BASE}); await rec.start();
    const roz = page.locator('details', {hasText: 'Stan rozliczeń'});
    await rec.mark('dane', wszystkie(page, 'main details'));
    await rec.mark('rozliczenia', roz);
    await rec.wait(2400);
    await rec.clickOn(roz.locator('summary'), {fx: 0.3});                                               // click 0
    await rec.wait(500);
    await przewinDo(rec, roz, 90);
    await rec.mark('zaleglosc', roz);
    await rec.wait(1600);
    await rec.clickOn(roz.getByRole('button', {name: 'Wystaw zaświadczenie'}));                       // click 1
    await rec.wait(600);
    await rec.mark('zaswiadczenie', roz.locator('.druk-cel'));
    await rec.moveToRect(await rec.rect(roz.locator('.druk-cel')), {fx: 0.97, fy: 0.95});
    await rec.wait(3400);
    const zapytaj = page.locator('section', {hasText: 'Zapytaj ZUS o swoją sprawę'});
    await przewinDo(rec, zapytaj, 260);
    await rec.clickOn('#pytanie-zus', {fx: 0.3});                                                       // click 2
    await rec.type('Czy moja zaległość została już zaksięgowana?', {cps: 34});
    await rec.clickOn(zapytaj.getByRole('button', {name: 'Wyślij'}));                                  // click 3
    await rec.wait(600);
    await rec.mark('odpowiedz', zapytaj);
    await rec.wait(3200);
    await rec.clickOn(page.getByRole('link', {name: 'Świadczenia', exact: true}).filter({visible: true}).first());            // click 4
    await rec.realtime(async () => {
      await page.waitForURL(/\/plan\/swiadczenia/);
      await page.locator('article', {hasText: 'Wstrzymany'}).first().waitFor();
      await page.waitForTimeout(300);
    });
    const wstrz = page.locator('article', {hasText: 'Wstrzymany'}).first();
    await przewinDo(rec, wstrz, 120);
    await rec.mark('wstrzymany', wstrz);
    await rec.moveToRect(await rec.rect(wstrz.getByText('Co odblokuje wypłatę')), {fx: 1.6, fy: 1.4});
    await rec.wait(3600);
    await rec.clickOn(page.getByRole('link', {name: 'Wsparcie', exact: true}).filter({visible: true}).first());               // click 5
    await rec.realtime(async () => {
      await page.waitForURL(/\/wsparcie/);
      await page.getByRole('heading', {name: /Wsparcie w trudnych/}).waitFor();
      await page.waitForTimeout(300);
    });
    await rec.wait(1200);
    await rec.clickOn(page.getByRole('button', {name: 'Wcześniactwo', exact: true}));                 // click 6
    await rec.wait(700);
    await przewinDo(rec, page.getByText('Twoje prawa w tej sytuacji'), 90, 900);
    await rec.mark('wsparcie', wszystkie(page, 'main h1, main a[href^="http"]'));
    await rec.mark('fundacje', page.getByText('Twoje prawa w tej sytuacji').locator('xpath=..'));
    await rec.moveTo(1240, 420);
    await rec.wait(3800);
    await rec.stop();
  }),

  /** Panel ustawień: logowanie pracownika, zmiana parametru, efekt w kalkulatorze. Zmiana jest cofana po nagraniu. */
  panel: () => scena('panel', async page => {
    await zaloguj(page, 'Anna');
    await page.goto(BASE + '/admin/logowanie'); await settle(page);
    const rec = new Recorder(page, 'panel', {base: BASE}); await rec.start();
    await rec.mark('logowanie', 'form');
    await rec.wait(1000);
    await rec.clickOn('input[type=password]', {fx: 0.3});                                               // click 0
    await rec.type('demo', {cps: 10});
    await rec.clickOn(page.getByRole('button', {name: /Zaloguj/}));                                    // click 1
    await rec.realtime(async () => {
      await page.waitForURL(/\/admin$/, {timeout: 15000});
      await page.getByRole('heading', {name: 'Parametry prawne'}).waitFor();
      await page.locator('table').first().waitFor();
      await page.waitForTimeout(300);
    });
    await rec.mark('parametry', wszystkie(page, 'main section'));
    await rec.mark('naglowek', page.getByRole('heading', {name: 'Parametry prawne'}).locator('xpath=..'));
    await rec.wait(2600);
    await rec.clickOn(page.getByPlaceholder('Szukaj parametru albo przepisu…'), {fx: 0.3});           // click 2
    await rec.type('tygodnieOjcowskiego', {cps: 30});
    await rec.wait(500);
    const wiersz = page.locator('tr', {has: page.getByText('tygodnieOjcowskiego', {exact: true})});
    await rec.mark('wiersz', wiersz);
    await rec.mark('tabela', page.locator('main section').first());
    await rec.wait(1200);
    const pole = wiersz.locator('input');
    await rec.clickOn(pole, {fx: 0.85});                                                                // click 3
    await page.keyboard.press('End'); await page.keyboard.press('Backspace');
    await rec.type('4', {cps: 6});
    await rec.wait(400);
    await rec.clickOn(wiersz.getByRole('button', {name: 'Zapisz'}));                                   // click 4
    await rec.realtime(async () => {
      await page.getByText(/Zapisano\./).waitFor();
      await page.waitForTimeout(200);
    });
    await rec.mark('zapisano-wiersz', wiersz);
    await rec.mark('komunikat', page.getByText(/Zapisano\./));
    await rec.wait(3000);
    // Ten sam użytkownik, w tej samej przeglądarce: kalkulator rodzica.
    await page.goto(BASE + '/plan/kalkulator');
    await page.locator('[aria-label="Szacowana suma"]').waitFor();
    await settle(page);
    await page.waitForTimeout(1500);
    await rec.mark('kalkulator');
    await rec.mark('ojcowski-suma', '[aria-label="Szacowana suma"]');
    await rec.wait(2200);
    const oj = page.locator('section', {hasText: 'Urlop ojcowski'});
    await przewinDo(rec, oj, 200, 900);
    await rec.mark('ojcowski-sekcja', oj);
    await rec.mark('ojcowski-os', page.locator('section', {hasText: 'Oś czasu'}));
    await rec.moveToRect(await rec.rect(oj.getByText(/bierze 4 tygodnie/)), {fx: 1.05, fy: 1.3});
    await rec.wait(3600);
    await rec.stop();
  }),
};

/** Cofnięcie zmian z panelu (plik lokalny, nie baza): pusty zestaw nadpisań. */
async function przywrocParametry() {
  const {ctx, page} = await launch(OPTS);
  try {
    await page.goto(BASE + '/admin/logowanie');
    await page.locator('input[type=password]').fill('demo'); await page.keyboard.press('Enter');
    await page.waitForURL(/\/admin$/);
    const r = await page.evaluate(() => fetch('/api/parametry', {method: 'PUT', headers: {'content-type': 'application/json'}, body: JSON.stringify({nadpisania: {}})}).then(r => r.status));
    console.log(`parametry przywrócone (HTTP ${r})`);
  } finally { await ctx.close(); }
}

const wanted = process.argv.slice(2);
for (const name of wanted.length ? wanted : Object.keys(scenes)) {
  if (!scenes[name]) { console.error(`Nie ma sceny "${name}". Sceny: ${Object.keys(scenes).join(', ')}`); process.exit(1); }
  console.log(`— ${name}`);
  try { await scenes[name](); } finally { if (name === 'panel') await przywrocParametry(); }
}
