import { describe, expect, it } from 'vitest';
import { PARAMETRY_2026, podstawaWymiaru, type MiesiacNiepracownika, type MiesiacPracownika } from '../index';

// Przykłady liczbowe: docs/research/podstawa-wymiaru.md §5.

const dwanascieMiesiecy = (brutto: number): MiesiacPracownika[] =>
  ['2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'].map(
    (miesiac) => ({ miesiac, brutto }),
  );

const MIESIACE_2025_02_DO_2026_01 = ['2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'];

const dwanascieMiesiecyNiepracownika = (podstawaSkladkiChorobowej: number, najnizszaPodstawa?: number): MiesiacNiepracownika[] =>
  MIESIACE_2025_02_DO_2026_01.map((miesiac) => ({ miesiac, podstawaSkladkiChorobowej, ...(najnizszaPodstawa === undefined ? {} : { najnizszaPodstawa }) }));

describe('podstawaWymiaru', () => {
  it('P1: pracownica ze stałą pensją 6000 zł przez pełny rok ma podstawę 5177,40 zł i stawkę dzienną 172,58 zł', () => {
    const wynik = podstawaWymiaru(
      {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-02-10',
        poczatekUbezpieczenia: '2023-01-01',
        pelnyEtat: true,
        miesiacePracownika: dwanascieMiesiecy(600_000),
      },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(517_740);
    expect(wynik.stawkaDzienna).toBe(17_258);
  });

  it('T02: stawka dzienna z podstawy 3883,05 zł zaokrągla połówkę grosza w górę do 129,44 zł', () => {
    // docs/research/sprawy-testowe.md T02: 4500 zł × 0,8629 = 3883,05 zł; dziennie 129,44 zł.
    // Sprawa nie podaje roku. Pełny etat za 4500 zł jest poniżej płacy minimalnej 2025 (4666 zł),
    // więc sprawa jest sprzed 2025 r.; przyjmujemy płacę minimalną z 2. połowy 2024 r. (4300 zł),
    // przy której art. 45 nie podnosi podstawy.
    const parametry2024 = { ...PARAMETRY_2026, placaMinimalna: { ...PARAMETRY_2026.placaMinimalna, wartosc: 430_000 } };
    const wynik = podstawaWymiaru(
      {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-02-10',
        poczatekUbezpieczenia: '2019-01-01',
        pelnyEtat: true,
        miesiacePracownika: dwanascieMiesiecy(450_000),
      },
      parametry2024,
    );

    expect(wynik.podstawa).toBe(388_305);
    expect(wynik.stawkaDzienna).toBe(12_944);
  });

  it('P2: miesiąc z co najmniej połową przepracowanego czasu jest uzupełniany, poniżej połowy wyłączony, a premia kwartalna wliczana w 1/12', () => {
    const miesiace = dwanascieMiesiecy(580_000);
    // Miesiąc A: 12 z 21 dni, wypłacona zmienna 457,14 zł, stała z umowy 5000 zł.
    miesiace[3] = {
      miesiac: '2025-05',
      brutto: 360_000,
      dniDoPrzepracowania: 21,
      dniPrzepracowane: 12,
      skladnikStalyZUmowy: 500_000,
      skladnikZmiennyFaktyczny: 45_714,
    };
    // Miesiąc B: 5 z 20 dni, poniżej połowy.
    miesiace[7] = { miesiac: '2025-09', brutto: 150_000, dniDoPrzepracowania: 20, dniPrzepracowane: 5 };

    const wynik = podstawaWymiaru(
      {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-02-10',
        poczatekUbezpieczenia: '2020-01-01',
        pelnyEtat: true,
        miesiacePracownika: miesiace,
        premieKwartalne: 600_000,
      },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(543_627);
    expect(wynik.sciezka).toBe('srednia_pracownika');
  });

  it('P3: pracownica na pełnym etacie z podstawą poniżej minimum dostaje podstawę minimalną 4147,10 zł', () => {
    const wynik = podstawaWymiaru(
      {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-02-10',
        poczatekUbezpieczenia: '2020-01-01',
        pelnyEtat: true,
        miesiacePracownika: dwanascieMiesiecy(450_000),
      },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(414_710);
    expect(wynik.niepotwierdzoneParametry).toContain('placaMinimalna');
  });

  it('P3: na niepełnym etacie podstawa nie jest podnoszona do minimum i zostaje 3883,05 zł', () => {
    const wynik = podstawaWymiaru(
      {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-02-10',
        poczatekUbezpieczenia: '2020-01-01',
        pelnyEtat: false,
        miesiacePracownika: dwanascieMiesiecy(450_000),
      },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(388_305);
  });

  it('inna płaca minimalna w zestawie parametrów zmienia podstawę minimalną', () => {
    // Płaca minimalna 2025 = 4666 zł (sprawy-testowe.md); 4666 × 0,8629 = 4026,29 zł (T01).
    const parametry2025 = { ...PARAMETRY_2026, placaMinimalna: { ...PARAMETRY_2026.placaMinimalna, wartosc: 466_600 } };

    const wynik = podstawaWymiaru(
      {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-02-10',
        poczatekUbezpieczenia: '2020-01-01',
        pelnyEtat: true,
        miesiacePracownika: dwanascieMiesiecy(300_000),
      },
      parametry2025,
    );

    expect(wynik.podstawa).toBe(402_629);
  });

  it('P4: przy stażu krótszym niż 12 miesięcy liczą się tylko pełne miesiące ubezpieczenia', () => {
    const wynik = podstawaWymiaru(
      {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-06-10',
        poczatekUbezpieczenia: '2026-03-15',
        pelnyEtat: true,
        miesiacePracownika: [
          { miesiac: '2026-03', brutto: 380_000 }, // niepełny miesiąc ubezpieczenia
          { miesiac: '2026-04', brutto: 700_000 },
          { miesiac: '2026-05', brutto: 700_000 },
        ],
      },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(604_030);
    expect(wynik.sciezka).toBe('srednia_pracownika');
  });

  it('P4: zdarzenie w pierwszym miesiącu ubezpieczenia liczy podstawę z wynagrodzenia z umowy', () => {
    const wynik = podstawaWymiaru(
      {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-03-20',
        poczatekUbezpieczenia: '2026-03-15',
        pelnyEtat: true,
        wynagrodzenieZUmowy: 700_000,
      },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(604_030);
    expect(wynik.sciezka).toBe('pierwszy_miesiac');
  });

  it('P5: zleceniobiorczyni z pełnym rokiem ma podstawę ze średniej podstawy składki, bez podnoszenia do płacy minimalnej', () => {
    const miesiace = MIESIACE_2025_02_DO_2026_01.map((miesiac, i) => ({ miesiac, podstawaSkladkiChorobowej: i < 6 ? 400_000 : 500_000 }));

    const wynik = podstawaWymiaru(
      { tytul: 'umowa_zlecenia', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2024-01-01', miesiaceNiepracownika: miesiace },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(388_305);
    expect(wynik.sciezka).toBe('srednia_niepracownika');
  });

  it('P6: działalność na „dużym ZUS” przez pełny rok ma podstawę 4877,11 zł', () => {
    const wynik = podstawaWymiaru(
      { tytul: 'dzialalnosc', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2022-05-01', miesiaceNiepracownika: dwanascieMiesiecyNiepracownika(565_200) },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(487_711);
  });

  it('P6: działalność na preferencyjnych składkach przez pełny rok ma podstawę 1244,13 zł', () => {
    const wynik = podstawaWymiaru(
      { tytul: 'dzialalnosc', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2022-05-01', miesiaceNiepracownika: dwanascieMiesiecyNiepracownika(144_180) },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(124_413);
    expect(wynik.sciezka).toBe('srednia_niepracownika');
  });

  it('P7: działalność krócej niż 12 miesięcy rozkłada nadwyżkę deklaracji ponad minimum na 12 miesięcy (art. 48a)', () => {
    const wynik = podstawaWymiaru(
      {
        tytul: 'dzialalnosc',
        dataZdarzenia: '2026-06-10',
        poczatekUbezpieczenia: '2026-02-01',
        miesiaceNiepracownika: ['2026-02', '2026-03', '2026-04', '2026-05'].map((miesiac) => ({
          miesiac,
          podstawaSkladkiChorobowej: 2_355_000,
          najnizszaPodstawa: 565_200,
        })),
      },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(1_002_517);
    expect(wynik.sciezka).toBe('art48a');
  });

  it('P8: działalność ze zdarzeniem w pierwszym miesiącu ma podstawę z najniższej podstawy składki, niezależnie od deklaracji', () => {
    const wynik = podstawaWymiaru(
      {
        tytul: 'dzialalnosc',
        dataZdarzenia: '2026-03-20',
        poczatekUbezpieczenia: '2026-03-01',
        miesiaceNiepracownika: [{ miesiac: '2026-03', podstawaSkladkiChorobowej: 2_355_000, najnizszaPodstawa: 565_200 }],
      },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(487_711);
    expect(wynik.sciezka).toBe('pierwszy_miesiac');
  });

  it('T03: miesiąc przepracowany dokładnie w połowie jest uzupełniany, a nie wyłączany', () => {
    // docs/research/sprawy-testowe.md T03: 6400 zł × 0,8629 = 5522,56 zł; dziennie 184,09 zł.
    const miesiace = dwanascieMiesiecy(640_000);
    miesiace[5] = { miesiac: '2025-07', brutto: 320_000, dniDoPrzepracowania: 20, dniPrzepracowane: 10, skladnikStalyZUmowy: 640_000 };

    const wynik = podstawaWymiaru(
      { tytul: 'umowa_o_prace', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2022-08-01', pelnyEtat: true, miesiacePracownika: miesiace },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(552_256);
    expect(wynik.stawkaDzienna).toBe(18_409);
  });

  describe('T09 (wariant hipotetyczny): 4 pełne miesiące ubezpieczenia', () => {
    // docs/research/sprawy-testowe.md T09: (3 × 4666 + 4806) / 4 = 4701,00 × 0,8629 = 4056,49 zł; dziennie 135,22 zł.
    const t09 = (pelnyEtat: boolean) =>
      podstawaWymiaru(
        {
          tytul: 'umowa_o_prace',
          dataZdarzenia: '2026-02-03',
          poczatekUbezpieczenia: '2025-09-07',
          pelnyEtat,
          miesiacePracownika: [
            { miesiac: '2025-10', brutto: 466_600 },
            { miesiac: '2025-11', brutto: 466_600 },
            { miesiac: '2025-12', brutto: 466_600 },
            { miesiac: '2026-01', brutto: 480_600 },
          ],
        },
        PARAMETRY_2026,
      );

    it('średnia z pełnych miesięcy daje podstawę 4056,49 zł i stawkę dzienną 135,22 zł, gdy minimum nie ma zastosowania', () => {
      const wynik = t09(false);
      expect(wynik.podstawa).toBe(405_649);
      expect(wynik.stawkaDzienna).toBe(13_522);
    });

    it('na pełnym etacie w 2026 r. podstawa jest podniesiona do minimum 4147,10 zł (art. 45; research pomija ten krok)', () => {
      expect(t09(true).podstawa).toBe(414_710);
    });
  });

  it('T01: przy zmianie wymiaru etatu liczą się podane miesiące po zmianie, a wynik jest orientacyjny', () => {
    // docs/research/sprawy-testowe.md T01: 4666,00 × 0,8629 = 4026,29 zł; stawka dzienna 134,21 zł.
    // Poród w grudniu 2025 r.; pełny etat od 1. dnia miesiąca 2 miesiące przed porodem; płaca minimalna 2025 = 4666 zł.
    const parametry2025 = { ...PARAMETRY_2026, placaMinimalna: { ...PARAMETRY_2026.placaMinimalna, wartosc: 466_600 } };

    const wynik = podstawaWymiaru(
      {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2025-12-27',
        poczatekUbezpieczenia: '2023-12-01',
        pelnyEtat: true,
        miesiacePracownika: [
          { miesiac: '2025-10', brutto: 466_600 },
          { miesiac: '2025-11', brutto: 466_600 },
        ],
        okolicznosciPozaZakresem: { zmianaWymiaruCzasuPracy: true },
      },
      parametry2025,
    );

    expect(wynik.podstawa).toBe(402_629);
    expect(wynik.stawkaDzienna).toBe(13_421);
    expect(wynik.ostrzezenia.map((o) => o.kod)).toEqual(['WYNIK_ORIENTACYJNY']);
  });

  it('T14: pracownica na 1/3 etatu ma podstawę z 10 miesięcy po zmianie wymiaru, bez podnoszenia do minimum', () => {
    // docs/research/sprawy-testowe.md T14: (3 × 1556 + 7 × 2200) / 10 = 2006,80 × 0,8629 = 1731,67 zł; dziennie 57,72 zł.
    const wynik = podstawaWymiaru(
      {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-08-01',
        poczatekUbezpieczenia: '2025-01-01',
        pelnyEtat: false,
        miesiacePracownika: [
          ...['2025-10', '2025-11', '2025-12'].map((miesiac) => ({ miesiac, brutto: 155_600 })),
          ...['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'].map((miesiac) => ({ miesiac, brutto: 220_000 })),
        ],
        okolicznosciPozaZakresem: { zmianaWymiaruCzasuPracy: true },
      },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(173_167);
    expect(wynik.stawkaDzienna).toBe(5_772);
    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('WYNIK_ORIENTACYJNY');
  });

  describe('braki danych dają ostrzeżenie, a nie zgadywanie', () => {
    it('brak kwot za część miesięcy okresu odniesienia daje ostrzeżenie z listą brakujących miesięcy', () => {
      const wynik = podstawaWymiaru(
        {
          tytul: 'umowa_o_prace',
          dataZdarzenia: '2026-02-10',
          poczatekUbezpieczenia: '2023-01-01',
          pelnyEtat: true,
          miesiacePracownika: dwanascieMiesiecy(600_000).slice(2),
        },
        PARAMETRY_2026,
      );

      expect(wynik.podstawa).toBe(517_740);
      const brak = wynik.ostrzezenia.find((o) => o.kod === 'BRAK_DANYCH_MIESIECY');
      expect(brak?.komunikat).toContain('2025-02');
      expect(brak?.komunikat).toContain('2025-03');
    });

    it('brak informacji o pełnym etacie u pracownika daje ostrzeżenie zamiast podnoszenia do minimum', () => {
      const wynik = podstawaWymiaru(
        { tytul: 'umowa_o_prace', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2020-01-01', miesiacePracownika: dwanascieMiesiecy(450_000) },
        PARAMETRY_2026,
      );

      expect(wynik.podstawa).toBe(388_305);
      expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('BRAK_DANYCH');
    });

    it('zdarzenie w pierwszym miesiącu pracy bez wynagrodzenia z umowy daje nieznaną podstawę', () => {
      const wynik = podstawaWymiaru(
        { tytul: 'umowa_o_prace', dataZdarzenia: '2026-03-20', poczatekUbezpieczenia: '2026-03-15', pelnyEtat: true },
        PARAMETRY_2026,
      );

      expect(wynik.podstawa).toBeNull();
      expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('BRAK_DANYCH');
    });

    it('działalność w pierwszym miesiącu bez najniższej podstawy składki daje nieznaną podstawę', () => {
      const wynik = podstawaWymiaru(
        { tytul: 'dzialalnosc', dataZdarzenia: '2026-03-20', poczatekUbezpieczenia: '2026-03-01', miesiaceNiepracownika: [{ miesiac: '2026-03', podstawaSkladkiChorobowej: 565_200 }] },
        PARAMETRY_2026,
      );

      expect(wynik.podstawa).toBeNull();
      expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('BRAK_DANYCH');
    });

    it('art. 48a bez najniższej podstawy przy deklaracji poniżej 60% prognozowanego wynagrodzenia daje nieznaną podstawę', () => {
      const wynik = podstawaWymiaru(
        {
          tytul: 'dzialalnosc',
          dataZdarzenia: '2026-06-10',
          poczatekUbezpieczenia: '2026-02-01',
          miesiaceNiepracownika: ['2026-02', '2026-03', '2026-04', '2026-05'].map((miesiac) => ({ miesiac, podstawaSkladkiChorobowej: 144_180 })),
        },
        PARAMETRY_2026,
      );

      expect(wynik.podstawa).toBeNull();
      expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('BRAK_DANYCH');
    });

    it('miesiąc niepełny bez składników do uzupełnienia wchodzi w kwocie wypłaconej, z ostrzeżeniem', () => {
      const miesiace = dwanascieMiesiecy(600_000);
      miesiace[0] = { miesiac: '2025-02', brutto: 600_000, dniDoPrzepracowania: 20, dniPrzepracowane: 15 };

      const wynik = podstawaWymiaru(
        { tytul: 'umowa_o_prace', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2020-01-01', pelnyEtat: true, miesiacePracownika: miesiace },
        PARAMETRY_2026,
      );

      expect(wynik.podstawa).toBe(517_740);
      const brak = wynik.ostrzezenia.find((o) => o.kod === 'BRAK_DANYCH');
      expect(brak?.komunikat).toContain('2025-02');
    });

    it('bez żadnych kwot za okres odniesienia podstawa i stawka dzienna są nieznane', () => {
      const wynik = podstawaWymiaru(
        { tytul: 'umowa_zlecenia', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2023-01-01' },
        PARAMETRY_2026,
      );

      expect(wynik.podstawa).toBeNull();
      expect(wynik.stawkaDzienna).toBeNull();
      expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('BRAK_DANYCH');
    });
  });

  describe('art. 43: podstawy nie ustala się na nowo przy przerwie krótszej niż miesiąc kalendarzowy', () => {
    const poZasilku = (dataZdarzenia: string) =>
      podstawaWymiaru(
        {
          tytul: 'umowa_o_prace',
          dataZdarzenia,
          poczatekUbezpieczenia: '2020-01-01',
          pelnyEtat: true,
          miesiacePracownika: ['2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'].map(
            (miesiac) => ({ miesiac, brutto: 600_000 }),
          ),
          poprzedniZasilek: { podstawa: 300_000, dataKonca: '2026-01-31' },
        },
        PARAMETRY_2026,
      );

    it('zasiłek bez przerwy przyjmuje poprzednią podstawę (bez podnoszenia do minimum)', () => {
      const wynik = poZasilku('2026-02-01');
      expect(wynik.podstawa).toBe(300_000);
      expect(wynik.stawkaDzienna).toBe(10_000);
      expect(wynik.sciezka).toBe('poprzednia_podstawa');
    });

    it('przerwa, która nie obejmuje pełnego miesiąca kalendarzowego, zachowuje poprzednią podstawę', () => {
      expect(poZasilku('2026-02-28').podstawa).toBe(300_000);
    });

    it('przerwa obejmująca cały miesiąc kalendarzowy oznacza ustalenie podstawy na nowo', () => {
      const wynik = poZasilku('2026-03-01');
      expect(wynik.podstawa).toBe(517_740);
      expect(wynik.sciezka).toBe('srednia_pracownika');
    });
  });

  describe('górny limit podstawy składki chorobowej nie-pracownika (23 550 zł)', () => {
    it('deklaracja powyżej maksimum jest przycięta, a podstawa wynosi najwyżej 20 321,30 zł', () => {
      const wynik = podstawaWymiaru(
        { tytul: 'dzialalnosc', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2022-05-01', miesiaceNiepracownika: dwanascieMiesiecyNiepracownika(3_000_000) },
        PARAMETRY_2026,
      );

      expect(wynik.podstawa).toBe(2_032_130);
      expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('PODSTAWA_SKLADKI_PONAD_MAKSIMUM');
    });

    it('deklaracja dokładnie na maksimum nie daje ostrzeżenia', () => {
      const wynik = podstawaWymiaru(
        { tytul: 'dzialalnosc', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2022-05-01', miesiaceNiepracownika: dwanascieMiesiecyNiepracownika(2_355_000) },
        PARAMETRY_2026,
      );

      expect(wynik.podstawa).toBe(2_032_130);
      expect(wynik.ostrzezenia).toEqual([]);
    });

    it('przychód zleceniobiorcy w pierwszym miesiącu też podlega limitowi', () => {
      const wynik = podstawaWymiaru(
        { tytul: 'umowa_zlecenia', dataZdarzenia: '2026-03-20', poczatekUbezpieczenia: '2026-03-02', wynagrodzenieZUmowy: 3_000_000 },
        PARAMETRY_2026,
      );

      expect(wynik.podstawa).toBe(2_032_130);
      expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('PODSTAWA_SKLADKI_PONAD_MAKSIMUM');
    });

    it('pracownika limit nie dotyczy', () => {
      // 30 000 zł × 0,8629 = 25 887,00 zł
      const wynik = podstawaWymiaru(
        { tytul: 'umowa_o_prace', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2022-05-01', pelnyEtat: true, miesiacePracownika: dwanascieMiesiecy(3_000_000) },
        PARAMETRY_2026,
      );

      expect(wynik.podstawa).toBe(2_588_700);
    });
  });

  describe('art. 50: miesiące, w których zleceniobiorca pobierał zasiłek przez część miesiąca', () => {
    const zlecenie = (miesiace: MiesiacNiepracownika[]) =>
      podstawaWymiaru({ tytul: 'umowa_zlecenia', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2023-01-01', miesiaceNiepracownika: miesiace }, PARAMETRY_2026);

    it('miesiąc z pracą przez mniej niż połowę miesiąca jest wyłączony', () => {
      const miesiace = dwanascieMiesiecyNiepracownika(500_000);
      miesiace[4] = { miesiac: '2025-06', podstawaSkladkiChorobowej: 150_000, dniWykonywania: 14 }; // czerwiec: 30 dni
      // 5000 zł × 0,8629 = 4314,50 zł
      expect(zlecenie(miesiace).podstawa).toBe(431_450);
    });

    it('miesiąc z pracą przez co najmniej połowę miesiąca wchodzi bez uzupełnienia', () => {
      const miesiace = dwanascieMiesiecyNiepracownika(500_000);
      miesiace[4] = { miesiac: '2025-06', podstawaSkladkiChorobowej: 200_000, dniWykonywania: 15 };
      // (11 × 5000 + 2000) / 12 = 4750 zł; × 0,8629 = 4098,775 → 4098,78 zł
      expect(zlecenie(miesiace).podstawa).toBe(409_878);
    });

    it('gdy w każdym miesiącu pracowano mniej niż połowę, bierze się wszystkie miesiące', () => {
      const miesiace = dwanascieMiesiecyNiepracownika(100_000).map((m) => ({ ...m, dniWykonywania: 5 }));
      // 1000 zł × 0,8629 = 862,90 zł
      expect(zlecenie(miesiace).podstawa).toBe(86_290);
    });
  });

  it('art. 48a ust. 5: przy deklaracji co najmniej 60% prognozowanego wynagrodzenia za najniższą przyjmuje się tę kwotę (P7 bez podanej najniższej)', () => {
    const wynik = podstawaWymiaru(
      {
        tytul: 'dzialalnosc',
        dataZdarzenia: '2026-06-10',
        poczatekUbezpieczenia: '2026-02-01',
        miesiaceNiepracownika: ['2026-02', '2026-03', '2026-04', '2026-05'].map((miesiac) => ({ miesiac, podstawaSkladkiChorobowej: 2_355_000 })),
      },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(1_002_517);
    expect(wynik.niepotwierdzoneParametry).toContain('najnizszaPodstawaDzialalnosci');
  });

  it('art. 38 ust. 3: gdy w każdym miesiącu przepracowano mniej niż połowę, wszystkie miesiące są uzupełniane', () => {
    const miesiace = dwanascieMiesiecy(125_000).map((m) => ({ ...m, dniDoPrzepracowania: 20, dniPrzepracowane: 5, skladnikStalyZUmowy: 500_000 }));
    const wynik = podstawaWymiaru(
      { tytul: 'umowa_o_prace', dataZdarzenia: '2026-02-10', poczatekUbezpieczenia: '2020-01-01', pelnyEtat: false, miesiacePracownika: miesiace },
      PARAMETRY_2026,
    );

    // 5000 zł × 0,8629 = 4314,50 zł
    expect(wynik.podstawa).toBe(431_450);
  });

  it('minimum z art. 45 obejmuje też podstawę z wynagrodzenia z umowy w pierwszym miesiącu', () => {
    const wynik = podstawaWymiaru(
      { tytul: 'umowa_o_prace', dataZdarzenia: '2026-03-20', poczatekUbezpieczenia: '2026-03-15', pelnyEtat: true, wynagrodzenieZUmowy: 400_000 },
      PARAMETRY_2026,
    );

    expect(wynik.podstawa).toBe(414_710);
  });

  it('odliczenie składek i dzielnik dzienny pochodzą z zestawu parametrów, a nie z kodu reguł', () => {
    const parametry = {
      ...PARAMETRY_2026,
      odliczenieSkladek: { ...PARAMETRY_2026.odliczenieSkladek, wartosc: 1000 }, // 10%
      dzielnikDzienny: { ...PARAMETRY_2026.dzielnikDzienny, wartosc: 20 },
    };

    const wynik = podstawaWymiaru(
      {
        tytul: 'umowa_o_prace',
        dataZdarzenia: '2026-02-10',
        poczatekUbezpieczenia: '2023-01-01',
        pelnyEtat: true,
        miesiacePracownika: dwanascieMiesiecy(600_000),
      },
      parametry,
    );

    // 6000 zł × 0,90 = 5400 zł; 5400 zł / 20 = 270 zł.
    expect(wynik.podstawa).toBe(540_000);
    expect(wynik.stawkaDzienna).toBe(27_000);
  });
});
