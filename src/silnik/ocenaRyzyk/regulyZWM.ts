/**
 * R-ZWM-*: zasiłek w wysokości zasiłku macierzyńskiego do dnia porodu (UZ art. 30 ust. 3; tabela D).
 * Tylko śmierć, upadłość i likwidacja pracodawcy. Bezprawne rozwiązanie umowy → „nieznane” (spec #14, OK-1).
 */

import { dodajDni } from '../wspolne/daty';
import { procentTekst } from '../wspolne/kwoty';
import {
  PRZYCZYNY_PO_STRONIE_PRACODAWCY,
  brakPrzyczynyUstania,
  naruszeniePrawa,
  ostatniZakonczonyPrzed,
  pracownica,
  ustaloWCiazy,
  type GrupaRegul,
} from './kontekst';
import type { WynikReguly } from './typy';

const PODSTAWA_ZWM = ['UZ art. 30 ust. 3', 'KP art. 177 § 4'];

export const regulyZWM: GrupaRegul = (k) => {
  const w = k.wejscie;
  const porod = w.dataPorodu ?? w.przewidywanaDataPorodu;
  const ustanie = ostatniZakonczonyPrzed(k.okresy, porod ?? dodajDni(w.dzis, 1));
  if (!ustanie) return [];
  const brakujaceDane = brakPrzyczynyUstania(w, ustanie);
  if (brakujaceDane) {
    return [
      {
        regula: 'R-ZWM-01',
        status: 'nieznane',
        swiadczenie: 'zasilek_w_wysokosci_zasilku_macierzynskiego',
        komunikat:
          'Twoja umowa o pracę ustała w ciąży (albo nie wiemy, czy przed ciążą). Podaj przyczynę ustania – przy śmierci, upadłości lub likwidacji pracodawcy do dnia porodu przysługuje zasiłek w wysokości zasiłku macierzyńskiego.',
        podstawaPrawna: PODSTAWA_ZWM,
        brakujaceDane,
      },
    ];
  }
  if (!ustanie.przyczynaUstania) return [];

  if (naruszeniePrawa(ustanie.przyczynaUstania) && pracownica(ustanie.tytul)) {
    return [
      {
        regula: 'R-ZWM-02',
        status: 'nieznane',
        swiadczenie: 'zasilek_w_wysokosci_zasilku_macierzynskiego',
        komunikat:
          'Umowę rozwiązano z naruszeniem prawa. Zasiłek w wysokości zasiłku macierzyńskiego do dnia porodu ustawa przewiduje tylko przy śmierci, upadłości lub likwidacji pracodawcy, dlatego silnik nie rozstrzyga tej sytuacji. Po porodzie sprawdź prawo do zasiłku macierzyńskiego – wymaga ono prawomocnego wyroku sądu.',
        podstawaPrawna: ['UZ art. 30 ust. 1 pkt 2', 'UZ art. 30 ust. 3'],
        brakujaceDane: ['potwierdzenie ZUS, czy świadczenie przysługuje przy bezprawnym rozwiązaniu umowy'],
      },
    ];
  }

  if (!PRZYCZYNY_PO_STRONIE_PRACODAWCY.includes(ustanie.przyczynaUstania)) return [];

  const wynik = (
    status: WynikReguly['status'],
    komunikat: string,
    dodatki: Partial<WynikReguly> = {},
  ): WynikReguly[] => [
    {
      regula: 'R-ZWM-01',
      status,
      swiadczenie: 'zasilek_w_wysokosci_zasilku_macierzynskiego',
      komunikat,
      podstawaPrawna: PODSTAWA_ZWM,
      ...dodatki,
    },
  ];

  if (!pracownica(ustanie.tytul)) {
    return wynik('nie_przysluguje', 'Zasiłek w wysokości zasiłku macierzyńskiego do dnia porodu przysługuje tylko osobom zatrudnionym na umowę o pracę.');
  }

  const wCiazy = ustaloWCiazy(w, ustanie);
  if (wCiazy === undefined) {
    return wynik('nieznane', 'Nie wiemy, czy umowa ustała w czasie ciąży. Podaj datę początku ciąży z zaświadczenia lekarskiego.', {
      brakujaceDane: ['dataPoczatkuCiazy'],
    });
  }
  if (!wCiazy) return [];

  if (w.zapewnionoInneZatrudnienie === undefined) {
    return wynik('nieznane', 'Podaj, czy pracodawca zapewnił Ci inne zatrudnienie – od tego zależy prawo do zasiłku do dnia porodu.', {
      brakujaceDane: ['zapewnionoInneZatrudnienie'],
    });
  }
  if (w.zapewnionoInneZatrudnienie) {
    return wynik('nie_przysluguje', 'Pracodawca zapewnił Ci inne zatrudnienie, więc zasiłek w wysokości zasiłku macierzyńskiego nie przysługuje – jesteś ubezpieczona z nowego tytułu.');
  }

  const od = dodajDni(ustanie.do, 1);
  const stawka = k.param('stawkaMacierzynski');
  return wynik(
    'przysluguje',
    `Straciłaś pracę w ciąży z powodu śmierci, upadłości lub likwidacji pracodawcy. Do dnia porodu przysługuje Ci zasiłek w wysokości zasiłku macierzyńskiego (${procentTekst(stawka)} podstawy wymiaru), a od porodu zasiłek macierzyński. Złóż świadectwo pracy, zaświadczenie lekarskie o ciąży i oświadczenie, że nie masz innej pracy.`,
    {
      skutek: {
        stawka,
        od,
        ...(w.dataPorodu ? { do: dodajDni(w.dataPorodu, -1) } : {}),
      },
    },
  );
};
