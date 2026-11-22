/**
 * Most między Sytuacją rodziny i Planem rodzica a trzema szwami silnika: buduje wejścia, układa plan urlopu
 * rodzicielskiego i ojcowskiego z decyzji rodziny i składa wyniki. Czysty TS, działa w przeglądarce i w testach.
 */

import {
  ocenaRyzyk,
  podstawaWymiaru,
  urlopyIZasilek,
  type Grosze,
  type ISODate,
  type MiesiacNiepracownika,
  type MiesiacPracownika,
  type OkresPlanowany,
  type OkresUbezpieczenia,
  type OkresZasilku,
  type ParametryPrawne,
  type RodzajUrlopu,
  type TytulUbezpieczenia,
  type WejsciePodstawy,
  type WejscieRyzyk,
  type WejscieUrlopow,
  type WynikPodstawy,
  type WynikRyzyk,
  type WynikUrlopow,
} from '@/silnik';
import { kwotaDzienna } from '@/silnik/wspolne/kwoty';
import { dodajDni, dodajLata, dodajMiesiaceDoMiesiaca, miesiacDaty, pierwszyDzienMiesiaca, porownaj, roznicaDni } from '@/silnik/wspolne/daty';
import { drugaRola, jestPracownikiem, type DrugiRodzic, type PlanRodzica, type Rola, type Sytuacja } from './sytuacja';

export interface Rozpatrzenie {
  podstawa: WynikPodstawy | null;
  podstawaDrugiego: WynikPodstawy | null;
  urlopy: WynikUrlopow;
  ryzyka: WynikRyzyk;
  /** Ocena ryzyk drugiego rodzica (ubezpieczenie, zaległość składkowa); `null` bez ubezpieczonego drugiego rodzica. */
  ryzykaDrugiego: WynikRyzyk | null;
  /** Kto pobiera zasiłek za urlop macierzyński (albo na warunkach macierzyńskiego). */
  wnioskodawca: Rola | null;
  /** Granice suwaka podziału urlopu rodzicielskiego. */
  podzial: { tygodnieLacznie: number; maksDlaJednego: number; nieprzenoszalne: number; tygodnieDrugiego: number } | null;
  /** Zasiłek w wysokości zasiłku macierzyńskiego do dnia porodu (R-ZWM-01), gdy przysługuje. */
  zwm: ZasilekDoPorodu | null;
}

/**
 * Zasiłek w wysokości zasiłku macierzyńskiego (UZ art. 30 ust. 3): 100% podstawy od dnia po ustaniu umowy do dnia
 * przed porodem. Podstawę liczymy na dzień powstania prawa (dzień po ustaniu), nie na dzień porodu.
 */
export interface ZasilekDoPorodu {
  od: ISODate;
  do: ISODate;
  dni: number;
  stawka: number;
  podstawa: WynikPodstawy | null;
  kwotaDzienna: Grosze | null;
  kwota: Grosze | null;
  podstawaPrawna: string[];
}

/** Parametry z panelu z płacą minimalną z roku sprawy przykładowej (jedyny parametr, który różni lata spraw). */
export function parametrySytuacji(s: Sytuacja, parametry: ParametryPrawne): ParametryPrawne {
  const placa = s.sprawaPrzykladowa?.placaMinimalna;
  return placa ? { ...parametry, placaMinimalna: { ...parametry.placaMinimalna, wartosc: placa } } : parametry;
}

/** Dzień, w którym powstaje prawo: dzień porodu albo przyjęcia dziecka. */
export const dataPrawa = (s: Sytuacja): ISODate => s.dataZdarzenia;

export function okresyUbezpieczenia(s: Sytuacja): OkresUbezpieczenia[] {
  if (s.okresyUbezpieczenia?.length) return s.okresyUbezpieczenia;
  return [
    {
      tytul: s.tytul,
      od: s.poczatekUbezpieczenia,
      ...(s.ustanie ? { do: s.ustanie.data, przyczynaUstania: s.ustanie.przyczyna } : {}),
    },
  ];
}

export function ubezpieczonyWDniu(s: Sytuacja, data: ISODate): boolean {
  return okresyUbezpieczenia(s).some((o) => porownaj(o.od, data) <= 0 && (o.do === undefined || porownaj(o.do, data) >= 0));
}

/** 12 miesięcy przed miesiącem zdarzenia z tą samą kwotą, ale tylko pełne miesiące ubezpieczenia. */
function miesiaceZKwoty(dataZdarzenia: ISODate, poczatek: ISODate): string[] {
  const miesiac = miesiacDaty(dataZdarzenia);
  const lista: string[] = [];
  for (let i = 12; i >= 1; i--) {
    const m = dodajMiesiaceDoMiesiaca(miesiac, -i);
    if (porownaj(pierwszyDzienMiesiaca(m), poczatek) >= 0) lista.push(m);
  }
  return lista;
}

interface DanePodstawy {
  tytul: TytulUbezpieczenia;
  dataZdarzenia: ISODate;
  poczatekUbezpieczenia: ISODate;
  pelnyEtat: boolean;
  brutto: Grosze | null;
  miesiacePracownika?: MiesiacPracownika[];
  miesiaceNiepracownika?: MiesiacNiepracownika[];
  zmianaWymiaruCzasuPracy?: boolean;
}

export function wejsciePodstawy(d: DanePodstawy, parametry: ParametryPrawne): WejsciePodstawy | null {
  const baza: WejsciePodstawy = {
    tytul: d.tytul,
    dataZdarzenia: d.dataZdarzenia,
    poczatekUbezpieczenia: d.poczatekUbezpieczenia,
    pelnyEtat: d.pelnyEtat,
    ...(d.zmianaWymiaruCzasuPracy ? { okolicznosciPozaZakresem: { zmianaWymiaruCzasuPracy: true } } : {}),
  };
  if (d.miesiacePracownika?.length) return { ...baza, miesiacePracownika: d.miesiacePracownika };
  if (d.miesiaceNiepracownika?.length) return { ...baza, miesiaceNiepracownika: d.miesiaceNiepracownika };
  if (d.brutto == null) return null;

  const miesiace = miesiaceZKwoty(d.dataZdarzenia, d.poczatekUbezpieczenia);
  if (miesiace.length === 0) return { ...baza, wynagrodzenieZUmowy: d.brutto };
  if (jestPracownikiem(d.tytul)) return { ...baza, miesiacePracownika: miesiace.map((miesiac) => ({ miesiac, brutto: d.brutto! })) };
  const najnizsza = d.tytul === 'dzialalnosc' || d.tytul === 'osoba_wspolpracujaca' ? parametry.najnizszaPodstawaDzialalnosci.wartosc : undefined;
  return {
    ...baza,
    miesiaceNiepracownika: miesiace.map((miesiac) => ({
      miesiac,
      podstawaSkladkiChorobowej: d.brutto!,
      ...(najnizsza !== undefined ? { najnizszaPodstawa: najnizsza } : {}),
    })),
  };
}

export function wejscieRyzyk(s: Sytuacja, dzis: ISODate): WejscieRyzyk {
  const urodzenie = s.zdarzenie === 'urodzenie';
  return {
    dzis,
    ...(urodzenie && s.rola === 'matka' ? { dataPoczatkuCiazy: s.dataPoczatkuCiazy ?? dodajDni(s.dataZdarzenia, -280) } : {}),
    ...(urodzenie && s.etap === 'ciaza' ? { przewidywanaDataPorodu: s.dataZdarzenia } : {}),
    ...(urodzenie && s.etap === 'poZdarzeniu' ? { dataPorodu: s.dataZdarzenia } : {}),
    ...(!urodzenie ? { dataPrzyjeciaDziecka: s.dataZdarzenia } : {}),
    okresyUbezpieczenia: okresyUbezpieczenia(s),
    zwolnienia: s.zwolnienia,
    ...(s.umowaTerminowa ? { umowaTerminowa: s.umowaTerminowa } : {}),
    ...(s.zadluzenie != null ? { zadluzenieSkladkoweNaDzienPrawa: s.zadluzenie } : {}),
    ...(s.dataSplatyZadluzenia ? { dataSplatyZadluzenia: s.dataSplatyZadluzenia } : {}),
    ...(s.zmianaWymiaruCzasuPracy ? { zmianaWymiaruCzasuPracy: true } : {}),
    ...(s.sygnalyRyzyka ? { sygnalyRyzyka: s.sygnalyRyzyka } : {}),
    ...(s.zapewnionoInneZatrudnienie !== undefined ? { zapewnionoInneZatrudnienie: s.zapewnionoInneZatrudnienie } : {}),
  };
}

/** Początek ubezpieczenia drugiego rodzica; bez danych zakładamy co najmniej 3 lata przed zdarzeniem. */
export const poczatekDrugiego = (s: Sytuacja, d: DrugiRodzic): ISODate => d.poczatekUbezpieczenia ?? dodajLata(dataPrawa(s), -3);

/** Wejście oceny ryzyk drugiego rodzica: jego okres ubezpieczenia i zaległość; bez zwolnień i sygnałów (nie pytamy o nie). */
export function wejscieRyzykDrugiego(s: Sytuacja, d: DrugiRodzic, dzis: ISODate): WejscieRyzyk {
  const urodzenie = s.zdarzenie === 'urodzenie';
  const matka = drugaRola(s.rola) === 'matka';
  return {
    dzis,
    ...(urodzenie && matka ? { dataPoczatkuCiazy: s.dataPoczatkuCiazy ?? dodajDni(s.dataZdarzenia, -280) } : {}),
    ...(urodzenie && s.etap === 'ciaza' ? { przewidywanaDataPorodu: s.dataZdarzenia } : {}),
    ...(urodzenie && s.etap === 'poZdarzeniu' ? { dataPorodu: s.dataZdarzenia } : {}),
    ...(!urodzenie ? { dataPrzyjeciaDziecka: s.dataZdarzenia } : {}),
    okresyUbezpieczenia: [{ tytul: d.tytul, od: poczatekDrugiego(s, d) }],
    zwolnienia: [],
    ...(d.zadluzenie != null ? { zadluzenieSkladkoweNaDzienPrawa: d.zadluzenie } : {}),
  };
}

function wniosek815(s: Sytuacja, plan: PlanRodzica, dzis: ISODate): WejscieUrlopow['wniosek815'] {
  if (plan.wariant !== '81_5') return { zlozony: false };
  if (s.wniosek815Data) return { zlozony: true, dataZlozenia: s.wniosek815Data };
  // Wniosek jeszcze niezłożony: zakładamy złożenie dziś (albo w dniu zdarzenia, jeśli to dopiero przed nami).
  return { zlozony: true, dataZlozenia: porownaj(dzis, s.dataZdarzenia) < 0 ? s.dataZdarzenia : dzis };
}

function wejscieUrlopow(s: Sytuacja, plan: PlanRodzica, dzis: ISODate, podstawa: Grosze | null, podstawaDrugiego: Grosze | null): WejscieUrlopow {
  const data = s.dataZdarzenia;
  const ileDzieci = Math.max(1, s.dzieci.length);
  const dzieci = Array.from({ length: ileDzieci }, (_, i) => {
    const d = s.dzieci[i];
    return {
      dataUrodzenia: s.zdarzenie === 'urodzenie' ? data : (d?.dataUrodzenia ?? data),
      ...(s.martweUrodzenie ? { martweUrodzenie: true } : {}),
      ...(s.tygodnieCiazyPrzyPorodzie ? { ukonczoneTygodnieCiazy: s.tygodnieCiazyPrzyPorodzie } : {}),
      ...(s.masaUrodzeniowaG ? { masaUrodzeniowaG: s.masaUrodzeniowaG } : {}),
      ...(s.pobytDzieckaWSzpitalu ? { hospitalizacje: [s.pobytDzieckaWSzpitalu] } : {}),
      ...(s.zaZyciem && i === 0 ? { zaswiadczenieZaZyciem: true } : {}),
    };
  });
  const rodzice: WejscieUrlopow['rodzice'] = [
    {
      rola: s.rola,
      ubezpieczony: ubezpieczonyWDniu(s, data),
      pracownik: jestPracownikiem(s.tytul),
      ...(podstawa != null ? { podstawaWymiaru: podstawa } : {}),
    },
  ];
  if (s.drugiRodzic)
    rodzice.push({
      rola: drugaRola(s.rola),
      ubezpieczony: s.drugiRodzic.ubezpieczony,
      pracownik: jestPracownikiem(s.drugiRodzic.tytul),
      ...(podstawaDrugiego != null ? { podstawaWymiaru: podstawaDrugiego } : {}),
    });
  return {
    zdarzenie: s.zdarzenie === 'urodzenie' ? { rodzaj: 'urodzenie', dataPorodu: data } : { rodzaj: s.zdarzenie, dataPrzyjecia: data },
    dzieci,
    rodzice,
    wniosek815: wniosek815(s, plan, dzis),
    dzis,
  };
}

const GLOWNE: RodzajUrlopu[] = ['macierzynski', 'naWarunkachMacierzynskiego', 'uzupelniajacyMacierzynski'];

/** Okresy rodzicielskiego i ojcowskiego z decyzji rodziny; granice wymiaru bierze z wyniku bez planu. */
function ulozPlan(wejscie: WejscieUrlopow, plan: PlanRodzica, bezPlanu: WynikUrlopow): { okresy: OkresPlanowany[]; podzial: Rozpatrzenie['podzial'] } {
  const okresy: OkresPlanowany[] = [];
  const w = bezPlanu.wymiary.rodzicielski;
  const ubezpieczeni = wejscie.rodzice.filter((r) => r.ubezpieczony);
  const glowne = bezPlanu.okresy.filter((o) => GLOWNE.includes(o.rodzaj));
  const wnioskodawca = glowne[0]?.rodzic ?? ubezpieczeni[0]?.rola;
  let podzial: Rozpatrzenie['podzial'] = null;

  if (w?.przysluguje && wnioskodawca && wnioskodawca !== 'inny') {
    const maks = w.maksDlaJednegoRodzicaTygodnie ?? w.tygodnie;
    const nieprzenoszalne = w.tygodnieNieprzenoszalne ?? 0;
    const drugi = ubezpieczeni.find((r) => r.rola !== wnioskodawca && r.rola !== 'inny');
    const tygDrugiego = drugi ? Math.min(Math.max(plan.tygodnieDrugiegoRodzica ?? nieprzenoszalne, 0), maks) : 0;
    const tygPierwszego = Math.min(w.tygodnie - tygDrugiego, maks);
    podzial = { tygodnieLacznie: w.tygodnie, maksDlaJednego: maks, nieprzenoszalne, tygodnieDrugiego: tygDrugiego };

    let od = dodajDni(glowne.reduce((max, o) => (porownaj(o.do, max) > 0 ? o.do : max), dodajDni(wejscie.zdarzenie.rodzaj === 'urodzenie' ? wejscie.zdarzenie.dataPorodu : wejscie.zdarzenie.dataPrzyjecia, -1)), 1);
    const dodaj = (rodzic: Rola, tygodnie: number) => {
      if (tygodnie <= 0) return;
      const praca = plan.praca?.rodzic === rodzic ? plan.praca : null;
      const tygPracy = praca ? Math.min(praca.tygodniePuli, tygodnie) : 0;
      if (tygodnie - tygPracy > 0) {
        const do_ = dodajDni(od, (tygodnie - tygPracy) * 7 - 1);
        okresy.push({ rodzaj: 'rodzicielski', rodzic, od, do: do_ });
        od = dodajDni(do_, 1);
      }
      if (praca && tygPracy > 0) {
        const dni = Math.floor((tygPracy * 7 * praca.mianownik) / (praca.mianownik - praca.licznik));
        const do_ = dodajDni(od, dni - 1);
        okresy.push({ rodzaj: 'rodzicielski', rodzic, od, do: do_, wymiarPracy: { licznik: praca.licznik, mianownik: praca.mianownik } });
        od = dodajDni(do_, 1);
      }
    };
    dodaj(wnioskodawca, tygPierwszego);
    if (drugi && drugi.rola !== 'inny') dodaj(drugi.rola, tygDrugiego);
  }

  const oj = bezPlanu.wymiary.ojcowski;
  if (oj?.przysluguje && plan.ojcowski && wejscie.rodzice.some((r) => r.rola === 'ojciec' && r.ubezpieczony)) {
    const start = wejscie.zdarzenie.rodzaj === 'urodzenie' ? wejscie.zdarzenie.dataPorodu : wejscie.zdarzenie.dataPrzyjecia;
    const od = dodajDni(start, Math.max(0, plan.ojcowskiPoDniach));
    const dni = Math.min(Math.max(plan.ojcowskiDni ?? oj.dni, 1), oj.dni);
    okresy.push({ rodzaj: 'ojcowski', rodzic: 'ojciec', od, do: dodajDni(od, dni - 1) });
  }
  return { okresy, podzial };
}

/** Suma kwot okresów z dopłatami; `null`, gdy któraś kwota jest nieznana. */
export function sumaOkresow(okresy: OkresZasilku[]): Grosze | null {
  let suma = 0;
  for (const o of okresy) {
    if (o.kwota == null) return null;
    suma += o.kwota + (o.podwyzszenie ?? 0);
  }
  return suma;
}

export function rozpatrz(s: Sytuacja, plan: PlanRodzica, parametryPanelu: ParametryPrawne, dzis: ISODate): Rozpatrzenie {
  const parametry = parametrySytuacji(s, parametryPanelu);
  const wp = wejsciePodstawy(
    {
      tytul: s.tytul,
      dataZdarzenia: dataPrawa(s),
      poczatekUbezpieczenia: s.poczatekUbezpieczenia,
      pelnyEtat: s.pelnyEtat,
      brutto: s.bruttoMiesiecznie,
      ...(s.miesiacePracownika ? { miesiacePracownika: s.miesiacePracownika } : {}),
      ...(s.miesiaceNiepracownika ? { miesiaceNiepracownika: s.miesiaceNiepracownika } : {}),
      ...(s.zmianaWymiaruCzasuPracy ? { zmianaWymiaruCzasuPracy: true } : {}),
    },
    parametry,
  );
  const podstawa = wp ? podstawaWymiaru(wp, parametry) : null;

  const d = s.drugiRodzic;
  const wpd =
    d?.ubezpieczony && d.bruttoMiesiecznie != null
      ? wejsciePodstawy(
          { tytul: d.tytul, dataZdarzenia: dataPrawa(s), poczatekUbezpieczenia: poczatekDrugiego(s, d), pelnyEtat: d.pelnyEtat ?? true, brutto: d.bruttoMiesiecznie },
          parametry,
        )
      : null;
  const podstawaDrugiego = wpd ? podstawaWymiaru(wpd, parametry) : null;

  const wejscie = wejscieUrlopow(s, plan, dzis, podstawa?.podstawa ?? null, podstawaDrugiego?.podstawa ?? null);
  const bezPlanu = urlopyIZasilek(wejscie, parametry);
  const { okresy: planowane, podzial } = ulozPlan(wejscie, plan, bezPlanu);
  let urlopy = urlopyIZasilek({ ...wejscie, plan: planowane }, parametry);

  // Bez planu ojcowskiego silnik liczy jego maksimum; gdy rodzina z niego rezygnuje, usuwamy go z wyniku.
  if (!plan.ojcowski && urlopy.okresy.some((o) => o.rodzaj === 'ojcowski')) {
    const okresy = urlopy.okresy.filter((o) => o.rodzaj !== 'ojcowski');
    urlopy = { ...urlopy, okresy, suma: sumaOkresow(okresy) };
  }

  const glowny = urlopy.okresy.find((o) => GLOWNE.includes(o.rodzaj));
  const wnioskodawca = glowny && glowny.rodzic !== 'inny' ? glowny.rodzic : null;
  const ryzykaDrugiego = d?.ubezpieczony ? ocenaRyzyk(wejscieRyzykDrugiego(s, d, dzis), parametry) : null;
  const ryzyka = ocenaRyzyk(wejscieRyzyk(s, dzis), parametry);
  return { podstawa, podstawaDrugiego, urlopy, ryzyka, ryzykaDrugiego, wnioskodawca, podzial, zwm: zasilekDoPorodu(s, ryzyka, parametry) };
}

function zasilekDoPorodu(s: Sytuacja, ryzyka: WynikRyzyk, parametry: ParametryPrawne): ZasilekDoPorodu | null {
  const w = ryzyka.wyniki.find((x) => x.regula === 'R-ZWM-01' && x.status === 'przysluguje');
  const od = w?.skutek?.od;
  // Przed porodem silnik nie zna końca okresu: liczymy do dnia przed przewidywaną datą porodu.
  const do_ = w?.skutek?.do ?? (s.zdarzenie === 'urodzenie' ? dodajDni(s.dataZdarzenia, -1) : undefined);
  if (!w || !od || !do_) return null;
  const stawka = w.skutek?.stawka ?? 1000;
  const wp = wejsciePodstawy(
    {
      tytul: s.tytul,
      dataZdarzenia: od,
      poczatekUbezpieczenia: s.poczatekUbezpieczenia,
      pelnyEtat: s.pelnyEtat,
      brutto: s.bruttoMiesiecznie,
      ...(s.miesiacePracownika ? { miesiacePracownika: s.miesiacePracownika } : {}),
      ...(s.zmianaWymiaruCzasuPracy ? { zmianaWymiaruCzasuPracy: true } : {}),
    },
    parametry,
  );
  const podstawa = wp ? podstawaWymiaru(wp, parametry) : null;
  const dni = roznicaDni(od, do_) + 1;
  const dzienna = podstawa?.podstawa != null ? kwotaDzienna(podstawa.podstawa, stawka, parametry.dzielnikDzienny.wartosc) : null;
  return { od, do: do_, dni, stawka, podstawa, kwotaDzienna: dzienna, kwota: dzienna != null ? dzienna * dni : null, podstawaPrawna: w.podstawaPrawna };
}
