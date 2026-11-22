/**
 * Typy wspólne dla trzech szwów silnika reguł (podstawaWymiaru, urlopyIZasilek, ocenaRyzyk).
 * Słownictwo zgodne z GLOSSARY.md.
 */

import type { KluczParametru } from './parametry';

/** Data kalendarzowa ISO `RRRR-MM-DD`. Arytmetyka zawsze w UTC (patrz wspolne/daty.ts). */
export type ISODate = string;

/** Miesiąc kalendarzowy ISO `RRRR-MM`. */
export type Miesiac = string;

/** Kwota pieniężna w groszach. Zawsze liczba całkowita, nigdy złote w liczbie zmiennoprzecinkowej. */
export type Grosze = number;

/** Stawka procentowa w promilach: 1000 = 100%, 815 = 81,5%, 700 = 70%. */
export type Promile = number;

/** Ułamek w punktach bazowych: 10000 = 100%, 1371 = 13,71%. */
export type PunktyBazowe = number;

/** Odwołanie do przepisu, np. „UZ art. 45 ust. 1”, „KP art. 180 § 1 pkt 1”. */
export type PodstawaPrawna = string;

/**
 * Tytuł ubezpieczenia chorobowego.
 * - umowa_o_prace: obowiązkowe chorobowe, pracownik (KP),
 * - umowa_zlecenia: dobrowolne chorobowe,
 * - dzialalnosc, osoba_wspolpracujaca: dobrowolne chorobowe, dotyczy ich UZ art. 2a.
 */
export type TytulUbezpieczenia = 'umowa_o_prace' | 'umowa_zlecenia' | 'dzialalnosc' | 'osoba_wspolpracujaca';

/** Ułamek zwykły, np. wymiar etatu ½ = { licznik: 1, mianownik: 2 }. */
export interface Ulamek {
  licznik: number;
  mianownik: number;
}

/** Okres kalendarzowy, oba końce włącznie. */
export interface Okres {
  od: ISODate;
  do: ISODate;
}

/** Urlop związany z rodzicielstwem (albo okres mu odpowiadający u osoby niebędącej pracownikiem). */
export type RodzajUrlopu =
  | 'macierzynski'
  | 'naWarunkachMacierzynskiego'
  | 'uzupelniajacyMacierzynski'
  | 'rodzicielski'
  | 'ojcowski';

/** „inny” = inny członek najbliższej rodziny (KP art. 175¹ pkt 3–4). */
export type RolaRodzica = 'matka' | 'ojciec' | 'inny';

/** Jeden krok wyliczenia z uzasadnieniem, gotowy do pokazania w UI. */
export interface Krok {
  opis: string;
  podstawaPrawna: PodstawaPrawna[];
  /** Kwota wynikowa kroku, jeśli krok coś liczy. */
  kwota?: Grosze;
}

/** Ostrzeżenie dla rodzica (brak danych, termin, wynik orientacyjny, założenie do potwierdzenia). */
export interface Ostrzezenie {
  /** Stały identyfikator do testów i UI, np. „BRAK_DANYCH”, „TERMIN_WNIOSKU_815”. */
  kod: string;
  komunikat: string;
  podstawaPrawna: PodstawaPrawna[];
  /** Termin, którego dotyczy ostrzeżenie (np. ostatni dzień na wniosek). */
  termin?: ISODate;
}

/** Część wspólna wyników wszystkich szwów. */
export interface WynikWspolny {
  ostrzezenia: Ostrzezenie[];
  /** Parametry ze statusem „do_potwierdzenia”, które wpłynęły na wynik (user story 42). */
  niepotwierdzoneParametry: KluczParametru[];
}
