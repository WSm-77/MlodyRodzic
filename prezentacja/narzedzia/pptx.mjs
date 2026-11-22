// Eksport prezentacji do PowerPointa: prezentacja/MlodyRodzic-prezentacja.pptx
//   (cd prezentacja && npm install && npm run pptx)
//
// Każdy slajd HTML rozkładany jest na warstwy: tło (wszystko, co się nie animuje) i osobny obraz
// każdego elementu .reveal, położony dokładnie tam, gdzie w HTML. Do slajdów dopisywane są
// animacje wejścia PowerPointa w tej samej kolejności i z tymi samymi opóźnieniami co w HTML
// (start automatyczny, bez klikania), a między slajdami – przenikanie.
// Wygląd 1:1 z HTML; teksty nie są edytowalne – zmiany wprowadza się w index.html i eksportuje ponownie.
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import {chromium} from '../../video/node_modules/playwright-core/index.mjs';
import {chromePath} from '../../video/capture/lib.mjs';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WYJSCIE = path.join(DIR, 'MlodyRodzic-prezentacja.pptx');
const SKALA = 2;            // gęstość pikseli obrazów (3840×2160 na slajd)
const PX = 1 / 192;         // 1920 px = 10 cali (LAYOUT_16x9)

// ---------- 1. Warstwy z przeglądarki ----------
const przegladarka = await chromium.launch({executablePath: chromePath()});
const kontekst = await przegladarka.newContext({viewport: {width: 1920, height: 1080}, deviceScaleFactor: SKALA, reducedMotion: 'reduce'});
const strona = await kontekst.newPage();
await strona.goto(pathToFileURL(path.join(DIR, 'index.html')).href + '#1', {waitUntil: 'networkidle'});
await strona.evaluate(() => document.fonts.ready);
// Tryb statyczny: bez przejść i animacji, wszystko od razu w stanie końcowym.
await strona.evaluate(() => document.documentElement.classList.add('statyczny'));
await strona.addStyleTag({content: '.deck-controls{display:none!important}'});
// Przezroczyste tło domyślne raz na stałe (zamiast omitBackground przy każdym zrzucie).
// Tło slajdu jest nieprzezroczyste, więc JPEG tła się nie zmienia.
const cdp = await kontekst.newCDPSession(strona);
await cdp.send('Emulation.setDefaultBackgroundColorOverride', {color: {r: 0, g: 0, b: 0, a: 0}});

const ustawStyl = css => strona.evaluate(css => {
  let s = document.getElementById('eksport-styl');
  if (!s) { s = document.createElement('style'); s.id = 'eksport-styl'; document.head.append(s); }
  s.textContent = css;
  // Zrzut dopiero po przerysowaniu.
  return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))));
}, css);

const liczba = await strona.locator('.slide').count();
const slajdy = [];
for (let nr = 1; nr <= liczba; nr++) {
  await ustawStyl('');
  await strona.keyboard.press('Home');
  for (let k = 1; k < nr; k++) await strona.keyboard.press('ArrowRight');
  await strona.waitForTimeout(150);

  const elementy = await strona.evaluate(() => {
    document.querySelectorAll('[data-eksport]').forEach(el => delete el.dataset.eksport);
    return [...document.querySelectorAll('.slide.active .reveal')].map((el, i) => {
    el.dataset.eksport = i;
    const r = el.getBoundingClientRect();
    const opoznienie = (parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0) * 1000;
    const rodzaj = el.classList.contains('telefon') ? 'telefon' : el.classList.contains('z-lewej') ? 'z-lewej'
      : el.classList.contains('z-prawej') ? 'z-prawej' : el.classList.contains('skala') ? 'skala' : 'gora';
    const opis = (el.querySelector('img')?.alt || el.alt || el.innerText || '').replace(/\s+/g, ' ').trim()
      || 'Ilustracja: rodzic z dzieckiem w sercu';
    return {i, x: r.left, y: r.top, w: r.width, h: r.height, opoznienie, rodzaj, opis};
  });
  });
  const nazwa = await strona.evaluate(() => document.querySelector('.slide.active').getAttribute('aria-label'));

  // Tło: slajd bez animowanych elementów.
  await ustawStyl('.slide.active .reveal, .slide.active .reveal *{visibility:hidden!important}');
  const tlo = await strona.screenshot({type: 'jpeg', quality: 92});

  // Każdy element osobno, na przezroczystym tle, z marginesem na cień.
  for (const e of elementy) {
    await ustawStyl(`html,body{background:transparent!important}
      body *{visibility:hidden!important}
      [data-eksport="${e.i}"], [data-eksport="${e.i}"] *{visibility:visible!important}`);
    const m = e.rodzaj === 'telefon' ? 110 : 44;
    const x = Math.max(0, Math.floor(e.x - m)), y = Math.max(0, Math.floor(e.y - m));
    const x2 = Math.min(1920, Math.ceil(e.x + e.w + m)), y2 = Math.min(1080, Math.ceil(e.y + e.h + m));
    Object.assign(e, {kx: x, ky: y, kw: x2 - x, kh: y2 - y});
    e.obraz = await strona.screenshot({type: 'png', clip: {x, y, width: x2 - x, height: y2 - y}});
    if (e.obraz[25] !== 6) throw new Error(`slajd ${nr}, element ${e.i}: zrzut bez kanału alfa`); // typ koloru PNG 6 = RGBA
  }
  slajdy.push({nazwa, tlo, elementy});
  console.log(`slajd ${nr}: ${elementy.length} animowanych elementów`);
}
await przegladarka.close();

// ---------- 2. Plik PPTX ----------
const pres = new PptxGenJS();
pres.layout = 'LAYOUT_16x9';
pres.title = 'MłodyRodzic – prezentacja';
pres.author = 'Wiktor Sędzimir, Szymon Rybski';
pres.subject = 'HackNation 2026 – zadanie ZUS „MlodyRodzic”';

for (const s of slajdy) {
  const slide = pres.addSlide();
  slide.background = {data: 'image/jpeg;base64,' + s.tlo.toString('base64')};
  for (const e of s.elementy) {
    slide.addImage({
      data: 'image/png;base64,' + e.obraz.toString('base64'),
      x: e.kx * PX, y: e.ky * PX, w: e.kw * PX, h: e.kh * PX,
      altText: e.opis.slice(0, 1000), objectName: `animacja-${e.i}`,
    });
  }
  slide.addNotes(s.nazwa || '');
}
await pres.writeFile({fileName: WYJSCIE});

// ---------- 3. Animacje i przejścia (OOXML p:timing) ----------
const cel = spid => `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>`;
const ruch = (id, spid, os, od, czas) =>
  `<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="${id}" dur="${czas}" decel="100000" fill="hold"/>${cel(spid)}` +
  `<p:attrNameLst><p:attrName>${os}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst>` +
  `<p:tav tm="0"><p:val><p:strVal val="${od}"/></p:val></p:tav>` +
  `<p:tav tm="100000"><p:val><p:strVal val="#${os}"/></p:val></p:tav></p:tavLst></p:anim>`;

function efekt(e, spid, pierwszy, nowyId) {
  const czas = e.rodzaj === 'telefon' ? 1100 : 800;
  const [preset, podtyp] = e.rodzaj === 'skala' ? [53, 16] : [42, 0]; // Powiększenie / Wyłanianie (fade + ruch)
  const wlasny = nowyId();
  let dzieci =
    `<p:set><p:cBhvr><p:cTn id="${nowyId()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>${cel(spid)}` +
    `<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>` +
    `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${nowyId()}" dur="${czas}"/>${cel(spid)}</p:cBhvr></p:animEffect>`;
  // Przesunięcia jak w CSS: 34 px w górę, 140 px dla telefonów, 70 px w poziomie, skala 0,86.
  if (e.rodzaj === 'gora') dzieci += ruch(nowyId(), spid, 'ppt_y', '#ppt_y+0.0315', czas);
  if (e.rodzaj === 'telefon') dzieci += ruch(nowyId(), spid, 'ppt_y', '#ppt_y+0.13', czas);
  if (e.rodzaj === 'z-lewej') dzieci += ruch(nowyId(), spid, 'ppt_x', '#ppt_x-0.0365', czas);
  if (e.rodzaj === 'z-prawej') dzieci += ruch(nowyId(), spid, 'ppt_x', '#ppt_x+0.0365', czas);
  if (e.rodzaj === 'skala') dzieci += ruch(nowyId(), spid, 'ppt_w', '#ppt_w*0.86', czas) + ruch(nowyId(), spid, 'ppt_h', '#ppt_h*0.86', czas);
  return `<p:par><p:cTn id="${wlasny}" presetID="${preset}" presetClass="entr" presetSubtype="${podtyp}" fill="hold" grpId="0" ` +
    `nodeType="${pierwszy ? 'afterEffect' : 'withEffect'}"><p:stCondLst><p:cond delay="${Math.round(e.opoznienie)}"/></p:stCondLst>` +
    `<p:childTnLst>${dzieci}</p:childTnLst></p:cTn></p:par>`;
}

function timing(elementy, idKsztaltu) {
  let id = 4;
  const nowyId = () => ++id;
  const efekty = [...elementy].sort((a, b) => a.opoznienie - b.opoznienie)
    .map((e, k) => efekt(e, idKsztaltu.get(`animacja-${e.i}`), k === 0, nowyId)).join('');
  return `<p:transition spd="med"><p:fade/></p:transition>` +
    `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` +
    `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>` +
    `<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>` +
    `<p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${efekty}</p:childTnLst></p:cTn></p:par>` +
    `</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn>` +
    `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>` +
    `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>` +
    `</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`;
}

const zip = await JSZip.loadAsync(fs.readFileSync(WYJSCIE));
for (let n = 1; n <= slajdy.length; n++) {
  const plik = `ppt/slides/slide${n}.xml`;
  let xml = await zip.file(plik).async('string');
  const idKsztaltu = new Map([...xml.matchAll(/<p:cNvPr id="(\d+)" name="(animacja-\d+)"/g)].map(m => [m[2], m[1]]));
  if (idKsztaltu.size !== slajdy[n - 1].elementy.length) throw new Error(`${plik}: znaleziono ${idKsztaltu.size} z ${slajdy[n - 1].elementy.length} obrazów`);
  const dodatek = slajdy[n - 1].elementy.length ? timing(slajdy[n - 1].elementy, idKsztaltu) : '<p:transition spd="med"><p:fade/></p:transition>';
  xml = xml.replace('</p:sld>', dodatek + '</p:sld>');
  zip.file(plik, xml);
}
// Bez wpisów katalogów w ZIP (usługi chmurowe źle je znoszą).
for (const [nazwa, wpis] of Object.entries(zip.files)) if (wpis.dir) delete zip.files[nazwa];
fs.writeFileSync(WYJSCIE, await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}));
console.log('PPTX:', WYJSCIE, `(${(fs.statSync(WYJSCIE).size / 1e6).toFixed(1)} MB)`);
