/**
 * Sytuacja rodziny (GLOSSARY.md): wszystko, co aplikacja wie o rodzinie, z ZUS (persona) albo wpisane ręcznie.
 * Plan rodzica: decyzje rodziny (wariant stawek, podział urlopu rodzicielskiego, łączenie z pracą).
 * Kwoty w groszach, daty ISO, jak w silniku.
 */

import type {
  Grosze,
  ISODate,
  MiesiacNiepracownika,
  MiesiacPracownika,
  Okres,
  OkresUbezpieczenia,
  PrzyczynaUstania,
  SygnalyRyzyka,
  TytulUbezpieczenia,
  UmowaTerminowa,
  Zwolnienie,
} from '@/silnik';

export type RodzajZdarzenia = 'urodzenie' | 'przysposobienie' | 'rodzinaZastepczaNiezawodowa';
export type Rola = 'matka' | 'ojciec';
export type Etap = 'ciaza' | 'poZdarzeniu';

export interface Adres {
  ulica: string;
  nrDomu: string;
  nrLokalu?: string;
  kod: string;
  poczta: string;
}

export interface Platnik {
  nazwa: string;
  nip: string;
  /** Więcej niż 20 ubezpieczonych w chorobowym: płatnik sam wypłaca zasiłek (UZ art. 61). */
  ponad20: boolean;
}

export interface Dziecko {
  imie: string;
  /** Data urodzenia (przy przysposobieniu i rodzinie zastępczej wcześniejsza niż data przyjęcia). */
  dataUrodzenia?: ISODate;
  miejsceUrodzenia?: string;
}

export interface DrugiRodzic {
  imie: string;
  nazwisko: string;
  pesel?: string;
  ubezpieczony: boolean;
  tytul: TytulUbezpieczenia;
  /** Wynagrodzenie brutto albo zadeklarowana podstawa składek, grosze/mies. */
  bruttoMiesiecznie: Grosze | null;
  /** Od kiedy ma ubezpieczenie chorobowe. Brak = co najmniej 3 lata przed zdarzeniem. */
  poczatekUbezpieczenia?: ISODate;
  /** Brak = pełny etat. */
  pelnyEtat?: boolean;
  /** Czy jego płatnik zgłasza do chorobowego ponad 20 osób. Brak = nie wiadomo. */
  ponad20?: boolean;
  /** Zadłużenie składkowe na dzień powstania prawa (działalność), grosze. Brak albo `null` = nie wiadomo. */
  zadluzenie?: Grosze | null;
}

/** Wartości, których rodzic nie podał, a silnik potrzebuje: przyjęte domyślnie i oznaczone w wyjaśnieniach. */
export type PoleZalozone =
  | 'poczatekUbezpieczenia'
  | 'pelnyEtat'
  | 'ponad20'
  | 'drugiRodzic.tytul'
  | 'drugiRodzic.poczatekUbezpieczenia'
  | 'drugiRodzic.pelnyEtat'
  | 'drugiRodzic.ponad20';

export interface Sytuacja {
  zrodlo: 'zus' | 'wpisane';
  personaId?: string;
  /** Z Szybkiego wyliczenia: część danych przyjęta domyślnie, wynik przybliżony do czasu przejścia Przewodnika. */
  przyblizona?: boolean;
  zalozenia?: PoleZalozone[];
  rola: Rola;
  osoba: { imie: string; nazwisko: string; pesel: string; adres: Adres; telefon?: string; rachunek?: string };

  zdarzenie: RodzajZdarzenia;
  etap: Etap;
  /** Data porodu (w ciąży: przewidywana) albo przyjęcia dziecka na wychowanie. */
  dataZdarzenia: ISODate;
  dataPoczatkuCiazy?: ISODate;
  dzieci: Dziecko[];
  zaZyciem: boolean;
  martweUrodzenie: boolean;
  /** Ukończone tygodnie ciąży w dniu porodu, masa i pobyt w szpitalu: uzupełniający urlop macierzyński. */
  tygodnieCiazyPrzyPorodzie?: number;
  masaUrodzeniowaG?: number;
  pobytDzieckaWSzpitalu?: Okres;

  tytul: TytulUbezpieczenia;
  pelnyEtat: boolean;
  poczatekUbezpieczenia: ISODate;
  platnik: Platnik;
  /** Wynagrodzenie brutto (pracownik, zleceniobiorca) albo zadeklarowana podstawa składki (działalność), grosze/mies. */
  bruttoMiesiecznie: Grosze | null;
  /** Dane płacowe z ZUS (Z-3 / Z-3a / deklaracje): mają pierwszeństwo przed `bruttoMiesiecznie`. */
  miesiacePracownika?: MiesiacPracownika[];
  miesiaceNiepracownika?: MiesiacNiepracownika[];
  /** Z ZUS; przy danych wpisanych wyprowadzane z tytułu, początku i ustania. */
  okresyUbezpieczenia?: OkresUbezpieczenia[];
  ustanie?: { data: ISODate; przyczyna: PrzyczynaUstania };
  /** Zaświadczenia lekarskie e-ZLA. */
  zwolnienia: Zwolnienie[];
  /** Zadłużenie składkowe na dzień powstania prawa, grosze (eZUS). `null` = nie wiadomo. */
  zadluzenie: Grosze | null;
  dataSplatyZadluzenia?: ISODate;
  umowaTerminowa?: UmowaTerminowa;
  zmianaWymiaruCzasuPracy?: boolean;
  sygnalyRyzyka?: SygnalyRyzyka;
  /** Data złożenia wniosku o 81,5% (wniosek o pełny wymiar), jeśli już złożony. */
  wniosek815Data?: ISODate;

  drugiRodzic: DrugiRodzic | null;
}

export interface PracaPrzyUrlopie {
  rodzic: Rola;
  /** Wymiar pracy jako ułamek etatu (najwyżej ½). */
  licznik: number;
  mianownik: number;
  /** Ile tygodni z puli urlopu rodzicielskiego rodzic wykorzystuje, łącząc go z pracą. */
  tygodniePuli: number;
}

export interface PlanRodzica {
  wariant: '100_70' | '81_5';
  /** Tygodnie urlopu rodzicielskiego drugiego rodzica (nie wnioskodawcy macierzyńskiego). `null` = jego część nieprzenoszalna. */
  tygodnieDrugiegoRodzica: number | null;
  ojcowski: boolean;
  /** Dzień rozpoczęcia urlopu ojcowskiego, liczony od dnia zdarzenia. */
  ojcowskiPoDniach: number;
  praca: PracaPrzyUrlopie | null;
}

export const PLAN_DOMYSLNY: PlanRodzica = {
  wariant: '100_70',
  tygodnieDrugiegoRodzica: null,
  ojcowski: true,
  ojcowskiPoDniach: 0,
  praca: null,
};

export const NAZWY_TYTULOW: Record<TytulUbezpieczenia, string> = {
  umowa_o_prace: 'Umowa o pracę',
  umowa_zlecenia: 'Umowa zlecenia',
  dzialalnosc: 'Działalność gospodarcza',
  osoba_wspolpracujaca: 'Osoba współpracująca',
};

export const NAZWY_ZDARZEN: Record<RodzajZdarzenia, string> = {
  urodzenie: 'Urodzenie dziecka',
  przysposobienie: 'Przysposobienie (adopcja)',
  rodzinaZastepczaNiezawodowa: 'Rodzina zastępcza niezawodowa',
};

export const drugaRola = (r: Rola): Rola => (r === 'matka' ? 'ojciec' : 'matka');

export const jestPracownikiem = (t: TytulUbezpieczenia): boolean => t === 'umowa_o_prace';
export const prowadziFirme = (t: TytulUbezpieczenia): boolean => t === 'dzialalnosc' || t === 'osoba_wspolpracujaca';

/** Forma zależna od roli: „ubezpieczona” dla mamy, „ubezpieczony” dla taty. */
export const wgRoli = (r: Rola, mama: string, tata: string): string => (r === 'matka' ? mama : tata);

/** Sytuacja do formularza „Policz od razu”: typowa rodzina, którą użytkownik nadpisuje własnymi danymi. */
export function sytuacjaPusta(dzis: ISODate): Sytuacja {
  return {
    zrodlo: 'wpisane',
    rola: 'matka',
    osoba: { imie: '', nazwisko: '', pesel: '', adres: { ulica: '', nrDomu: '', kod: '', poczta: '' } },
    zdarzenie: 'urodzenie',
    etap: 'ciaza',
    dataZdarzenia: dzis,
    dzieci: [{ imie: '' }],
    zaZyciem: false,
    martweUrodzenie: false,
    tytul: 'umowa_o_prace',
    pelnyEtat: true,
    poczatekUbezpieczenia: '2022-01-01',
    platnik: { nazwa: '', nip: '', ponad20: true },
    bruttoMiesiecznie: 600_000,
    zwolnienia: [],
    zadluzenie: null,
    drugiRodzic: { imie: '', nazwisko: '', ubezpieczony: true, tytul: 'umowa_o_prace', bruttoMiesiecznie: 700_000 },
  };
}
