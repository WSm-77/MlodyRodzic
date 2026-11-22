/**
 * Symulacja wypełnienia wniosku ZAM (stan po 24.10.2026) z Sytuacji rodziny i wyniku silnika.
 * Nazwy pól i pułapki tooltipów: docs/research/formularze-acroform.md. Pole „Page1.PESEL” to
 * `topmostSubform[0].Page1[0].PESEL[0]` w pliku public/forms/ZAM_edytowalny.pdf.
 */

import type { ISODate } from '@/silnik';
import type { Rozpatrzenie } from './rozpatrz';
import { drugaRola, type PlanRodzica, type Sytuacja } from './sytuacja';

export type ZrodloPola = 'ZUS' | 'plan' | 'wpisz';

export interface PoleZam {
  nazwa: string;
  etykieta: string;
  sekcja: string;
  wartosc: string | boolean;
  zrodlo: ZrodloPola;
  /** Pola, których ZUS nie zmienia w symulacji (dane z rejestru). */
  tylkoOdczyt?: boolean;
  maks?: number;
}

/** Data w polu grzebieniowym ZAM: ddmmrrrr. */
export const dataZam = (d: ISODate): string => `${d.slice(8, 10)}${d.slice(5, 7)}${d.slice(0, 4)}`;
export const dataPL = (d: ISODate): string => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
const okres = (od: ISODate, do_: ISODate) => `${dataPL(od)} – ${dataPL(do_)}`;

export function polaZam(s: Sytuacja, plan: PlanRodzica, r: Rozpatrzenie, dzis: ISODate): PoleZam[] {
  const pola: PoleZam[] = [];
  const p = (nazwa: string, etykieta: string, sekcja: string, wartosc: string | boolean, zrodlo: ZrodloPola, extra: Partial<PoleZam> = {}) =>
    pola.push({ nazwa, etykieta, sekcja, wartosc, zrodlo, ...extra });
  const zus = s.zrodlo === 'zus' ? 'ZUS' : 'wpisz';
  const ro = s.zrodlo === 'zus';

  const D = 'Dane wnioskodawcy';
  p('Page1.PESEL', 'PESEL', D, s.osoba.pesel, zus, { tylkoOdczyt: ro, maks: 11 });
  p('Page1.Imie', 'Imię', D, s.osoba.imie, zus, { tylkoOdczyt: ro });
  p('Page1.Nazwisko', 'Nazwisko', D, s.osoba.nazwisko, zus, { tylkoOdczyt: ro });
  p('Page1.Ulica', 'Ulica', D, s.osoba.adres.ulica, zus);
  p('Page1.Numerdomu', 'Numer domu', D, s.osoba.adres.nrDomu, zus);
  p('Page1.Numerlokalu', 'Numer lokalu', D, s.osoba.adres.nrLokalu ?? '', zus);
  p('Page1.Kodpocztowy', 'Kod pocztowy', D, s.osoba.adres.kod, zus);
  p('Page1.Poczta', 'Miejscowość', D, s.osoba.adres.poczta, zus);
  p('Page1.Numertelefonu', 'Telefon (dobrowolnie)', D, s.osoba.telefon ?? '', 'wpisz');

  const P = 'Płatnik składek';
  p('Page1.NIP', 'NIP płatnika', P, s.platnik.nip, zus, { tylkoOdczyt: ro, maks: 10 });
  p('Page1.Nazwaplatnika', 'Nazwa płatnika', P, s.platnik.nazwa, zus, { tylkoOdczyt: ro });
  p('Page2.Numerrachunku', 'Numer rachunku (bez niego: przekaz pocztowy)', P, s.osoba.rachunek ?? '', 'wpisz', { maks: 26 });

  const Z = 'Zakres wniosku';
  const moje = r.urlopy.okresy.filter((o) => o.rodzic === s.rola);
  const glowny = moje.find((o) => o.rodzaj === 'macierzynski' || o.rodzaj === 'naWarunkachMacierzynskiego');
  const rodz = moje.filter((o) => o.rodzaj === 'rodzicielski');
  const uzup = moje.find((o) => o.rodzaj === 'uzupelniajacyMacierzynski');
  const oj = moje.find((o) => o.rodzaj === 'ojcowski');
  p('Page2.macierzynskiego', 'Urlop macierzyński', Z, glowny?.rodzaj === 'macierzynski', 'plan');
  p('Page2.nawarunkach', 'Urlop na warunkach urlopu macierzyńskiego', Z, glowny?.rodzaj === 'naWarunkachMacierzynskiego', 'plan');
  p('Page2.Okres', 'Okres (od–do)', Z, glowny ? okres(glowny.od, glowny.do) : '', 'plan');
  p('Page2.rodzicielskiego', 'Urlop rodzicielski', Z, rodz.length > 0, 'plan');
  p('Page2.Okres2', 'Okres urlopu rodzicielskiego', Z, rodz[0] ? okres(rodz[0].od, rodz.at(-1)!.do) : '', 'plan');
  p('Page2.czesc', 'Która część urlopu rodzicielskiego', Z, rodz.length > 0 ? (rodz.length > 1 ? `1–${rodz.length}` : '1') : '', 'plan');
  p('Page2.uzMacierzynskiego', 'Uzupełniający urlop macierzyński', Z, !!uzup, 'plan');
  p('Page2.Okres3', 'Okres uzupełniającego urlopu', Z, uzup ? okres(uzup.od, uzup.do) : '', 'plan');
  p('Page2.ojcowskiego', 'Urlop ojcowski', Z, !!oj, 'plan');
  p('Page2.Okres4', 'Okres urlopu ojcowskiego', Z, oj ? okres(oj.od, oj.do) : '', 'plan');
  p('Page2.Numerlokalu2', 'Która część urlopu ojcowskiego', Z, oj ? '1' : '', 'plan');
  p('Page2.informuje', 'Pełny wymiar urlopu macierzyńskiego i rodzicielskiego (wariant 81,5%)', Z, plan.wariant === '81_5' && !!glowny, 'plan');

  const niepracownik = s.tytul === 'dzialalnosc' || s.tytul === 'osoba_wspolpracujaca';
  p('Page2.TAK', 'Prowadzę działalność i mam ubezpieczenie chorobowe', Z, niepracownik, zus, { tylkoOdczyt: ro });

  const Pr = 'Przyczyna i dziecko';
  const urodzenie = s.zdarzenie === 'urodzenie';
  const zgloszenieWCiazy = urodzenie && s.etap === 'ciaza';
  p('Page2.ZaznaczX1a', 'Urodzenie dziecka', Pr, urodzenie && !zgloszenieWCiazy, 'plan');
  p('Page2.ZaznaczX1b', 'Przyjęcie na wychowanie i wniosek o przysposobienie', Pr, s.zdarzenie === 'przysposobienie', 'plan');
  p('Page2.ZaznaczX1c', 'Rodzina zastępcza (niezawodowa)', Pr, s.zdarzenie === 'rodzinaZastepczaNiezawodowa', 'plan');
  p('Page2.Data', 'Data przyjęcia dziecka (ddmmrrrr)', Pr, urodzenie ? '' : dataZam(s.dataZdarzenia), 'plan', { maks: 8 });
  p('Page3._2', 'Przewidywana data porodu (wniosek przed porodem)', Pr, zgloszenieWCiazy, 'plan');
  p('Page3.Data2a', 'Przewidywana data porodu (ddmmrrrr)', Pr, zgloszenieWCiazy ? dataZam(s.dataZdarzenia) : '', 'plan', { maks: 8 });
  const dzieci = s.dzieci
    .map((d) => {
      const ur = urodzenie ? s.dataZdarzenia : d.dataUrodzenia;
      return [d.imie ? `${d.imie} ${s.osoba.nazwisko}` : '(imię nadane w akcie)', ur ? `ur. ${dataPL(ur)}` : '', d.miejsceUrodzenia ?? ''].filter(Boolean).join(', ');
    })
    .join('; ');
  p('Page3.Tekst1', 'Dane dziecka / dzieci', Pr, zgloszenieWCiazy ? '' : dzieci, 'wpisz');
  p('Page3.ZaznaczX1', 'Dziecko ma zaświadczenie „Za życiem”', Pr, s.zaZyciem && !zgloszenieWCiazy, 'plan');
  p('Page3.podajimie1', 'Imię dziecka z zaświadczeniem „Za życiem”', Pr, s.zaZyciem ? (s.dzieci[0]?.imie ?? '') : '', 'wpisz');
  if (uzup) {
    const t = s.tygodnieCiazyPrzyPorodzie ?? 40;
    p('Page3._4', 'Uzupełniający urlop: pobyt dziecka w szpitalu', Pr, true, 'plan');
    p('Page3.skroceniem', 'Poród przed ukończeniem 28. tygodnia', Pr, t < 28, 'plan');
    p('Page3.przerwaniem4A', 'Masa urodzeniowa do 1000 g', Pr, (s.masaUrodzeniowaG ?? 9999) <= 1000, 'plan');
    p('Page3.przerwaniem4B', '28.–37. tydzień i masa ponad 1000 g', Pr, t >= 28 && t < 37 && (s.masaUrodzeniowaG ?? 9999) > 1000, 'plan');
    p('Page3.podjeciem', 'Po 37. tygodniu, pobyt w szpitalu od 5. do 28. dnia', Pr, t >= 37, 'plan');
    p('Page3.Tekst4a', 'Pobyt dziecka w szpitalu (od–do)', Pr, s.pobytDzieckaWSzpitalu ? okres(s.pobytDzieckaWSzpitalu.od, s.pobytDzieckaWSzpitalu.do) : '', 'wpisz');
    p('Page4.Tekst4c', 'Dane dziecka (uzupełniający urlop)', Pr, dzieci, 'wpisz');
  }

  const R = 'Drugi rodzic i podpis';
  const drugiego = r.urlopy.okresy.filter((o) => o.rodzic === drugaRola(s.rola) && o.rodzaj === 'rodzicielski');
  if (oj) p('Page5.NIE2', 'Nie pobierałem z innego tytułu zasiłku za urlop ojcowski', R, true, 'wpisz');
  p('Page5.TAK', 'Drugi rodzic skorzysta z zasiłku za urlop rodzicielski', R, drugiego.length > 0, 'plan');
  p('Page5.NIE', 'Drugi rodzic nie skorzysta z zasiłku za urlop rodzicielski', R, drugiego.length === 0, 'plan');
  p('Page5.Okres', 'Okres urlopu rodzicielskiego drugiego rodzica', R, drugiego[0] ? okres(drugiego[0].od, drugiego.at(-1)!.do) : '', 'plan');
  p('Page5.PESEL', 'PESEL drugiego rodzica', R, s.drugiRodzic?.pesel ?? '', s.drugiRodzic?.pesel ? zus : 'wpisz', { maks: 11 });
  p('Page5.Imie', 'Imię drugiego rodzica', R, s.drugiRodzic?.imie ?? '', zus);
  p('Page5.Nazwisko', 'Nazwisko drugiego rodzica', R, s.drugiRodzic?.nazwisko ?? '', zus);
  p('Page5.Data', 'Data wypełnienia (ddmmrrrr)', R, dataZam(dzis), 'plan', { maks: 8 });
  return pola;
}
