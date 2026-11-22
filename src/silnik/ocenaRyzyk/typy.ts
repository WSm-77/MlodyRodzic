/** Typy wejścia i wyniku szwu ocenaRyzyk. */

import type {
  Grosze,
  ISODate,
  Okres,
  Ostrzezenie,
  PodstawaPrawna,
  Promile,
  RodzajUrlopu,
  TytulUbezpieczenia,
  WynikWspolny,
} from '../typy';

export type PrzyczynaUstania =
  | 'smierc_pracodawcy'
  | 'upadlosc_pracodawcy'
  | 'likwidacja_pracodawcy'
  | 'naruszenie_prawa_prawomocny_wyrok'
  /** Rozwiązanie zakwestionowane w sądzie, wyrok jeszcze nie zapadł (wynik „nieznane”). */
  | 'naruszenie_prawa_bez_wyroku'
  | 'koniec_umowy_terminowej'
  | 'wypowiedzenie_lub_porozumienie'
  | 'zamkniecie_lub_zawieszenie_dzialalnosci'
  | 'wyrejestrowanie_dobrowolnego'
  | 'nieoplacenie_skladki'
  /** Decyzja ZUS o niepodleganiu ubezpieczeniu (np. umowa uznana za zawartą dla pozoru). */
  | 'decyzja_zus_o_niepodleganiu';

/**
 * Okres podlegania ubezpieczeniu chorobowemu (oba końce włącznie).
 * - Decyzja ZUS o niepodleganiu: `do` = dzień przed dniem, od którego ZUS stwierdził niepodleganie;
 *   niepodleganie od pierwszego dnia umowy zapisuje się jako okres pusty (`do` = `od` − 1 dzień), jak w T07.
 * - Wyrejestrowanie z dobrowolnego chorobowego na czas zasiłku macierzyńskiego (R-MA-04): `do` = dzień
 *   rozpoczęcia zasiłku (prawo powstaje w czasie ubezpieczenia), jak w T06.
 */
export interface OkresUbezpieczenia {
  tytul: TytulUbezpieczenia;
  od: ISODate;
  /** Ostatni dzień ubezpieczenia. Brak = trwa. */
  do?: ISODate;
  przyczynaUstania?: PrzyczynaUstania;
}

/** Zaświadczenie lekarskie e-ZLA. */
export interface Zwolnienie extends Okres {
  /** Kod B: niezdolność w okresie ciąży. */
  kodB: boolean;
  tytul: TytulUbezpieczenia;
  wTrakcieUrlopuBezplatnegoLubWychowawczego?: boolean;
}

export interface UmowaTerminowa {
  rodzaj: 'czas_okreslony' | 'okres_probny';
  /** Długość okresu próbnego w miesiącach. */
  dlugoscMiesiecy?: number;
  naZastepstwo: boolean;
  planowanyKoniec: ISODate;
}

export interface UrlopBezplatnyLubWychowawczy extends Okres {
  rodzaj: 'bezplatny' | 'wychowawczy';
}

/** Okres zasiłku macierzyńskiego pobranego albo wnioskowanego (do reguł R-MA-04 – R-MA-06). */
export interface OkresZasilkuMacierzynskiego extends Okres {
  rodzaj: RodzajUrlopu;
}

/** Świadczenia wykluczające zasiłek po ustaniu tytułu i świadczenie rehabilitacyjne (UZ art. 13 ust. 1, art. 18 ust. 7). */
export interface SwiadczeniaWykluczajace {
  emeryturaLubRenta?: boolean;
  zasilekDlaBezrobotnychLubPrzedemerytalny?: boolean;
  rodzicielskieSwiadczenieUzupelniajace?: boolean;
  krus?: boolean;
  nowyTytulPoUstaniu?: boolean;
}

export interface SygnalyRyzyka {
  umowaZawartaWCiazy?: boolean;
  /** Data zawarcia umowy, do oceny, jak krótko przed zwolnieniem lub porodem ją zawarto. */
  dataZawarciaUmowy?: ISODate;
  podwyzkaPodstawyWCiazy?: boolean;
  wynagrodzenieZnaczniePowyzejRynkowego?: boolean;
  /** Ułamkowy wymiar etatu nieproporcjonalny do wynagrodzenia. */
  ulamkowyEtat?: boolean;
}

export interface WejscieRyzyk {
  /** Dzień oceny. Silnik nie korzysta z zegara systemowego. */
  dzis: ISODate;
  dataPoczatkuCiazy?: ISODate;
  przewidywanaDataPorodu?: ISODate;
  dataPorodu?: ISODate;
  /** Przysposobienie albo rodzina zastępcza: dzień przyjęcia dziecka na wychowanie. */
  dataPrzyjeciaDziecka?: ISODate;
  /** Chronologicznie. */
  okresyUbezpieczenia: OkresUbezpieczenia[];
  /** Chronologicznie. */
  zwolnienia: Zwolnienie[];
  urlopyBezplatneLubWychowawcze?: UrlopBezplatnyLubWychowawczy[];
  okresyZasilkuMacierzynskiego?: OkresZasilkuMacierzynskiego[];
  umowaTerminowa?: UmowaTerminowa;
  /** Ukończyła 50 lat w poprzednim roku kalendarzowym lub wcześniej (KP art. 92 § 1 pkt 1). */
  wiek50Wczesniej?: boolean;
  /**
   * Dni wynagrodzenia chorobowego wykorzystane w roku kalendarzowym dnia `dzis` (także u poprzedniego pracodawcy),
   * poza zwolnieniami podanymi w `zwolnienia` – te silnik dolicza sam.
   */
  dniWynagrodzeniaChorobowegoWRoku?: number;
  /** UZ art. 4 ust. 3 pkt 1 */
  absolwentkaW90Dni?: boolean;
  /** UZ art. 4 ust. 3 pkt 3 */
  staz10LatObowiazkowego?: boolean;
  /** Upadłość / likwidacja: pracodawca zapewnił inne zatrudnienie (UZ art. 30 ust. 3). */
  zapewnionoInneZatrudnienie?: boolean;
  /** Zadłużenie składkowe w dniu powstania prawa, grosze (z PUE/eZUS). Brak = nie wiadomo. */
  zadluzenieSkladkoweNaDzienPrawa?: Grosze;
  dataSplatyZadluzenia?: ISODate;
  swiadczeniaWykluczajace?: SwiadczeniaWykluczajace;
  pracaZarobkowaNaZwolnieniu?: boolean;
  /** Orzeczenie lekarza orzecznika ZUS o rokowaniu (świadczenie rehabilitacyjne). */
  rokowanieOdzyskaniaZdolnosci?: boolean;
  /** Zmiana wymiaru czasu pracy w miesiącu zdarzenia lub w 12 poprzednich (R-PZ-04). */
  zmianaWymiaruCzasuPracy?: boolean;
  sygnalyRyzyka?: SygnalyRyzyka;
}

export type StatusReguly = 'przysluguje' | 'nie_przysluguje' | 'ryzyko' | 'nieznane' | 'informacja';

export type Swiadczenie =
  | 'zasilek_chorobowy'
  | 'wynagrodzenie_chorobowe'
  | 'zasilek_chorobowy_po_ustaniu'
  | 'swiadczenie_rehabilitacyjne'
  | 'zasilek_w_wysokosci_zasilku_macierzynskiego'
  | 'zasilek_macierzynski'
  | 'ochrona_stosunku_pracy';

export interface WynikReguly {
  /** Identyfikator reguły, np. „R-CH-02”. */
  regula: string;
  status: StatusReguly;
  swiadczenie?: Swiadczenie;
  skutek?: { stawka?: Promile; maksDni?: number; od?: ISODate; do?: ISODate };
  /** Komunikat dla rodzica, prostym językiem. */
  komunikat: string;
  podstawaPrawna: PodstawaPrawna[];
  /** Termin istotny dla rodzica (np. ostatni dzień spłaty zadłużenia). */
  termin?: ISODate;
  /** Przy statusie „nieznane”: czego brakuje, żeby rozstrzygnąć. */
  brakujaceDane?: string[];
}

export interface WynikRyzyk extends WynikWspolny {
  /** Wyniki reguł w kolejności oceny. */
  wyniki: WynikReguly[];
}
