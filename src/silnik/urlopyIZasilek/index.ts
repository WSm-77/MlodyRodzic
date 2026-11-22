/**
 * Szew 2: wymiar urlopów związanych z rodzicielstwem, okresy zasiłku macierzyńskiego obojga rodziców,
 * stawki (100%, 70%, 81,5%) i kwoty.
 * Reguły: docs/research/reguly-wymiaru-zasilku-macierzynskiego.md; korekty D4–D6: komentarz do #14.
 * Konwencja: dzień porodu (przyjęcia dziecka) = dzień 1, okresy włącznie z końcami.
 */

import type { ParametryPrawne } from '../parametry';
import type {
  Grosze,
  ISODate,
  Krok,
  Okres,
  Ostrzezenie,
  PodstawaPrawna,
  Promile,
  RodzajUrlopu,
  RolaRodzica,
  Ulamek,
  WynikWspolny,
} from '../typy';
import { nowyKontekst } from './kontekst';
import { policzOkresy } from './okresy';
import { policzWymiary } from './wymiary';

export type Zdarzenie =
  | {
      rodzaj: 'urodzenie';
      dataPorodu: ISODate;
      /** Pełne tygodnie urlopu macierzyńskiego wykorzystane przed porodem (0–6, KP art. 180 § 2). */
      tygodniePrzedPorodem?: number;
    }
  /** Przyjęcie dziecka na wychowanie i wniosek do sądu o przysposobienie. */
  | { rodzaj: 'przysposobienie'; dataPrzyjecia: ISODate }
  | { rodzaj: 'rodzinaZastepczaNiezawodowa'; dataPrzyjecia: ISODate }
  /** Zawodowa rodzina zastępcza: urlop nie przysługuje (KP art. 183 § 1). */
  | { rodzaj: 'rodzinaZastepczaZawodowa'; dataPrzyjecia: ISODate };

export interface Dziecko {
  dataUrodzenia: ISODate;
  martweUrodzenie?: boolean;
  dataZgonu?: ISODate;
  /** Masa urodzeniowa w gramach (uzupełniający urlop macierzyński). */
  masaUrodzeniowaG?: number;
  /** Ukończone tygodnie ciąży w dniu porodu. */
  ukonczoneTygodnieCiazy?: number;
  /** Pobyty w szpitalu po porodzie albo po przyjęciu dziecka. */
  hospitalizacje?: Okres[];
  /** Rodzina zastępcza: odroczony obowiązek szkolny (limit wieku 10 zamiast 7 lat). */
  odroczenieObowiazkuSzkolnego?: boolean;
  /** Zaświadczenie z art. 4 ust. 3 ustawy „Za życiem”. */
  zaswiadczenieZaZyciem?: boolean;
}

export interface Rodzic {
  rola: RolaRodzica;
  /** Podlega ubezpieczeniu chorobowemu w dniu powstania prawa. */
  ubezpieczony: boolean;
  /** Pracownik (urlop) albo ubezpieczony niebędący pracownikiem (okres odpowiadający urlopowi). */
  pracownik: boolean;
  /** Podstawa wymiaru zasiłku z szwu podstawaWymiaru, grosze/mies. Brak = kwoty nieznane. */
  podstawaWymiaru?: Grosze;
  /** Orzeczenie o niezdolności do samodzielnej egzystencji. */
  orzeczenieNiezdolnosciDoSamodzielnejEgzystencji?: boolean;
}

/** Wniosek o zasiłek za macierzyński i rodzicielski w pełnym wymiarze (wariant 81,5%, UZ art. 30a). */
export interface Wniosek815 {
  zlozony: boolean;
  dataZlozenia?: ISODate;
}

/** Sytuacje przejęcia urlopu macierzyńskiego przez ojca albo innego członka rodziny (KP art. 180 § 4–17). */
export type PrzyczynaPrzejecia =
  | 'rezygnacja' // KP art. 180 § 4–5
  | 'rezygnacja_z_orzeczeniem' // § 6–7
  | 'pobyt_matki_w_szpitalu' // § 10–11
  | 'zgon_matki' // § 12
  | 'porzucenie_dziecka' // § 13
  | 'matka_nieubezpieczona' // § 15: zgon, porzucenie albo orzeczenie matki bez tytułu do ubezpieczenia
  | 'zatrudnienie_matki_nieubezpieczonej'; // § 17

export interface PrzejecieMacierzynskiego {
  przez: Exclude<RolaRodzica, 'matka'>;
  przyczyna: PrzyczynaPrzejecia;
  /** Dzień zdarzenia (rezygnacji, zgonu, porzucenia, przyjęcia do szpitala, podjęcia zatrudnienia). */
  data: ISODate;
  /** Koniec pobytu matki w szpitalu albo jej zatrudnienia, jeśli znany. */
  dataKonca?: ISODate;
}

/** Jak rodzina chce wykorzystać urlopy. Bez planu silnik liczy maksimum. */
export interface OkresPlanowany extends Okres {
  rodzaj: RodzajUrlopu;
  rodzic: RolaRodzica;
  /** Wymiar pracy przy łączeniu rodzicielskiego z pracą (KP art. 182¹ᵉ), np. ½ etatu. */
  wymiarPracy?: Ulamek;
}

export interface WejscieUrlopow {
  zdarzenie: Zdarzenie;
  dzieci: Dziecko[];
  rodzice: Rodzic[];
  wniosek815?: Wniosek815;
  przejecie?: PrzejecieMacierzynskiego;
  plan?: OkresPlanowany[];
  /** Dzień oceny, do ostrzeżeń o terminach. */
  dzis?: ISODate;
}

export type KategoriaUzupelniajacego = 'A' | 'B' | 'C';

/** Część wymiaru urlopu przypadająca jednej osobie (np. przy przejęciu macierzyńskiego przez ojca). */
export interface CzescWymiaru extends Okres {
  rodzic: RolaRodzica;
  dni: number;
}

export interface WymiarUrlopu {
  rodzaj: RodzajUrlopu;
  przysluguje: boolean;
  /** Pełne tygodnie wymiaru; gdy wymiar nie jest wielokrotnością tygodnia (np. 7 dni od zgonu), rozstrzyga `dni`. */
  tygodnie: number;
  dni: number;
  /** Okres urlopu wyznaczony datą zdarzenia (macierzyński, na warunkach macierzyńskiego), oba końce włącznie. */
  okres?: Okres;
  /** Podział okresu między osoby (przejęcie macierzyńskiego, KP art. 180 § 4–17). */
  podzial?: CzescWymiaru[];
  podstawaPrawna: PodstawaPrawna[];
  /** Ostatni dzień, w którym można wykorzystać urlop (rodzicielski, ojcowski). */
  terminWykorzystania?: ISODate;
  /** Dopuszczalna liczba części (rodzicielski 5, ojcowski 2). */
  maksCzesci?: number;
  /** Rodzicielski: część wyłącznie dla każdego z rodziców, tygodnie. */
  tygodnieNieprzenoszalne?: number;
  /** Rodzicielski: maksimum dla jednego rodzica (wymiar − część nieprzenoszalna drugiego), tygodnie. */
  maksDlaJednegoRodzicaTygodnie?: number;
  /** Uzupełniający urlop macierzyński: kategoria z KP art. 180² § 1. */
  kategoria?: KategoriaUzupelniajacego;
}

export type WariantStawek = '100_70' | '81_5';

export interface OkresZasilku extends Okres {
  rodzaj: RodzajUrlopu;
  rodzic: RolaRodzica;
  dni: number;
  /** Stawka w promilach przed redukcją za łączenie z pracą. */
  stawka: Promile;
  wymiarPracy?: Ulamek;
  /** Kwota za 1 dzień, grosze; `null`, gdy brak podstawy wymiaru rodzica. */
  kwotaDzienna: Grosze | null;
  /** kwotaDzienna × dni (bez podwyższenia), grosze. */
  kwota: Grosze | null;
  /** Dopłata do kwoty świadczenia rodzicielskiego za ten okres (UZ art. 31 ust. 3a, 3c), grosze. */
  podwyzszenie?: Grosze;
  podstawaPrawna: PodstawaPrawna[];
}

/** Jednorazowe wyrównanie macierzyńskiego do 100% po utracie wariantu 81,5% (na wniosek, UZ art. 31 ust. 4). */
export interface Wyrownanie {
  rodzic: RolaRodzica;
  kwota: Grosze | null;
  podstawaPrawna: PodstawaPrawna[];
}

export interface WynikUrlopow extends WynikWspolny {
  wymiary: Partial<Record<RodzajUrlopu, WymiarUrlopu>>;
  okresy: OkresZasilku[];
  wariant: WariantStawek;
  wyrownanie?: Wyrownanie;
  /** Suma kwot wszystkich okresów z podwyższeniami, grosze; `null`, gdy brakuje którejś podstawy. */
  suma: Grosze | null;
  /** Porównanie sum obu wariantów stawek dla tego samego planu (user story 34). */
  porownanieWariantow?: { wariant100_70: Grosze | null; wariant815: Grosze | null };
  kroki: Krok[];
}

export function urlopyIZasilek(wejscie: WejscieUrlopow, parametry: ParametryPrawne): WynikUrlopow {
  const k = nowyKontekst(parametry);
  const wymiary = policzWymiary(wejscie, k);
  return {
    wymiary,
    ...policzOkresy(wejscie, wymiary, k),
    kroki: k.kroki,
    ostrzezenia: k.ostrzezenia,
    niepotwierdzoneParametry: [...k.niepotwierdzone],
  };
}
