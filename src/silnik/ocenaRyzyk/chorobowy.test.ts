import { describe, expect, it } from 'vitest';
import { PARAMETRY_2026, ocenaRyzyk, type WejscieRyzyk, type WynikReguly } from '../index';

// Szew ocenaRyzyk, część druga: zasiłek chorobowy w ciąży, po ustaniu tytułu, świadczenie rehabilitacyjne.
// Źródła oczekiwań: docs/research/uprawnienia-w-ciazy-i-ryzyka.md (tabele A–C, reguły R-CH-*, R-PU-*, R-RE-01),
// docs/research/sprawy-testowe.md (T09), komentarz z korektami do #14 (D9), UZ art. 4, 7–9, 12, 13, 17–19, KP art. 92.

const wejscie = (dane: Partial<WejscieRyzyk>): WejscieRyzyk => ({
  dzis: '2026-06-30',
  okresyUbezpieczenia: [],
  zwolnienia: [],
  ...dane,
});

const ocen = (dane: Partial<WejscieRyzyk>) => ocenaRyzyk(wejscie(dane), PARAMETRY_2026);

const regula = (wyniki: WynikReguly[], id: string): WynikReguly => {
  const w = wyniki.find((x) => x.regula === id);
  if (!w) throw new Error(`Brak wyniku reguły ${id}; są: ${wyniki.map((x) => x.regula).join(', ')}`);
  return w;
};

const CHOROBOWE = ['zasilek_chorobowy', 'wynagrodzenie_chorobowe', 'zasilek_chorobowy_po_ustaniu', 'swiadczenie_rehabilitacyjne'];

describe('ocenaRyzyk – zasiłek chorobowy w ciąży', () => {
  it('T09: zwolnienie w ciąży po decyzji ZUS o niepodleganiu od pierwszego dnia umowy → zasiłek chorobowy nie przysługuje', () => {
    // Umowa od dnia −149; ZUS stwierdził niepodleganie od pierwszego dnia (okres pusty: do = od − 1).
    const { wyniki } = ocen({
      dataPoczatkuCiazy: '2025-12-01',
      okresyUbezpieczenia: [
        { tytul: 'umowa_o_prace', od: '2025-10-03', do: '2025-10-02', przyczynaUstania: 'decyzja_zus_o_niepodleganiu' },
      ],
      zwolnienia: [{ od: '2026-03-01', do: '2026-03-29', kodB: true, tytul: 'umowa_o_prace' }],
    });

    const w = regula(wyniki, 'R-CH-01');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.swiadczenie).toBe('zasilek_chorobowy');
    expect(w.komunikat).toMatch(/decyzj/i);
    expect(w.podstawaPrawna).toContain('UZ art. 6 ust. 1');
    expect(wyniki.some((x) => x.status === 'przysluguje' && CHOROBOWE.includes(x.swiadczenie ?? ''))).toBe(false);
  });

  it('okres wyczekiwania 30 dni przy umowie o pracę: za dni przed jego upływem zasiłek nie przysługuje, potem tak', () => {
    // 2026-02-01 … 2026-03-02 to 30 dni ubezpieczenia; prawo od 2026-03-03.
    const { wyniki } = ocen({
      dataPoczatkuCiazy: '2025-12-01',
      okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2026-02-01' }],
      zwolnienia: [{ od: '2026-02-20', do: '2026-03-10', kodB: true, tytul: 'umowa_o_prace' }],
    });

    const w = regula(wyniki, 'R-CH-02');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.skutek).toMatchObject({ od: '2026-02-20', do: '2026-03-02' });
    expect(w.termin).toBe('2026-03-03');
    expect(w.podstawaPrawna).toContain('UZ art. 4 ust. 1 pkt 1');
  });

  it('przerwa w ubezpieczeniu dokładnie 30 dni: wcześniejszy okres wlicza się do okresu wyczekiwania', () => {
    // 20 dni (1–20 stycznia) + przerwa 21.01–19.02 (30 dni) + 20.02–1.03 (10 dni) = 30 dni przed 2 marca.
    const { wyniki } = ocen({
      dataPoczatkuCiazy: '2025-12-01',
      okresyUbezpieczenia: [
        { tytul: 'umowa_o_prace', od: '2026-01-01', do: '2026-01-20', przyczynaUstania: 'koniec_umowy_terminowej' },
        { tytul: 'umowa_o_prace', od: '2026-02-20' },
      ],
      zwolnienia: [{ od: '2026-03-02', do: '2026-03-20', kodB: true, tytul: 'umowa_o_prace' }],
    });

    expect(regula(wyniki, 'R-CH-02').status).toBe('przysluguje');
  });

  it('przerwa w ubezpieczeniu 31 dni: wcześniejszy okres się nie wlicza, okres wyczekiwania liczy się od nowa', () => {
    const { wyniki } = ocen({
      dataPoczatkuCiazy: '2025-12-01',
      okresyUbezpieczenia: [
        { tytul: 'umowa_o_prace', od: '2026-01-01', do: '2026-01-20', przyczynaUstania: 'koniec_umowy_terminowej' },
        { tytul: 'umowa_o_prace', od: '2026-02-21' },
      ],
      zwolnienia: [{ od: '2026-03-02', do: '2026-03-20', kodB: true, tytul: 'umowa_o_prace' }],
    });

    const w = regula(wyniki, 'R-CH-02');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.termin).toBe('2026-03-23');
  });

  it('przy dobrowolnym ubezpieczeniu (zlecenie) okres wyczekiwania wynosi 90 dni', () => {
    // 2026-01-01 … 2026-03-31 to 90 dni; prawo od 2026-04-01.
    const { wyniki } = ocen({
      dataPoczatkuCiazy: '2025-12-01',
      okresyUbezpieczenia: [{ tytul: 'umowa_zlecenia', od: '2026-01-01' }],
      zwolnienia: [{ od: '2026-03-15', do: '2026-04-10', kodB: true, tytul: 'umowa_zlecenia' }],
    });

    const w = regula(wyniki, 'R-CH-02');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.termin).toBe('2026-04-01');
    expect(w.podstawaPrawna).toContain('UZ art. 4 ust. 1 pkt 2');
  });

  it('absolwentka ubezpieczona w ciągu 90 dni od ukończenia szkoły ma zasiłek od pierwszego dnia ubezpieczenia', () => {
    const { wyniki } = ocen({
      dataPoczatkuCiazy: '2025-12-01',
      absolwentkaW90Dni: true,
      okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2026-02-01' }],
      zwolnienia: [{ od: '2026-02-05', do: '2026-02-20', kodB: true, tytul: 'umowa_o_prace' }],
    });

    const w = regula(wyniki, 'R-CH-02');
    expect(w.status).toBe('przysluguje');
    expect(w.podstawaPrawna).toContain('UZ art. 4 ust. 3');
  });

  it('10 lat wcześniejszego obowiązkowego ubezpieczenia znosi okres wyczekiwania tylko przy ubezpieczeniu obowiązkowym', () => {
    const okresy = { okresyUbezpieczenia: [{ tytul: 'umowa_zlecenia' as const, od: '2026-02-01' }] };
    const zwolnienia = [{ od: '2026-02-05', do: '2026-02-20', kodB: true, tytul: 'umowa_zlecenia' as const }];

    expect(regula(ocen({ ...okresy, zwolnienia, staz10LatObowiazkowego: true }).wyniki, 'R-CH-02').status).toBe('nie_przysluguje');
    expect(
      regula(
        ocen({
          okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2026-02-01' }],
          zwolnienia: [{ ...zwolnienia[0]!, tytul: 'umowa_o_prace' }],
          staz10LatObowiazkowego: true,
        }).wyniki,
        'R-CH-02',
      ).status,
    ).toBe('przysluguje');
  });

  const pracownicaOd2025 = { okresyUbezpieczenia: [{ tytul: 'umowa_o_prace' as const, od: '2025-01-01' }] };

  it('kod B na e-ZLA: zasiłek 100% podstawy, okres zasiłkowy do 270 dni', () => {
    const { wyniki } = ocen({
      ...pracownicaOd2025,
      dataPoczatkuCiazy: '2026-01-10',
      zwolnienia: [{ od: '2026-03-02', do: '2026-03-20', kodB: true, tytul: 'umowa_o_prace' }],
    });

    const w = regula(wyniki, 'R-CH-03');
    expect(w.skutek).toMatchObject({ stawka: 1000, maksDni: 270 });
    expect(w.podstawaPrawna).toEqual(expect.arrayContaining(['UZ art. 11 ust. 2 pkt 1', 'UZ art. 8 ust. 1']));
  });

  it('zwolnienie w ciąży bez kodu B: ryzyko – 80% podstawy i do 182 dni, prośba o korektę u lekarza', () => {
    const { wyniki } = ocen({
      ...pracownicaOd2025,
      dataPoczatkuCiazy: '2026-01-10',
      zwolnienia: [{ od: '2026-03-02', do: '2026-03-20', kodB: false, tytul: 'umowa_o_prace' }],
    });

    const w = regula(wyniki, 'R-CH-03');
    expect(w.status).toBe('ryzyko');
    expect(w.skutek).toMatchObject({ stawka: 800, maksDni: 182 });
    expect(w.komunikat).toMatch(/kod(u)? B/);
  });

  it('stawka i okres zasiłkowy pochodzą z parametrów prawnych, a nie ze stałych w regułach', () => {
    const parametry = {
      ...PARAMETRY_2026,
      stawkaChorobowyCiaza: { ...PARAMETRY_2026.stawkaChorobowyCiaza, wartosc: 900 },
      okresZasilkowyCiazaDni: { ...PARAMETRY_2026.okresZasilkowyCiazaDni, wartosc: 300 },
      okresWyczekiwaniaObowiazkowe: { ...PARAMETRY_2026.okresWyczekiwaniaObowiazkowe, wartosc: 31 },
    };
    const { wyniki } = ocenaRyzyk(
      wejscie({
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2026-02-01' }],
        dataPoczatkuCiazy: '2026-01-10',
        zwolnienia: [{ od: '2026-03-03', do: '2026-03-20', kodB: true, tytul: 'umowa_o_prace' }],
      }),
      parametry,
    );

    expect(regula(wyniki, 'R-CH-02').termin).toBe('2026-03-04');
    expect(regula(wyniki, 'R-CH-03').skutek).toMatchObject({ stawka: 900, maksDni: 300 });
  });
});

describe('ocenaRyzyk – wynagrodzenie chorobowe od pracodawcy', () => {
  const pracownica = {
    dataPoczatkuCiazy: '2025-12-01',
    okresyUbezpieczenia: [{ tytul: 'umowa_o_prace' as const, od: '2025-01-01' }],
  };
  const zwolnienieMarzecKwiecien = { od: '2026-03-02', do: '2026-04-30', kodB: true, tytul: 'umowa_o_prace' as const };

  it('pracownica: pierwsze 33 dni zwolnienia w roku płaci pracodawca (w ciąży 100%), od 34. dnia zasiłek z ZUS', () => {
    const { wyniki } = ocen({ ...pracownica, zwolnienia: [zwolnienieMarzecKwiecien] });

    const w = regula(wyniki, 'R-CH-04');
    expect(w.swiadczenie).toBe('wynagrodzenie_chorobowe');
    expect(w.skutek).toMatchObject({ od: '2026-03-02', do: '2026-04-03', stawka: 1000 });
    expect(w.komunikat).toContain('2026-04-04');
    expect(w.podstawaPrawna).toEqual(expect.arrayContaining(['KP art. 92 § 1', 'KP art. 92 § 4']));
  });

  it('pracownica, która ukończyła 50 lat w poprzednim roku lub wcześniej: pracodawca płaci tylko 14 dni', () => {
    const { wyniki } = ocen({ ...pracownica, wiek50Wczesniej: true, zwolnienia: [zwolnienieMarzecKwiecien] });

    expect(regula(wyniki, 'R-CH-04').skutek).toMatchObject({ od: '2026-03-02', do: '2026-03-15' });
  });

  it('dni wynagrodzenia chorobowego wykorzystane wcześniej w roku (np. u poprzedniego pracodawcy) zmniejszają limit', () => {
    const { wyniki } = ocen({ ...pracownica, dniWynagrodzeniaChorobowegoWRoku: 30, zwolnienia: [zwolnienieMarzecKwiecien] });

    expect(regula(wyniki, 'R-CH-04').skutek).toMatchObject({ od: '2026-03-02', do: '2026-03-04' });
  });

  it('kolejne zwolnienia w tym samym roku sumują się do limitu 33 dni', () => {
    const { wyniki } = ocen({
      ...pracownica,
      zwolnienia: [{ od: '2026-01-05', do: '2026-01-24', kodB: true, tytul: 'umowa_o_prace' }, zwolnienieMarzecKwiecien],
    });

    const drugie = wyniki.filter((x) => x.regula === 'R-CH-04')[1];
    expect(drugie?.skutek).toMatchObject({ od: '2026-03-02', do: '2026-03-14' });
  });

  it('limit 33 dni liczy się od nowa w nowym roku kalendarzowym', () => {
    const { wyniki } = ocen({
      ...pracownica,
      dzis: '2026-12-20',
      dniWynagrodzeniaChorobowegoWRoku: 30,
      zwolnienia: [{ od: '2026-12-20', do: '2027-01-31', kodB: true, tytul: 'umowa_o_prace' }],
    });

    const w = regula(wyniki, 'R-CH-04');
    expect(w.skutek).toMatchObject({ od: '2026-12-20', do: '2026-12-22' });
    expect(w.komunikat).toContain('2027-01-01');
  });

  it('zleceniobiorczyni nie dostaje wynagrodzenia chorobowego – zasiłek od pierwszego dnia zwolnienia', () => {
    const { wyniki } = ocen({
      dataPoczatkuCiazy: '2025-12-01',
      okresyUbezpieczenia: [{ tytul: 'umowa_zlecenia', od: '2025-01-01' }],
      zwolnienia: [{ od: '2026-03-02', do: '2026-03-20', kodB: true, tytul: 'umowa_zlecenia' }],
    });

    const w = regula(wyniki, 'R-CH-04');
    expect(w.swiadczenie).toBe('zasilek_chorobowy');
    expect(w.skutek).toMatchObject({ od: '2026-03-02' });
    expect(wyniki.some((x) => x.swiadczenie === 'wynagrodzenie_chorobowe')).toBe(false);
  });
});

describe('ocenaRyzyk – okres zasiłkowy', () => {
  const ciaza = {
    dataPoczatkuCiazy: '2025-12-01',
    okresyUbezpieczenia: [{ tytul: 'umowa_zlecenia' as const, od: '2025-01-01' }],
  };
  const zw = (od: string, do_: string, kodB = true) => ({ od, do: do_, kodB, tytul: 'umowa_zlecenia' as const });
  const ostatni = (wyniki: WynikReguly[], id: string) => wyniki.filter((x) => x.regula === id).at(-1)!;

  it('zwolnienia z przerwą dokładnie 60 dni sumują się do jednego okresu zasiłkowego (270 dni z kodem B)', () => {
    // 90 dni (1.01–31.03) + przerwa 1.04–30.05 (60 dni) + 30 dni (31.05–29.06) → zostaje 150 dni.
    const { wyniki } = ocen({ ...ciaza, zwolnienia: [zw('2026-01-01', '2026-03-31'), zw('2026-05-31', '2026-06-29')] });

    const w = ostatni(wyniki, 'R-CH-05');
    expect(w.status).toBe('informacja');
    expect(w.komunikat).toContain('150');
    expect(w.podstawaPrawna).toContain('UZ art. 9 ust. 2');
  });

  it('przerwa 61 dni: nowy okres zasiłkowy', () => {
    const { wyniki } = ocen({ ...ciaza, zwolnienia: [zw('2026-01-01', '2026-03-31'), zw('2026-06-01', '2026-06-30')] });

    expect(ostatni(wyniki, 'R-CH-05').komunikat).toContain('240');
  });

  it('zwolnienie z kodem B po przerwie od zwolnienia sprzed ciąży: okres zasiłkowy liczy się od nowa', () => {
    // Zwolnienie bez kodu B przed ciążą (31 dni), po 40 dniach przerwy zwolnienie w ciąży z kodem B (30 dni) → zostaje 240.
    const { wyniki } = ocen({
      ...ciaza,
      dataPoczatkuCiazy: '2025-11-20',
      zwolnienia: [zw('2025-10-01', '2025-10-31', false), zw('2025-12-10', '2026-01-08')],
    });

    expect(ostatni(wyniki, 'R-CH-05').komunikat).toContain('240');
  });

  it('po wyczerpaniu 270 dni zasiłek chorobowy nie przysługuje za dalsze dni zwolnienia', () => {
    // 1.01–27.09 to 270 dni; zwolnienie trwa do 30.09.
    const { wyniki } = ocen({ ...ciaza, dataPoczatkuCiazy: '2025-12-20', zwolnienia: [zw('2026-01-01', '2026-09-30')] });

    const w = regula(wyniki, 'R-CH-05');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.skutek).toMatchObject({ od: '2026-09-28', do: '2026-09-30', maksDni: 270 });
  });

  it('zwolnienie w znanej ciąży bez kodu B: okres zasiłkowy 182 dni (jak w R-CH-03), po nim świadczenie rehabilitacyjne', () => {
    // 1.01–1.07 to 182 dni; zwolnienie trwa do 31.07 (212 dni). Limit 270 dni tylko z kodem B (story 14, research R-CH-05).
    const { wyniki } = ocen({
      ...ciaza,
      swiadczeniaWykluczajace: {},
      rokowanieOdzyskaniaZdolnosci: true,
      zwolnienia: [zw('2026-01-01', '2026-07-31', false)],
    });

    expect(regula(wyniki, 'R-CH-03')).toMatchObject({ status: 'ryzyko', skutek: { maksDni: 182 } });
    const w = regula(wyniki, 'R-CH-05');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.skutek).toMatchObject({ od: '2026-07-02', do: '2026-07-31', maksDni: 182 });
    expect(regula(wyniki, 'R-RE-01').skutek).toMatchObject({ od: '2026-07-02', stawka: 900 });
  });
});

describe('ocenaRyzyk – utrata i wyłączenia zasiłku chorobowego', () => {
  const pracownica = {
    dataPoczatkuCiazy: '2025-12-01',
    okresyUbezpieczenia: [{ tytul: 'umowa_o_prace' as const, od: '2025-01-01' }],
  };

  it('zwolnienie w czasie urlopu bezpłatnego: zasiłek nie przysługuje, a dni nie zużywają okresu zasiłkowego', () => {
    const { wyniki } = ocen({
      ...pracownica,
      zwolnienia: [
        { od: '2026-03-02', do: '2026-03-20', kodB: true, tytul: 'umowa_o_prace', wTrakcieUrlopuBezplatnegoLubWychowawczego: true },
      ],
    });

    const w = regula(wyniki, 'R-CH-06');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.skutek).toMatchObject({ od: '2026-03-02', do: '2026-03-20' });
    expect(w.podstawaPrawna).toEqual(expect.arrayContaining(['UZ art. 12 ust. 2', 'UZ art. 12 ust. 3']));
    expect(regula(wyniki, 'R-CH-05').komunikat).toContain('270');
    expect(wyniki.some((x) => x.regula === 'R-CH-04')).toBe(false);
  });

  it('część zwolnienia w czasie urlopu wychowawczego: zasiłek nie przysługuje tylko za te dni', () => {
    const { wyniki } = ocen({
      ...pracownica,
      urlopyBezplatneLubWychowawcze: [{ rodzaj: 'wychowawczy', od: '2026-03-10', do: '2026-06-30' }],
      zwolnienia: [{ od: '2026-03-02', do: '2026-03-20', kodB: true, tytul: 'umowa_o_prace' }],
    });

    expect(regula(wyniki, 'R-CH-06').skutek).toMatchObject({ od: '2026-03-10', do: '2026-03-20' });
  });

  it('praca zarobkowa na zwolnieniu: ryzyko utraty zasiłku za cały okres zwolnienia (polecenie szefa nie usprawiedliwia)', () => {
    const { wyniki } = ocen({
      ...pracownica,
      pracaZarobkowaNaZwolnieniu: true,
      zwolnienia: [
        { od: '2026-03-02', do: '2026-03-20', kodB: true, tytul: 'umowa_o_prace' },
        { od: '2026-04-02', do: '2026-04-20', kodB: true, tytul: 'umowa_o_prace' },
      ],
    });

    const w = wyniki.filter((x) => x.regula === 'R-CH-07');
    expect(w).toHaveLength(1);
    expect(w[0]?.status).toBe('ryzyko');
    expect(w[0]?.podstawaPrawna).toContain('UZ art. 17 ust. 1');
  });

  it('od 1.01.2027 przy kilku tytułach: informacja o zwolnieniu tylko z części tytułów i jeden okres zasiłkowy', () => {
    const dwaTytuly = {
      pracaZarobkowaNaZwolnieniu: false,
      okresyUbezpieczenia: [
        { tytul: 'umowa_o_prace' as const, od: '2025-01-01' },
        { tytul: 'umowa_zlecenia' as const, od: '2025-01-01' },
      ],
    };
    // Zlecenie 30 dni, przerwa 10 dni, umowa o pracę 19 dni.
    const w2027 = ocen({
      ...dwaTytuly,
      dzis: '2027-03-31',
      dataPoczatkuCiazy: '2026-12-01',
      zwolnienia: [
        { od: '2027-01-01', do: '2027-01-30', kodB: true, tytul: 'umowa_zlecenia' },
        { od: '2027-02-10', do: '2027-02-28', kodB: true, tytul: 'umowa_o_prace' },
      ],
    }).wyniki;
    expect(w2027.find((x) => x.regula === 'R-CH-08')?.podstawaPrawna).toContain('UZ art. 17 ust. 1d');
    expect(w2027.some((x) => x.regula === 'R-CH-07')).toBe(false);
    expect(w2027.filter((x) => x.regula === 'R-CH-05').at(-1)?.komunikat).toContain('221');

    const w2026 = ocen({
      ...dwaTytuly,
      dzis: '2026-03-31',
      dataPoczatkuCiazy: '2025-12-01',
      zwolnienia: [
        { od: '2026-01-01', do: '2026-01-30', kodB: true, tytul: 'umowa_zlecenia' },
        { od: '2026-02-10', do: '2026-02-28', kodB: true, tytul: 'umowa_o_prace' },
      ],
    }).wyniki;
    expect(w2026.some((x) => x.regula === 'R-CH-08')).toBe(false);
    expect(w2026.filter((x) => x.regula === 'R-CH-05').at(-1)?.komunikat).toContain('251');
  });

  it('data wejścia w życie jednego okresu zasiłkowego (UZ art. 9 ust. 4) jest niepotwierdzonym parametrem (OK-8)', () => {
    const dane: Partial<WejscieRyzyk> = {
      pracaZarobkowaNaZwolnieniu: false,
      dzis: '2026-03-31',
      dataPoczatkuCiazy: '2025-12-01',
      okresyUbezpieczenia: [
        { tytul: 'umowa_o_prace', od: '2025-01-01' },
        { tytul: 'umowa_zlecenia', od: '2025-01-01' },
      ],
      zwolnienia: [
        { od: '2026-01-01', do: '2026-01-30', kodB: true, tytul: 'umowa_zlecenia' },
        { od: '2026-02-10', do: '2026-02-28', kodB: true, tytul: 'umowa_o_prace' },
      ],
    };
    expect(ocen(dane).niepotwierdzoneParametry).toContain('dataJednegoOkresuZasilkowego');

    // Ta sama sprawa przy dacie przesuniętej na 2026 r.: zwolnienia z obu tytułów w jednym okresie (270 − 30 − 19 = 221).
    const parametry = { ...PARAMETRY_2026, dataJednegoOkresuZasilkowego: { ...PARAMETRY_2026.dataJednegoOkresuZasilkowego, wartosc: '2026-01-01' } };
    const { wyniki } = ocenaRyzyk(wejscie(dane), parametry);
    expect(wyniki.find((x) => x.regula === 'R-CH-08')).toBeDefined();
    expect(wyniki.filter((x) => x.regula === 'R-CH-05').at(-1)?.komunikat).toContain('221');
  });
});

describe('ocenaRyzyk – zasiłek chorobowy po ustaniu tytułu ubezpieczenia', () => {
  const brakWykluczen = { swiadczeniaWykluczajace: {} };
  const umowaDo15Marca = {
    dataPoczatkuCiazy: '2025-12-01',
    okresyUbezpieczenia: [
      { tytul: 'umowa_o_prace' as const, od: '2025-01-01', do: '2026-03-15', przyczynaUstania: 'wypowiedzenie_lub_porozumienie' as const },
    ],
  };
  const zw = (od: string, do_: string, kodB = true) => ({ od, do: do_, kodB, tytul: 'umowa_o_prace' as const });

  it('niezdolność powstała w czasie ubezpieczenia i trwa po jego ustaniu: zasiłek dalej, w ciąży do 270 dni', () => {
    const { wyniki } = ocen({ ...umowaDo15Marca, ...brakWykluczen, zwolnienia: [zw('2026-03-01', '2026-05-31')] });

    const w = regula(wyniki, 'R-PU-01');
    expect(w.status).toBe('przysluguje');
    expect(w.swiadczenie).toBe('zasilek_chorobowy_po_ustaniu');
    expect(w.skutek).toMatchObject({ od: '2026-03-16', maksDni: 270 });
    expect(w.podstawaPrawna).toContain('UZ art. 8 ust. 2');
    expect(regula(wyniki, 'R-PU-03').podstawaPrawna).toContain('UZ art. 46');
  });

  it('niezdolność powstała 14. dnia po ustaniu i trwa 30 dni: zasiłek po ustaniu przysługuje', () => {
    const { wyniki } = ocen({ ...umowaDo15Marca, ...brakWykluczen, zwolnienia: [zw('2026-03-29', '2026-04-27')] });

    const w = regula(wyniki, 'R-PU-01');
    expect(w.status).toBe('przysluguje');
    expect(w.podstawaPrawna).toContain('UZ art. 7 pkt 1');
    expect(wyniki.some((x) => x.regula === 'R-CH-01')).toBe(false);
  });

  it('niezdolność powstała 15. dnia po ustaniu: zasiłek nie przysługuje', () => {
    const { wyniki } = ocen({ ...umowaDo15Marca, ...brakWykluczen, zwolnienia: [zw('2026-03-30', '2026-04-30')] });

    const w = regula(wyniki, 'R-PU-01');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.komunikat).toMatch(/14 dni/);
  });

  it('niezdolność po ustaniu krótsza niż 30 dni: zasiłek nie przysługuje; kolejne zwolnienia bez przerwy sumują się', () => {
    expect(
      regula(ocen({ ...umowaDo15Marca, ...brakWykluczen, zwolnienia: [zw('2026-03-29', '2026-04-26')] }).wyniki, 'R-PU-01').status,
    ).toBe('nie_przysluguje');

    const ciagle = ocen({
      ...umowaDo15Marca,
      ...brakWykluczen,
      zwolnienia: [zw('2026-03-29', '2026-04-10'), zw('2026-04-11', '2026-04-27')],
    });
    expect(regula(ciagle.wyniki, 'R-PU-01').status).toBe('przysluguje');
  });

  it('nowy tytuł ubezpieczenia po ustaniu wyklucza zasiłek za okres po ustaniu', () => {
    const { wyniki } = ocen({
      ...umowaDo15Marca,
      swiadczeniaWykluczajace: { nowyTytulPoUstaniu: true },
      zwolnienia: [zw('2026-03-01', '2026-05-31')],
    });

    const w = regula(wyniki, 'R-PU-02');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.podstawaPrawna).toContain('UZ art. 13 ust. 1 pkt 2');
    expect(wyniki.some((x) => x.regula === 'R-PU-01' && x.status === 'przysluguje')).toBe(false);
  });

  it('brak informacji o świadczeniach wykluczających: wynik „nieznane” z prośbą o dane', () => {
    const { wyniki } = ocen({ ...umowaDo15Marca, zwolnienia: [zw('2026-03-01', '2026-05-31')] });

    const w = regula(wyniki, 'R-PU-02');
    expect(w.status).toBe('nieznane');
    expect(w.brakujaceDane).toContain('swiadczeniaWykluczajace');
  });

  it('prawo do zasiłku nienabyte w czasie ubezpieczenia (okres wyczekiwania nie minął): brak zasiłku po ustaniu', () => {
    const { wyniki } = ocen({
      ...brakWykluczen,
      dataPoczatkuCiazy: '2025-12-01',
      okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2026-02-01', do: '2026-02-20', przyczynaUstania: 'koniec_umowy_terminowej' }],
      zwolnienia: [zw('2026-02-25', '2026-03-31')],
    });

    const w = regula(wyniki, 'R-PU-02');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.komunikat).toMatch(/wyczekiwania/);
    expect(w.podstawaPrawna).toContain('UZ art. 13 ust. 1 pkt 3');
  });

  it('poza ciążą zasiłek za okres po ustaniu tytułu przysługuje najwyżej 91 dni', () => {
    const { wyniki } = ocen({
      ...brakWykluczen,
      okresyUbezpieczenia: umowaDo15Marca.okresyUbezpieczenia,
      zwolnienia: [zw('2026-03-01', '2026-07-31', false)],
    });

    const w = regula(wyniki, 'R-PU-01');
    expect(w.status).toBe('przysluguje');
    expect(w.skutek).toMatchObject({ od: '2026-03-16', do: '2026-06-14', maksDni: 91 });
  });
});

describe('ocenaRyzyk – świadczenie rehabilitacyjne', () => {
  // Zlecenie od 2025 r.; zwolnienie z kodem B 1.01–30.09.2026, okres zasiłkowy 270 dni wyczerpany 27.09.
  const wyczerpany270 = {
    dataPoczatkuCiazy: '2025-12-20',
    okresyUbezpieczenia: [{ tytul: 'umowa_zlecenia' as const, od: '2025-01-01' }],
    zwolnienia: [{ od: '2026-01-01', do: '2026-09-30', kodB: true, tytul: 'umowa_zlecenia' as const }],
    swiadczeniaWykluczajace: {},
  };

  it('po wyczerpaniu 270 dni zasiłku w ciąży, przy rokowaniu odzyskania zdolności: świadczenie rehabilitacyjne 100%, do 12 miesięcy', () => {
    const { wyniki } = ocen({ ...wyczerpany270, rokowanieOdzyskaniaZdolnosci: true });

    const w = regula(wyniki, 'R-RE-01');
    expect(w.status).toBe('przysluguje');
    expect(w.swiadczenie).toBe('swiadczenie_rehabilitacyjne');
    expect(w.skutek).toMatchObject({ od: '2026-09-28', stawka: 1000, maksDni: 360 });
    expect(w.podstawaPrawna).toEqual(expect.arrayContaining(['UZ art. 18 ust. 1', 'UZ art. 19 ust. 1']));
  });

  it('bez orzeczenia lekarza orzecznika o rokowaniu: wynik „nieznane”', () => {
    const { wyniki } = ocen(wyczerpany270);

    const w = regula(wyniki, 'R-RE-01');
    expect(w.status).toBe('nieznane');
    expect(w.brakujaceDane).toContain('rokowanieOdzyskaniaZdolnosci');
    expect(w.komunikat).toMatch(/lekarz orzecznik/);
  });

  it('prawo do renty wyklucza świadczenie rehabilitacyjne', () => {
    const { wyniki } = ocen({ ...wyczerpany270, rokowanieOdzyskaniaZdolnosci: true, swiadczeniaWykluczajace: { emeryturaLubRenta: true } });

    const w = regula(wyniki, 'R-RE-01');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.podstawaPrawna).toContain('UZ art. 18 ust. 7');
  });

  it('poza ciążą świadczenie rehabilitacyjne wynosi 90% przez 3 miesiące, potem 75%', () => {
    // 1.01–1.07 to 182 dni; zwolnienie trwa do 31.07.
    const { wyniki } = ocen({
      okresyUbezpieczenia: wyczerpany270.okresyUbezpieczenia,
      swiadczeniaWykluczajace: {},
      rokowanieOdzyskaniaZdolnosci: true,
      zwolnienia: [{ od: '2026-01-01', do: '2026-07-31', kodB: false, tytul: 'umowa_zlecenia' }],
    });

    const w = regula(wyniki, 'R-RE-01');
    expect(w.skutek).toMatchObject({ od: '2026-07-02', stawka: 900 });
    expect(w.komunikat).toContain('75%');
  });

  it('dopóki okres zasiłkowy nie jest wyczerpany, świadczenie rehabilitacyjne się nie pojawia', () => {
    const { wyniki } = ocen({ ...wyczerpany270, zwolnienia: [{ ...wyczerpany270.zwolnienia[0]!, do: '2026-06-30' }] });

    expect(wyniki.some((x) => x.regula === 'R-RE-01')).toBe(false);
  });
});
