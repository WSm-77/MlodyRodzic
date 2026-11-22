import { describe, expect, it } from 'vitest';
import {
  PARAMETRY_2026,
  ocenaRyzyk,
  podstawaWymiaru,
  urlopyIZasilek,
  type MiesiacPracownika,
  type OkresZasilku,
  type ParametryPrawne,
  type RolaRodzica,
  type WejsciePodstawy,
  type WejscieRyzyk,
  type WejscieUrlopow,
  type WynikPodstawy,
  type WynikReguly,
  type WynikRyzyk,
  type WynikUrlopow,
} from './index';

// Przypadki T01–T14 z docs/research/sprawy-testowe.md, przeprowadzone przez trzy publiczne szwy.
// Rozstrzygnięcia i długości okresów pochodzą z decyzji ZUS; kwoty są wyliczeniami researchu (testy regresji).
// Konwencja: w sprawy-testowe.md dzień 0 = dzień porodu; tu daty są wpisane wprost (dzień n = data porodu + n dni),
// a w komentarzach podany jest numer dnia ze sprawy.

/** Sprawa do rozpatrzenia: wejścia szwów; podstawa wymiaru trafia do rodzica `rodzicPodstawy` w wejściu urlopów. */
interface Sprawa {
  parametry?: ParametryPrawne;
  podstawa?: WejsciePodstawy;
  rodzicPodstawy?: RolaRodzica;
  urlopy?: WejscieUrlopow;
  ryzyka?: WejscieRyzyk;
}

interface Rozstrzygniecie {
  podstawa?: WynikPodstawy;
  urlopy?: WynikUrlopow;
  ryzyka?: WynikRyzyk;
}

/** Cienki pomocnik składający: podstawaWymiaru → urlopyIZasilek, obok ocenaRyzyk. Nie jest szwem. */
function rozpatrz(sprawa: Sprawa): Rozstrzygniecie {
  const parametry = sprawa.parametry ?? PARAMETRY_2026;
  const podstawa = sprawa.podstawa && podstawaWymiaru(sprawa.podstawa, parametry);
  const rola = sprawa.rodzicPodstawy ?? 'matka';
  const urlopy =
    sprawa.urlopy &&
    urlopyIZasilek(
      {
        ...sprawa.urlopy,
        rodzice: sprawa.urlopy.rodzice.map((r) =>
          r.rola === rola && podstawa?.podstawa != null ? { ...r, podstawaWymiaru: podstawa.podstawa } : r,
        ),
      },
      parametry,
    );
  const ryzyka = sprawa.ryzyka && ocenaRyzyk(sprawa.ryzyka, parametry);
  return { podstawa, urlopy, ryzyka };
}

const zPlacaMinimalna = (grosze: number): ParametryPrawne => ({
  ...PARAMETRY_2026,
  placaMinimalna: { ...PARAMETRY_2026.placaMinimalna, wartosc: grosze },
});
const PARAMETRY_2024 = zPlacaMinimalna(430_000); // płaca minimalna od 2024-07-01
const PARAMETRY_2025 = zPlacaMinimalna(466_600);

const okresy = (wynik: WynikUrlopow | undefined, rodzaj: OkresZasilku['rodzaj'], rodzic: RolaRodzica = 'matka') =>
  (wynik?.okresy ?? []).filter((o) => o.rodzaj === rodzaj && o.rodzic === rodzic);

const regula = (wynik: WynikRyzyk | undefined, id: string): WynikReguly => {
  const w = wynik?.wyniki.find((x) => x.regula === id);
  if (!w) throw new Error(`Brak wyniku reguły ${id}; są: ${(wynik?.wyniki ?? []).map((x) => x.regula).join(', ')}`);
  return w;
};

const miesiace = (lista: string[], brutto: number): MiesiacPracownika[] => lista.map((miesiac) => ({ miesiac, brutto }));

describe('sprawy przykładowe – kwoty (regresja) i okresy', () => {
  it('T02: martwe urodzenie daje 8 tygodni (56 dni) po 100%: podstawa 3883,05 zł, dziennie 129,44 zł, razem 7248,64 zł', () => {
    // Poród (martwy) 2026-02-10 = dzień 0. Wcześniej pełne miesiące na zasiłku macierzyńskim (0 dni pracy), potem 4500 zł.
    // Rok sprawy sprzed 2025 r. (4500 zł < 4666 zł), więc płaca minimalna 2024 (4300 zł) – patrz #16.
    const { podstawa, urlopy } = rozpatrz({
      parametry: PARAMETRY_2024,
      podstawa: {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-02-10',
        poczatekUbezpieczenia: '2019-09-01',
        pelnyEtat: true,
        miesiacePracownika: [
          ...['2025-02', '2025-03', '2025-04', '2025-05', '2025-06'].map((miesiac) => ({
            miesiac,
            brutto: 0,
            dniDoPrzepracowania: 21,
            dniPrzepracowane: 0,
          })),
          ...miesiace(['2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'], 450_000),
        ],
      },
      urlopy: {
        zdarzenie: { rodzaj: 'urodzenie', dataPorodu: '2026-02-10' },
        dzieci: [{ dataUrodzenia: '2026-02-10', martweUrodzenie: true }],
        rodzice: [{ rola: 'matka', ubezpieczony: true, pracownik: true }],
      },
    });

    expect(podstawa?.podstawa).toBe(388_305);
    expect(podstawa?.stawkaDzienna).toBe(12_944);
    // Dzień 0–55.
    expect(okresy(urlopy, 'macierzynski')).toEqual([
      expect.objectContaining({ od: '2026-02-10', do: '2026-04-06', dni: 56, stawka: 1000, kwotaDzienna: 12_944, kwota: 724_864 }),
    ]);
    expect(urlopy?.okresy.filter((o) => o.rodzaj !== 'macierzynski')).toEqual([]);
  });

  it('T01: wniosek w 10. dniu po porodzie daje 81,5% za 52 tygodnie (dzień 0–363); podstawa z miesięcy po zmianie etatu 4026,29 zł, dziennie 109,38 zł', () => {
    // Poród 2025-12-27 = dzień 0; pełny etat od 2025-10-01; 2 miesiące × 4666 zł; płaca minimalna 2025 (#16).
    const { podstawa, urlopy } = rozpatrz({
      parametry: PARAMETRY_2025,
      podstawa: {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2025-12-27',
        poczatekUbezpieczenia: '2023-12-01',
        pelnyEtat: true,
        miesiacePracownika: miesiace(['2025-10', '2025-11'], 466_600),
        okolicznosciPozaZakresem: { zmianaWymiaruCzasuPracy: true },
      },
      urlopy: {
        zdarzenie: { rodzaj: 'urodzenie', dataPorodu: '2025-12-27' },
        dzieci: [{ dataUrodzenia: '2025-12-27' }],
        rodzice: [{ rola: 'matka', ubezpieczony: true, pracownik: true }],
        wniosek815: { zlozony: true, dataZlozenia: '2026-01-06' }, // dzień 10
      },
    });

    expect(podstawa?.podstawa).toBe(402_629);
    expect(podstawa?.stawkaDzienna).toBe(13_421);
    expect(urlopy?.wariant).toBe('81_5');
    // Macierzyński dzień 0–139 (20 tyg.), rodzicielski dzień 140–363 (32 tyg.; 9 tyg. zostaje dla drugiego rodzica).
    expect(okresy(urlopy, 'macierzynski')).toEqual([
      expect.objectContaining({ od: '2025-12-27', do: '2026-05-15', dni: 140, stawka: 815, kwotaDzienna: 10_938 }),
    ]);
    expect(okresy(urlopy, 'rodzicielski')).toEqual([
      expect.objectContaining({ od: '2026-05-16', do: '2026-12-25', dni: 224, stawka: 815, kwotaDzienna: 10_938 }),
    ]);
  });

  it('T03: urlop ojcowski 7 dni po 100%: podstawa 5522,56 zł, dziennie 184,09 zł, razem 1288,63 zł', () => {
    // Poród 2026-01-20; ojcowski 2026-02-10 – 2026-02-16; 12 miesięcy × 6400 zł, jeden przepracowany w połowie (10/20 dni).
    const t03 = miesiace(
      ['2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'],
      640_000,
    );
    t03[5] = { miesiac: '2025-07', brutto: 320_000, dniDoPrzepracowania: 20, dniPrzepracowane: 10, skladnikStalyZUmowy: 640_000 };

    const { podstawa, urlopy } = rozpatrz({
      podstawa: {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-02-10',
        poczatekUbezpieczenia: '2022-08-01',
        pelnyEtat: true,
        miesiacePracownika: t03,
      },
      rodzicPodstawy: 'ojciec',
      urlopy: {
        zdarzenie: { rodzaj: 'urodzenie', dataPorodu: '2026-01-20' },
        dzieci: [{ dataUrodzenia: '2026-01-20' }],
        rodzice: [
          { rola: 'matka', ubezpieczony: true, pracownik: true },
          { rola: 'ojciec', ubezpieczony: true, pracownik: true },
        ],
        plan: [{ rodzaj: 'ojcowski', rodzic: 'ojciec', od: '2026-02-10', do: '2026-02-16' }],
      },
    });

    expect(podstawa?.podstawa).toBe(552_256);
    expect(podstawa?.stawkaDzienna).toBe(18_409);
    expect(okresy(urlopy, 'ojcowski', 'ojciec')).toEqual([
      expect.objectContaining({ od: '2026-02-10', do: '2026-02-16', dni: 7, stawka: 1000, kwotaDzienna: 18_409, kwota: 128_863 }),
    ]);
  });

  it('T14: rozwiązanie umowy w ciąży z powodu upadłości daje 100% od dnia po rozwiązaniu do dnia przed porodem (175 dni); podstawa 1731,67 zł, dziennie 57,72 zł', () => {
    // Umowa 2025-01-01 – 2026-07-31 (19 mies.), 1/3 etatu; dzień 0 = 2026-08-01, poród w dniu 175 (2027-01-23).
    const { podstawa, ryzyka } = rozpatrz({
      podstawa: {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-08-01',
        poczatekUbezpieczenia: '2025-01-01',
        pelnyEtat: false,
        miesiacePracownika: [
          ...miesiace(['2025-10', '2025-11', '2025-12'], 155_600),
          ...miesiace(['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'], 220_000),
        ],
        okolicznosciPozaZakresem: { zmianaWymiaruCzasuPracy: true },
      },
      ryzyka: {
        dzis: '2026-08-11',
        dataPoczatkuCiazy: '2026-05-01',
        dataPorodu: '2027-01-23',
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-01-01', do: '2026-07-31', przyczynaUstania: 'upadlosc_pracodawcy' }],
        zwolnienia: [],
        zapewnionoInneZatrudnienie: false,
      },
    });

    expect(podstawa?.podstawa).toBe(173_167);
    expect(podstawa?.stawkaDzienna).toBe(5_772);
    const zwm = regula(ryzyka, 'R-ZWM-01');
    expect(zwm.status).toBe('przysluguje');
    expect(zwm.swiadczenie).toBe('zasilek_w_wysokosci_zasilku_macierzynskiego');
    // Dzień 0–174.
    expect(zwm.skutek).toEqual({ stawka: 1000, od: '2026-08-01', do: '2027-01-22' });
  });

  describe('T09 (wariant hipotetyczny, gdyby tytuł był ważny): 4 pełne miesiące pracy', () => {
    const t09 = (pelnyEtat: boolean) =>
      rozpatrz({
        podstawa: {
          tytul: 'umowa_o_prace',
          dataZdarzenia: '2026-02-03',
          poczatekUbezpieczenia: '2025-09-07', // dzień −149
          pelnyEtat,
          miesiacePracownika: [...miesiace(['2025-10', '2025-11', '2025-12'], 466_600), ...miesiace(['2026-01'], 480_600)],
        },
        ryzyka: {
          dzis: '2026-03-04',
          dataPoczatkuCiazy: '2025-10-15',
          okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-09-07' }],
          // Dzień 0–28; wynagrodzenie chorobowe od pracodawcy (33 dni) wykorzystane wcześniej w roku.
          zwolnienia: [{ od: '2026-02-03', do: '2026-03-03', kodB: true, tytul: 'umowa_o_prace' }],
          dniWynagrodzeniaChorobowegoWRoku: 33,
        },
      });

    it('średnia (3 × 4666 + 4806) / 4 daje podstawę 4056,49 zł i dziennie 135,22 zł, gdy nie podnosi jej minimum z art. 45', () => {
      const { podstawa } = t09(false);
      expect(podstawa?.podstawa).toBe(405_649);
      expect(podstawa?.stawkaDzienna).toBe(13_522);
    });

    it('na pełnym etacie podstawa rośnie do minimum 4147,10 zł (UZ art. 45; research pomija ten krok, #16)', () => {
      expect(t09(true).podstawa?.podstawa).toBe(414_710);
    });

    it('okres wyczekiwania minął, a niezdolność w ciąży daje zasiłek chorobowy z ZUS w wysokości 100%', () => {
      const { ryzyka } = t09(false);
      expect(regula(ryzyka, 'R-CH-02')).toMatchObject({ status: 'przysluguje', swiadczenie: 'zasilek_chorobowy' });
      expect(regula(ryzyka, 'R-CH-03').skutek).toMatchObject({ stawka: 1000 });
      // Limit wynagrodzenia chorobowego (33 dni) wyczerpany wcześniej, więc za dzień 0–28 płaci ZUS.
      expect(regula(ryzyka, 'R-CH-04').swiadczenie).toBe('zasilek_chorobowy');
    });
  });
});

// Sprawy z porodem 2026-03-01 = dzień 0 (rok bez znaczenia dla wyniku).
const D0 = '2026-03-01';
const matka = { rola: 'matka', ubezpieczony: true, pracownik: true } as const;

describe('sprawy przykładowe – długości okresów z decyzji ZUS', () => {
  it('T11: wcześniak ≤ 1000 g w szpitalu do dnia 120: macierzyński 20 tyg., uzupełniający 15 tyg., rodzicielski 32 tyg. – łącznie 67 tyg.', () => {
    const { urlopy } = rozpatrz({
      urlopy: {
        zdarzenie: { rodzaj: 'urodzenie', dataPorodu: D0 },
        dzieci: [{ dataUrodzenia: D0, masaUrodzeniowaG: 950, hospitalizacje: [{ od: D0, do: '2026-06-29' }] }],
        rodzice: [matka],
      },
    });

    expect(urlopy?.wymiary.uzupelniajacyMacierzynski).toMatchObject({ przysluguje: true, kategoria: 'A', tygodnie: 15 });
    // Dzień 0–139, 140–244, 245–468.
    expect(okresy(urlopy, 'macierzynski')).toEqual([expect.objectContaining({ od: D0, do: '2026-07-18', dni: 140 })]);
    expect(okresy(urlopy, 'uzupelniajacyMacierzynski')).toEqual([expect.objectContaining({ od: '2026-07-19', do: '2026-10-31', dni: 105 })]);
    expect(okresy(urlopy, 'rodzicielski')).toEqual([expect.objectContaining({ od: '2026-11-01', do: '2027-06-12', dni: 224 })]);
  });

  it('T12: bliźnięta z 28. tygodnia z „Za życiem” i wnioskiem w 15. dniu: macierzyński 31 tyg., uzupełniający 8 tyg., rodzicielski 58 tyg. – łącznie 97 tyg.', () => {
    // Masa > 1000 g (nieczytelna w sprawie – przyjęto 1200 g); hospitalizacja w dniu wniosku trwała, przyjęto do dnia 75.
    const blizniak = {
      dataUrodzenia: D0,
      ukonczoneTygodnieCiazy: 28,
      masaUrodzeniowaG: 1200,
      zaswiadczenieZaZyciem: true,
      hospitalizacje: [{ od: D0, do: '2026-05-15' }],
    };
    const { urlopy } = rozpatrz({
      urlopy: {
        zdarzenie: { rodzaj: 'urodzenie', dataPorodu: D0 },
        dzieci: [blizniak, blizniak],
        rodzice: [matka],
        wniosek815: { zlozony: true, dataZlozenia: '2026-03-16' }, // dzień 15
      },
    });

    expect(urlopy?.wariant).toBe('81_5');
    expect(urlopy?.wymiary.uzupelniajacyMacierzynski).toMatchObject({ kategoria: 'B', tygodnie: 8 });
    // Dzień 0–216, 217–272, 273–678.
    expect(okresy(urlopy, 'macierzynski')).toEqual([expect.objectContaining({ od: D0, do: '2026-10-03', dni: 217, stawka: 815 })]);
    // Research podaje 81,5% „za całość”, ale UZ art. 31 ust. 1 daje za uzupełniający zawsze 100% (komentarz do #14).
    expect(okresy(urlopy, 'uzupelniajacyMacierzynski')).toEqual([
      expect.objectContaining({ od: '2026-10-04', do: '2026-11-28', dni: 56, stawka: 1000 }),
    ]);
    expect(okresy(urlopy, 'rodzicielski')).toEqual([expect.objectContaining({ od: '2026-11-29', do: '2028-01-08', dni: 406, stawka: 815 })]);
  });

  it('T05: ojciec (działalność) przejmuje macierzyński po 11 tygodniach matki – zostaje mu 9 tygodni (63 dni)', () => {
    // Sytuacja matki nieznana; przyjęto rezygnację matki z orzeczeniem o niezdolności do samodzielnej egzystencji
    // (KP art. 180 § 6), którą wolno złożyć po 8 tygodniach. Matka: dzień 0–76, ojciec: dzień 77–139.
    const { urlopy } = rozpatrz({
      urlopy: {
        zdarzenie: { rodzaj: 'urodzenie', dataPorodu: D0 },
        dzieci: [{ dataUrodzenia: D0 }],
        rodzice: [matka, { rola: 'ojciec', ubezpieczony: true, pracownik: false }],
        przejecie: { przez: 'ojciec', przyczyna: 'rezygnacja_z_orzeczeniem', data: '2026-05-16' },
      },
    });

    expect(urlopy?.wymiary.macierzynski?.podzial?.find((c) => c.rodzic === 'ojciec')).toEqual({
      rodzic: 'ojciec',
      od: '2026-05-17',
      do: '2026-07-18',
      dni: 63,
    });
    expect(okresy(urlopy, 'macierzynski', 'ojciec')).toEqual([expect.objectContaining({ dni: 63 })]);
  });
});

describe('sprawy przykładowe – odmowy (ocenaRyzyk)', () => {
  describe('T04: ojcowski 14 dni przy działalności z zadłużeniem składkowym', () => {
    // Płaca minimalna 2025 = 4666 zł → próg 1% = 46,66 zł. Ojcowski 2025-09-01 – 2025-09-14.
    const t04 = (dane: Partial<WejscieRyzyk> = {}) =>
      rozpatrz({
        parametry: PARAMETRY_2025,
        urlopy: {
          zdarzenie: { rodzaj: 'urodzenie', dataPorodu: '2025-08-20' },
          dzieci: [{ dataUrodzenia: '2025-08-20' }],
          rodzice: [matka, { rola: 'ojciec', ubezpieczony: true, pracownik: false }],
          plan: [{ rodzaj: 'ojcowski', rodzic: 'ojciec', od: '2025-09-01', do: '2025-09-14' }],
        },
        ryzyka: {
          dzis: '2025-09-20',
          dataPorodu: '2025-08-20',
          okresyUbezpieczenia: [{ tytul: 'dzialalnosc', od: '2024-11-01' }],
          zwolnienia: [],
          okresyZasilkuMacierzynskiego: [{ rodzaj: 'ojcowski', od: '2025-09-01', do: '2025-09-14' }],
          zadluzenieSkladkoweNaDzienPrawa: 10_000,
          ...dane,
        },
      });

    it('dług powyżej 1% płacy minimalnej w dniu powstania prawa → odmowa za cały okres 14 dni', () => {
      const { urlopy, ryzyka } = t04();
      expect(okresy(urlopy, 'ojcowski', 'ojciec')).toEqual([expect.objectContaining({ dni: 14 })]);
      const dlug = regula(ryzyka, 'R-DL-01');
      expect(dlug.status).toBe('nie_przysluguje');
      expect(dlug.podstawaPrawna).toContain('UZ art. 2a ust. 1');
    });

    it.each([
      ['dług dokładnie 46,66 zł', { zadluzenieSkladkoweNaDzienPrawa: 4_666 }],
      ['dług spłacony', { dzis: '2025-10-10', dataSplatyZadluzenia: '2025-10-01' }],
    ] as const)('wariant: %s → zadłużenie nie blokuje zasiłku', (_, dane) => {
      expect(regula(t04(dane).ryzyka, 'R-DL-01').status).not.toBe('nie_przysluguje');
    });
  });

  it('T06: rodzicielski po 13 dniach przerwy bez ubezpieczenia chorobowego (działalność) → odmowa za dzień 153–376 (32 tyg.)', () => {
    // Macierzyński dzień 0–139; wyrejestrowanie z dobrowolnego chorobowego z chwilą rozpoczęcia zasiłku (#19).
    const { urlopy, ryzyka } = rozpatrz({
      urlopy: {
        zdarzenie: { rodzaj: 'urodzenie', dataPorodu: D0 },
        dzieci: [{ dataUrodzenia: D0 }],
        rodzice: [{ rola: 'matka', ubezpieczony: true, pracownik: false }],
        plan: [
          { rodzaj: 'macierzynski', rodzic: 'matka', od: D0, do: '2026-07-18' },
          { rodzaj: 'rodzicielski', rodzic: 'matka', od: '2026-08-01', do: '2027-03-12' },
        ],
      },
      ryzyka: {
        dzis: '2026-08-05',
        dataPorodu: D0,
        okresyUbezpieczenia: [{ tytul: 'dzialalnosc', od: '2024-01-01', do: D0, przyczynaUstania: 'wyrejestrowanie_dobrowolnego' }],
        zwolnienia: [],
        zadluzenieSkladkoweNaDzienPrawa: 0,
        okresyZasilkuMacierzynskiego: [
          { rodzaj: 'macierzynski', od: D0, do: '2026-07-18' },
          { rodzaj: 'rodzicielski', od: '2026-08-01', do: '2027-03-12' },
        ],
      },
    });

    // 41 − 9 = 32 tyg.
    expect(urlopy?.wymiary.rodzicielski?.maksDlaJednegoRodzicaTygodnie).toBe(32);
    expect(okresy(urlopy, 'rodzicielski')).toEqual([expect.objectContaining({ od: '2026-08-01', do: '2027-03-12', dni: 224 })]);
    expect(regula(ryzyka, 'R-MA-01').status).toBe('przysluguje');
    const odmowa = regula(ryzyka, 'R-MA-06');
    expect(odmowa.status).toBe('nie_przysluguje');
    expect(odmowa.skutek).toEqual({ od: '2026-08-01', do: '2027-03-12' });
  });

  it('T07: ZUS stwierdził niepodleganie od pierwszego dnia umowy (pozorność) → odmowa za 52 tyg., a pozorność tylko jako ryzyko', () => {
    // Umowa od dnia −71 na 1/8 etatu; niepodleganie od pierwszego dnia = pusty okres ubezpieczenia (#19).
    const { ryzyka } = rozpatrz({
      ryzyka: {
        dzis: '2026-03-08', // dzień 7: wniosek
        dataPorodu: D0,
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-12-20', do: '2025-12-19', przyczynaUstania: 'decyzja_zus_o_niepodleganiu' }],
        zwolnienia: [],
        sygnalyRyzyka: { umowaZawartaWCiazy: true, dataZawarciaUmowy: '2025-12-20', ulamkowyEtat: true },
      },
    });

    expect(regula(ryzyka, 'R-MA-03').status).toBe('nie_przysluguje');
    expect(regula(ryzyka, 'R-PZ-01').status).toBe('ryzyko');
    expect(ryzyka?.wyniki.some((w) => w.swiadczenie === 'zasilek_macierzynski' && w.status === 'przysluguje')).toBe(false);
  });

  it('T08: niepodleganie ubezpieczeniu od dnia −251 → poród poza ubezpieczeniem, odmowa za dzień 0–363', () => {
    const { ryzyka } = rozpatrz({
      ryzyka: {
        dzis: '2026-03-21', // dzień 20: wniosek
        dataPorodu: D0,
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2024-01-01', do: '2025-06-22', przyczynaUstania: 'decyzja_zus_o_niepodleganiu' }],
        zwolnienia: [],
      },
    });

    const odmowa = regula(ryzyka, 'R-MA-03');
    expect(odmowa.status).toBe('nie_przysluguje');
    expect(odmowa.podstawaPrawna).toContain('UZ art. 29 ust. 1');
    expect(ryzyka?.wyniki.some((w) => w.swiadczenie === 'zasilek_macierzynski' && w.status === 'przysluguje')).toBe(false);
  });

  it('T09: zwolnienie w ciąży po decyzji ZUS o niepodleganiu od pierwszego dnia umowy → odmowa zasiłku chorobowego', () => {
    // Dzień 0 = 2026-02-03 (początek okresu zasiłku); umowa od dnia −149, okres ubezpieczenia pusty.
    const { ryzyka } = rozpatrz({
      ryzyka: {
        dzis: '2026-03-04',
        dataPoczatkuCiazy: '2025-10-15',
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-09-07', do: '2025-09-06', przyczynaUstania: 'decyzja_zus_o_niepodleganiu' }],
        zwolnienia: [{ od: '2026-02-03', do: '2026-03-03', kodB: true, tytul: 'umowa_o_prace' }],
      },
    });

    const odmowa = regula(ryzyka, 'R-CH-01');
    expect(odmowa.status).toBe('nie_przysluguje');
    expect(odmowa.swiadczenie).toBe('zasilek_chorobowy');
    expect(ryzyka?.wyniki.some((w) => w.swiadczenie === 'zasilek_chorobowy' && w.status === 'przysluguje')).toBe(false);
  });
});

describe('sprawy przykładowe – bez znanego rozstrzygnięcia', () => {
  // Dokumenty sprawy nie zawierają decyzji; research proponuje asercje „do weryfikacji” (20 tyg. + 32 tyg., podstawa 931,93 zł),
  // ale nie nadają się na test złotej ścieżki do czasu potwierdzenia wyniku.
  it.todo('T10: przyjęcie ok. 5-letniego dziecka na wychowanie (przysposobienie) przy działalności – czeka na rozstrzygnięcie ZUS');
  // Wyliczenie researchu (½ × 70% z 3572,07 zł = 1250,22 zł/mies. > 1000 zł) przeczy wypłaconemu przez ZUS podwyższeniu
  // za dzień 161–436; reguła porównania z kwotą świadczenia rodzicielskiego przy łączeniu z pracą jest nieustalona.
  it.todo('T13: podwyższenie do kwoty świadczenia rodzicielskiego przy łączeniu rodzicielskiego z pracą na ½ etatu – reguła do ustalenia');
});
