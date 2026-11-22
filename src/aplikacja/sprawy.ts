/**
 * Sprawy przykładowe ZUS (docs/research/sprawy-testowe.md) jako Sytuacje rodziny: jury wybiera sprawę, aplikacja
 * liczy ją tym samym mostem co Plan rodzica i zestawia wynik z rozstrzygnięciem ZUS.
 *
 * W katalogu są tylko fakty liczbowe, bez tekstu dokumentów i danych osobowych (regulamin zabrania redystrybucji
 * zestawów). Decyzje ZUS nie podają kwot zasiłku: kwoty oczekiwane to wyliczenia researchu z danych płacowych Z-3,
 * oznaczone jako „wyliczenie”. Sprawy, których Sytuacja rodziny nie wyraża (T05 przejęcie macierzyńskiego,
 * T06 przerwa przed rodzicielskim, T10 i T13 bez ustalonego rozstrzygnięcia), sprawdzają testy silnika.
 */

import type { Grosze, ISODate, MiesiacNiepracownika, MiesiacPracownika, Promile, RodzajUrlopu } from '@/silnik';
import { dodajMiesiaceDoMiesiaca } from '@/silnik/wspolne/daty';
import { dataKrotka, procent, tygodnie, zl } from './format';
import type { Rozpatrzenie } from './rozpatrz';
import type { PlanRodzica, Rola, Sytuacja } from './sytuacja';

export type ZrodloOczekiwania = 'decyzja' | 'wyliczenie';

export type Oczekiwanie =
  | { typ: 'okres'; rodzaj: RodzajUrlopu; rodzic: Rola; dni: number; stawka?: Promile; zrodlo: ZrodloOczekiwania }
  | { typ: 'podstawa'; kwota: Grosze; dla?: 'zasilek_do_porodu' }
  | { typ: 'kwotaDzienna'; kwota: Grosze; rodzaj: RodzajUrlopu | 'zasilek_do_porodu' }
  | { typ: 'kwota'; kwota: Grosze; rodzaj: RodzajUrlopu | 'zasilek_do_porodu'; rodzic?: Rola }
  | { typ: 'odmowa'; regula: string; rodzic?: Rola; opis: string }
  | { typ: 'zasilekDoPorodu'; od: ISODate; do: ISODate; dni: number };

export interface SprawaPrzykladowa {
  id: string;
  tytul: string;
  /** Rodzaj sprawy jak w nazwie zestawu ZUS. */
  rodzaj: string;
  /** Dane wejściowe odczytane z dokumentów sprawy. */
  fakty: string[];
  decyzja: { wynik: 'przyznano' | 'odmowa'; opis: string };
  sytuacja: Sytuacja;
  plan?: Partial<PlanRodzica>;
  /** Dzień oceny: dzień złożenia wniosku albo badania uprawnień w sprawie. */
  dzis: ISODate;
  oczekiwane: Oczekiwanie[];
}

export interface WierszPorownania {
  etykieta: string;
  oczekiwane: string;
  wyliczone: string;
  zgodne: boolean;
  zrodlo: ZrodloOczekiwania;
  /** Uzasadnienie z reguły silnika (przy odmowie). */
  uzasadnienie?: string;
}

const miesiace = (od: string, ile: number) => Array.from({ length: ile }, (_, i) => dodajMiesiaceDoMiesiaca(od, i));
const pensje = (od: string, ile: number, brutto: Grosze): MiesiacPracownika[] => miesiace(od, ile).map((miesiac) => ({ miesiac, brutto }));

const PLACA_2024: Grosze = 430_000;
const PLACA_2025: Grosze = 466_600;

const BEZ_ADRESU = { ulica: '', nrDomu: '', kod: '', poczta: '' };
const osoba = { imie: '', nazwisko: '', pesel: '', adres: BEZ_ADRESU };
const platnikMaly = { nazwa: 'Pracodawca ze sprawy', nip: '', ponad20: false };

function sytuacja(id: string, s: Partial<Sytuacja> & Pick<Sytuacja, 'dataZdarzenia' | 'tytul' | 'poczatekUbezpieczenia'>, placaMinimalna?: Grosze): Sytuacja {
  return {
    zrodlo: 'wpisane',
    rola: 'matka',
    osoba,
    zdarzenie: 'urodzenie',
    etap: 'poZdarzeniu',
    dzieci: [{ imie: '' }],
    zaZyciem: false,
    martweUrodzenie: false,
    pelnyEtat: true,
    platnik: platnikMaly,
    bruttoMiesiecznie: null,
    zwolnienia: [],
    zadluzenie: null,
    drugiRodzic: null,
    ...s,
    sprawaPrzykladowa: { id, ...(placaMinimalna ? { placaMinimalna } : {}) },
  };
}

/** T03: 12 miesięcy po 6400 zł, lipiec przepracowany w połowie (10 z 20 dni), uzupełniony do składnika stałego. */
const pensjeT03: MiesiacPracownika[] = pensje('2025-01', 12, 640_000).map((m) =>
  m.miesiac === '2025-07' ? { miesiac: m.miesiac, brutto: 320_000, dniDoPrzepracowania: 20, dniPrzepracowane: 10, skladnikStalyZUmowy: 640_000 } : m,
);

/** T04: deklarowana podstawa składek 1290 zł w pierwszym miesiącu, potem 1399,80 zł. */
const skladkiT04: MiesiacNiepracownika[] = miesiace('2024-11', 9).map((miesiac, i) => ({ miesiac, podstawaSkladkiChorobowej: i === 0 ? 129_000 : 139_980 }));

export const SPRAWY: SprawaPrzykladowa[] = [
  {
    id: 'T01',
    tytul: 'Macierzyński i rodzicielski, wniosek o 81,5% w 10. dniu',
    rodzaj: 'zasiłek macierzyński za urlop macierzyński i rodzicielski',
    fakty: [
      'Umowa o pracę, płatnik do 20 ubezpieczonych (wypłaca ZUS)',
      'Pełny etat od 2 miesięcy przed porodem, wcześniej niepełny – liczą się tylko miesiące po zmianie (2 × 4666 zł)',
      'Wniosek o pełny wymiar urlopu macierzyńskiego i rodzicielskiego 10 dni po porodzie',
      'Płaca minimalna z roku sprawy: 4666 zł',
    ],
    decyzja: { wynik: 'przyznano', opis: 'Zasiłek przyznany i wypłacony za 52 tygodnie w wysokości 81,5%.' },
    sytuacja: sytuacja(
      'T01',
      {
        dataZdarzenia: '2025-12-27',
        tytul: 'umowa_o_prace',
        poczatekUbezpieczenia: '2023-12-01',
        miesiacePracownika: pensje('2025-10', 2, 466_600),
        bruttoMiesiecznie: 466_600,
        zmianaWymiaruCzasuPracy: true,
        wniosek815Data: '2026-01-06',
      },
      PLACA_2025,
    ),
    plan: { wariant: '81_5', ojcowski: false },
    dzis: '2026-01-06',
    oczekiwane: [
      { typ: 'okres', rodzaj: 'macierzynski', rodzic: 'matka', dni: 140, stawka: 815, zrodlo: 'decyzja' },
      { typ: 'okres', rodzaj: 'rodzicielski', rodzic: 'matka', dni: 224, stawka: 815, zrodlo: 'decyzja' },
      { typ: 'podstawa', kwota: 402_629 },
      { typ: 'kwotaDzienna', kwota: 10_938, rodzaj: 'macierzynski' },
    ],
  },
  {
    id: 'T02',
    tytul: 'Martwe urodzenie',
    rodzaj: 'zasiłek macierzyński, martwe urodzenie',
    fakty: [
      'Umowa o pracę, pełny etat od ponad 6 lat, płatnik do 20 ubezpieczonych',
      'Wynagrodzenie 4500 zł; 5 miesięcy okresu bazowego na wcześniejszym zasiłku (0 dni pracy) – pomijamy je',
      'Martwe urodzenie, wniosek 11 dni po porodzie',
      'Płaca minimalna z roku sprawy: 4300 zł',
    ],
    decyzja: { wynik: 'przyznano', opis: 'Zasiłek przyznany za 8 tygodni (56 dni) w wysokości 100%.' },
    sytuacja: sytuacja(
      'T02',
      {
        dataZdarzenia: '2026-02-10',
        tytul: 'umowa_o_prace',
        poczatekUbezpieczenia: '2019-09-01',
        martweUrodzenie: true,
        bruttoMiesiecznie: 450_000,
        miesiacePracownika: [
          ...miesiace('2025-02', 5).map((miesiac) => ({ miesiac, brutto: 0, dniDoPrzepracowania: 21, dniPrzepracowane: 0 })),
          ...pensje('2025-07', 7, 450_000),
        ],
      },
      PLACA_2024,
    ),
    plan: { ojcowski: false },
    dzis: '2026-02-21',
    oczekiwane: [
      { typ: 'okres', rodzaj: 'macierzynski', rodzic: 'matka', dni: 56, stawka: 1000, zrodlo: 'decyzja' },
      { typ: 'podstawa', kwota: 388_305 },
      { typ: 'kwotaDzienna', kwota: 12_944, rodzaj: 'macierzynski' },
      { typ: 'kwota', kwota: 724_864, rodzaj: 'macierzynski' },
    ],
  },
  {
    id: 'T03',
    tytul: 'Urlop ojcowski, 7 dni',
    rodzaj: 'zasiłek macierzyński za okres urlopu ojcowskiego',
    fakty: [
      'Ojciec, umowa o pracę, pełny etat od ok. 3,5 roku, płatnik do 20 ubezpieczonych',
      'Wynagrodzenie stałe 6400 zł; jeden miesiąc przepracowany w połowie (10 z 20 dni) – uzupełniany do pełnej kwoty',
      'Urlop ojcowski: 1 tydzień z 2 przysługujących, 3 tygodnie po porodzie',
    ],
    decyzja: { wynik: 'przyznano', opis: 'Zasiłek za 7 dni urlopu ojcowskiego przyznany i wypłacony (100%).' },
    sytuacja: sytuacja('T03', {
      rola: 'ojciec',
      dataZdarzenia: '2026-01-20',
      tytul: 'umowa_o_prace',
      poczatekUbezpieczenia: '2022-08-01',
      bruttoMiesiecznie: 640_000,
      miesiacePracownika: pensjeT03,
      drugiRodzic: { imie: '', nazwisko: '', ubezpieczony: true, tytul: 'umowa_o_prace', bruttoMiesiecznie: null },
    }),
    plan: { ojcowski: true, ojcowskiPoDniach: 21, ojcowskiDni: 7 },
    dzis: '2026-01-13',
    oczekiwane: [
      { typ: 'okres', rodzaj: 'ojcowski', rodzic: 'ojciec', dni: 7, stawka: 1000, zrodlo: 'decyzja' },
      { typ: 'podstawa', kwota: 552_256 },
      { typ: 'kwotaDzienna', kwota: 18_409, rodzaj: 'ojcowski' },
      { typ: 'kwota', kwota: 128_863, rodzaj: 'ojcowski', rodzic: 'ojciec' },
    ],
  },
  {
    id: 'T04',
    tytul: 'Urlop ojcowski przy działalności z długiem w składkach',
    rodzaj: 'zasiłek za urlop ojcowski, działalność, zadłużenie z tytułu składek – odmowa',
    fakty: [
      'Ojciec prowadzi działalność, dobrowolne chorobowe od ok. 10 miesięcy',
      'Deklarowana podstawa składek 1290 zł, potem 1399,80 zł',
      'Wniosek o zasiłek za 14 dni urlopu ojcowskiego',
      'W dniu powstania prawa zaległość w składkach 100 zł, większa niż 1% płacy minimalnej (46,66 zł)',
    ],
    decyzja: { wynik: 'odmowa', opis: 'Odmowa za cały okres: zaległość w składkach ponad 1% płacy minimalnej w dniu powstania prawa.' },
    sytuacja: sytuacja(
      'T04',
      {
        rola: 'ojciec',
        dataZdarzenia: '2025-08-20',
        tytul: 'dzialalnosc',
        poczatekUbezpieczenia: '2024-11-01',
        bruttoMiesiecznie: 139_980,
        miesiaceNiepracownika: skladkiT04,
        zadluzenie: 10_000,
        platnik: { nazwa: 'Działalność gospodarcza (płatnik sam dla siebie)', nip: '', ponad20: false },
        drugiRodzic: { imie: '', nazwisko: '', ubezpieczony: true, tytul: 'umowa_o_prace', bruttoMiesiecznie: null },
      },
      PLACA_2025,
    ),
    plan: { ojcowski: true, ojcowskiPoDniach: 12, ojcowskiDni: 14 },
    dzis: '2025-09-20',
    oczekiwane: [
      { typ: 'okres', rodzaj: 'ojcowski', rodzic: 'ojciec', dni: 14, zrodlo: 'decyzja' },
      { typ: 'odmowa', regula: 'R-DL-01', opis: 'zaległość w składkach' },
    ],
  },
  {
    id: 'T07',
    tytul: 'Umowa uznana za zawartą dla pozoru',
    rodzaj: 'zasiłek macierzyński – odmowa, niepodleganie ubezpieczeniu',
    fakty: [
      'Umowa o pracę na 1/8 etatu zawarta ok. 10 tygodni przed porodem',
      'Wniosek o 52 tygodnie zasiłku 7 dni po porodzie',
      'ZUS po kontroli stwierdził decyzją niepodleganie ubezpieczeniom od pierwszego dnia umowy',
    ],
    decyzja: { wynik: 'odmowa', opis: 'Odmowa za 52 tygodnie: brak tytułu do ubezpieczenia chorobowego (umowa dla pozoru).' },
    sytuacja: sytuacja('T07', {
      dataZdarzenia: '2026-03-01',
      tytul: 'umowa_o_prace',
      pelnyEtat: false,
      poczatekUbezpieczenia: '2025-12-20',
      bruttoMiesiecznie: 127_349,
      okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-12-20', do: '2025-12-19', przyczynaUstania: 'decyzja_zus_o_niepodleganiu' }],
      sygnalyRyzyka: { umowaZawartaWCiazy: true, dataZawarciaUmowy: '2025-12-20', ulamkowyEtat: true },
    }),
    plan: { ojcowski: false },
    dzis: '2026-03-08',
    oczekiwane: [{ typ: 'odmowa', regula: 'R-MA-03', opis: 'brak ubezpieczenia w dniu porodu' }],
  },
  {
    id: 'T08',
    tytul: 'Brak ubezpieczenia w dniu porodu',
    rodzaj: 'zasiłek macierzyński – odmowa, nie podlega ubezpieczeniu w dniu porodu',
    fakty: ['Umowa o pracę; ZUS decyzją stwierdził niepodleganie ubezpieczeniom od ok. 8 miesięcy przed porodem', 'Wniosek o 52 tygodnie zasiłku 20 dni po porodzie'],
    decyzja: { wynik: 'odmowa', opis: 'Odmowa za 52 tygodnie: poród poza okresem ubezpieczenia chorobowego.' },
    sytuacja: sytuacja('T08', {
      dataZdarzenia: '2026-03-01',
      tytul: 'umowa_o_prace',
      poczatekUbezpieczenia: '2024-01-01',
      okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2024-01-01', do: '2025-06-22', przyczynaUstania: 'decyzja_zus_o_niepodleganiu' }],
    }),
    plan: { ojcowski: false },
    dzis: '2026-03-21',
    oczekiwane: [{ typ: 'odmowa', regula: 'R-MA-03', opis: 'brak ubezpieczenia w dniu porodu' }],
  },
  {
    id: 'T09',
    tytul: 'Zasiłek chorobowy w ciąży bez ubezpieczenia',
    rodzaj: 'odmowa prawa do zasiłku chorobowego w ciąży, brak ubezpieczenia',
    fakty: [
      'Umowa o pracę, pełny etat, od ok. 5 miesięcy przed zwolnieniem',
      'Zwolnienie w ciąży (kod B) na 29 dni',
      'ZUS decyzją stwierdził niepodleganie ubezpieczeniom od pierwszego dnia umowy',
    ],
    decyzja: { wynik: 'odmowa', opis: 'Odmowa zasiłku chorobowego: ustanie tytułu ubezpieczenia na podstawie decyzji ZUS.' },
    sytuacja: sytuacja('T09', {
      etap: 'ciaza',
      dataZdarzenia: '2026-07-22',
      dataPoczatkuCiazy: '2025-10-15',
      tytul: 'umowa_o_prace',
      poczatekUbezpieczenia: '2025-09-07',
      bruttoMiesiecznie: 470_100,
      miesiacePracownika: [...pensje('2025-10', 3, 466_600), ...pensje('2026-01', 1, 480_600)],
      okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-09-07', do: '2025-09-06', przyczynaUstania: 'decyzja_zus_o_niepodleganiu' }],
      zwolnienia: [{ od: '2026-02-03', do: '2026-03-03', kodB: true, tytul: 'umowa_o_prace' }],
    }),
    plan: { ojcowski: false },
    dzis: '2026-03-04',
    oczekiwane: [{ typ: 'odmowa', regula: 'R-CH-01', opis: 'brak ubezpieczenia chorobowego' }],
  },
  {
    id: 'T11',
    tytul: 'Skrajny wcześniak do 1000 g',
    rodzaj: 'zasiłek macierzyński za urlop macierzyński, uzupełniający i rodzicielski – skrajny wcześniak',
    fakty: ['Umowa o pracę (bez danych o wynagrodzeniu – kwot nie liczymy)', 'Jedno dziecko, masa urodzeniowa do 1000 g', 'Dziecko w szpitalu od porodu przez 121 dni'],
    decyzja: { wynik: 'przyznano', opis: 'Decyzja przyznająca: macierzyński 20 tyg., uzupełniający 15 tyg., rodzicielski 32 tyg.' },
    sytuacja: sytuacja('T11', {
      dataZdarzenia: '2026-03-01',
      tytul: 'umowa_o_prace',
      poczatekUbezpieczenia: '2020-01-01',
      masaUrodzeniowaG: 950,
      pobytDzieckaWSzpitalu: { od: '2026-03-01', do: '2026-06-29' },
    }),
    plan: { ojcowski: false },
    dzis: '2026-03-10',
    oczekiwane: [
      { typ: 'okres', rodzaj: 'macierzynski', rodzic: 'matka', dni: 140, zrodlo: 'decyzja' },
      { typ: 'okres', rodzaj: 'uzupelniajacyMacierzynski', rodzic: 'matka', dni: 105, zrodlo: 'decyzja' },
      { typ: 'okres', rodzaj: 'rodzicielski', rodzic: 'matka', dni: 224, zrodlo: 'decyzja' },
    ],
  },
  {
    id: 'T12',
    tytul: 'Bliźnięta z 28. tygodnia, „Za życiem”',
    rodzaj: 'zasiłek macierzyński, bliźnięta, wcześniaki, zaświadczenie „Za życiem”',
    fakty: [
      'Umowa o pracę (bez danych o wynagrodzeniu – kwot nie liczymy)',
      'Dwoje dzieci z jednego porodu w 28. tygodniu ciąży, masa ponad 1000 g, w szpitalu od porodu',
      'Zaświadczenie „Za życiem”',
      'Wniosek o pełny wymiar urlopów (81,5%) 15 dni po porodzie',
    ],
    decyzja: { wynik: 'przyznano', opis: 'Przyznano wnioskowane okresy: macierzyński 31 tyg., uzupełniający 8 tyg., rodzicielski 58 tyg.' },
    sytuacja: sytuacja('T12', {
      dataZdarzenia: '2026-03-01',
      tytul: 'umowa_o_prace',
      poczatekUbezpieczenia: '2020-01-01',
      dzieci: [{ imie: '' }, { imie: '' }],
      zaZyciem: true,
      tygodnieCiazyPrzyPorodzie: 28,
      masaUrodzeniowaG: 1200,
      pobytDzieckaWSzpitalu: { od: '2026-03-01', do: '2026-05-15' },
      wniosek815Data: '2026-03-16',
    }),
    plan: { wariant: '81_5', ojcowski: false },
    dzis: '2026-03-16',
    oczekiwane: [
      { typ: 'okres', rodzaj: 'macierzynski', rodzic: 'matka', dni: 217, stawka: 815, zrodlo: 'decyzja' },
      { typ: 'okres', rodzaj: 'uzupelniajacyMacierzynski', rodzic: 'matka', dni: 56, zrodlo: 'decyzja' },
      { typ: 'okres', rodzaj: 'rodzicielski', rodzic: 'matka', dni: 406, stawka: 815, zrodlo: 'decyzja' },
    ],
  },
  {
    id: 'T14',
    tytul: 'Utrata pracy w ciąży przez upadłość pracodawcy',
    rodzaj: 'zasiłek w wysokości zasiłku macierzyńskiego',
    fakty: [
      'Umowa o pracę na 1/3 etatu, rozwiązana w ciąży z powodu upadłości pracodawcy; innego zatrudnienia nie zapewniono',
      'Wynagrodzenie po zmianie wymiaru: 3 × 1556 zł, potem 7 × 2200 zł',
      'Wniosek o zasiłek od dnia po rozwiązaniu umowy do dnia porodu',
    ],
    decyzja: { wynik: 'przyznano', opis: 'Zasiłek w wysokości zasiłku macierzyńskiego za 175 dni do dnia porodu, 100% (zaświadczenie płatnika i wniosek).' },
    sytuacja: sytuacja('T14', {
      etap: 'ciaza',
      dataZdarzenia: '2027-01-23',
      dataPoczatkuCiazy: '2026-05-01',
      tytul: 'umowa_o_prace',
      pelnyEtat: false,
      poczatekUbezpieczenia: '2025-01-01',
      bruttoMiesiecznie: 220_000,
      miesiacePracownika: [...pensje('2025-10', 3, 155_600), ...pensje('2026-01', 7, 220_000)],
      zmianaWymiaruCzasuPracy: true,
      ustanie: { data: '2026-07-31', przyczyna: 'upadlosc_pracodawcy' },
      zapewnionoInneZatrudnienie: false,
    }),
    plan: { ojcowski: false },
    dzis: '2026-08-11',
    oczekiwane: [
      { typ: 'zasilekDoPorodu', od: '2026-08-01', do: '2027-01-22', dni: 175 },
      { typ: 'podstawa', kwota: 173_167, dla: 'zasilek_do_porodu' },
      { typ: 'kwotaDzienna', kwota: 5_772, rodzaj: 'zasilek_do_porodu' },
      { typ: 'kwota', kwota: 1_010_100, rodzaj: 'zasilek_do_porodu' },
    ],
  },
];

export const sprawa = (id: string): SprawaPrzykladowa | undefined => SPRAWY.find((x) => x.id === id);

const NAZWY: Record<RodzajUrlopu | 'zasilek_do_porodu', string> = {
  macierzynski: 'urlop macierzyński',
  naWarunkachMacierzynskiego: 'urlop na warunkach macierzyńskiego',
  uzupelniajacyMacierzynski: 'uzupełniający urlop macierzyński',
  rodzicielski: 'urlop rodzicielski',
  ojcowski: 'urlop ojcowski',
  zasilek_do_porodu: 'zasiłek do porodu',
};

const okresTekst = (dni: number, stawka?: Promile) => `${dni} dni (${tygodnie(dni)})${stawka ? `, ${procent(stawka)}` : ''}`;

/** Zestawia rozstrzygnięcie ZUS z wynikiem silnika dla Sytuacji sprawy. */
export function porownajSprawe(sp: SprawaPrzykladowa, r: Rozpatrzenie): WierszPorownania[] {
  const s = sp.sytuacja;
  return sp.oczekiwane.map((o): WierszPorownania => {
    switch (o.typ) {
      case 'okres': {
        const czesci = r.urlopy.okresy.filter((x) => x.rodzaj === o.rodzaj && x.rodzic === o.rodzic);
        const dni = czesci.reduce((a, x) => a + x.dni, 0);
        const stawka = czesci[0]?.stawka;
        const zgodne = dni === o.dni && (o.stawka === undefined || czesci.every((x) => x.stawka === o.stawka));
        return {
          etykieta: `${NAZWY[o.rodzaj][0]!.toUpperCase()}${NAZWY[o.rodzaj].slice(1)} (${o.rodzic === 'matka' ? 'matka' : 'ojciec'})`,
          oczekiwane: okresTekst(o.dni, o.stawka),
          wyliczone: czesci.length ? `${okresTekst(dni, o.stawka !== undefined ? stawka : undefined)}, ${dataKrotka(czesci[0]!.od)} – ${dataKrotka(czesci.at(-1)!.do)}` : 'brak okresu',
          zgodne,
          zrodlo: o.zrodlo,
        };
      }
      case 'podstawa': {
        const wynik = o.dla === 'zasilek_do_porodu' ? (r.zwm?.podstawa?.podstawa ?? null) : (r.podstawa?.podstawa ?? null);
        return { etykieta: 'Podstawa wymiaru zasiłku', oczekiwane: zl(o.kwota), wyliczone: zl(wynik), zgodne: wynik === o.kwota, zrodlo: 'wyliczenie' };
      }
      case 'kwotaDzienna': {
        const wynik = o.rodzaj === 'zasilek_do_porodu' ? (r.zwm?.kwotaDzienna ?? null) : (r.urlopy.okresy.find((x) => x.rodzaj === o.rodzaj)?.kwotaDzienna ?? null);
        return { etykieta: 'Zasiłek za 1 dzień', oczekiwane: zl(o.kwota), wyliczone: zl(wynik), zgodne: wynik === o.kwota, zrodlo: 'wyliczenie' };
      }
      case 'kwota': {
        const wynik =
          o.rodzaj === 'zasilek_do_porodu'
            ? (r.zwm?.kwota ?? null)
            : r.urlopy.okresy.filter((x) => x.rodzaj === o.rodzaj && (!o.rodzic || x.rodzic === o.rodzic)).reduce<number | null>((a, x) => (a == null || x.kwota == null ? null : a + x.kwota), 0);
        return { etykieta: `Kwota za cały okres (${NAZWY[o.rodzaj]})`, oczekiwane: zl(o.kwota), wyliczone: zl(wynik), zgodne: wynik === o.kwota, zrodlo: 'wyliczenie' };
      }
      case 'odmowa': {
        const ryzyka = !o.rodzic || o.rodzic === s.rola ? r.ryzyka : r.ryzykaDrugiego;
        const wynik = ryzyka?.wyniki.find((x) => x.regula === o.regula && x.status === 'nie_przysluguje');
        return {
          etykieta: 'Prawo do zasiłku',
          oczekiwane: `odmowa (${o.opis})`,
          wyliczone: wynik ? `odmowa (${o.opis})` : 'przysługuje',
          zgodne: !!wynik,
          zrodlo: 'decyzja',
          ...(wynik ? { uzasadnienie: wynik.komunikat } : {}),
        };
      }
      case 'zasilekDoPorodu': {
        const z = r.zwm;
        return {
          etykieta: 'Zasiłek w wysokości zasiłku macierzyńskiego',
          oczekiwane: `${okresTekst(o.dni, 1000)}, ${dataKrotka(o.od)} – ${dataKrotka(o.do)}`,
          wyliczone: z ? `${okresTekst(z.dni, z.stawka)}, ${dataKrotka(z.od)} – ${dataKrotka(z.do)}` : 'nie przysługuje',
          zgodne: !!z && z.od === o.od && z.do === o.do && z.dni === o.dni && z.stawka === 1000,
          zrodlo: 'decyzja',
        };
      }
    }
  });
}
