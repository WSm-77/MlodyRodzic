/**
 * Formularze ZUS w PDF a Sytuacja rodziny: wypełnienie Z-3 danymi sprawy i odczyt edytowalnych ZAM, Z-3, Z-3a.
 * Nazwy pól: docs/research/formularze-acroform.md. Krótka nazwa to „Strona.Pole” albo „Strona.Pole[i]”,
 * np. „Page1.NIP” = `topmostSubform[0].Page1[0].NIP[0]`, „Page4.Miesiac[7]” = `topmostSubform[0].Page4[0].Miesiac[7]`.
 *
 * Skany ze spraw przykładowych ZUS nie mają pól ani warstwy tekstowej, więc odczytujemy tylko formularze
 * wypełnione elektronicznie (np. Z-3 pobrany dla sprawy z katalogu albo ZAM z ekranu wniosków).
 */

import type { Grosze, ISODate, MiesiacNiepracownika, MiesiacPracownika } from '@/silnik';
import { dodajDni } from '@/silnik/wspolne/daty';
import { dataPL } from './zam';
import type { PlanRodzica, Sytuacja } from './sytuacja';

export type WartoscPola = string | boolean;
export type PolaFormularza = Record<string, WartoscPola>;
export type RodzajFormularza = 'ZAM' | 'Z-3' | 'Z-3a';

export interface OdczytFormularza {
  formularz: RodzajFormularza;
  /** Co odczytaliśmy, do pokazania rodzicowi przed przejściem do Przewodnika. */
  odczytane: { etykieta: string; wartosc: string }[];
  zmiany: Partial<Sytuacja>;
  plan?: Partial<PlanRodzica>;
  /** Czego formularz nie zawiera, a Plan potrzebuje: rodzic uzupełni w Przewodniku. */
  braki: string[];
}

/** `topmostSubform[0].Page4[0].Miesiac[7]` → `Page4.Miesiac[7]`; indeks [0] pola pomijamy. */
export function krotkaNazwa(pelna: string): string {
  const m = /Page(\d+)\[0\]\.(.+)$/.exec(pelna);
  if (!m) return pelna;
  return `Page${m[1]}.${m[2]!.replace(/\[0\]$/, '')}`;
}

/** Odwrotność `krotkaNazwa`. */
export function pelnaNazwaPola(krotka: string): string {
  const [strona, pole] = krotka.split('.') as [string, string];
  return `topmostSubform[0].${strona}[0].${pole.includes('[') ? pole : `${pole}[0]`}`;
}

const kwotaPL = (g: Grosze): string => (g / 100).toFixed(2).replace('.', ',');

/** „6 400,00 zł”, „6400.5” → grosze; pusty tekst → null. */
export function kwotaZTekstu(t: WartoscPola | undefined): Grosze | null {
  if (typeof t !== 'string') return null;
  const czyste = t.replace(/[^\d,.-]/g, '').replace(',', '.');
  if (!czyste || Number.isNaN(Number(czyste))) return null;
  return Math.round(Number(czyste) * 100);
}

/** Wszystkie daty z tekstu: „dd.mm.rrrr”, „dd-mm-rrrr”, „rrrr-mm-dd” albo pole grzebieniowe „ddmmrrrr”. */
export function datyZTekstu(t: WartoscPola | undefined): ISODate[] {
  if (typeof t !== 'string') return [];
  const daty: ISODate[] = [];
  const re = /(\d{4})-(\d{2})-(\d{2})|(\d{2})[.\-/ ](\d{2})[.\-/ ](\d{4})|\b(\d{2})(\d{2})(\d{4})\b/g;
  for (const m of t.matchAll(re)) {
    if (m[1]) daty.push(`${m[1]}-${m[2]}-${m[3]}`);
    else if (m[4]) daty.push(`${m[6]}-${m[5]}-${m[4]}`);
    else daty.push(`${m[9]}-${m[8]}-${m[7]}`);
  }
  return daty;
}

/** Wartość pola; „Pole[0]” i „Pole” to to samo pole (krotkaNazwa pomija indeks 0). */
const pole = (p: PolaFormularza, k: string): WartoscPola | undefined => p[k] ?? p[k.replace(/\[0\]$/, '')];
const tekst = (p: PolaFormularza, k: string): string => {
  const v = pole(p, k);
  return typeof v === 'string' ? v.trim() : '';
};
const zaznaczone = (p: PolaFormularza, k: string): boolean => pole(p, k) === true;

export function rozpoznajFormularz(p: PolaFormularza): RodzajFormularza | null {
  if ('Page4.Podstawawymiaru' in p && 'Page3.UCHpodlega' in p) return 'Z-3';
  if ('Page5.Podstawawymiaru' in p && 'Page3.UCHpodlega' in p) return 'Z-3a';
  if ('Page2.macierzynskiego' in p && 'Page5.Imie' in p) return 'ZAM';
  return null;
}

// --- Z-3: wypełnienie danymi sprawy ---------------------------------------------------------------------------

/** Z-3 dla pracownika z danymi płacowymi z Sytuacji (tabela s. 4: ostatnie 12 miesięcy). */
export function polaZ3(s: Sytuacja, dzis: ISODate): PolaFormularza {
  const p: PolaFormularza = {
    'Page1.pierwszywniosek': true,
    'Page1.NIP': s.platnik.nip,
    'Page1.Nazwaplatnika': s.platnik.nazwa,
    'Page1.PESEL2': s.osoba.pesel,
    'Page1.Imie': s.osoba.imie,
    'Page1.Nazwisko': s.osoba.nazwisko,
    'Page3.UCHpodlega': s.ustanie ? `${dataPL(s.poczatekUbezpieczenia)} – ${dataPL(s.ustanie.data)}` : `od ${dataPL(s.poczatekUbezpieczenia)}`,
    'Page3.UZpodlega': s.pelnyEtat ? 'pełny etat' : 'niepełny etat',
    'Page4.TAK_PI': !s.platnik.ponad20,
    'Page4.NIE_PI': s.platnik.ponad20,
    'Page6.Data': dataPL(dzis).replace(/\./g, ''),
  };
  const zwolnienie = s.zwolnienia[0];
  if (s.ustanie && s.etap === 'ciaza') {
    p['Page2.zasilekwwysokosci'] = true;
    p['Page2.Tekstzww'] = `od ${dataPL(dodajDni(s.ustanie.data, 1))} do dnia porodu`;
  } else if (s.etap === 'ciaza' && zwolnienie) {
    p['Page2._1'] = true;
    p['Page2.Tekst'] = `${dataPL(zwolnienie.od)} – ${dataPL(zwolnienie.do)}${zwolnienie.kodB ? ', kod B' : ''}`;
  } else {
    p['Page2._3'] = true;
    p['Page2.Tekstzm'] = `od ${dataPL(s.dataZdarzenia)}`;
    p['Page3.A6'] = s.rola === 'matka' && s.zdarzenie === 'urodzenie';
    p['Page3.E6'] = s.rola === 'ojciec';
    if (s.zdarzenie === 'urodzenie') p['Page3.Tekst1'] = `dziecko ur. ${dataPL(s.dataZdarzenia)}${s.dzieci.length > 1 ? ` (${s.dzieci.length} dzieci z jednego porodu)` : ''}`;
  }
  const pierwszy = s.miesiacePracownika?.[0];
  if (s.zmianaWymiaruCzasuPracy && pierwszy) p['Page3.Podajdate'] = `01${pierwszy.miesiac.slice(5, 7)}${pierwszy.miesiac.slice(0, 4)}`;

  (s.miesiacePracownika ?? []).slice(-12).forEach((m, i) => {
    p[`Page4.ROK[${i}]`] = m.miesiac.slice(0, 4);
    p[`Page4.Miesiac[${5 * i}]`] = m.miesiac.slice(5, 7);
    if (m.dniDoPrzepracowania !== undefined) {
      p[`Page4.Miesiac[${5 * i + 1}]`] = String(m.dniPrzepracowane ?? 0);
      p[`Page4.Przepracowal[${i}]`] = String(m.dniDoPrzepracowania);
      p[`Page4.Liczbadni[${i}]`] = (m.dniPrzepracowane ?? 0) === 0 ? 'zasiłek' : 'nieobecność usprawiedliwiona';
    }
    p[`Page4.Podstawawymiaru[${i}]`] = kwotaPL(m.skladnikStalyZUmowy ?? m.brutto);
    p[`Page4.Miesiac[${5 * i + 2}]`] = kwotaPL(m.skladnikZmiennyFaktyczny ?? 0);
    p[`Page4.Miesiac[${5 * i + 3}]`] = kwotaPL(0);
    p[`Page4.Miesiac[${5 * i + 4}]`] = '13,71';
  });
  return p;
}

// --- Odczyt ---------------------------------------------------------------------------------------------------

/** Wiersze tabeli Z-3 (s. 4) na miesiące pracownika; miesiąc niepełny uzupełniany do składnika stałego. */
function miesiaceZ3(p: PolaFormularza): MiesiacPracownika[] {
  const wynik: MiesiacPracownika[] = [];
  for (let i = 0; i < 12; i++) {
    const rok = tekst(p, `Page4.ROK[${i}]`);
    const mies = tekst(p, `Page4.Miesiac[${5 * i}]`).padStart(2, '0');
    const stale = kwotaZTekstu(pole(p, `Page4.Podstawawymiaru[${i}]`));
    if (!/^\d{4}$/.test(rok) || !/^(0[1-9]|1[0-2])$/.test(mies) || stale == null) continue;
    const zmienne = kwotaZTekstu(pole(p, `Page4.Miesiac[${5 * i + 2}]`)) ?? 0;
    const premie = kwotaZTekstu(pole(p, `Page4.Miesiac[${5 * i + 3}]`)) ?? 0;
    const przepr = Number.parseInt(tekst(p, `Page4.Miesiac[${5 * i + 1}]`), 10);
    const doPrzepr = Number.parseInt(tekst(p, `Page4.Przepracowal[${i}]`), 10);
    const miesiac = `${rok}-${mies}`;
    if (Number.isFinite(przepr) && Number.isFinite(doPrzepr) && przepr < doPrzepr) {
      wynik.push(
        stale === 0
          ? { miesiac, brutto: zmienne + premie, dniDoPrzepracowania: doPrzepr, dniPrzepracowane: przepr }
          : {
              miesiac,
              brutto: Math.round((stale * przepr) / doPrzepr) + zmienne + premie,
              dniDoPrzepracowania: doPrzepr,
              dniPrzepracowane: przepr,
              skladnikStalyZUmowy: stale,
              ...(zmienne ? { skladnikZmiennyFaktyczny: zmienne } : {}),
            },
      );
    } else wynik.push({ miesiac, brutto: stale + zmienne + premie });
  }
  return wynik.sort((a, b) => a.miesiac.localeCompare(b.miesiac));
}

/** Tabela przychodu Z-3a (s. 5) na miesiące niepracownika. */
function miesiaceZ3a(p: PolaFormularza): MiesiacNiepracownika[] {
  const wynik: MiesiacNiepracownika[] = [];
  for (let i = 0; i < 12; i++) {
    const rok = tekst(p, `Page5.ROK[${i}]`);
    const mies = tekst(p, `Page5.Miesiac[${i}]`).padStart(2, '0');
    const podstawa = kwotaZTekstu(pole(p, `Page5.Podstawawymiaru[${i}]`));
    if (!/^\d{4}$/.test(rok) || !/^(0[1-9]|1[0-2])$/.test(mies) || podstawa == null) continue;
    const dni = Number.parseInt(tekst(p, `Page5.Przepracowal[${i}]`), 10);
    const wszystkie = Number.parseInt(tekst(p, `Page5.Liczbadni[${i}]`), 10);
    wynik.push({ miesiac: `${rok}-${mies}`, podstawaSkladkiChorobowej: podstawa, ...(Number.isFinite(dni) && Number.isFinite(wszystkie) && dni < wszystkie ? { dniWykonywania: dni } : {}) });
  }
  return wynik.sort((a, b) => a.miesiac.localeCompare(b.miesiac));
}

const srednia = (xs: number[]): Grosze | null => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

function wspolneZaswiadczenia(p: PolaFormularza, o: OdczytFormularza, dzis: ISODate, platnik20: [string, string]) {
  const z = o.zmiany;
  const imie = tekst(p, 'Page1.Imie');
  const nazwisko = tekst(p, 'Page1.Nazwisko');
  const pesel = tekst(p, 'Page1.PESEL2');
  if (imie || nazwisko || pesel) {
    z.osoba = { imie, nazwisko, pesel, adres: { ulica: '', nrDomu: '', kod: '', poczta: '' } };
    o.odczytane.push({ etykieta: 'Ubezpieczony', wartosc: [imie, nazwisko, pesel && `PESEL ${pesel}`].filter(Boolean).join(' ') });
  }
  const do20 = zaznaczone(p, platnik20[0]);
  const ponad20 = zaznaczone(p, platnik20[1]);
  z.platnik = { nazwa: tekst(p, 'Page1.Nazwaplatnika'), nip: tekst(p, 'Page1.NIP'), ponad20: ponad20 && !do20 };
  o.odczytane.push({
    etykieta: 'Płatnik',
    wartosc: `${z.platnik.nazwa || 'bez nazwy'}${z.platnik.nip ? `, NIP ${z.platnik.nip}` : ''}${do20 ? ' · do 20 ubezpieczonych (zasiłek wypłaca ZUS)' : ponad20 ? ' · ponad 20 ubezpieczonych (wypłaca płatnik)' : ''}`,
  });
  if (!do20 && !ponad20) o.braki.push('czy płatnik zgłasza do ubezpieczenia ponad 20 osób');

  const ubezp = datyZTekstu(pole(p, 'Page3.UCHpodlega'));
  if (ubezp[0]) {
    z.poczatekUbezpieczenia = ubezp[0];
    o.odczytane.push({ etykieta: 'Ubezpieczenie chorobowe', wartosc: ubezp[1] ? `${dataPL(ubezp[0])} – ${dataPL(ubezp[1])}` : `od ${dataPL(ubezp[0])}` });
    if (ubezp[1]) {
      z.ustanie = { data: ubezp[1], przyczyna: 'wypowiedzenie_lub_porozumienie' };
      o.braki.push('przyczyna ustania umowy');
    }
  } else o.braki.push('od kiedy masz ubezpieczenie chorobowe');

  const zdarzenie = datyZTekstu(pole(p, 'Page3.Tekst1'))[0] ?? datyZTekstu(pole(p, 'Page2.Dane_tekst'))[0] ?? datyZTekstu(pole(p, 'Page2.Tekstzm'))[0];
  if (zdarzenie) {
    z.dataZdarzenia = zdarzenie;
    z.etap = zdarzenie <= dzis ? 'poZdarzeniu' : 'ciaza';
    o.odczytane.push({ etykieta: 'Data porodu (początek zasiłku)', wartosc: dataPL(zdarzenie) });
  } else o.braki.push('data porodu albo przyjęcia dziecka');
}

function odczytZ3(p: PolaFormularza, dzis: ISODate): OdczytFormularza {
  const o: OdczytFormularza = { formularz: 'Z-3', odczytane: [], zmiany: { tytul: 'umowa_o_prace' }, braki: [] };
  wspolneZaswiadczenia(p, o, dzis, ['Page4.TAK_PI', 'Page4.NIE_PI']);
  const z = o.zmiany;
  const wymiar = tekst(p, 'Page3.UZpodlega').toLowerCase();
  const ulamek = /^(\d+)\s*\/\s*(\d+)$/.exec(wymiar);
  z.pelnyEtat = ulamek ? ulamek[1] === ulamek[2] : !/niepełn|niepeln|0[,.]\d/.test(wymiar);
  if (wymiar) o.odczytane.push({ etykieta: 'Wymiar czasu pracy', wartosc: wymiar });
  if (tekst(p, 'Page3.Podajdate')) z.zmianaWymiaruCzasuPracy = true;
  if (zaznaczone(p, 'Page2.zasilekwwysokosci')) {
    z.etap = 'ciaza';
    if (z.ustanie) z.ustanie = { ...z.ustanie, przyczyna: 'upadlosc_pracodawcy' };
    o.odczytane.push({ etykieta: 'Wniosek', wartosc: 'zasiłek w wysokości zasiłku macierzyńskiego' });
    o.braki.push('przewidywana data porodu', 'czy pracodawca zapewnił inne zatrudnienie');
  }
  if (zaznaczone(p, 'Page3.E6')) z.rola = 'ojciec';
  const miesiace = miesiaceZ3(p);
  if (miesiace.length) {
    z.miesiacePracownika = miesiace;
    z.bruttoMiesiecznie = srednia(miesiace.map((m) => m.skladnikStalyZUmowy ?? m.brutto));
    o.odczytane.push({
      etykieta: 'Wynagrodzenie',
      wartosc: `${miesiace.length} mies. (${miesiace[0]!.miesiac} – ${miesiace.at(-1)!.miesiac}), średnio ${kwotaPL(z.bruttoMiesiecznie ?? 0)} zł brutto`,
    });
  } else o.braki.push('wynagrodzenie z ostatnich 12 miesięcy');
  return o;
}

function odczytZ3a(p: PolaFormularza, dzis: ISODate): OdczytFormularza {
  const o: OdczytFormularza = { formularz: 'Z-3a', odczytane: [], zmiany: { tytul: 'umowa_zlecenia' }, braki: [] };
  wspolneZaswiadczenia(p, o, dzis, ['Page4.PozostaleA', 'Page4.PozostaleB']);
  const miesiace = miesiaceZ3a(p);
  if (miesiace.length) {
    o.zmiany.miesiaceNiepracownika = miesiace;
    o.zmiany.bruttoMiesiecznie = srednia(miesiace.map((m) => m.podstawaSkladkiChorobowej));
    o.odczytane.push({ etykieta: 'Podstawa składek', wartosc: `${miesiace.length} mies., średnio ${kwotaPL(o.zmiany.bruttoMiesiecznie ?? 0)} zł` });
  } else o.braki.push('przychód z ostatnich 12 miesięcy');
  return o;
}

function odczytZam(p: PolaFormularza, dzis: ISODate): OdczytFormularza {
  const o: OdczytFormularza = { formularz: 'ZAM', odczytane: [], zmiany: {}, braki: ['wynagrodzenie (ZAM go nie zawiera – dołącz Z-3 albo wpisz w Przewodniku)'] };
  const z = o.zmiany;
  const osoba = {
    imie: tekst(p, 'Page1.Imie'),
    nazwisko: tekst(p, 'Page1.Nazwisko'),
    pesel: tekst(p, 'Page1.PESEL'),
    adres: { ulica: tekst(p, 'Page1.Ulica'), nrDomu: tekst(p, 'Page1.Numerdomu'), nrLokalu: tekst(p, 'Page1.Numerlokalu'), kod: tekst(p, 'Page1.Kodpocztowy'), poczta: tekst(p, 'Page1.Poczta') },
    ...(tekst(p, 'Page2.Numerrachunku') ? { rachunek: tekst(p, 'Page2.Numerrachunku') } : {}),
  };
  z.osoba = osoba;
  o.odczytane.push({ etykieta: 'Wnioskodawca', wartosc: [osoba.imie, osoba.nazwisko, osoba.pesel && `PESEL ${osoba.pesel}`].filter(Boolean).join(' ') || '—' });
  if (tekst(p, 'Page1.Nazwaplatnika') || tekst(p, 'Page1.NIP')) {
    z.platnik = { nazwa: tekst(p, 'Page1.Nazwaplatnika'), nip: tekst(p, 'Page1.NIP'), ponad20: false };
    o.odczytane.push({ etykieta: 'Płatnik', wartosc: `${z.platnik.nazwa}${z.platnik.nip ? `, NIP ${z.platnik.nip}` : ''}` });
    o.braki.push('czy płatnik zgłasza do ubezpieczenia ponad 20 osób');
  }
  if (zaznaczone(p, 'Page2.TAK')) z.tytul = 'dzialalnosc';

  if (zaznaczone(p, 'Page2.ZaznaczX1b') || zaznaczone(p, 'Page2.ZaznaczX1c')) {
    z.zdarzenie = zaznaczone(p, 'Page2.ZaznaczX1b') ? 'przysposobienie' : 'rodzinaZastepczaNiezawodowa';
    const d = datyZTekstu(pole(p, 'Page2.Data'))[0];
    if (d) z.dataZdarzenia = d;
    z.etap = 'poZdarzeniu';
  } else if (zaznaczone(p, 'Page3._2')) {
    const d = datyZTekstu(pole(p, 'Page3.Data2a'))[0];
    if (d) z.dataZdarzenia = d;
    z.etap = 'ciaza';
    z.zdarzenie = 'urodzenie';
  } else {
    const d = datyZTekstu(pole(p, 'Page3.Tekst1'))[0] ?? datyZTekstu(pole(p, 'Page2.Okres'))[0] ?? datyZTekstu(pole(p, 'Page2.Okres4'))[0];
    if (d) z.dataZdarzenia = d;
    z.zdarzenie = 'urodzenie';
    z.etap = d && d > dzis ? 'ciaza' : 'poZdarzeniu';
  }
  if (z.dataZdarzenia) o.odczytane.push({ etykieta: z.zdarzenie === 'urodzenie' ? (z.etap === 'ciaza' ? 'Przewidywana data porodu' : 'Data porodu') : 'Data przyjęcia dziecka', wartosc: dataPL(z.dataZdarzenia) });
  else o.braki.push('data porodu albo przyjęcia dziecka');

  const dzieci = tekst(p, 'Page3.Tekst1').split(';').filter((x) => x.trim());
  if (dzieci.length > 1) z.dzieci = dzieci.map(() => ({ imie: '' }));
  if (zaznaczone(p, 'Page3.ZaznaczX1')) {
    z.zaZyciem = true;
    o.odczytane.push({ etykieta: 'Zaświadczenie „Za życiem”', wartosc: 'tak' });
  }
  const zakres = [
    zaznaczone(p, 'Page2.macierzynskiego') && 'urlop macierzyński',
    zaznaczone(p, 'Page2.nawarunkach') && 'urlop na warunkach macierzyńskiego',
    zaznaczone(p, 'Page2.rodzicielskiego') && 'urlop rodzicielski',
    zaznaczone(p, 'Page2.uzMacierzynskiego') && 'uzupełniający urlop macierzyński',
    zaznaczone(p, 'Page2.ojcowskiego') && 'urlop ojcowski',
  ].filter(Boolean);
  if (zakres.length) o.odczytane.push({ etykieta: 'Zakres wniosku', wartosc: zakres.join(', ') });
  if (zaznaczone(p, 'Page2.ojcowskiego') && !zaznaczone(p, 'Page2.macierzynskiego')) z.rola = 'ojciec';
  if (zaznaczone(p, 'Page2.informuje')) {
    o.plan = { wariant: '81_5' };
    o.odczytane.push({ etykieta: 'Wariant', wartosc: '81,5% za cały okres (pełny wymiar)' });
  }
  const drugiImie = tekst(p, 'Page5.Imie');
  if (drugiImie || zaznaczone(p, 'Page5.TAK')) {
    z.drugiRodzic = { imie: drugiImie, nazwisko: tekst(p, 'Page5.Nazwisko'), pesel: tekst(p, 'Page5.PESEL'), ubezpieczony: zaznaczone(p, 'Page5.TAK'), tytul: 'umowa_o_prace', bruttoMiesiecznie: null };
    o.odczytane.push({ etykieta: 'Drugi rodzic', wartosc: [drugiImie, tekst(p, 'Page5.Nazwisko')].filter(Boolean).join(' ') || '—' });
  }
  return o;
}

export function odczytajFormularz(p: PolaFormularza, dzis: ISODate): OdczytFormularza | null {
  const rodzaj = rozpoznajFormularz(p);
  if (rodzaj === 'Z-3') return odczytZ3(p, dzis);
  if (rodzaj === 'Z-3a') return odczytZ3a(p, dzis);
  if (rodzaj === 'ZAM') return odczytZam(p, dzis);
  return null;
}

/** Nakłada odczyt na Sytuację (szkic Przewodnika): dane z formularza nadpisują, reszta zostaje. */
export function nalozOdczyt(baza: Sytuacja, o: OdczytFormularza): Sytuacja {
  const { sprawaPrzykladowa: _, ...bezSprawy } = baza;
  const z = o.zmiany;
  return {
    ...bezSprawy,
    ...z,
    zrodlo: 'wpisane',
    osoba: z.osoba ? { ...baza.osoba, ...z.osoba, adres: { ...baza.osoba.adres, ...Object.fromEntries(Object.entries(z.osoba.adres).filter(([, v]) => v)) } } : baza.osoba,
    ...(z.miesiacePracownika ? { miesiaceNiepracownika: undefined } : {}),
    ...(z.miesiaceNiepracownika ? { miesiacePracownika: undefined } : {}),
    przyblizona: false,
    zalozenia: [],
  };
}
