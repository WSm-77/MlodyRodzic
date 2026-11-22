/**
 * Wnioski do wypełnienia w aplikacji dla pozycji z listy „Wnioski i terminy”:
 * - wniosek urlopowy pracownika do pracodawcy – nie ma urzędowego wzoru, treść według rozporządzenia
 *   w sprawie wniosków dotyczących uprawnień pracowników związanych z rodzicielstwem (Dz.U. 2025 poz. 322, „RWn”);
 * - ZAM (wzór ZUS) wypełniany danymi z Sytuacji i Planu;
 * - wniosek o odpis aktu urodzenia (rejestr stanu cywilnego, gov.pl).
 */

import type { ISODate, OkresZasilku } from '@/silnik';
import { dodajDni } from '@/silnik/wspolne/daty';
import type { PozycjaDokumentu } from './dokumenty';
import type { Rozpatrzenie } from './rozpatrz';
import { jestPracownikiem, wgRoli, type PlanRodzica, type Rola, type Sytuacja } from './sytuacja';
import { dataPL } from './zam';

export interface PoleWniosku {
  klucz: string;
  etykieta: string;
  wartosc: string;
  typ: 'tekst' | 'data';
}

export interface WzorWniosku {
  tytul: string;
  /** Pracodawca, do którego trafia wniosek. */
  adresat: string;
  pola: PoleWniosku[];
  /** Akapity wniosku z bieżących wartości pól (daty w polach w formacie ISO). */
  tresc: (w: Record<string, string>) => string[];
  oswiadczenia: string[];
  zalaczniki: string[];
  podstawa: string[];
}

export type FormularzWniosku = { rodzaj: 'urlopowy'; wzor: WzorWniosku } | { rodzaj: 'zam'; wlasny: boolean } | { rodzaj: 'odpis' };

const d = (iso: string | undefined) => (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? dataPL(iso) : '…');

function osobaRoli(s: Sytuacja, k: Rola) {
  if (k === s.rola) return { imieNazwisko: [s.osoba.imie, s.osoba.nazwisko].filter(Boolean).join(' '), pracodawca: s.platnik.nazwa, tytul: s.tytul };
  const dr = s.drugiRodzic;
  return { imieNazwisko: [dr?.imie, dr?.nazwisko].filter(Boolean).join(' '), pracodawca: '', tytul: dr?.tytul ?? 'umowa_o_prace' };
}

/** „Zofia Kowalczyk, ur. 10.11.2026” albo opis dzieci bez imion. */
function dzieci(s: Sytuacja): string {
  const ur = (i: number) => (s.zdarzenie === 'urodzenie' ? s.dataZdarzenia : s.dzieci[i]?.dataUrodzenia);
  const lista = s.dzieci.map((x, i) => [x.imie ? `${x.imie} ${s.osoba.nazwisko}`.trim() : 'dziecko', ur(i) ? `ur. ${dataPL(ur(i)!)}` : ''].filter(Boolean).join(', '));
  return lista.join('; ');
}

const okresyRoli = (r: Rozpatrzenie, k: Rola, rodzaj: OkresZasilku['rodzaj']) => r.urlopy.okresy.filter((o) => o.rodzic === k && o.rodzaj === rodzaj);

const wspolnePola = (s: Sytuacja, k: Rola, dzis: ISODate): PoleWniosku[] => [
  { klucz: 'imieNazwisko', etykieta: 'Imię i nazwisko pracownika', wartosc: osobaRoli(s, k).imieNazwisko, typ: 'tekst' },
  { klucz: 'pracodawca', etykieta: 'Pracodawca', wartosc: osobaRoli(s, k).pracodawca, typ: 'tekst' },
  { klucz: 'miejscowosc', etykieta: 'Miejscowość', wartosc: k === s.rola ? s.osoba.adres.poczta : '', typ: 'tekst' },
  { klucz: 'data', etykieta: 'Data wniosku', wartosc: dzis, typ: 'data' },
];

const zaZyciem = (s: Sytuacja) => (s.zaZyciem ? ['Kopia zaświadczenia „Za życiem” (art. 4 ust. 3 ustawy o wsparciu kobiet w ciąży i rodzin „Za życiem”)'] : []);
const odpisAktu = (s: Sytuacja) =>
  s.zdarzenie === 'urodzenie'
    ? ['Odpis skrócony aktu urodzenia dziecka (albo jego kopia)']
    : ['Oświadczenie o dacie przyjęcia dziecka i kopia wniosku do sądu o przysposobienie z poświadczeniem daty (albo orzeczenie o umieszczeniu w rodzinie zastępczej)'];

/** Oświadczenie o drugim rodzicu wymagane przy urlopie rodzicielskim (RWn § 15 ust. 2 pkt 2). */
function oswiadczenieDrugiego(s: Sytuacja, r: Rozpatrzenie, k: Rola): string {
  const drugi = r.urlopy.okresy.filter((o) => o.rodzic !== k && o.rodzic !== 'inny' && o.rodzaj === 'rodzicielski');
  const rodzic = k === 'matka' ? 'ojciec' : 'matka';
  return drugi.length
    ? `Oświadczam, że drugi rodzic dziecka (${rodzic}) zamierza korzystać z urlopu rodzicielskiego albo zasiłku za ten okres od ${dataPL(drugi[0]!.od)} do ${dataPL(drugi.at(-1)!.do)}.`
    : `Oświadczam, że drugi rodzic dziecka (${rodzic}) nie zamierza korzystać z urlopu rodzicielskiego ani zasiłku za ten okres w okresie wskazanym we wniosku.`;
}

function wzorPrzedPorodem(s: Sytuacja, k: Rola, dzis: ISODate): WzorWniosku {
  return {
    tytul: 'Wniosek o udzielenie części urlopu macierzyńskiego przed przewidywaną datą porodu',
    adresat: osobaRoli(s, k).pracodawca,
    pola: [...wspolnePola(s, k, dzis), { klucz: 'od', etykieta: 'Urlop od dnia (najwcześniej 6 tygodni przed porodem)', wartosc: dodajDni(s.dataZdarzenia, -42), typ: 'data' }],
    tresc: (w) => [`Na podstawie art. 180 § 2 Kodeksu pracy proszę o udzielenie mi części urlopu macierzyńskiego przed przewidywaną datą porodu (${dataPL(s.dataZdarzenia)}) od dnia ${d(w.od)}.`],
    oswiadczenia: [],
    zalaczniki: ['Kopia zaświadczenia lekarskiego o przewidywanej dacie porodu (na zwykłym druku)'],
    podstawa: ['KP art. 180 § 2', 'RWn § 2'],
  };
}

function wzorGlowny(s: Sytuacja, plan: PlanRodzica, r: Rozpatrzenie, k: Rola, dzis: ISODate): WzorWniosku | null {
  const glowny = r.urlopy.okresy.find((o) => o.rodzic === k && (o.rodzaj === 'macierzynski' || o.rodzaj === 'naWarunkachMacierzynskiego'));
  if (!glowny) return null;
  const naWarunkach = glowny.rodzaj === 'naWarunkachMacierzynskiego';
  const rodz = okresyRoli(r, k, 'rodzicielski');
  const pelny = plan.wariant === '81_5' && rodz.length > 0 && rodz[0]!.od === dodajDni(glowny.do, 1);
  const pola: PoleWniosku[] = [
    ...wspolnePola(s, k, dzis),
    { klucz: 'od', etykieta: naWarunkach ? 'Urlop na warunkach macierzyńskiego od' : 'Urlop macierzyński od', wartosc: glowny.od, typ: 'data' },
    { klucz: 'do', etykieta: 'do', wartosc: glowny.do, typ: 'data' },
    ...(pelny
      ? ([
          { klucz: 'rodzOd', etykieta: 'Urlop rodzicielski od', wartosc: rodz[0]!.od, typ: 'data' },
          { klucz: 'rodzDo', etykieta: 'do', wartosc: rodz.at(-1)!.do, typ: 'data' },
        ] satisfies PoleWniosku[])
      : []),
  ];
  const zdarzenie = naWarunkach
    ? `w związku z przyjęciem na wychowanie dziecka (${dzieci(s)}) w dniu ${dataPL(s.dataZdarzenia)}`
    : s.martweUrodzenie
      ? `w związku z porodem w dniu ${dataPL(s.dataZdarzenia)}`
      : `w związku z urodzeniem dziecka (${dzieci(s)})`;
  return {
    tytul: naWarunkach
      ? 'Wniosek o udzielenie urlopu na warunkach urlopu macierzyńskiego'
      : pelny
        ? 'Wniosek o udzielenie urlopu macierzyńskiego i urlopu rodzicielskiego w pełnym wymiarze'
        : 'Wniosek o udzielenie urlopu macierzyńskiego',
    adresat: osobaRoli(s, k).pracodawca,
    pola,
    tresc: (w) => [
      `Proszę o udzielenie mi urlopu ${naWarunkach ? 'na warunkach urlopu macierzyńskiego' : 'macierzyńskiego'} od dnia ${d(w.od)} do dnia ${d(w.do)} ${zdarzenie}.`,
      ...(pelny
        ? [
            `Jednocześnie proszę o udzielenie mi bezpośrednio po nim urlopu rodzicielskiego w pełnym wymiarze, od dnia ${d(w.rodzOd)} do dnia ${d(w.rodzDo)}, oraz o wypłatę zasiłku macierzyńskiego w wysokości 81,5% podstawy wymiaru za cały ten okres.`,
          ]
        : []),
    ],
    oswiadczenia: [
      ...(naWarunkach ? [`Oświadczam, że przyjęł${wgRoli(k, 'am', 'em')} dziecko na wychowanie w dniu ${dataPL(s.dataZdarzenia)}.`] : []),
      ...(pelny ? [oswiadczenieDrugiego(s, r, k)] : []),
    ],
    zalaczniki: [...(s.martweUrodzenie ? ['Odpis skrócony aktu urodzenia z adnotacją „urodziło się martwe” albo zaświadczenie lekarza lub położnej'] : odpisAktu(s)), ...(pelny ? zaZyciem(s) : [])],
    podstawa: naWarunkach ? ['KP art. 183 § 1 i 6', 'RWn § 18'] : pelny ? ['KP art. 180 § 1', 'KP art. 182¹ᵈ § 1', 'UZ art. 31 ust. 3', 'RWn § 15'] : ['KP art. 180 § 1'],
  };
}

function wzorUzupelniajacy(s: Sytuacja, r: Rozpatrzenie, k: Rola, dzis: ISODate): WzorWniosku | null {
  const u = okresyRoli(r, k, 'uzupelniajacyMacierzynski')[0];
  if (!u) return null;
  return {
    tytul: 'Wniosek o udzielenie uzupełniającego urlopu macierzyńskiego',
    adresat: osobaRoli(s, k).pracodawca,
    pola: [...wspolnePola(s, k, dzis), { klucz: 'od', etykieta: 'Urlop od', wartosc: u.od, typ: 'data' }, { klucz: 'do', etykieta: 'do', wartosc: u.do, typ: 'data' }],
    tresc: (w) => [
      `Proszę o udzielenie mi uzupełniającego urlopu macierzyńskiego od dnia ${d(w.od)} do dnia ${d(w.do)}, bezpośrednio po urlopie macierzyńskim, który kończy się ${dataPL(dodajDni(u.od, -1))}.`,
    ],
    oswiadczenia: ['Oświadczam, że drugi rodzic dziecka nie zamierza korzystać z uzupełniającego urlopu macierzyńskiego ani z zasiłku macierzyńskiego za okres odpowiadający temu urlopowi.'],
    zalaczniki: ['Zaświadczenie szpitala o urodzeniu dziecka przed terminem albo o pobycie dziecka w szpitalu (art. 180² § 5 Kodeksu pracy)'],
    podstawa: ['KP art. 180² § 4–5', 'RWn § 14'],
  };
}

function wzorRodzicielski(s: Sytuacja, r: Rozpatrzenie, k: Rola, indeks: number, dzis: ISODate): WzorWniosku | null {
  const o = r.urlopy.okresy.filter((x) => x.rodzaj === 'rodzicielski')[indeks];
  if (!o || o.rodzic === 'inny') return null;
  const wlasne = okresyRoli(r, k, 'rodzicielski');
  const nr = wlasne.indexOf(o) + 1;
  const wczesniej = wlasne.slice(0, nr - 1);
  const praca = o.wymiarPracy;
  return {
    tytul: praca ? 'Wniosek o udzielenie części urlopu rodzicielskiego i łączenie jej z pracą' : 'Wniosek o udzielenie urlopu rodzicielskiego',
    adresat: osobaRoli(s, k).pracodawca,
    pola: [...wspolnePola(s, k, dzis), { klucz: 'od', etykieta: 'Urlop rodzicielski od', wartosc: o.od, typ: 'data' }, { klucz: 'do', etykieta: 'do', wartosc: o.do, typ: 'data' }],
    tresc: (w) => [
      `Na podstawie art. 182¹ᵈ § 1 Kodeksu pracy proszę o udzielenie mi ${nr > 1 ? `${nr}. części ` : ''}urlopu rodzicielskiego od dnia ${d(w.od)} do dnia ${d(w.do)} na dziecko: ${dzieci(s)}.`,
      wczesniej.length
        ? `Dotychczas wykorzystał${wgRoli(k, 'am', 'em')} urlop rodzicielski w ${wczesniej.length} ${wczesniej.length === 1 ? 'części' : 'częściach'}: ${wczesniej.map((x) => `${dataPL(x.od)} – ${dataPL(x.do)}`).join(', ')}.`
        : `Dotychczas nie korzystał${wgRoli(k, 'am', 'em')} z urlopu rodzicielskiego ani z zasiłku macierzyńskiego za okres tego urlopu.`,
      ...(praca
        ? [
            `Jednocześnie, na podstawie art. 182¹ᵉ § 2 Kodeksu pracy, wnoszę o łączenie urlopu rodzicielskiego w tym okresie z pracą w wymiarze ${praca.licznik}/${praca.mianownik} etatu. Okres urlopu uwzględnia jego proporcjonalne wydłużenie, a część powstałą z wydłużenia także zamierzam łączyć z pracą w tym wymiarze.`,
          ]
        : []),
    ],
    oswiadczenia: [oswiadczenieDrugiego(s, r, k)],
    zalaczniki: [...odpisAktu(s), ...zaZyciem(s)],
    podstawa: ['KP art. 182¹ᵈ § 1', 'RWn § 15', ...(praca ? ['KP art. 182¹ᵉ § 2', 'RWn § 16'] : [])],
  };
}

function wzorOjcowski(s: Sytuacja, r: Rozpatrzenie, dzis: ISODate): WzorWniosku | null {
  const o = okresyRoli(r, 'ojciec', 'ojcowski')[0];
  if (!o) return null;
  return {
    tytul: 'Wniosek o udzielenie urlopu ojcowskiego',
    adresat: osobaRoli(s, 'ojciec').pracodawca,
    pola: [...wspolnePola(s, 'ojciec', dzis), { klucz: 'od', etykieta: 'Urlop ojcowski od', wartosc: o.od, typ: 'data' }, { klucz: 'do', etykieta: 'do', wartosc: o.do, typ: 'data' }],
    tresc: (w) => [`Na podstawie art. 182³ § 2 Kodeksu pracy proszę o udzielenie mi urlopu ojcowskiego od dnia ${d(w.od)} do dnia ${d(w.do)} na dziecko: ${dzieci(s)}.`],
    oswiadczenia: ['Oświadczam, że nie korzystałem dotychczas z urlopu ojcowskiego na to dziecko.'],
    zalaczniki: s.zdarzenie === 'urodzenie' ? odpisAktu(s) : ['Kopia prawomocnego postanowienia sądu o przysposobieniu dziecka'],
    podstawa: ['KP art. 182³ § 2', 'RWn § 17'],
  };
}

/** Formularz do wypełnienia w aplikacji dla pozycji z listy wniosków; `null`, gdy sprawę załatwia się gdzie indziej. */
export function formularzWniosku(p: PozycjaDokumentu, s: Sytuacja, plan: PlanRodzica, r: Rozpatrzenie, dzis: ISODate): FormularzWniosku | null {
  if (p.id === 'odpis') return { rodzaj: 'odpis' };
  const pracownik = jestPracownikiem(osobaRoli(s, p.kto).tytul);
  const zam = { rodzaj: 'zam', wlasny: p.kto === s.rola } as const;
  const urlopowy = (wzor: WzorWniosku | null): FormularzWniosku | null => (wzor ? { rodzaj: 'urlopowy', wzor } : null);

  if (p.id === 'macierzynski-przed-porodem') return pracownik ? urlopowy(wzorPrzedPorodem(s, p.kto, dzis)) : null;
  if (p.id.startsWith('zasilek-glowny-')) return pracownik ? urlopowy(wzorGlowny(s, plan, r, p.kto, dzis)) : zam;
  if (p.id === 'uzupelniajacy') return pracownik ? urlopowy(wzorUzupelniajacy(s, r, p.kto, dzis)) : zam;
  if (p.id.startsWith('rodzicielski-')) return pracownik ? urlopowy(wzorRodzicielski(s, r, p.kto, Number(p.id.slice('rodzicielski-'.length)), dzis)) : zam;
  if (p.id === 'ojcowski') return pracownik ? urlopowy(wzorOjcowski(s, r, dzis)) : zam;
  return null;
}
