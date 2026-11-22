/**
 * Uprawnienia (GLOSSARY.md): prawa do świadczeń i urlopów ustalone dla Sytuacji rodziny, każde ze statusem i powodem.
 * Składa wyniki trzech szwów silnika w listę dla ekranów Świadczenia i Pulpit; niczego nie liczy od nowa.
 */

import type { Grosze, ISODate, Okres, OkresZasilku, Promile, RodzajUrlopu, WymiarUrlopu, WynikReguly, WynikRyzyk } from '@/silnik';
import { data, tygodnie } from './format';
import type { Rozpatrzenie } from './rozpatrz';
import { drugaRola, type Rola, type Sytuacja } from './sytuacja';

export type StatusUprawnienia = 'przysluguje' | 'zalezy' | 'nie_przysluguje';
export type RodzajUprawnienia = RodzajUrlopu | 'chorobowy_w_ciazy' | 'zasilek_do_porodu';

/** Okres z wyliczeniem kwoty: okres zasiłku macierzyńskiego z silnika albo zasiłku do porodu. */
export type OkresWyliczenia = Pick<OkresZasilku, 'od' | 'do' | 'dni' | 'stawka' | 'kwotaDzienna' | 'kwota' | 'wymiarPracy' | 'podwyzszenie'>;

export interface Uprawnienie {
  id: string;
  kto: Rola;
  rodzaj: RodzajUprawnienia;
  nazwa: string;
  status: StatusUprawnienia;
  powod: string;
  /** Co musiałoby się zmienić, żeby świadczenie przysługiwało (albo zostało wypłacone). */
  coZmieni?: string;
  termin?: ISODate;
  okres?: Okres;
  /** Okresy zasiłku z silnika: z nich ekran pokazuje wyliczenie. */
  okresy: OkresWyliczenia[];
  dni: number;
  /** Suma z dopłatami. `null`: brak podstawy wymiaru; `undefined`: świadczenie, którego aplikacja nie liczy. */
  kwota?: Grosze | null;
  stawki: Promile[];
  /** Podstawa wymiaru tej osoby. */
  podstawa: Grosze | null;
  /** Ryzyka i braki danych, które dotyczą tego świadczenia (plakietki). */
  ryzyka: WynikReguly[];
  /** Dodatkowe wyjaśnienia z reguł (np. okres zasiłkowy przy chorobowym). */
  szczegoly: string[];
  podstawaPrawna: string[];
}

export interface Uprawnienia {
  /** Świadczenia, które przysługują albo zależą od dodatkowych faktów; w kolejności: Ty, drugi rodzic, chronologicznie. */
  lista: Uprawnienie[];
  /** Świadczenia typowe dla takiej rodziny, które odpadają przez fakt z Sytuacji rodziny (decyzja Q23). */
  nieprzysluguje: Uprawnienie[];
  /** Ryzyka i informacje, które nie dotyczą jednego świadczenia. */
  ogolne: { kto: Rola; wynik: WynikReguly }[];
  ilePrzysluguje: number;
}

export const NAZWY_UPRAWNIEN: Record<RodzajUprawnienia, string> = {
  macierzynski: 'Zasiłek za urlop macierzyński',
  naWarunkachMacierzynskiego: 'Zasiłek za urlop na warunkach macierzyńskiego',
  uzupelniajacyMacierzynski: 'Zasiłek za uzupełniający urlop macierzyński',
  rodzicielski: 'Zasiłek za urlop rodzicielski',
  ojcowski: 'Zasiłek za urlop ojcowski',
  chorobowy_w_ciazy: 'Zasiłek chorobowy w ciąży',
  zasilek_do_porodu: 'Zasiłek w wysokości zasiłku macierzyńskiego (do porodu)',
};

const CHOROBOWE = new Set(['zasilek_chorobowy', 'wynagrodzenie_chorobowe', 'zasilek_chorobowy_po_ustaniu']);
const GLOWNE: RodzajUrlopu[] = ['macierzynski', 'naWarunkachMacierzynskiego', 'uzupelniajacyMacierzynski'];

export function imieRoli(s: Sytuacja, r: Rola): string {
  if (r === s.rola) return s.osoba.imie || 'Ty';
  return s.drugiRodzic?.imie || (r === 'matka' ? 'mama' : 'tata');
}
const wielka = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

interface Osoba {
  rola: Rola;
  ja: boolean;
  ryzyka: WynikRyzyk | null;
  podstawa: Grosze | null;
}

const unikalne = <T,>(xs: T[]) => [...new Set(xs)];

function powodZasilku(s: Sytuacja, o: Osoba, rodzaj: RodzajUrlopu, w: WymiarUrlopu | undefined, dni: number, r: Rozpatrzenie): string {
  const kto = imieRoli(s, o.rola);
  const dzien = s.zdarzenie === 'urodzenie' ? 'porodu' : 'przyjęcia dziecka';
  if (GLOWNE.includes(rodzaj)) {
    const regula = o.ja ? o.ryzyka?.wyniki.find((x) => x.swiadczenie === 'zasilek_macierzynski' && x.status === 'przysluguje') : undefined;
    const dlugosc = `${tygodnie(dni)} od dnia ${dzien}.`;
    return regula ? `${regula.komunikat} ${wielka(dlugosc)}` : `${wielka(kto)} ma ubezpieczenie chorobowe w dniu ${dzien}, więc zasiłek przysługuje przez ${dlugosc}`;
  }
  if (rodzaj === 'rodzicielski' && w) {
    const n = r.podzial?.nieprzenoszalne ?? w.tygodnieNieprzenoszalne ?? 0;
    const czesc = o.ja ? 'Twoja część' : `Część: ${kto}`;
    return `${czesc} to ${tygodnie(dni)} z ${w.tygodnie} tygodni urlopu rodzicielskiego dla rodziny.${n ? ` ${n} tygodni może wykorzystać tylko każde z rodziców osobno.` : ''}${w.terminWykorzystania ? ` Urlop trzeba wykorzystać do ${data(w.terminWykorzystania)}.` : ''}`;
  }
  if (rodzaj === 'ojcowski' && w)
    return `${w.tygodnie} tygodnie urlopu dla taty, w całości albo w dwóch częściach${w.terminWykorzystania ? `, do ${data(w.terminWykorzystania)}` : ''}.`;
  return `Przysługuje przez ${tygodnie(dni)}.`;
}

/** Zasiłki z okresów silnika jednej osoby, z plakietkami ryzyk i ewentualnym wstrzymaniem przez zaległość. */
function zasilkiOsoby(s: Sytuacja, r: Rozpatrzenie, o: Osoba, zuzyte: Set<WynikReguly>): Uprawnienie[] {
  const kto = imieRoli(s, o.rola);
  const wyniki = o.ryzyka?.wyniki ?? [];
  const blokada = wyniki.find((x) => x.status === 'nie_przysluguje' && x.regula.startsWith('R-DL'));
  const ryzyka = wyniki.filter(
    (x) => (x.status === 'ryzyko' || x.status === 'nieznane') && (x.swiadczenie === 'zasilek_macierzynski' || (!x.swiadczenie && x.regula.startsWith('R-PZ'))),
  );
  const okresy = r.urlopy.okresy.filter((x) => x.rodzic === o.rola);
  const rodzaje = unikalne(okresy.map((x) => x.rodzaj));
  if (rodzaje.length > 0) {
    if (blokada) zuzyte.add(blokada);
    ryzyka.forEach((x) => zuzyte.add(x));
    wyniki.filter((x) => x.swiadczenie === 'zasilek_macierzynski' && x.status === 'przysluguje').forEach((x) => zuzyte.add(x));
  }
  return rodzaje.map((rodzaj) => {
    const czesci = okresy.filter((x) => x.rodzaj === rodzaj);
    const w = r.urlopy.wymiary[rodzaj];
    const dni = czesci.reduce((a, x) => a + x.dni, 0);
    const kwota = czesci.some((x) => x.kwota == null) ? null : czesci.reduce((a, x) => a + (x.kwota ?? 0) + (x.podwyzszenie ?? 0), 0);
    const powod = blokada
      ? o.ja
        ? blokada.komunikat
        : `${wielka(kto)} ma zaległość w składkach powyżej progu. Dopóki jej całej nie spłaci, ZUS nie wypłaci zasiłku.`
      : powodZasilku(s, o, rodzaj, w, dni, r);
    return {
      id: `${rodzaj}-${o.rola}`,
      kto: o.rola,
      rodzaj,
      nazwa: NAZWY_UPRAWNIEN[rodzaj],
      status: blokada || ryzyka.some((x) => x.status === 'nieznane') ? 'zalezy' : 'przysluguje',
      powod,
      ...(blokada ? { coZmieni: 'Spłata całej zaległości w składkach. Wtedy ZUS wypłaci zasiłek.', ...(blokada.termin ? { termin: blokada.termin } : {}) } : {}),
      okres: { od: czesci[0]!.od, do: czesci.at(-1)!.do },
      okresy: czesci,
      dni,
      kwota,
      stawki: unikalne(czesci.map((x) => x.stawka)),
      podstawa: o.podstawa,
      ryzyka,
      szczegoly: [],
      podstawaPrawna: unikalne([...(w?.podstawaPrawna ?? []), ...czesci.flatMap((x) => x.podstawaPrawna), ...(blokada?.podstawaPrawna ?? [])]),
    } satisfies Uprawnienie;
  });
}

/** Zasiłek chorobowy w ciąży: z reguł R-CH (zwolnienia e-ZLA), bez kwoty (decyzja Q9). */
function chorobowyWCiazy(s: Sytuacja, o: Osoba, zuzyte: Set<WynikReguly>): Uprawnienie | null {
  if (o.rola !== 'matka' || s.zdarzenie !== 'urodzenie') return null;
  const reguly = (o.ryzyka?.wyniki ?? []).filter((x) => CHOROBOWE.has(x.swiadczenie ?? '') || (x.regula.startsWith('R-CH') && x.swiadczenie));
  const baza = { id: `chorobowy-${o.rola}`, kto: o.rola, rodzaj: 'chorobowy_w_ciazy' as const, nazwa: NAZWY_UPRAWNIEN.chorobowy_w_ciazy, okresy: [], dni: 0, stawki: [], podstawa: o.podstawa, ryzyka: [] };
  if (reguly.length === 0) {
    if (!o.ja || s.etap !== 'ciaza') return null;
    return {
      ...baza,
      status: 'zalezy',
      powod: 'Jeśli lekarz wystawi zwolnienie z kodem B (niezdolność do pracy w ciąży), dostaniesz 100% podstawy wymiaru za każdy dzień zwolnienia.',
      szczegoly: [],
      podstawaPrawna: ['UZ art. 11 ust. 2 pkt 2'],
    };
  }
  reguly.forEach((x) => zuzyte.add(x));
  const nie = reguly.find((x) => x.status === 'nie_przysluguje');
  const tak = reguly.find((x) => x.status === 'przysluguje');
  const glowna = nie ?? tak ?? reguly[0]!;
  return {
    ...baza,
    status: nie ? 'nie_przysluguje' : tak ? 'przysluguje' : 'zalezy',
    powod: glowna.komunikat,
    szczegoly: reguly.filter((x) => x !== glowna).map((x) => x.komunikat),
    podstawaPrawna: unikalne(reguly.flatMap((x) => x.podstawaPrawna)),
  };
}

/** Zasiłek w wysokości zasiłku macierzyńskiego po upadłości, likwidacji albo śmierci pracodawcy (R-ZWM-01). */
function zasilekDoPorodu(r: Rozpatrzenie, o: Osoba, zuzyte: Set<WynikReguly>): Uprawnienie | null {
  const z = r.zwm;
  if (!o.ja || !z) return null;
  const regula = r.ryzyka.wyniki.find((x) => x.regula === 'R-ZWM-01' && x.status === 'przysluguje');
  if (regula) zuzyte.add(regula);
  return {
    id: `zasilek-do-porodu-${o.rola}`,
    kto: o.rola,
    rodzaj: 'zasilek_do_porodu',
    nazwa: NAZWY_UPRAWNIEN.zasilek_do_porodu,
    status: 'przysluguje',
    powod: regula?.komunikat ?? 'Umowa ustała w ciąży z przyczyn po stronie pracodawcy, więc do dnia porodu przysługuje zasiłek w wysokości zasiłku macierzyńskiego.',
    okres: { od: z.od, do: z.do },
    okresy: [{ od: z.od, do: z.do, dni: z.dni, stawka: z.stawka, kwotaDzienna: z.kwotaDzienna, kwota: z.kwota }],
    dni: z.dni,
    kwota: z.kwota,
    stawki: [z.stawka],
    podstawa: z.podstawa?.podstawa ?? null,
    ryzyka: [],
    szczegoly: ['Podstawę wymiaru liczymy z 12 miesięcy przed miesiącem, w którym powstało prawo (dzień po rozwiązaniu umowy).'],
    podstawaPrawna: z.podstawaPrawna,
  };
}

/** Typowe świadczenia, które odpadają przez fakt z Sytuacji rodziny (Q23). Przy martwym urodzeniu ich nie wyliczamy. */
function nieprzyslugujace(s: Sytuacja, r: Rozpatrzenie, osoby: Osoba[], zuzyte: Set<WynikReguly>): Uprawnienie[] {
  if (s.martweUrodzenie) return [];
  const lista: Uprawnienie[] = [];
  const pusty = { okresy: [], dni: 0, stawki: [], podstawa: null, ryzyka: [], szczegoly: [] };
  const glowny: RodzajUrlopu = s.zdarzenie === 'urodzenie' ? 'macierzynski' : 'naWarunkachMacierzynskiego';

  for (const o of osoby) {
    const brak = o.ryzyka?.wyniki.find((x) => x.status === 'nie_przysluguje' && x.swiadczenie === 'zasilek_macierzynski' && !x.regula.startsWith('R-DL'));
    if (!brak || r.urlopy.okresy.some((x) => x.rodzic === o.rola && GLOWNE.includes(x.rodzaj))) continue;
    zuzyte.add(brak);
    lista.push({ ...pusty, id: `brak-${glowny}-${o.rola}`, kto: o.rola, rodzaj: glowny, nazwa: NAZWY_UPRAWNIEN[glowny], status: 'nie_przysluguje', powod: brak.komunikat, podstawaPrawna: brak.podstawaPrawna });
  }

  const drugi = drugaRola(s.rola);
  const d = s.drugiRodzic;
  const kto = imieRoli(s, drugi);
  const rodz = r.urlopy.wymiary.rodzicielski;
  const oj = r.urlopy.wymiary.ojcowski;
  const n = r.podzial?.nieprzenoszalne ?? rodz?.tygodnieNieprzenoszalne ?? 9;
  if (d && !d.ubezpieczony) {
    const coZmieni = `Ubezpieczenie chorobowe przed rozpoczęciem urlopu: umowa o pracę albo dobrowolne chorobowe przy zleceniu lub działalności.`;
    if (rodz?.przysluguje)
      lista.push({
        ...pusty,
        id: `brak-rodzicielski-${drugi}`,
        kto: drugi,
        rodzaj: 'rodzicielski',
        nazwa: NAZWY_UPRAWNIEN.rodzicielski,
        status: 'nie_przysluguje',
        powod: `${wielka(kto)} nie ma ubezpieczenia chorobowego, więc nie dostanie zasiłku za ${n} tygodni urlopu rodzicielskiego, które należą tylko do drugiego rodzica. Tych tygodni nie można przenieść.`,
        coZmieni,
        podstawaPrawna: rodz.podstawaPrawna,
      });
    if (drugi === 'ojciec' && oj?.przysluguje)
      lista.push({
        ...pusty,
        id: 'brak-ojcowski-ojciec',
        kto: drugi,
        rodzaj: 'ojcowski',
        nazwa: NAZWY_UPRAWNIEN.ojcowski,
        status: 'nie_przysluguje',
        powod: `${wielka(kto)} nie ma ubezpieczenia chorobowego, więc nie dostanie zasiłku za urlop ojcowski.`,
        coZmieni,
        podstawaPrawna: oj.podstawaPrawna,
      });
  }
  if (!d && rodz?.przysluguje && n > 0)
    lista.push({
      ...pusty,
      id: `brak-rodzicielski-${drugi}`,
      kto: drugi,
      rodzaj: 'rodzicielski',
      nazwa: `${NAZWY_UPRAWNIEN.rodzicielski} (część drugiego rodzica)`,
      status: 'nie_przysluguje',
      powod: `${n} tygodni urlopu rodzicielskiego należy tylko do drugiego rodzica. Gdy nie dzielicie opieki, tych tygodni nie można przenieść i przepadają.`,
      podstawaPrawna: rodz.podstawaPrawna,
    });
  return lista;
}

export function uprawnienia(s: Sytuacja, r: Rozpatrzenie): Uprawnienia {
  const osoby: Osoba[] = [
    { rola: s.rola, ja: true, ryzyka: r.ryzyka, podstawa: r.podstawa?.podstawa ?? null },
    ...(s.drugiRodzic ? [{ rola: drugaRola(s.rola), ja: false, ryzyka: r.ryzykaDrugiego, podstawa: r.podstawaDrugiego?.podstawa ?? null }] : []),
  ];
  const zuzyte = new Set<WynikReguly>();
  const lista = osoby.flatMap((o) => {
    const ch = chorobowyWCiazy(s, o, zuzyte);
    const zwm = zasilekDoPorodu(r, o, zuzyte);
    const zasilki = zasilkiOsoby(s, r, o, zuzyte).sort((a, b) => (a.okres!.od < b.okres!.od ? -1 : 1));
    return [...(ch && ch.status !== 'nie_przysluguje' ? [ch] : []), ...(zwm ? [zwm] : []), ...zasilki];
  });
  const nie = [
    ...osoby.map((o) => chorobowyWCiazy(s, o, new Set())).filter((x): x is Uprawnienie => x?.status === 'nie_przysluguje'),
    ...nieprzyslugujace(s, r, osoby, zuzyte),
  ];
  const ogolne = osoby.flatMap((o) => (o.ryzyka?.wyniki ?? []).filter((w) => !zuzyte.has(w)).map((wynik) => ({ kto: o.rola, wynik })));
  return { lista, nieprzysluguje: nie, ogolne, ilePrzysluguje: lista.filter((x) => x.status === 'przysluguje').length };
}
