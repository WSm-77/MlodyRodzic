import { describe, expect, it } from 'vitest';
import { PARAMETRY_2026, ocenaRyzyk, type WejscieRyzyk, type WynikReguly } from '../index';

// Źródła oczekiwań: docs/research/uprawnienia-w-ciazy-i-ryzyka.md (tabela D–H, reguły R-*),
// docs/research/sprawy-testowe.md (T04, T06, T07, T08, T14), komentarz z korektami do #14 (R-MA-06, D7, D8).

const D0 = '2026-03-01'; // dzień porodu w sprawach testowych („dzień 0”)

const wejscie = (dane: Partial<WejscieRyzyk>): WejscieRyzyk => ({
  dzis: D0,
  okresyUbezpieczenia: [],
  zwolnienia: [],
  ...dane,
});

const regula = (wyniki: WynikReguly[], id: string): WynikReguly => {
  const w = wyniki.find((x) => x.regula === id);
  if (!w) throw new Error(`Brak wyniku reguły ${id}; są: ${wyniki.map((x) => x.regula).join(', ')}`);
  return w;
};

describe('ocenaRyzyk – prawo do zasiłku macierzyńskiego', () => {
  it('T08: poród po decyzji ZUS o niepodleganiu ubezpieczeniom → zasiłek macierzyński nie przysługuje', () => {
    // Niepodleganie od dnia −251; ostatni dzień ubezpieczenia: dzień −252.
    const { wyniki } = ocenaRyzyk(
      wejscie({
        dzis: '2026-03-21',
        dataPorodu: D0,
        okresyUbezpieczenia: [
          { tytul: 'umowa_o_prace', od: '2024-01-01', do: '2025-06-22', przyczynaUstania: 'decyzja_zus_o_niepodleganiu' },
        ],
      }),
      PARAMETRY_2026,
    );

    const w = regula(wyniki, 'R-MA-03');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.swiadczenie).toBe('zasilek_macierzynski');
    expect(w.podstawaPrawna).toContain('UZ art. 29 ust. 1');
    expect(wyniki.some((x) => x.status === 'przysluguje' && x.swiadczenie === 'zasilek_macierzynski')).toBe(false);
  });

  it('T07: decyzja ZUS o niepodleganiu od pierwszego dnia umowy → odmowa, a pozorność tylko jako ryzyko', () => {
    // Umowa od dnia −71 na 1/8 etatu; niepodleganie od pierwszego dnia (okres pusty: do = od − 1).
    const { wyniki } = ocenaRyzyk(
      wejscie({
        dzis: '2026-03-08',
        dataPorodu: D0,
        okresyUbezpieczenia: [
          { tytul: 'umowa_o_prace', od: '2025-12-20', do: '2025-12-19', przyczynaUstania: 'decyzja_zus_o_niepodleganiu' },
        ],
        sygnalyRyzyka: { umowaZawartaWCiazy: true, dataZawarciaUmowy: '2025-12-20', ulamkowyEtat: true },
      }),
      PARAMETRY_2026,
    );

    const ma = regula(wyniki, 'R-MA-03');
    expect(ma.status).toBe('nie_przysluguje');
    expect(ma.komunikat).toMatch(/decyzj/i);

    const pozor = regula(wyniki, 'R-PZ-01');
    expect(pozor.status).toBe('ryzyko');
  });

  it('pozorność umowy nigdy nie jest rozstrzygana: sam sygnał przy ważnym ubezpieczeniu daje „ryzyko”, a prawo przysługuje', () => {
    const { wyniki } = ocenaRyzyk(
      wejscie({
        dataPorodu: D0,
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-12-20' }],
        sygnalyRyzyka: { umowaZawartaWCiazy: true, wynagrodzenieZnaczniePowyzejRynkowego: true },
      }),
      PARAMETRY_2026,
    );

    expect(regula(wyniki, 'R-MA-01').status).toBe('przysluguje');
    expect(regula(wyniki, 'R-PZ-01').status).toBe('ryzyko');
    expect(regula(wyniki, 'R-PZ-02').status).toBe('ryzyko');
    expect(wyniki.filter((x) => x.regula.startsWith('R-PZ')).every((x) => x.status === 'ryzyko' || x.status === 'informacja')).toBe(true);
  });

  it('poród w czasie urlopu wychowawczego bez ubezpieczenia chorobowego → zasiłek macierzyński przysługuje', () => {
    const { wyniki } = ocenaRyzyk(
      wejscie({
        dataPorodu: D0,
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2020-01-01', do: '2025-05-31' }],
        urlopyBezplatneLubWychowawcze: [{ rodzaj: 'wychowawczy', od: '2025-06-01', do: '2027-05-31' }],
      }),
      PARAMETRY_2026,
    );
    const w = regula(wyniki, 'R-MA-01');
    expect(w.status).toBe('przysluguje');
    expect(w.podstawaPrawna).toContain('UZ art. 29 ust. 1');
  });

  it('urlop bezpłatny w okresie zasiłku macierzyńskiego → zasiłek nie przysługuje za dni urlopu bezpłatnego (R-MA-05)', () => {
    const { wyniki } = ocenaRyzyk(
      wejscie({
        dataPorodu: D0,
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2020-01-01' }],
        urlopyBezplatneLubWychowawcze: [{ rodzaj: 'bezplatny', od: '2026-02-15', do: '2026-03-10' }],
        okresyZasilkuMacierzynskiego: [{ rodzaj: 'macierzynski', od: D0, do: '2026-07-18' }],
      }),
      PARAMETRY_2026,
    );
    const w = regula(wyniki, 'R-MA-05');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.skutek).toEqual({ od: D0, do: '2026-03-10' });
  });

  it('działalność ubezpieczona krócej niż 12 pełnych miesięcy → informacja o podstawie wg art. 48a (R-PZ-03)', () => {
    // Od 2025-06-15 do porodu 2026-03-01: pełne miesiące lipiec 2025 – luty 2026 = 8.
    const krotko = ocenaRyzyk(
      wejscie({ dataPorodu: D0, okresyUbezpieczenia: [{ tytul: 'dzialalnosc', od: '2025-06-15' }], zadluzenieSkladkoweNaDzienPrawa: 0 }),
      PARAMETRY_2026,
    ).wyniki;
    const w = regula(krotko, 'R-PZ-03');
    expect(w.status).toBe('informacja');
    expect(w.komunikat).toMatch(/\b8 pełnych miesięcy/);
    expect(w.podstawaPrawna).toContain('UZ art. 48a ust. 1');

    const dlugo = ocenaRyzyk(
      wejscie({ dataPorodu: D0, okresyUbezpieczenia: [{ tytul: 'dzialalnosc', od: '2025-03-01' }], zadluzenieSkladkoweNaDzienPrawa: 0 }),
      PARAMETRY_2026,
    ).wyniki;
    expect(dlugo.some((x) => x.regula === 'R-PZ-03')).toBe(false);
  });

  it('zmiana wymiaru czasu pracy → informacja, że podstawa liczy się od nowego wymiaru (R-PZ-04)', () => {
    const { wyniki } = ocenaRyzyk(
      wejscie({ dataPorodu: D0, okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2024-01-01' }], zmianaWymiaruCzasuPracy: true }),
      PARAMETRY_2026,
    );
    const w = regula(wyniki, 'R-PZ-04');
    expect(w.status).toBe('informacja');
    expect(w.podstawaPrawna).toContain('UZ art. 40');
  });

  it('brak daty porodu, przyjęcia dziecka i przewidywanej daty porodu → nieznane z prośbą o uzupełnienie', () => {
    const { wyniki } = ocenaRyzyk(wejscie({ okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2024-01-01' }] }), PARAMETRY_2026);
    const w = regula(wyniki, 'R-MA-01');
    expect(w.status).toBe('nieznane');
    expect(w.brakujaceDane).toEqual(expect.arrayContaining(['dataPorodu', 'przewidywanaDataPorodu']));
  });

  it('wyniki są w kolejności oceny ze specu: umowa terminowa, zadłużenie, zasiłek do porodu, prawo do macierzyńskiego, sygnały pozoru', () => {
    const { wyniki } = ocenaRyzyk(
      wejscie({
        dzis: '2025-11-15',
        dataPoczatkuCiazy: '2025-06-10',
        przewidywanaDataPorodu: D0,
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-01-01', do: '2025-12-31' }],
        umowaTerminowa: { rodzaj: 'czas_okreslony', naZastepstwo: false, planowanyKoniec: '2025-12-31' },
        sygnalyRyzyka: { umowaZawartaWCiazy: true, podwyzkaPodstawyWCiazy: true },
      }),
      PARAMETRY_2026,
    );
    expect(wyniki.map((x) => x.regula)).toEqual(['R-KP-02', 'R-KP-01', 'R-MA-02', 'R-PZ-01', 'R-PZ-02']);
  });

  it('podwyższenie podstawy składek w ciąży daje tylko „ryzyko” (R-PZ-02)', () => {
    const { wyniki } = ocenaRyzyk(
      wejscie({
        dataPorodu: D0,
        okresyUbezpieczenia: [{ tytul: 'dzialalnosc', od: '2024-01-01' }],
        zadluzenieSkladkoweNaDzienPrawa: 0,
        sygnalyRyzyka: { podwyzkaPodstawyWCiazy: true },
      }),
      PARAMETRY_2026,
    );

    expect(regula(wyniki, 'R-PZ-02').status).toBe('ryzyko');
    expect(wyniki.some((x) => x.regula === 'R-PZ-01')).toBe(false);
  });
});

describe('ocenaRyzyk – umowa terminowa i ochrona z Kodeksu pracy (R-KP-*)', () => {
  // Ciąża od 2025-06-10: trzeci miesiąc ciąży upływa 2025-09-09.
  const terminowa = (dane: Partial<WejscieRyzyk> = {}): WejscieRyzyk =>
    wejscie({
      dzis: '2025-11-15',
      dataPoczatkuCiazy: '2025-06-10',
      dataPorodu: D0,
      okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-01-01', do: '2025-12-31', przyczynaUstania: 'koniec_umowy_terminowej' }],
      umowaTerminowa: { rodzaj: 'czas_okreslony', naZastepstwo: false, planowanyKoniec: '2025-12-31' },
      ...dane,
    });

  it('umowa na czas określony kończąca się po 3. miesiącu ciąży przedłuża się do dnia porodu → zasiłek macierzyński z art. 30 ust. 4', () => {
    const { wyniki } = ocenaRyzyk(terminowa(), PARAMETRY_2026);

    const kp = regula(wyniki, 'R-KP-02');
    expect(kp.status).toBe('przysluguje');
    expect(kp.skutek?.do).toBe(D0);
    expect(kp.podstawaPrawna).toContain('KP art. 177 § 3');

    const ma = regula(wyniki, 'R-MA-02');
    expect(ma.status).toBe('przysluguje');
    expect(ma.podstawaPrawna).toContain('UZ art. 30 ust. 4');
    expect(wyniki.some((x) => x.regula === 'R-MA-03')).toBe(false);
  });

  it('umowa kończąca się w ostatnim dniu 3. miesiąca ciąży nie przedłuża się → ryzyko i brak zasiłku macierzyńskiego', () => {
    const umowa = { rodzaj: 'czas_okreslony', naZastepstwo: false, planowanyKoniec: '2025-09-09' } as const;
    const { wyniki } = ocenaRyzyk(
      terminowa({
        umowaTerminowa: umowa,
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-01-01', do: '2025-09-09', przyczynaUstania: 'koniec_umowy_terminowej' }],
      }),
      PARAMETRY_2026,
    );
    expect(regula(wyniki, 'R-KP-02').status).toBe('ryzyko');
    expect(regula(wyniki, 'R-MA-03').status).toBe('nie_przysluguje');
  });

  it('umowa skończona przed początkiem ciąży: komunikat mówi o końcu przed ciążą, nie o 3. miesiącu', () => {
    const { wyniki } = ocenaRyzyk(
      terminowa({
        umowaTerminowa: { rodzaj: 'czas_okreslony', naZastepstwo: false, planowanyKoniec: '2025-05-31' },
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-01-01', do: '2025-05-31', przyczynaUstania: 'koniec_umowy_terminowej' }],
      }),
      PARAMETRY_2026,
    );
    const w = regula(wyniki, 'R-KP-02');
    expect(w.status).toBe('ryzyko');
    expect(w.komunikat).toContain('przed początkiem ciąży');
    expect(w.komunikat).not.toMatch(/miesiąca ciąży/);
  });

  it('umowa kończąca się dzień po upływie 3. miesiąca ciąży przedłuża się do porodu', () => {
    const { wyniki } = ocenaRyzyk(
      terminowa({
        umowaTerminowa: { rodzaj: 'czas_okreslony', naZastepstwo: false, planowanyKoniec: '2025-09-10' },
        okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2025-01-01', do: '2025-09-10', przyczynaUstania: 'koniec_umowy_terminowej' }],
      }),
      PARAMETRY_2026,
    );
    expect(regula(wyniki, 'R-KP-02').status).toBe('przysluguje');
    expect(regula(wyniki, 'R-MA-02').status).toBe('przysluguje');
  });

  it('umowa na zastępstwo nie przedłuża się do porodu', () => {
    const { wyniki } = ocenaRyzyk(
      terminowa({ umowaTerminowa: { rodzaj: 'czas_okreslony', naZastepstwo: true, planowanyKoniec: '2025-12-31' } }),
      PARAMETRY_2026,
    );
    expect(regula(wyniki, 'R-KP-02').status).toBe('ryzyko');
    expect(regula(wyniki, 'R-MA-03').status).toBe('nie_przysluguje');
  });

  it('okres próbny do 1 miesiąca nie przedłuża się, a dłuższy – tak', () => {
    const probny = (dlugoscMiesiecy: number) =>
      ocenaRyzyk(
        terminowa({ umowaTerminowa: { rodzaj: 'okres_probny', dlugoscMiesiecy, naZastepstwo: false, planowanyKoniec: '2025-12-31' } }),
        PARAMETRY_2026,
      ).wyniki;
    expect(regula(probny(1), 'R-KP-02').status).toBe('ryzyko');
    expect(regula(probny(3), 'R-KP-02').status).toBe('przysluguje');
  });

  it('brak daty początku ciąży → nieznane', () => {
    const { wyniki } = ocenaRyzyk(terminowa({ dataPoczatkuCiazy: undefined }), PARAMETRY_2026);
    const w = regula(wyniki, 'R-KP-02');
    expect(w.status).toBe('nieznane');
    expect(w.brakujaceDane).toContain('dataPoczatkuCiazy');
  });

  it('pracownica w ciąży dostaje informację o ochronie przed zwolnieniem, zleceniobiorczyni – o jej braku', () => {
    const ciaza = (tytul: 'umowa_o_prace' | 'umowa_zlecenia') =>
      ocenaRyzyk(
        wejscie({
          dzis: '2025-11-15',
          dataPoczatkuCiazy: '2025-06-10',
          przewidywanaDataPorodu: D0,
          okresyUbezpieczenia: [{ tytul, od: '2025-01-01' }],
        }),
        PARAMETRY_2026,
      ).wyniki;
    const pracownica = regula(ciaza('umowa_o_prace'), 'R-KP-01');
    expect(pracownica.status).toBe('informacja');
    expect(pracownica.podstawaPrawna).toContain('KP art. 177 § 1');
    const zlecenie = regula(ciaza('umowa_zlecenia'), 'R-KP-01');
    expect(zlecenie.status).toBe('informacja');
    expect(zlecenie.komunikat).toMatch(/tylko umowy o pracę/);
  });

  it('w ciąży: zlecenie kończy się przed przewidywaną datą porodu → ryzyko braku zasiłku macierzyńskiego', () => {
    const { wyniki } = ocenaRyzyk(
      wejscie({
        dzis: '2025-11-15',
        dataPoczatkuCiazy: '2025-06-10',
        przewidywanaDataPorodu: D0,
        okresyUbezpieczenia: [{ tytul: 'umowa_zlecenia', od: '2025-01-01', do: '2026-01-31' }],
      }),
      PARAMETRY_2026,
    );
    const w = regula(wyniki, 'R-MA-03');
    expect(w.status).toBe('ryzyko');
  });
});

describe('ocenaRyzyk – kolejny okres zasiłku po wyrejestrowaniu z dobrowolnego chorobowego (R-MA-04, R-MA-06)', () => {
  // T06: działalność; macierzyński za dzień 0–139; od dnia 140 brak zgłoszenia do chorobowego;
  // wniosek o rodzicielski za dzień 153–376 (po przerwie 13 dni) → odmowa.
  const T06 = (dane: Partial<WejscieRyzyk> = {}): WejscieRyzyk =>
    wejscie({
      dzis: '2026-08-05',
      dataPorodu: D0,
      okresyUbezpieczenia: [{ tytul: 'dzialalnosc', od: '2024-01-01', do: D0, przyczynaUstania: 'wyrejestrowanie_dobrowolnego' }],
      zadluzenieSkladkoweNaDzienPrawa: 0,
      okresyZasilkuMacierzynskiego: [
        { rodzaj: 'macierzynski', od: D0, do: '2026-07-18' },
        { rodzaj: 'rodzicielski', od: '2026-08-01', do: '2027-03-12' },
      ],
      ...dane,
    });

  it('T06: rodzicielski po 13 dniach przerwy bez ubezpieczenia chorobowego → nie przysługuje za dzień 153–376', () => {
    const { wyniki } = ocenaRyzyk(T06(), PARAMETRY_2026);

    expect(regula(wyniki, 'R-MA-01').status).toBe('przysluguje');
    const w = regula(wyniki, 'R-MA-06');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.swiadczenie).toBe('zasilek_macierzynski');
    expect(w.skutek).toEqual({ od: '2026-08-01', do: '2027-03-12' });
    expect(w.podstawaPrawna).toContain('UZ art. 29 ust. 1');
  });

  it('ubezpieczona dobrowolnie dostaje informację o wyrejestrowaniu z chorobowego na czas zasiłku (R-MA-04)', () => {
    const { wyniki } = ocenaRyzyk(T06(), PARAMETRY_2026);
    expect(regula(wyniki, 'R-MA-04').status).toBe('informacja');
  });

  it('pracownica nie dostaje informacji o wyrejestrowaniu z dobrowolnego chorobowego', () => {
    const { wyniki } = ocenaRyzyk(
      T06({ okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2024-01-01' }] }),
      PARAMETRY_2026,
    );
    expect(wyniki.some((x) => x.regula === 'R-MA-04' || x.regula === 'R-MA-06')).toBe(false);
  });

  it('rodzicielski bezpośrednio po macierzyńskim (bez przerwy) → przysługuje mimo wyrejestrowania', () => {
    const { wyniki } = ocenaRyzyk(
      T06({
        okresyZasilkuMacierzynskiego: [
          { rodzaj: 'macierzynski', od: D0, do: '2026-07-18' },
          { rodzaj: 'rodzicielski', od: '2026-07-19', do: '2027-02-27' },
        ],
      }),
      PARAMETRY_2026,
    );
    expect(wyniki.some((x) => x.regula === 'R-MA-06' && x.status === 'nie_przysluguje')).toBe(false);
  });

  it('przerwa, ale ponowne zgłoszenie do chorobowego przed rodzicielskim → rodzicielski przysługuje', () => {
    const { wyniki } = ocenaRyzyk(
      T06({
        okresyUbezpieczenia: [
          { tytul: 'dzialalnosc', od: '2024-01-01', do: D0, przyczynaUstania: 'wyrejestrowanie_dobrowolnego' },
          { tytul: 'dzialalnosc', od: '2026-07-25' },
        ],
      }),
      PARAMETRY_2026,
    );
    expect(wyniki.some((x) => x.regula === 'R-MA-06' && x.status === 'nie_przysluguje')).toBe(false);
  });
});

describe('ocenaRyzyk – zasiłek w wysokości zasiłku macierzyńskiego (do dnia porodu)', () => {
  // T14: dzień 0 = dzień po rozwiązaniu umowy (2026-01-01); poród w dniu 175 → zasiłek za dzień 0–174.
  const T14 = (dane: Partial<WejscieRyzyk> = {}): WejscieRyzyk =>
    wejscie({
      dzis: '2026-01-10',
      dataPoczatkuCiazy: '2025-10-01',
      dataPorodu: '2026-06-25',
      okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2024-06-01', do: '2025-12-31', przyczynaUstania: 'upadlosc_pracodawcy' }],
      zapewnionoInneZatrudnienie: false,
      ...dane,
    });

  it('T14: rozwiązanie umowy w ciąży z powodu upadłości → 100% za 175 dni do dnia porodu, potem zasiłek macierzyński', () => {
    const { wyniki } = ocenaRyzyk(T14(), PARAMETRY_2026);

    const zwm = regula(wyniki, 'R-ZWM-01');
    expect(zwm.status).toBe('przysluguje');
    expect(zwm.swiadczenie).toBe('zasilek_w_wysokosci_zasilku_macierzynskiego');
    expect(zwm.skutek).toEqual({ stawka: 1000, od: '2026-01-01', do: '2026-06-24' });
    expect(zwm.podstawaPrawna).toContain('UZ art. 30 ust. 3');

    const ma = regula(wyniki, 'R-MA-02');
    expect(ma.status).toBe('przysluguje');
    expect(ma.podstawaPrawna).toContain('UZ art. 30 ust. 1 pkt 1');
  });

  it('likwidacja i śmierć pracodawcy też dają zasiłek do dnia porodu', () => {
    for (const przyczynaUstania of ['likwidacja_pracodawcy', 'smierc_pracodawcy'] as const) {
      const { wyniki } = ocenaRyzyk(
        T14({ okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2024-06-01', do: '2025-12-31', przyczynaUstania }] }),
        PARAMETRY_2026,
      );
      expect(regula(wyniki, 'R-ZWM-01').status).toBe('przysluguje');
    }
  });

  it('pracodawca zapewnił inne zatrudnienie → zasiłek do dnia porodu nie przysługuje', () => {
    const { wyniki } = ocenaRyzyk(T14({ zapewnionoInneZatrudnienie: true }), PARAMETRY_2026);
    expect(regula(wyniki, 'R-ZWM-01').status).toBe('nie_przysluguje');
  });

  it('brak informacji o innym zatrudnieniu → nieznane z prośbą o uzupełnienie', () => {
    const { wyniki } = ocenaRyzyk(T14({ zapewnionoInneZatrudnienie: undefined }), PARAMETRY_2026);
    const w = regula(wyniki, 'R-ZWM-01');
    expect(w.status).toBe('nieznane');
    expect(w.brakujaceDane?.length).toBeGreaterThan(0);
  });

  it('umowa o pracę ustała w ciąży bez podanej przyczyny → nieznane z prośbą o przyczynę, nie odmowa', () => {
    const { wyniki } = ocenaRyzyk(
      T14({ okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2024-06-01', do: '2025-12-31' }] }),
      PARAMETRY_2026,
    );

    const ma = regula(wyniki, 'R-MA-02');
    expect(ma.status).toBe('nieznane');
    expect(ma.brakujaceDane).toContain('przyczynaUstania');
    expect(wyniki.some((x) => x.regula === 'R-MA-03')).toBe(false);
    const zwm = regula(wyniki, 'R-ZWM-01');
    expect(zwm.status).toBe('nieznane');
    expect(zwm.brakujaceDane).toContain('przyczynaUstania');
  });

  it('rozwiązanie umowy przed ciążą → ani zasiłek do porodu, ani macierzyński po ustaniu', () => {
    const { wyniki } = ocenaRyzyk(T14({ dataPoczatkuCiazy: '2026-01-05' }), PARAMETRY_2026);
    expect(wyniki.some((x) => x.regula === 'R-ZWM-01')).toBe(false);
    expect(regula(wyniki, 'R-MA-03').status).toBe('nie_przysluguje');
  });

  it('bezprawne rozwiązanie bez prawomocnego wyroku → nieznane (silnik nie rozstrzyga)', () => {
    const { wyniki } = ocenaRyzyk(
      T14({
        okresyUbezpieczenia: [
          { tytul: 'umowa_o_prace', od: '2024-06-01', do: '2025-12-31', przyczynaUstania: 'naruszenie_prawa_bez_wyroku' },
        ],
      }),
      PARAMETRY_2026,
    );
    expect(regula(wyniki, 'R-ZWM-02').status).toBe('nieznane');
    expect(regula(wyniki, 'R-MA-02').status).toBe('nieznane');
    expect(wyniki.some((x) => x.regula === 'R-ZWM-01')).toBe(false);
  });

  it('bezprawne rozwiązanie z prawomocnym wyrokiem → zasiłek macierzyński po porodzie, zasiłek do porodu nieznany', () => {
    const { wyniki } = ocenaRyzyk(
      T14({
        okresyUbezpieczenia: [
          { tytul: 'umowa_o_prace', od: '2024-06-01', do: '2025-12-31', przyczynaUstania: 'naruszenie_prawa_prawomocny_wyrok' },
        ],
      }),
      PARAMETRY_2026,
    );
    expect(regula(wyniki, 'R-ZWM-02').status).toBe('nieznane');
    const ma = regula(wyniki, 'R-MA-02');
    expect(ma.status).toBe('przysluguje');
    expect(ma.podstawaPrawna).toContain('UZ art. 30 ust. 1 pkt 2');
  });

  it('upadłość przy zleceniu (nie pracownica) → zasiłek do porodu nie przysługuje', () => {
    const { wyniki } = ocenaRyzyk(
      T14({ okresyUbezpieczenia: [{ tytul: 'umowa_zlecenia', od: '2024-06-01', do: '2025-12-31', przyczynaUstania: 'upadlosc_pracodawcy' }] }),
      PARAMETRY_2026,
    );
    expect(regula(wyniki, 'R-ZWM-01').status).toBe('nie_przysluguje');
    expect(regula(wyniki, 'R-MA-03').status).toBe('nie_przysluguje');
  });
});

describe('ocenaRyzyk – zadłużenie składkowe (UZ art. 2a)', () => {
  // T04: ojciec prowadzący działalność, zasiłek za urlop ojcowski 14 dni; płaca minimalna 2025 = 4666 zł → próg 46,66 zł.
  const PARAMETRY_2025 = { ...PARAMETRY_2026, placaMinimalna: { ...PARAMETRY_2026.placaMinimalna, wartosc: 466_600 } };
  const T04 = (dane: Partial<WejscieRyzyk> = {}): WejscieRyzyk =>
    wejscie({
      dzis: '2025-09-20',
      dataPorodu: '2025-08-20',
      okresyUbezpieczenia: [{ tytul: 'dzialalnosc', od: '2024-11-01' }],
      okresyZasilkuMacierzynskiego: [{ rodzaj: 'ojcowski', od: '2025-09-01', do: '2025-09-14' }],
      zadluzenieSkladkoweNaDzienPrawa: 10_000,
      ...dane,
    });

  it('T04: działalność z długiem powyżej 1% płacy minimalnej w dniu powstania prawa → odmowa do czasu spłaty, termin 6 miesięcy', () => {
    const { wyniki } = ocenaRyzyk(T04(), PARAMETRY_2025);
    const w = regula(wyniki, 'R-DL-01');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.termin).toBe('2026-03-01');
    expect(w.podstawaPrawna).toContain('UZ art. 2a ust. 1');
  });

  it('T04 wariant: dług dokładnie 1% płacy minimalnej (46,66 zł) nie blokuje zasiłku', () => {
    const { wyniki } = ocenaRyzyk(T04({ zadluzenieSkladkoweNaDzienPrawa: 4_666 }), PARAMETRY_2025);
    expect(regula(wyniki, 'R-DL-01').status).toBe('informacja');
    expect(wyniki.some((x) => x.status === 'nie_przysluguje')).toBe(false);
  });

  it('dług o 1 grosz powyżej progu blokuje zasiłek', () => {
    const { wyniki } = ocenaRyzyk(T04({ zadluzenieSkladkoweNaDzienPrawa: 4_667 }), PARAMETRY_2025);
    expect(regula(wyniki, 'R-DL-01').status).toBe('nie_przysluguje');
  });

  it('T04 wariant: dług spłacony w ciągu 6 miesięcy → wypłata odblokowana od dnia spłaty', () => {
    const { wyniki } = ocenaRyzyk(T04({ dzis: '2026-03-10', dataSplatyZadluzenia: '2026-03-01' }), PARAMETRY_2025);
    const w = regula(wyniki, 'R-DL-01');
    expect(w.status).toBe('przysluguje');
    expect(w.skutek?.od).toBe('2026-03-01');
  });

  it('dług niespłacony przez 6 miesięcy → prawo przedawnione', () => {
    const { wyniki } = ocenaRyzyk(T04({ dzis: '2026-03-02' }), PARAMETRY_2025);
    const w = regula(wyniki, 'R-DL-01');
    expect(w.status).toBe('nie_przysluguje');
    expect(w.termin).toBeUndefined();
    expect(w.komunikat).toMatch(/przedawni/);
  });

  it('spłata po upływie 6 miesięcy nie przywraca prawa', () => {
    const { wyniki } = ocenaRyzyk(T04({ dzis: '2026-04-01', dataSplatyZadluzenia: '2026-03-02' }), PARAMETRY_2025);
    expect(regula(wyniki, 'R-DL-01').status).toBe('nie_przysluguje');
  });

  it('brak danych o zadłużeniu przy działalności → nieznane z prośbą o zaświadczenie o niezaleganiu', () => {
    const { wyniki } = ocenaRyzyk(T04({ zadluzenieSkladkoweNaDzienPrawa: undefined }), PARAMETRY_2025);
    const w = regula(wyniki, 'R-DL-01');
    expect(w.status).toBe('nieznane');
    expect(w.brakujaceDane).toContain('zadluzenieSkladkoweNaDzienPrawa');
  });

  it('art. 2a nie dotyczy pracownicy ani zleceniobiorczyni', () => {
    for (const tytul of ['umowa_o_prace', 'umowa_zlecenia'] as const) {
      const { wyniki } = ocenaRyzyk(T04({ okresyUbezpieczenia: [{ tytul, od: '2024-11-01' }] }), PARAMETRY_2025);
      expect(wyniki.some((x) => x.regula === 'R-DL-01')).toBe(false);
    }
  });

  it('próg zależy od płacy minimalnej z zestawu parametrów, nie od stałej w kodzie', () => {
    // 47,00 zł długu: powyżej 1% płacy 2025 (46,66 zł), ale nie powyżej 1% płacy 2026 (48,06 zł).
    const dane = T04({ zadluzenieSkladkoweNaDzienPrawa: 4_700 });
    expect(regula(ocenaRyzyk(dane, PARAMETRY_2025).wyniki, 'R-DL-01').status).toBe('nie_przysluguje');
    const wynik2026 = ocenaRyzyk(dane, PARAMETRY_2026);
    expect(regula(wynik2026.wyniki, 'R-DL-01').status).toBe('informacja');
    expect(wynik2026.niepotwierdzoneParametry).toContain('placaMinimalna');
  });

  it('osoba współpracująca podlega art. 2a, a dniem powstania prawa do macierzyńskiego jest dzień porodu', () => {
    const { wyniki } = ocenaRyzyk(
      wejscie({
        dataPorodu: D0,
        okresyUbezpieczenia: [{ tytul: 'osoba_wspolpracujaca', od: '2024-01-01' }],
        zadluzenieSkladkoweNaDzienPrawa: 50_000,
      }),
      PARAMETRY_2026,
    );
    expect(regula(wyniki, 'R-DL-01').termin).toBe('2026-09-01');
  });

  it('spóźniona składka chorobowa przy działalności → ryzyko przerwy w ubezpieczeniu (R-DL-02)', () => {
    const { wyniki } = ocenaRyzyk(
      wejscie({
        dataPorodu: D0,
        okresyUbezpieczenia: [
          { tytul: 'dzialalnosc', od: '2024-01-01', do: '2025-05-31', przyczynaUstania: 'nieoplacenie_skladki' },
          { tytul: 'dzialalnosc', od: '2025-07-01' },
        ],
        zadluzenieSkladkoweNaDzienPrawa: 0,
      }),
      PARAMETRY_2026,
    );
    expect(regula(wyniki, 'R-DL-02').status).toBe('ryzyko');
    expect(regula(wyniki, 'R-MA-01').status).toBe('przysluguje');
  });
});
