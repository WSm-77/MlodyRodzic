import { describe, expect, it } from 'vitest';
import { PARAMETRY_2026, urlopyIZasilek, type Dziecko, type Rodzic, type WejscieUrlopow } from '../index';

// Przykłady: docs/research/reguly-wymiaru-zasilku-macierzynskiego.md §2–§7 i §9 (P4, P6, P7, P8),
// granice z komentarza do #14 (korekty D4, D5). Konwencja: dzień porodu = dzień 1.

const matka: Rodzic = { rola: 'matka', ubezpieczony: true, pracownik: true };
const ojciec: Rodzic = { rola: 'ojciec', ubezpieczony: true, pracownik: true };

const dziecko = (dane: Partial<Dziecko> = {}): Dziecko => ({ dataUrodzenia: '2026-03-01', ...dane });

function urodzenie(dzieci: Dziecko[], reszta: Partial<WejscieUrlopow> = {}): WejscieUrlopow {
  return {
    zdarzenie: { rodzaj: 'urodzenie', dataPorodu: '2026-03-01' },
    dzieci,
    rodzice: [matka, ojciec],
    ...reszta,
  };
}

const wymiary = (wejscie: WejscieUrlopow, parametry = PARAMETRY_2026) => urlopyIZasilek(wejscie, parametry).wymiary;

describe('urlopyIZasilek: urlop macierzyński wg liczby dzieci', () => {
  it('jedno dziecko daje 20 tygodni macierzyńskiego od dnia porodu, 2026-03-01 do 2026-07-18', () => {
    const m = wymiary(urodzenie([dziecko()])).macierzynski;

    expect(m?.przysluguje).toBe(true);
    expect(m?.tygodnie).toBe(20);
    expect(m?.dni).toBe(140);
    expect(m?.okres).toEqual({ od: '2026-03-01', do: '2026-07-18' });
    expect(m?.podstawaPrawna).toContain('KP art. 180 § 1 pkt 1');
  });

  it.each([
    [2, 31, 217],
    [3, 33, 231],
    [4, 35, 245],
    [5, 37, 259],
    [6, 37, 259],
  ])('%i dzieci przy jednym porodzie daje %i tygodni (%i dni)', (n, tygodnie, dni) => {
    const m = wymiary(urodzenie(Array.from({ length: n }, () => dziecko()))).macierzynski;

    expect(m?.tygodnie).toBe(tygodnie);
    expect(m?.dni).toBe(dni);
  });

  it('2 tygodnie przed porodem pomniejszają część po porodzie: urlop 2026-03-01 do 2026-07-18 przy porodzie 2026-03-15', () => {
    const m = wymiary(
      urodzenie([dziecko({ dataUrodzenia: '2026-03-15' })], {
        zdarzenie: { rodzaj: 'urodzenie', dataPorodu: '2026-03-15', tygodniePrzedPorodem: 2 },
      }),
    ).macierzynski;

    expect(m?.dni).toBe(140);
    expect(m?.okres).toEqual({ od: '2026-03-01', do: '2026-07-18' });
  });

  it('więcej niż 6 tygodni przed porodem jest niedozwolone: liczy 6 tygodni i ostrzega', () => {
    const wynik = urlopyIZasilek(
      urodzenie([dziecko({ dataUrodzenia: '2026-04-12' })], {
        zdarzenie: { rodzaj: 'urodzenie', dataPorodu: '2026-04-12', tygodniePrzedPorodem: 8 },
      }),
      PARAMETRY_2026,
    );

    expect(wynik.wymiary.macierzynski?.okres).toEqual({ od: '2026-03-01', do: '2026-07-18' });
    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('ZA_DUZO_TYGODNI_PRZED_PORODEM');
  });

  it('bez listy dzieci liczy wymiar dla jednego dziecka i prosi o uzupełnienie danych (story 40)', () => {
    const wynik = urlopyIZasilek(urodzenie([]), PARAMETRY_2026);

    expect(wynik.wymiary.macierzynski?.tygodnie).toBe(20);
    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('BRAK_DANYCH_DZIECI');
  });
});

describe('urlopyIZasilek: martwe urodzenie i zgon dziecka', () => {
  it('P6: martwe urodzenie 2026-03-01 daje 8 tygodni po porodzie, do 2026-04-25 (56 dni)', () => {
    const m = wymiary(urodzenie([dziecko({ martweUrodzenie: true })])).macierzynski;

    expect(m?.okres).toEqual({ od: '2026-03-01', do: '2026-04-25' });
    expect(m?.dni).toBe(56);
    expect(m?.podstawaPrawna).toContain('KP art. 180¹ § 1');
  });

  it('P6: zgon w 54. dniu życia (2026-04-23) wydłuża urlop do 7 dni od zgonu, do 2026-04-30 (61 dni)', () => {
    const m = wymiary(urodzenie([dziecko({ dataZgonu: '2026-04-23' })])).macierzynski;

    expect(m?.okres).toEqual({ od: '2026-03-01', do: '2026-04-30' });
    expect(m?.dni).toBe(61);
  });

  it.each([
    ['2026-04-24', '2026-05-01', 62, 'KP art. 180¹ § 1'], // 55. dzień życia
    ['2026-04-25', '2026-05-02', 63, 'KP art. 180¹ § 1'], // 56. dzień: jeszcze przed upływem 8 tygodni
    ['2026-04-26', '2026-05-03', 64, 'KP art. 180¹ § 2'], // 57. dzień: po upływie 8 tygodni
  ])('zgon %s: urlop do %s (%i dni), %s', (dataZgonu, koniec, dni, przepis) => {
    const m = wymiary(urodzenie([dziecko({ dataZgonu })])).macierzynski;

    expect(m?.okres).toEqual({ od: '2026-03-01', do: koniec });
    expect(m?.dni).toBe(dni);
    expect(m?.podstawaPrawna).toContain(przepis);
  });

  it('zgon po upływie 8 tygodni (2026-06-08) zachowuje urlop tylko 7 dni od zgonu, do 2026-06-15', () => {
    const m = wymiary(urodzenie([dziecko({ dataZgonu: '2026-06-08' })])).macierzynski;

    expect(m?.okres).toEqual({ od: '2026-03-01', do: '2026-06-15' });
  });

  it('P6: bliźnięta, jedno umiera w 10. dniu: macierzyński jak dla 1 dziecka, 20 tygodni', () => {
    const m = wymiary(urodzenie([dziecko(), dziecko({ dataZgonu: '2026-03-10' })])).macierzynski;

    expect(m?.tygodnie).toBe(20);
    expect(m?.okres).toEqual({ od: '2026-03-01', do: '2026-07-18' });
  });

  it('bliźnięta, jedno umiera w 196. dniu (2026-09-12): urlop trwa jeszcze 7 dni od zgonu, do 2026-09-19', () => {
    const m = wymiary(urodzenie([dziecko(), dziecko({ dataZgonu: '2026-09-12' })])).macierzynski;

    expect(m?.okres).toEqual({ od: '2026-03-01', do: '2026-09-19' });
    expect(m?.dni).toBe(203);
    expect(m?.podstawaPrawna).toContain('KP art. 180¹ § 2');
  });
});

describe('urlopyIZasilek: przejęcie urlopu macierzyńskiego', () => {
  const kody = (w: WejscieUrlopow) => urlopyIZasilek(w, PARAMETRY_2026).ostrzezenia.map((o) => o.kod);

  it('P7: matka 2 tygodnie przed porodem i 14 po, potem rezygnuje: ojciec przejmuje 4 tygodnie (2026-06-21 do 2026-07-18)', () => {
    const m = wymiary(
      urodzenie([dziecko({ dataUrodzenia: '2026-03-15' })], {
        zdarzenie: { rodzaj: 'urodzenie', dataPorodu: '2026-03-15', tygodniePrzedPorodem: 2 },
        przejecie: { przez: 'ojciec', przyczyna: 'rezygnacja', data: '2026-06-20' },
      }),
    ).macierzynski;

    expect(m?.podzial).toEqual([
      { rodzic: 'matka', od: '2026-03-01', do: '2026-06-20', dni: 112 },
      { rodzic: 'ojciec', od: '2026-06-21', do: '2026-07-18', dni: 28 },
    ]);
  });

  it('P7: matka 6 tygodni przed porodem i 14 po: wymiar wyczerpany, ojcu nic nie zostaje', () => {
    const wejscie = urodzenie([dziecko({ dataUrodzenia: '2026-04-12' })], {
      zdarzenie: { rodzaj: 'urodzenie', dataPorodu: '2026-04-12', tygodniePrzedPorodem: 6 },
      przejecie: { przez: 'ojciec', przyczyna: 'rezygnacja', data: '2026-07-18' },
    });

    expect(wymiary(wejscie).macierzynski?.podzial?.find((c) => c.rodzic === 'ojciec')).toBeUndefined();
    expect(kody(wejscie)).toContain('PRZEJECIE_BRAK_CZESCI');
  });

  it('rezygnacja przed upływem 14 tygodni po porodzie: ojciec może przejąć dopiero od 99. dnia (2026-06-07) i silnik ostrzega', () => {
    const wejscie = urodzenie([dziecko()], { przejecie: { przez: 'ojciec', przyczyna: 'rezygnacja', data: '2026-04-30' } });

    expect(wymiary(wejscie).macierzynski?.podzial?.find((c) => c.rodzic === 'ojciec')).toEqual({
      rodzic: 'ojciec',
      od: '2026-06-07',
      do: '2026-07-18',
      dni: 42,
    });
    expect(kody(wejscie)).toContain('PRZEJECIE_ZA_WCZESNIE');
  });

  it('zwykłej rezygnacji matki nie może przejąć inny członek rodziny', () => {
    const wejscie = urodzenie([dziecko()], { przejecie: { przez: 'inny', przyczyna: 'rezygnacja', data: '2026-06-06' } });

    expect(wymiary(wejscie).macierzynski?.podzial).toBeUndefined();
    expect(kody(wejscie)).toContain('PRZEJECIE_NIEDOZWOLONE');
  });

  it.each([
    // [przyczyna, przez, data zdarzenia, koniec (pobyt/zatrudnienie), część drugiej osoby od, do, dni]
    ['rezygnacja_z_orzeczeniem', 'inny', '2026-04-25', undefined, '2026-04-26', '2026-07-18', 84],
    ['pobyt_matki_w_szpitalu', 'ojciec', '2026-05-10', '2026-05-20', '2026-05-10', '2026-05-20', 11],
    ['zgon_matki', 'inny', '2026-03-20', undefined, '2026-03-21', '2026-07-18', 120],
    ['porzucenie_dziecka', 'ojciec', '2026-03-20', undefined, '2026-04-26', '2026-07-18', 84],
    ['matka_nieubezpieczona', 'ojciec', '2026-03-20', undefined, '2026-03-21', '2026-07-18', 120],
    ['zatrudnienie_matki_nieubezpieczonej', 'ojciec', '2026-04-01', '2026-05-31', '2026-04-01', '2026-05-31', 61],
  ] as const)('%s (%s, %s): druga osoba przejmuje %s–%s', (przyczyna, przez, data, dataKonca, od, do_, dni) => {
    const m = wymiary(
      urodzenie([dziecko()], { przejecie: { przez, przyczyna, data, ...(dataKonca ? { dataKonca } : {}) } }),
    ).macierzynski;

    expect(m?.podzial?.find((c) => c.rodzic === przez)).toEqual({ rodzic: przez, od, do: do_, dni });
  });

  it('pobyt matki w szpitalu przerywa jej urlop tylko na czas pobytu: potem matka wraca na urlop', () => {
    const m = wymiary(
      urodzenie([dziecko()], {
        przejecie: { przez: 'ojciec', przyczyna: 'pobyt_matki_w_szpitalu', data: '2026-05-10', dataKonca: '2026-05-20' },
      }),
    ).macierzynski;

    expect(m?.podzial).toEqual([
      { rodzic: 'matka', od: '2026-03-01', do: '2026-05-09', dni: 70 },
      { rodzic: 'ojciec', od: '2026-05-10', do: '2026-05-20', dni: 11 },
      { rodzic: 'matka', od: '2026-05-21', do: '2026-07-18', dni: 59 },
    ]);
  });

  it('matka nieubezpieczona nie ma urlopu: podział obejmuje tylko część ojca', () => {
    const m = wymiary(
      urodzenie([dziecko()], {
        rodzice: [{ ...matka, ubezpieczony: false }, ojciec],
        przejecie: { przez: 'ojciec', przyczyna: 'matka_nieubezpieczona', data: '2026-03-20' },
      }),
    ).macierzynski;

    expect(m?.podzial?.map((c) => c.rodzic)).toEqual(['ojciec']);
  });
});

describe('urlopyIZasilek: uzupełniający urlop macierzyński', () => {
  // Poród 2026-03-01 = dzień 1, więc n-ty dzień po porodzie w marcu to 2026-03-n.
  const wczesniak = (ukonczoneTygodnieCiazy: number, masaUrodzeniowaG: number, ...hospitalizacje: [string, string][]) =>
    dziecko({ ukonczoneTygodnieCiazy, masaUrodzeniowaG, hospitalizacje: hospitalizacje.map(([od, do_]) => ({ od, do: do_ })) });
  const uzupelniajacy = (...dzieci: Dziecko[]) => wymiary(urodzenie(dzieci)).uzupelniajacyMacierzynski;

  it('P4a: 26 tygodni, 900 g, szpital w dniach 1–90: kategoria A, 13 tygodni bezpośrednio po macierzyńskim', () => {
    const u = uzupelniajacy(wczesniak(26, 900, ['2026-03-01', '2026-05-29']));

    expect(u?.kategoria).toBe('A');
    expect(u?.tygodnie).toBe(13);
    expect(u?.dni).toBe(91);
    expect(u?.okres).toEqual({ od: '2026-07-19', do: '2026-10-17' });
  });

  it('P4b: 32 tygodnie, 1600 g, szpital w dniach 1–12 i 20–33: kategoria B, 26 dni, 4 tygodnie', () => {
    const u = uzupelniajacy(wczesniak(32, 1600, ['2026-03-01', '2026-03-12'], ['2026-03-20', '2026-04-02']));

    expect(u?.kategoria).toBe('B');
    expect(u?.tygodnie).toBe(4);
  });

  it('P4c: 39 tygodni, 3400 g, szpital w dniach 1–3 i 9–14: kategoria C, w oknie 6 dni, 1 tydzień', () => {
    const u = uzupelniajacy(wczesniak(39, 3400, ['2026-03-01', '2026-03-03'], ['2026-03-09', '2026-03-14']));

    expect(u?.kategoria).toBe('C');
    expect(u?.tygodnie).toBe(1);
  });

  it('P4d: bliźnięta 30 tygodni, 1100 g i 950 g: kategoria wg najniższej masy (A), dni wg najdłużej hospitalizowanego (50), 8 tygodni', () => {
    const u = uzupelniajacy(
      wczesniak(30, 1100, ['2026-03-01', '2026-04-19']),
      wczesniak(30, 950, ['2026-03-01', '2026-03-30']),
    );

    expect(u?.kategoria).toBe('A');
    expect(u?.tygodnie).toBe(8);
  });

  it('P4e: 30 tygodni, 1500 g, szpital w dniach 1–70: kategoria B liczy tylko dni 1–56, 8 tygodni', () => {
    const u = uzupelniajacy(wczesniak(30, 1500, ['2026-03-01', '2026-05-09']));

    expect(u?.kategoria).toBe('B');
    expect(u?.tygodnie).toBe(8);
  });

  it('masa dokładnie 1000 g daje kategorię A: szpital w dniach 1–70 to 10 tygodni', () => {
    const u = uzupelniajacy(wczesniak(30, 1000, ['2026-03-01', '2026-05-09']));

    expect(u?.kategoria).toBe('A');
    expect(u?.tygodnie).toBe(10);
  });

  it.each([
    [27, 'A', 10],
    [28, 'B', 8],
  ])('%i ukończonych tygodni i masa 1001 g: kategoria %s, %i tygodni', (tygodnie, kategoria, wynik) => {
    const u = uzupelniajacy(wczesniak(tygodnie, 1001, ['2026-03-01', '2026-05-09']));

    expect(u?.kategoria).toBe(kategoria);
    expect(u?.tygodnie).toBe(wynik);
  });

  it.each([
    [36, true, 1],
    [37, false, 0],
  ])('%i ukończonych tygodni, szpital tylko w dniach 1–4: przysługuje %s, %i tygodni', (tygodnie, przysluguje, wynik) => {
    const u = uzupelniajacy(wczesniak(tygodnie, 3000, ['2026-03-01', '2026-03-04']));

    expect(u?.przysluguje).toBe(przysluguje);
    expect(u?.tygodnie).toBe(wynik);
  });

  it.each([
    ['jeden dzień w 28. dniu', '2026-03-28', '2026-03-28', 0],
    ['2 kolejne dni od 28. dnia', '2026-03-28', '2026-03-29', 1],
    ['pobyt zaczęty w 29. dniu', '2026-03-29', '2026-04-04', 0],
  ])('kategoria C wymaga 2 kolejnych dni pobytu, pierwszego w dniach 5–28: %s daje %i tyg.', (_opis, od, do_, wynik) => {
    expect(uzupelniajacy(wczesniak(39, 3400, [od, do_]))?.tygodnie).toBe(wynik);
  });

  it('dziecko bez pobytu w szpitalu: uzupełniający nie przysługuje', () => {
    expect(uzupelniajacy(dziecko({ ukonczoneTygodnieCiazy: 39, masaUrodzeniowaG: 3400 }))?.przysluguje).toBe(false);
  });

  it('brak tygodnia ciąży przy masie powyżej 1000 g: ostrzeżenie o brakujących danych zamiast zgadywania', () => {
    const wynik = urlopyIZasilek(
      urodzenie([dziecko({ masaUrodzeniowaG: 1500, hospitalizacje: [{ od: '2026-03-01', do: '2026-03-20' }] })]),
      PARAMETRY_2026,
    );

    expect(wynik.wymiary.uzupelniajacyMacierzynski?.przysluguje).toBe(false);
    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('BRAK_DANYCH_UZUPELNIAJACY');
  });

  it('granica 28. tygodnia przy masie powyżej 1000 g to założenie do potwierdzenia: ostrzeżenie', () => {
    const wynik = urlopyIZasilek(urodzenie([wczesniak(28, 1200, ['2026-03-01', '2026-03-20'])]), PARAMETRY_2026);

    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('ZALOZENIE_PROGI_UZUPELNIAJACEGO');
  });

  it('zgon wcześniaka przed końcem macierzyńskiego: uzupełniający nie przysługuje', () => {
    const u = uzupelniajacy({ ...wczesniak(26, 900, ['2026-03-01', '2026-04-10']), dataZgonu: '2026-04-10' });

    expect(u?.przysluguje).toBe(false);
  });
});

describe('urlopyIZasilek: urlop rodzicielski', () => {
  it('jedno dziecko: 41 tygodni łącznie, po 9 nieprzenoszalnych, jeden rodzic maks. 32, 5 części, do 2032-12-31', () => {
    const r = wymiary(urodzenie([dziecko()])).rodzicielski;

    expect(r).toMatchObject({
      przysluguje: true,
      tygodnie: 41,
      dni: 287,
      tygodnieNieprzenoszalne: 9,
      maksDlaJednegoRodzicaTygodnie: 32,
      maksCzesci: 5,
      terminWykorzystania: '2032-12-31',
    });
  });

  it.each([
    ['bliźnięta', [dziecko(), dziecko()], 43, 34],
    ['jedno dziecko z zaświadczeniem „Za życiem”', [dziecko({ zaswiadczenieZaZyciem: true })], 65, 56],
    ['bliźnięta, jedno z zaświadczeniem „Za życiem”', [dziecko(), dziecko({ zaswiadczenieZaZyciem: true })], 67, 58],
  ])('%s: %i tygodni, jeden rodzic maks. %i', (_opis, dzieci, tygodnie, maks) => {
    const r = wymiary(urodzenie(dzieci)).rodzicielski;

    expect(r?.tygodnie).toBe(tygodnie);
    expect(r?.maksDlaJednegoRodzicaTygodnie).toBe(maks);
  });

  it('P6: bliźnięta, jedno umiera w 10. dniu: rodzicielski 41 tygodni jako założenie do potwierdzenia', () => {
    const wynik = urlopyIZasilek(urodzenie([dziecko(), dziecko({ dataZgonu: '2026-03-10' })]), PARAMETRY_2026);

    expect(wynik.wymiary.rodzicielski?.tygodnie).toBe(41);
    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('ZALOZENIE_RODZICIELSKI_PO_ZGONIE_DZIECKA');
  });

  it('martwe urodzenie: brak urlopu rodzicielskiego, ojcowskiego i uzupełniającego', () => {
    const w = wymiary(urodzenie([dziecko({ martweUrodzenie: true, hospitalizacje: [] })]));

    expect(w.rodzicielski?.przysluguje).toBe(false);
    expect(w.ojcowski?.przysluguje).toBe(false);
    expect(w.uzupelniajacyMacierzynski?.przysluguje).toBe(false);
  });

  it('zgon dziecka w czasie macierzyńskiego po 8 tygodniach życia (2026-06-08): rodzicielski już nie przysługuje', () => {
    expect(wymiary(urodzenie([dziecko({ dataZgonu: '2026-06-08' })])).rodzicielski?.przysluguje).toBe(false);
  });

  it('zgon dziecka po macierzyńskim (2026-09-01): prawo do rodzicielskiego trwa 7 dni od zgonu, do 2026-09-08', () => {
    const r = wymiary(urodzenie([dziecko({ dataZgonu: '2026-09-01' })])).rodzicielski;

    expect(r?.przysluguje).toBe(true);
    expect(r?.terminWykorzystania).toBe('2026-09-08');
  });

  it('samotny rodzic: 9 tygodni drugiego rodzica nadal nieprzenoszalne, z ostrzeżeniem o założeniu', () => {
    const wynik = urlopyIZasilek(urodzenie([dziecko()], { rodzice: [matka] }), PARAMETRY_2026);

    expect(wynik.wymiary.rodzicielski?.maksDlaJednegoRodzicaTygodnie).toBe(32);
    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('ZALOZENIE_NIEPRZENOSZALNE_SAMOTNY_RODZIC');
  });

  it('wymiar i część nieprzenoszalna pochodzą z zestawu parametrów', () => {
    const parametry = {
      ...PARAMETRY_2026,
      tygodnieRodzicielskiego: { ...PARAMETRY_2026.tygodnieRodzicielskiego, wartosc: 45 },
      tygodnieNieprzenoszalne: { ...PARAMETRY_2026.tygodnieNieprzenoszalne, wartosc: 10 },
    };

    expect(wymiary(urodzenie([dziecko()]), parametry).rodzicielski?.maksDlaJednegoRodzicaTygodnie).toBe(35);
  });
});

describe('urlopyIZasilek: urlop ojcowski', () => {
  it('2 tygodnie w najwyżej 2 częściach, do ukończenia przez dziecko 12 miesięcy (2027-02-28)', () => {
    const o = wymiary(urodzenie([dziecko()])).ojcowski;

    expect(o).toMatchObject({ przysluguje: true, tygodnie: 2, dni: 14, maksCzesci: 2, terminWykorzystania: '2027-02-28' });
    expect(o?.podstawaPrawna).toContain('KP art. 182³ § 1 pkt 1');
  });
});

describe('urlopyIZasilek: przyjęcie dziecka na wychowanie', () => {
  const przyjecie = (
    rodzaj: 'przysposobienie' | 'rodzinaZastepczaNiezawodowa' | 'rodzinaZastepczaZawodowa',
    ...dzieci: Dziecko[]
  ): WejscieUrlopow => ({ zdarzenie: { rodzaj, dataPrzyjecia: '2026-03-01' }, dzieci, rodzice: [matka, ojciec] });

  it('P8: rodzina zastępcza, dziecko 30 dni przed 7. urodzinami: minimum 9 tygodni na warunkach macierzyńskiego i rodzicielski 38', () => {
    const w = wymiary(przyjecie('rodzinaZastepczaNiezawodowa', dziecko({ dataUrodzenia: '2019-03-31' })));

    expect(w.naWarunkachMacierzynskiego).toMatchObject({ przysluguje: true, tygodnie: 9, dni: 63, okres: { od: '2026-03-01', do: '2026-05-02' } });
    expect(w.rodzicielski).toMatchObject({ przysluguje: true, tygodnie: 38, maksDlaJednegoRodzicaTygodnie: 29 });
    expect(w.macierzynski).toBeUndefined();
  });

  it('P8: rodzina zastępcza, dziecko 3-letnie: 20 tygodni na warunkach macierzyńskiego i rodzicielski 41', () => {
    const w = wymiary(przyjecie('rodzinaZastepczaNiezawodowa', dziecko({ dataUrodzenia: '2023-03-01' })));

    expect(w.naWarunkachMacierzynskiego).toMatchObject({ tygodnie: 20, dni: 140, okres: { od: '2026-03-01', do: '2026-07-18' } });
    expect(w.rodzicielski).toMatchObject({ tygodnie: 41, terminWykorzystania: '2029-12-31' });
  });

  it.each([
    ['rodzinaZastepczaNiezawodowa', '2019-03-02', false, true], // dzień przed 7. urodzinami
    ['rodzinaZastepczaNiezawodowa', '2019-03-01', false, false], // w dniu 7. urodzin
    ['rodzinaZastepczaNiezawodowa', '2017-03-02', true, true], // 9 lat, odroczony obowiązek szkolny: limit 10 lat
    ['rodzinaZastepczaNiezawodowa', '2017-03-02', false, false], // 9 lat bez odroczenia
    ['przysposobienie', '2012-03-02', false, true], // dzień przed 14. urodzinami
    ['przysposobienie', '2012-03-01', false, false], // w dniu 14. urodzin
  ] as const)('%s, dziecko urodzone %s (odroczenie: %s): urlop przysługuje: %s', (rodzaj, dataUrodzenia, odroczenieObowiazkuSzkolnego, przysluguje) => {
    const w = wymiary(przyjecie(rodzaj, dziecko({ dataUrodzenia, odroczenieObowiazkuSzkolnego })));

    expect(w.naWarunkachMacierzynskiego?.przysluguje).toBe(przysluguje);
    expect(w.rodzicielski?.przysluguje).toBe(przysluguje);
  });

  it('dziecko tuż przed limitem wieku dostaje minimum 9 tygodni', () => {
    expect(wymiary(przyjecie('przysposobienie', dziecko({ dataUrodzenia: '2012-03-02' }))).naWarunkachMacierzynskiego?.dni).toBe(63);
  });

  it('przysposobienie, 75 dni do 14. urodzin: urlop skrócony do dnia przed urodzinami (2026-05-14), rodzicielski 41', () => {
    const w = wymiary(przyjecie('przysposobienie', dziecko({ dataUrodzenia: '2012-05-15' })));

    expect(w.naWarunkachMacierzynskiego).toMatchObject({ dni: 75, okres: { od: '2026-03-01', do: '2026-05-14' } });
    expect(w.rodzicielski?.tygodnie).toBe(41);
  });

  it('dwoje dzieci przyjętych jednocześnie: 31 tygodni i rodzicielski 43', () => {
    const w = wymiary(przyjecie('przysposobienie', dziecko({ dataUrodzenia: '2024-01-10' }), dziecko({ dataUrodzenia: '2022-06-01' })));

    expect(w.naWarunkachMacierzynskiego?.tygodnie).toBe(31);
    expect(w.rodzicielski?.tygodnie).toBe(43);
  });

  it('minimum przy dziecku z zaświadczeniem „Za życiem”: rodzicielski 62 tygodnie', () => {
    const w = wymiary(przyjecie('rodzinaZastepczaNiezawodowa', dziecko({ dataUrodzenia: '2019-03-31', zaswiadczenieZaZyciem: true })));

    expect(w.rodzicielski?.tygodnie).toBe(62);
  });

  it('zawodowa rodzina zastępcza: urlop na warunkach macierzyńskiego, rodzicielski i ojcowski nie przysługują', () => {
    const w = wymiary(przyjecie('rodzinaZastepczaZawodowa', dziecko({ dataUrodzenia: '2023-03-01' })));

    expect(w.naWarunkachMacierzynskiego?.przysluguje).toBe(false);
    expect(w.naWarunkachMacierzynskiego?.podstawaPrawna).toContain('KP art. 183 § 1');
    expect(w.rodzicielski?.przysluguje).toBe(false);
    expect(w.ojcowski?.przysluguje).toBe(false);
  });

  it('rodzina zastępcza niezawodowa nie ma urlopu ojcowskiego; przysposobienie ma, z ostrzeżeniem o terminie z postanowienia sądu', () => {
    expect(wymiary(przyjecie('rodzinaZastepczaNiezawodowa', dziecko({ dataUrodzenia: '2023-03-01' }))).ojcowski?.przysluguje).toBe(false);

    const wynik = urlopyIZasilek(przyjecie('przysposobienie', dziecko({ dataUrodzenia: '2023-03-01' })), PARAMETRY_2026);
    expect(wynik.wymiary.ojcowski).toMatchObject({ przysluguje: true, tygodnie: 2, terminWykorzystania: '2037-02-28' });
    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('TERMIN_OJCOWSKI_PRZYSPOSOBIENIE');
  });

  it('uzupełniający przy przyjęciu liczy tylko pobyt w szpitalu po dniu przyjęcia', () => {
    const w = wymiary(
      przyjecie(
        'przysposobienie',
        dziecko({ dataUrodzenia: '2026-02-20', ukonczoneTygodnieCiazy: 26, masaUrodzeniowaG: 900, hospitalizacje: [{ od: '2026-02-20', do: '2026-03-20' }] }),
      ),
    );

    expect(w.uzupelniajacyMacierzynski).toMatchObject({ przysluguje: true, kategoria: 'A', tygodnie: 3 });
  });

  it('przejęcie urlopu na warunkach macierzyńskiego przez ojca po rezygnacji matki', () => {
    const w = wymiary({
      ...przyjecie('przysposobienie', dziecko({ dataUrodzenia: '2023-03-01' })),
      przejecie: { przez: 'ojciec', przyczyna: 'rezygnacja', data: '2026-06-06' },
    });

    expect(w.naWarunkachMacierzynskiego?.podzial?.find((c) => c.rodzic === 'ojciec')).toEqual({
      rodzic: 'ojciec',
      od: '2026-06-07',
      do: '2026-07-18',
      dni: 42,
    });
  });
});

// Okresy, stawki i kwoty (#18): docs/research/reguly-wymiaru-zasilku-macierzynskiego.md §8–§9 (P1, P2, P3, P5, P6),
// korekta D6 i konwencja terminów z komentarza do #14. Kwoty w groszach.
describe('urlopyIZasilek: okresy, stawki i kwoty zasiłku', () => {
  const matkaP1: Rodzic = { ...matka, podstawaWymiaru: 600_000 };
  const ojciecP1: Rodzic = { ...ojciec, podstawaWymiaru: 900_000 };
  const p1 = (reszta: Partial<WejscieUrlopow> = {}): WejscieUrlopow =>
    urodzenie([dziecko()], {
      rodzice: [matkaP1, ojciecP1],
      wniosek815: { zlozony: true, dataZlozenia: '2026-03-10' },
      ...reszta,
    });
  const okresy = (wynik: ReturnType<typeof urlopyIZasilek>, rodzaj: string, rodzic: string) =>
    wynik.okresy.filter((o) => o.rodzaj === rodzaj && o.rodzic === rodzic);

  it('P1: macierzyński matki przy wniosku 81,5%: 140 dni po 163,00 zł = 22 820,00 zł', () => {
    const wynik = urlopyIZasilek(p1(), PARAMETRY_2026);

    expect(wynik.wariant).toBe('81_5');
    expect(okresy(wynik, 'macierzynski', 'matka')).toEqual([
      expect.objectContaining({ od: '2026-03-01', do: '2026-07-18', dni: 140, stawka: 815, kwotaDzienna: 16_300, kwota: 2_282_000 }),
    ]);
  });

  it('P1: bez planu rodzicielski matki 32 tyg. po 81,5% (36 512,00 zł), potem 9 tyg. ojca po 70% (13 230,00 zł)', () => {
    const wynik = urlopyIZasilek(p1(), PARAMETRY_2026);

    expect(okresy(wynik, 'rodzicielski', 'matka')).toEqual([
      expect.objectContaining({ od: '2026-07-19', do: '2027-02-27', dni: 224, stawka: 815, kwotaDzienna: 16_300, kwota: 3_651_200 }),
    ]);
    expect(okresy(wynik, 'rodzicielski', 'ojciec')).toEqual([
      expect.objectContaining({ od: '2027-02-28', do: '2027-05-01', dni: 63, stawka: 700, kwotaDzienna: 21_000, kwota: 1_323_000 }),
    ]);
    expect(okresy(wynik, 'rodzicielski', 'ojciec')[0]?.podstawaPrawna).toContain('UZ art. 31 ust. 3f');
  });

  it('P1: ojcowski zawsze 100%, także przy wniosku 81,5%: 14 dni po 300,00 zł = 4 200,00 zł', () => {
    const wynik = urlopyIZasilek(p1(), PARAMETRY_2026);

    expect(okresy(wynik, 'ojcowski', 'ojciec')).toEqual([
      expect.objectContaining({ od: '2026-03-01', do: '2026-03-14', dni: 14, stawka: 1000, kwotaDzienna: 30_000, kwota: 420_000 }),
    ]);
  });

  it('P1: suma i porównanie wariantów — matka 59 332 zł przy 81,5% wobec 59 360 zł przy 100/70', () => {
    const wynik = urlopyIZasilek(p1(), PARAMETRY_2026);

    // 22 820 + 36 512 + 13 230 + 4 200 oraz 28 000 + 31 360 + 13 230 + 4 200.
    expect(wynik.suma).toBe(7_676_200);
    expect(wynik.porownanieWariantow).toEqual({ wariant815: 7_676_200, wariant100_70: 7_679_000 });
  });

  it('P1: przy wniosku 81,5% silnik ostrzega, do kiedy trzeba zacząć rodzicielski (koniec 1. roku życia, 2027-02-28)', () => {
    const ostrzezenie = urlopyIZasilek(p1(), PARAMETRY_2026).ostrzezenia.find((o) => o.kod === 'TERMIN_RODZICIELSKIEGO_815');

    expect(ostrzezenie?.termin).toBe('2027-02-28');
  });

  it.each([
    ['2026-03-22', '81_5', 16_300],
    ['2026-03-23', '100_70', 20_000],
  ] as const)('wniosek 81,5% złożony %s (poród 2026-03-01): wariant %s, macierzyński %i gr dziennie', (dataZlozenia, wariant, dzienna) => {
    const wynik = urlopyIZasilek(p1({ wniosek815: { zlozony: true, dataZlozenia } }), PARAMETRY_2026);

    expect(wynik.wariant).toBe(wariant);
    expect(okresy(wynik, 'macierzynski', 'matka')[0]?.kwotaDzienna).toBe(dzienna);
    expect(wynik.ostrzezenia.some((o) => o.kod === 'WNIOSEK_815_PO_TERMINIE')).toBe(wariant === '100_70');
  });

  it('bez wniosku: wariant 100/70 i ostrzeżenie o terminie na wniosek 81,5% (2026-03-22)', () => {
    const wynik = urlopyIZasilek(p1({ wniosek815: { zlozony: false } }), PARAMETRY_2026);

    expect(wynik.wariant).toBe('100_70');
    expect(wynik.ostrzezenia.find((o) => o.kod === 'TERMIN_WNIOSKU_815')?.termin).toBe('2026-03-22');
  });

  it('uzupełniający zawsze 100% przy wniosku 81,5%; rodzicielski zaczyna się po nim; wniosek o uzupełniający do 2026-06-27', () => {
    const wczesniak = dziecko({ ukonczoneTygodnieCiazy: 26, masaUrodzeniowaG: 900, hospitalizacje: [{ od: '2026-03-01', do: '2026-05-29' }] });
    const wynik = urlopyIZasilek(p1({ dzieci: [wczesniak] }), PARAMETRY_2026);

    expect(okresy(wynik, 'uzupelniajacyMacierzynski', 'matka')).toEqual([
      expect.objectContaining({ od: '2026-07-19', do: '2026-10-17', dni: 91, stawka: 1000, kwotaDzienna: 20_000, kwota: 1_820_000 }),
    ]);
    expect(okresy(wynik, 'rodzicielski', 'matka')[0]?.od).toBe('2026-10-18');
    expect(wynik.ostrzezenia.find((o) => o.kod === 'TERMIN_WNIOSKU_UZUPELNIAJACEGO')?.termin).toBe('2026-06-27');
  });

  describe('P2: utrata 81,5% — matka zaczyna rodzicielski dopiero w 1. urodziny dziecka', () => {
    const planOd = (od: string, do_: string): Partial<WejscieUrlopow> => ({
      plan: [{ rodzaj: 'rodzicielski', rodzic: 'matka', od, do: do_ }],
    });

    it('rodzicielski 70% (140,00 zł dziennie) i wyrównanie macierzyńskiego 140 × (200 − 163) = 5 180,00 zł na wniosek', () => {
      const wynik = urlopyIZasilek(p1(planOd('2027-03-01', '2027-10-10')), PARAMETRY_2026);

      expect(okresy(wynik, 'rodzicielski', 'matka')).toEqual([
        expect.objectContaining({ dni: 224, stawka: 700, kwotaDzienna: 14_000, kwota: 3_136_000 }),
      ]);
      expect(okresy(wynik, 'macierzynski', 'matka')[0]?.kwota).toBe(2_282_000);
      expect(wynik.wyrownanie).toEqual({ rodzic: 'matka', kwota: 518_000, podstawaPrawna: ['UZ art. 31 ust. 4'] });
      expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('UTRATA_815');
    });

    it('rodzicielski od ostatniego dnia 1. roku życia (2027-02-28) zachowuje 81,5%', () => {
      const wynik = urlopyIZasilek(p1(planOd('2027-02-28', '2027-10-09')), PARAMETRY_2026);

      expect(okresy(wynik, 'rodzicielski', 'matka')[0]?.stawka).toBe(815);
      expect(wynik.wyrownanie).toBeUndefined();
    });
  });

  it('P3: bliźnięta, 100/70, podstawa 4 500 zł: macierzyński 217 dni = 32 550 zł, rodzicielski matki 34 tyg. = 24 990 zł', () => {
    const wynik = urlopyIZasilek(
      urodzenie([dziecko(), dziecko()], { rodzice: [{ ...matka, podstawaWymiaru: 450_000 }, ojciec] }),
      PARAMETRY_2026,
    );

    expect(okresy(wynik, 'macierzynski', 'matka')).toEqual([expect.objectContaining({ dni: 217, kwotaDzienna: 15_000, kwota: 3_255_000 })]);
    expect(okresy(wynik, 'rodzicielski', 'matka')).toEqual([expect.objectContaining({ dni: 238, kwotaDzienna: 10_500, kwota: 2_499_000 })]);
    expect(okresy(wynik, 'rodzicielski', 'ojciec')).toEqual([expect.objectContaining({ dni: 63, kwotaDzienna: null, kwota: null })]);
  });

  it('P3: brak podstawy wymiaru ojca — kwoty jego okresów i suma nieznane, z ostrzeżeniem', () => {
    const wynik = urlopyIZasilek(
      urodzenie([dziecko(), dziecko()], { rodzice: [{ ...matka, podstawaWymiaru: 450_000 }, ojciec] }),
      PARAMETRY_2026,
    );

    expect(wynik.suma).toBeNull();
    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('BRAK_PODSTAWY_WYMIARU');
  });

  it('P5: łączenie z pracą na ½ etatu przez 16 tyg. wydłuża rodzicielski do 40 tyg.; łącznie 31 360 zł, tyle co bez łączenia', () => {
    const wynik = urlopyIZasilek(
      urodzenie([dziecko()], {
        rodzice: [matkaP1],
        plan: [
          { rodzaj: 'rodzicielski', rodzic: 'matka', od: '2026-07-19', do: '2026-11-07', wymiarPracy: { licznik: 1, mianownik: 2 } },
          { rodzaj: 'rodzicielski', rodzic: 'matka', od: '2026-11-08', do: '2027-04-24' },
        ],
      }),
      PARAMETRY_2026,
    );
    const rodzicielski = okresy(wynik, 'rodzicielski', 'matka');

    expect(rodzicielski).toEqual([
      expect.objectContaining({ dni: 112, stawka: 700, kwotaDzienna: 7_000, kwota: 784_000 }),
      expect.objectContaining({ dni: 168, stawka: 700, kwotaDzienna: 14_000, kwota: 2_352_000 }),
    ]);
    expect(rodzicielski.reduce((s, o) => s + (o.kwota ?? 0), 0)).toBe(3_136_000);
    expect(wynik.ostrzezenia.map((o) => o.kod)).not.toContain('RODZICIELSKI_PONAD_WYMIAR');
  });

  describe('P6: martwe urodzenie i zgon dziecka, podstawa 5 000 zł (166,67 zł dziennie)', () => {
    const rodzice = [{ ...matka, podstawaWymiaru: 500_000 }, ojciec];

    it('martwe urodzenie: 56 dni po 100% = 9 333,52 zł, mimo wniosku 81,5%', () => {
      const wynik = urlopyIZasilek(
        urodzenie([dziecko({ martweUrodzenie: true })], { rodzice, wniosek815: { zlozony: true, dataZlozenia: '2026-03-05' } }),
        PARAMETRY_2026,
      );

      expect(wynik.wariant).toBe('100_70');
      expect(wynik.okresy).toEqual([
        expect.objectContaining({ rodzaj: 'macierzynski', rodzic: 'matka', dni: 56, stawka: 1000, kwotaDzienna: 16_667, kwota: 933_352 }),
      ]);
      expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('WNIOSEK_815_BEZ_PRZEDMIOTU');
    });

    it('zgon w 54. dniu życia: macierzyński do 2026-04-30, 61 dni = 10 166,87 zł', () => {
      const wynik = urlopyIZasilek(urodzenie([dziecko({ dataZgonu: '2026-04-23' })], { rodzice }), PARAMETRY_2026);

      expect(wynik.okresy).toEqual([expect.objectContaining({ rodzaj: 'macierzynski', do: '2026-04-30', dni: 61, kwota: 1_016_687 })]);
    });
  });

  it('przejęcie macierzyńskiego przez ojca przy wniosku 81,5%: 81,5% jego podstawy jako założenie (OK-6)', () => {
    const wynik = urlopyIZasilek(
      p1({
        dzieci: [dziecko({ dataUrodzenia: '2026-03-15' })],
        zdarzenie: { rodzaj: 'urodzenie', dataPorodu: '2026-03-15', tygodniePrzedPorodem: 2 },
        przejecie: { przez: 'ojciec', przyczyna: 'rezygnacja', data: '2026-06-20' },
      }),
      PARAMETRY_2026,
    );

    expect(okresy(wynik, 'macierzynski', 'ojciec')).toEqual([
      expect.objectContaining({ od: '2026-06-21', do: '2026-07-18', dni: 28, stawka: 815, kwotaDzienna: 24_450, kwota: 684_600 }),
    ]);
    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('ZALOZENIE_815_PRZEJECIE_MACIERZYNSKIEGO');
  });

  it('pobyt matki w szpitalu: zasiłek za macierzyński matka / ojciec / matka', () => {
    const wynik = urlopyIZasilek(
      p1({ przejecie: { przez: 'ojciec', przyczyna: 'pobyt_matki_w_szpitalu', data: '2026-05-10', dataKonca: '2026-05-20' } }),
      PARAMETRY_2026,
    );

    expect(wynik.okresy.filter((o) => o.rodzaj === 'macierzynski').map((o) => [o.rodzic, o.dni])).toEqual([
      ['matka', 70],
      ['ojciec', 11],
      ['matka', 59],
    ]);
  });

  it('ojciec bierze 12 tyg. rodzicielskiego przy 81,5%: 9 tyg. po 70%, przekazane 3 tyg. po 81,5% jako założenie (OK-6)', () => {
    const wynik = urlopyIZasilek(
      p1({
        plan: [
          { rodzaj: 'rodzicielski', rodzic: 'matka', od: '2026-07-19', do: '2027-02-06' },
          { rodzaj: 'rodzicielski', rodzic: 'ojciec', od: '2027-02-07', do: '2027-05-01' },
        ],
      }),
      PARAMETRY_2026,
    );

    expect(okresy(wynik, 'rodzicielski', 'ojciec')).toEqual([
      expect.objectContaining({ od: '2027-02-07', do: '2027-04-10', dni: 63, stawka: 700, kwota: 1_323_000 }),
      expect.objectContaining({ od: '2027-04-11', do: '2027-05-01', dni: 21, stawka: 815, kwotaDzienna: 24_450, kwota: 513_450 }),
    ]);
    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('ZALOZENIE_815_CZESC_PRZEKAZANA');
  });

  it('podwyższenie do kwoty świadczenia rodzicielskiego (1 000 zł): podstawa 1 200 zł, rodzicielski 840 zł/mies.', () => {
    const wynik = urlopyIZasilek(
      urodzenie([dziecko()], {
        rodzice: [{ ...matka, podstawaWymiaru: 120_000 }],
        plan: [{ rodzaj: 'rodzicielski', rodzic: 'matka', od: '2026-08-01', do: '2026-09-15' }],
      }),
      PARAMETRY_2026,
    );

    // Sierpień cały: 1 000 − 840 = 160 zł; wrzesień 15 z 30 dni: 80 zł. Macierzyński 1 200 zł ≥ 1 000 zł: bez podwyższenia.
    expect(okresy(wynik, 'rodzicielski', 'matka')).toEqual([
      expect.objectContaining({ dni: 46, kwotaDzienna: 2_800, kwota: 128_800, podwyzszenie: 24_000 }),
    ]);
    expect(okresy(wynik, 'macierzynski', 'matka')[0]?.podwyzszenie).toBeUndefined();
    // Wyliczone ręcznie (przykładu brak w researchu): macierzyński 140 dni × 40,00 zł = 5 600,00 zł,
    // rodzicielski 46 dni × 28,00 zł = 1 288,00 zł, podwyższenie 160,00 + 80,00 zł = 240,00 zł; razem 7 128,00 zł.
    expect(wynik.suma).toBe(712_800);
    expect(wynik.niepotwierdzoneParametry).toContain('kwotaSwiadczeniaRodzicielskiego');
    expect(wynik.ostrzezenia.map((o) => o.kod)).toContain('ZALOZENIE_PODWYZSZENIE');
  });

  describe('sprawdzenie planu rodzicielskiego i ojcowskiego', () => {
    const tydzien = (n: number, rodzic: 'matka' | 'ojciec' = 'matka') => {
      const od = new Date(Date.UTC(2026, 6, 19 + 7 * n)).toISOString().slice(0, 10);
      const do_ = new Date(Date.UTC(2026, 6, 19 + 7 * n + 6)).toISOString().slice(0, 10);
      return { rodzaj: 'rodzicielski' as const, rodzic, od, do: do_ };
    };
    const kody = (plan: WejscieUrlopow['plan']) => urlopyIZasilek(p1({ plan }), PARAMETRY_2026).ostrzezenia.map((o) => o.kod);

    it('termin wykorzystania rodzicielskiego (koniec roku 6. urodzin, 2032-12-31) i limit 5 części w ostrzeżeniu', () => {
      const o = urlopyIZasilek(p1(), PARAMETRY_2026).ostrzezenia.find((x) => x.kod === 'TERMIN_RODZICIELSKIEGO');

      expect(o?.termin).toBe('2032-12-31');
    });

    it('6 części to za dużo (maks. 5)', () => {
      expect(kody([0, 2, 4, 6, 8, 10].map((n) => tydzien(n)))).toContain('RODZICIELSKI_ZA_DUZO_CZESCI');
    });

    it('matka 33 tygodnie: ponad limit jednego rodzica (32)', () => {
      expect(kody([{ rodzaj: 'rodzicielski', rodzic: 'matka', od: '2026-07-19', do: '2027-03-06' }])).toContain('RODZICIELSKI_PONAD_LIMIT_RODZICA');
    });

    it('okres po końcu roku 6. urodzin', () => {
      expect(kody([{ rodzaj: 'rodzicielski', rodzic: 'matka', od: '2032-12-20', do: '2033-01-05' }])).toContain('RODZICIELSKI_PO_TERMINIE');
    });

    it('łączenie z pracą ponad ½ etatu i przez osobę niebędącą pracownikiem', () => {
      const wynik = urlopyIZasilek(
        urodzenie([dziecko()], {
          rodzice: [{ ...matkaP1, pracownik: false }],
          plan: [{ rodzaj: 'rodzicielski', rodzic: 'matka', od: '2026-07-19', do: '2026-08-15', wymiarPracy: { licznik: 3, mianownik: 4 } }],
        }),
        PARAMETRY_2026,
      );

      expect(wynik.ostrzezenia.map((o) => o.kod)).toEqual(expect.arrayContaining(['LACZENIE_PONAD_LIMIT_ETATU', 'LACZENIE_TYLKO_PRACOWNIK']));
    });

    it('ojcowski w 3 częściach albo w części krótszej niż tydzień jest niezgodny z przepisami', () => {
      const czesc = (od: string, do_: string) => ({ rodzaj: 'ojcowski' as const, rodzic: 'ojciec' as const, od, do: do_ });

      expect(kody([czesc('2026-03-01', '2026-03-05'), czesc('2026-04-01', '2026-04-05'), czesc('2026-05-01', '2026-05-04')])).toContain(
        'OJCOWSKI_NIEZGODNY_Z_PRZEPISAMI',
      );
      expect(kody([czesc('2026-03-01', '2026-03-07'), czesc('2026-04-01', '2026-04-07')])).not.toContain('OJCOWSKI_NIEZGODNY_Z_PRZEPISAMI');
    });
  });
});
