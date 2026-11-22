/**
 * Wewnętrzny kontekst oceny ryzyk: wejście, odczyt parametrów, stan ustalony przez wcześniejsze reguły
 * i predykaty wspólne dla grup reguł. Brak własnych testów: sprawdzany przez szew ocenaRyzyk.
 */

import { odczytaj, type KluczParametru, type ParametryPrawne } from '../parametry';
import type { ISODate, Ostrzezenie, TytulUbezpieczenia } from '../typy';
import { porownaj } from '../wspolne/daty';
import type { OkresUbezpieczenia, PrzyczynaUstania, WejscieRyzyk, WynikReguly } from './typy';

export interface KontekstOceny {
  readonly wejscie: WejscieRyzyk;
  /** Odczyt parametru z notowaniem niepotwierdzonych (user story 42). */
  param<K extends KluczParametru>(klucz: K): ParametryPrawne[K]['wartosc'];
  readonly ostrzezenia: Ostrzezenie[];
  /** Okresy ubezpieczenia po skutkach reguł (R-KP-02 przesuwa koniec umowy terminowej na dzień porodu). */
  okresy: OkresUbezpieczenia[];
  /** Ustalone przez R-KP-02: umowa terminowa przedłużona do dnia porodu (KP art. 177 § 3). */
  umowaPrzedluzonaDoPorodu: boolean;
}

/** Grupa reguł: czyta kontekst (może go uzupełnić dla kolejnych grup) i zwraca wyniki w kolejności oceny. */
export type GrupaRegul = (k: KontekstOceny) => WynikReguly[];

export function utworzKontekst(
  wejscie: WejscieRyzyk,
  parametry: ParametryPrawne,
  niepotwierdzone: Set<KluczParametru>,
): KontekstOceny {
  return {
    wejscie,
    param: (klucz) => odczytaj(parametry, klucz, niepotwierdzone),
    ostrzezenia: [],
    okresy: [...wejscie.okresyUbezpieczenia],
    umowaPrzedluzonaDoPorodu: false,
  };
}

/** Okres ubezpieczenia chorobowego obejmujący dzień (oba końce włącznie; brak `do` = trwa). */
export function okresWDniu(okresy: readonly OkresUbezpieczenia[], dzien: ISODate): OkresUbezpieczenia | undefined {
  return okresy.find((o) => porownaj(o.od, dzien) <= 0 && (o.do === undefined || porownaj(dzien, o.do) <= 0));
}

/** Ostatni okres, który skończył się przed danym dniem (najpóźniejszy koniec). */
export function ostatniZakonczonyPrzed(
  okresy: readonly OkresUbezpieczenia[],
  dzien: ISODate,
): (OkresUbezpieczenia & { do: ISODate }) | undefined {
  let wynik: (OkresUbezpieczenia & { do: ISODate }) | undefined;
  for (const o of okresy) {
    if (o.do === undefined || porownaj(o.do, dzien) >= 0) continue;
    if (!wynik || porownaj(o.do, wynik.do) > 0) wynik = { ...o, do: o.do };
  }
  return wynik;
}

/** Przyczyny ustania z UZ art. 30 ust. 1 pkt 1 i ust. 3 (po stronie pracodawcy). */
export const PRZYCZYNY_PO_STRONIE_PRACODAWCY: readonly PrzyczynaUstania[] = [
  'smierc_pracodawcy',
  'upadlosc_pracodawcy',
  'likwidacja_pracodawcy',
];

export const naruszeniePrawa = (p: PrzyczynaUstania | undefined): boolean =>
  p === 'naruszenie_prawa_prawomocny_wyrok' || p === 'naruszenie_prawa_bez_wyroku';

/** Czy ubezpieczenie ustało w okresie ciąży (ostatni dzień ubezpieczenia nie wcześniej niż początek ciąży). `undefined` = brak daty początku ciąży. */
export function ustaloWCiazy(w: WejscieRyzyk, okres: OkresUbezpieczenia & { do: ISODate }): boolean | undefined {
  if (!w.dataPoczatkuCiazy) return undefined;
  return porownaj(okres.do, w.dataPoczatkuCiazy) >= 0;
}

/**
 * Umowa o pracę ustała bez podanej przyczyny, a ustanie mogło przypaść w ciąży: od przyczyny zależy prawo
 * z UZ art. 30 ust. 1 i ust. 3, więc wynik ma być „nieznane”. Zwraca brakujące dane albo `undefined`.
 */
export function brakPrzyczynyUstania(w: WejscieRyzyk, okres: OkresUbezpieczenia & { do: ISODate }): string[] | undefined {
  if (!pracownica(okres.tytul) || okres.przyczynaUstania !== undefined) return undefined;
  const wCiazy = ustaloWCiazy(w, okres);
  if (wCiazy === false) return undefined;
  return wCiazy === undefined ? ['przyczynaUstania', 'dataPoczatkuCiazy'] : ['przyczynaUstania'];
}

export const pracownica = (t: TytulUbezpieczenia): boolean => t === 'umowa_o_prace';
/** Tytuły z dobrowolnym ubezpieczeniem chorobowym (zlecenie, działalność, współpraca). */
export const dobrowolne = (t: TytulUbezpieczenia): boolean => t !== 'umowa_o_prace';
/** Tytuły objęte UZ art. 2a (zadłużenie składkowe). */
export const art2a = (t: TytulUbezpieczenia): boolean => t === 'dzialalnosc' || t === 'osoba_wspolpracujaca';

/**
 * Dzień powstania prawa do zasiłku macierzyńskiego (UZ art. 2a): początek najwcześniejszego okresu zasiłku
 * (np. urlopu ojcowskiego, urlopu przed porodem), a bez okresów – dzień porodu lub przyjęcia dziecka.
 */
export function dzienPowstaniaPrawa(w: WejscieRyzyk): ISODate | undefined {
  const okresy = w.okresyZasilkuMacierzynskiego ?? [];
  if (okresy.length > 0) return okresy.map((o) => o.od).reduce((a, b) => (porownaj(a, b) <= 0 ? a : b));
  return dzienZdarzenia(w)?.dzien;
}

/** Okres ubezpieczenia w danym dniu, a gdy go brak – ostatni zakończony wcześniej. */
export function okresWDniuLubOstatni(okresy: readonly OkresUbezpieczenia[], dzien: ISODate): OkresUbezpieczenia | undefined {
  return okresWDniu(okresy, dzien) ?? ostatniZakonczonyPrzed(okresy, dzien);
}

/** Dzień, w którym rodzi się prawo do zasiłku macierzyńskiego: poród albo przyjęcie dziecka; inaczej prognoza. */
export function dzienZdarzenia(w: WejscieRyzyk): { dzien: ISODate; prognoza: boolean } | undefined {
  const faktyczny = w.dataPorodu ?? w.dataPrzyjeciaDziecka;
  if (faktyczny) return { dzien: faktyczny, prognoza: false };
  if (w.przewidywanaDataPorodu) return { dzien: w.przewidywanaDataPorodu, prognoza: true };
  return undefined;
}
