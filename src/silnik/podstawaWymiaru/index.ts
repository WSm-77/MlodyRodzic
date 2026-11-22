/**
 * Szew 1: podstawa wymiaru zasiłku i stawka dzienna (UZ rozdz. 8).
 * Algorytm: docs/research/podstawa-wymiaru.md; korekty diagramu D2: komentarz do #14.
 */

import { odczytaj, type KluczParametru, type ParametryPrawne } from '../parametry';
import type { Grosze, ISODate, Krok, Miesiac, Ostrzezenie, TytulUbezpieczenia, WynikWspolny } from '../typy';
import { czesciDaty, dodajDni, dniWMiesiacu, dodajMiesiaceDoMiesiaca, miesiacDaty, ostatniDzienMiesiaca, porownaj, porownajMiesiace } from '../wspolne/daty';
import { kwotaTekst, procentTekst, zaokraglij } from '../wspolne/kwoty';
import { calkowita, dodaj, doGroszy, razy, suma, ulamek, type Wymierna } from './wymierne';

/** Wynagrodzenie pracownika za jeden miesiąc kalendarzowy (z zaświadczenia Z-3). */
export interface MiesiacPracownika {
  miesiac: Miesiac;
  /** Wynagrodzenie brutto wypłacone za miesiąc (składniki miesięczne), grosze. */
  brutto: Grosze;
  /** Tylko dla miesiąca niepełnego z przyczyn usprawiedliwionych (UZ art. 37 ust. 2, art. 38 ust. 2). */
  dniDoPrzepracowania?: number;
  dniPrzepracowane?: number;
  /** Składnik stały w kwocie z umowy, do uzupełnienia miesiąca niepełnego, grosze. */
  skladnikStalyZUmowy?: Grosze;
  /** Składnik zmienny faktycznie wypłacony za miesiąc niepełny, grosze. */
  skladnikZmiennyFaktyczny?: Grosze;
}

/** Przychód ubezpieczonego niebędącego pracownikiem za jeden miesiąc (zleceniobiorca, działalność). */
export interface MiesiacNiepracownika {
  miesiac: Miesiac;
  /** Podstawa składki na ubezpieczenie chorobowe za miesiąc (zadeklarowana albo z umowy), grosze. */
  podstawaSkladkiChorobowej: Grosze;
  /** Najniższa podstawa składki za miesiąc (działalność; UZ art. 48a ust. 5, art. 49 ust. 1 pkt 1), grosze. */
  najnizszaPodstawa?: Grosze;
  /**
   * Dni kalendarzowe, w których wykonywano pracę lub działalność, gdy w części miesiąca pobierano
   * zasiłek (UZ art. 50). Brak = cały miesiąc.
   */
  dniWykonywania?: number;
}

/** Okoliczności spoza zakresu MVP; każda daje ostrzeżenie „wynik orientacyjny”. */
export interface OkolicznosciPozaZakresem {
  zbiegTytulow?: boolean;
  /** UZ art. 40 */
  zmianaWymiaruCzasuPracy?: boolean;
  /** UZ art. 41 */
  skladnikiWylaczone?: boolean;
  /** UZ art. 48a ust. 2–4, art. 49 ust. 2–3 */
  przejscieZInnegoTytulu?: boolean;
}

export interface WejsciePodstawy {
  tytul: TytulUbezpieczenia;
  /** Dzień powstania niezdolności do pracy, porodu albo przyjęcia dziecka; wyznacza miesiąc zdarzenia. */
  dataZdarzenia: ISODate;
  /** Początek nieprzerwanego ubezpieczenia chorobowego. */
  poczatekUbezpieczenia: ISODate;
  /** Pracownik na pełnym etacie (UZ art. 45). Brak przy pracowniku = brak danych. */
  pelnyEtat?: boolean;
  miesiacePracownika?: MiesiacPracownika[];
  miesiaceNiepracownika?: MiesiacNiepracownika[];
  /** Premie kwartalne brutto za 4 kwartały przed miesiącem zdarzenia (UZ art. 42 ust. 2), grosze. */
  premieKwartalne?: Grosze;
  /** Premie roczne brutto za rok kalendarzowy przed zdarzeniem (UZ art. 42 ust. 3), grosze. */
  premieRoczne?: Grosze;
  /**
   * Zdarzenie w 1. miesiącu ubezpieczenia: wynagrodzenie z umowy (pracownik, UZ art. 37 ust. 2 pkt 1)
   * albo przychód z umowy (zleceniobiorca, UZ art. 49 ust. 1 pkt 2), grosze/mies.
   */
  wynagrodzenieZUmowy?: Grosze;
  /** Poprzedni zasiłek (UZ art. 43): przy przerwie krótszej niż miesiąc kalendarzowy podstawa się nie zmienia. */
  poprzedniZasilek?: { podstawa: Grosze; dataKonca: ISODate };
  okolicznosciPozaZakresem?: OkolicznosciPozaZakresem;
}

/** Ścieżka wyliczenia z diagramu D2. */
export type SciezkaPodstawy =
  | 'poprzednia_podstawa' // UZ art. 43
  | 'pierwszy_miesiac' // UZ art. 37, art. 49
  | 'srednia_pracownika' // UZ art. 36, 38, 42
  | 'srednia_niepracownika' // UZ art. 48, 50
  | 'art48a'; // działalność krócej niż 12 miesięcy

export interface WynikPodstawy extends WynikWspolny {
  /** Podstawa wymiaru zasiłku, grosze/mies.; `null`, gdy brak danych do wyliczenia. */
  podstawa: Grosze | null;
  /** Podstawa za 1 dzień (podstawa / dzielnik dzienny), grosze; `null`, gdy brak podstawy. */
  stawkaDzienna: Grosze | null;
  sciezka: SciezkaPodstawy | null;
  kroki: Krok[];
}

export function podstawaWymiaru(wejscie: WejsciePodstawy, parametry: ParametryPrawne): WynikPodstawy {
  const niepotwierdzone = new Set<KluczParametru>();
  const kroki: Krok[] = [];
  const ostrzezenia: Ostrzezenie[] = [];

  const odliczenie = odczytaj(parametry, 'odliczenieSkladek', niepotwierdzone);
  const dzielnik = odczytaj(parametry, 'dzielnikDzienny', niepotwierdzone);
  const poOdliczeniu = ulamek(10_000 - odliczenie, 10_000);

  ostrzezenia.push(...ostrzezeniaPozaZakresem(wejscie.okolicznosciPozaZakresem));

  const poprzedni = wejscie.poprzedniZasilek;
  if (poprzedni && !przerwaObejmujePelnyMiesiac(poprzedni.dataKonca, wejscie.dataZdarzenia)) {
    kroki.push({
      opis: 'Między zasiłkami nie było przerwy albo była krótsza niż miesiąc kalendarzowy: przyjęto podstawę poprzedniego zasiłku.',
      podstawaPrawna: ['UZ art. 43'],
      kwota: poprzedni.podstawa,
    });
    const stawkaDzienna = zaokraglij(poprzedni.podstawa, dzielnik);
    kroki.push({ opis: `Stawka dzienna: podstawa podzielona przez ${dzielnik}.`, podstawaPrawna: ['UZ art. 36 ust. 3'], kwota: stawkaDzienna });
    return {
      podstawa: poprzedni.podstawa,
      stawkaDzienna,
      sciezka: 'poprzednia_podstawa',
      kroki,
      ostrzezenia,
      niepotwierdzoneParametry: [...niepotwierdzone],
    };
  }

  const miesiaceOkresu = odczytaj(parametry, 'miesiaceOkresuOdniesienia', niepotwierdzone);
  const okres = okresOdniesienia(wejscie, miesiaceOkresu);
  kroki.push({
    opis:
      okres.length === 0
        ? 'Zdarzenie w pierwszym miesiącu ubezpieczenia: brak pełnego miesiąca kalendarzowego w okresie odniesienia.'
        : `Okres odniesienia: ${okres.length} pełnych miesięcy kalendarzowych ubezpieczenia (${okres[0]} – ${okres[okres.length - 1]}).`,
    podstawaPrawna: ['UZ art. 36 ust. 1, 2 i 4'],
  });

  const podane = new Set([...(wejscie.miesiacePracownika ?? []), ...(wejscie.miesiaceNiepracownika ?? [])].map((m) => m.miesiac));
  const brakujace = okres.filter((m) => !podane.has(m));
  if (podane.size > 0 && brakujace.length > 0 && wejscie.okolicznosciPozaZakresem?.zmianaWymiaruCzasuPracy !== true) {
    ostrzezenia.push({
      kod: 'BRAK_DANYCH_MIESIECY',
      komunikat: `Brak kwot za miesiące: ${brakujace.join(', ')}. Policzyliśmy podstawę z pozostałych miesięcy; uzupełnij dane, żeby wynik był pewny.`,
      podstawaPrawna: ['UZ art. 36 ust. 1', 'UZ art. 38 ust. 1'],
    });
  }

  const limit = wejscie.tytul === 'umowa_o_prace' ? bezLimitu : limitSkladki(odczytaj(parametry, 'maksPodstawaSkladkiChorobowej', niepotwierdzone), ostrzezenia);

  let sciezka: SciezkaPodstawy;
  let brutto: Wymierna | null;
  if (okres.length === 0) {
    sciezka = 'pierwszy_miesiac';
    brutto = pierwszyMiesiac(wejscie, limit, kroki, ostrzezenia);
  } else if (wejscie.tytul === 'umowa_o_prace') {
    sciezka = 'srednia_pracownika';
    brutto = sredniaPracownika(wejscie, okres, miesiaceOkresu, kroki, ostrzezenia);
  } else if (okres.length < miesiaceOkresu && czyZadeklarowanaKwota(wejscie.tytul)) {
    sciezka = 'art48a';
    brutto = art48a(wejscie, okres, miesiaceOkresu, odczytaj(parametry, 'najnizszaPodstawaDzialalnosci', niepotwierdzone), limit, kroki, ostrzezenia);
  } else {
    sciezka = 'srednia_niepracownika';
    brutto = sredniaNiepracownika(wejscie, okres, limit, kroki, ostrzezenia);
  }

  if (brutto === null) {
    return { podstawa: null, stawkaDzienna: null, sciezka, kroki, ostrzezenia, niepotwierdzoneParametry: [...niepotwierdzone] };
  }

  let podstawa = doGroszy(razy(brutto, poOdliczeniu));
  kroki.push({
    opis: `Odliczenie składek społecznych ${procentTekst(odliczenie, 10_000)}.`,
    podstawaPrawna: [wejscie.tytul === 'umowa_o_prace' ? 'UZ art. 3 pkt 3' : 'UZ art. 3 pkt 4'],
    kwota: podstawa,
  });

  if (wejscie.tytul === 'umowa_o_prace' && wejscie.pelnyEtat === true) {
    const placaMinimalna = odczytaj(parametry, 'placaMinimalna', niepotwierdzone);
    const minimum = doGroszy(razy(calkowita(placaMinimalna), poOdliczeniu));
    if (podstawa < minimum) {
      kroki.push({
        opis: 'Podstawa niższa od minimalnego wynagrodzenia po odliczeniu składek: podniesiona do minimum.',
        podstawaPrawna: ['UZ art. 45 ust. 1'],
        kwota: minimum,
      });
      podstawa = minimum;
    }
  } else if (wejscie.tytul === 'umowa_o_prace' && wejscie.pelnyEtat === undefined) {
    ostrzezenia.push({
      kod: 'BRAK_DANYCH',
      komunikat: 'Nie wiemy, czy pracujesz na pełny etat. Na pełnym etacie podstawa nie może być niższa niż minimalne wynagrodzenie po odliczeniu składek.',
      podstawaPrawna: ['UZ art. 45 ust. 1'],
    });
  }

  const stawkaDzienna = zaokraglij(podstawa, dzielnik);
  kroki.push({ opis: `Stawka dzienna: podstawa podzielona przez ${dzielnik}.`, podstawaPrawna: ['UZ art. 36 ust. 3'], kwota: stawkaDzienna });

  return { podstawa, stawkaDzienna, sciezka, kroki, ostrzezenia, niepotwierdzoneParametry: [...niepotwierdzone] };
}

/**
 * Czy przerwa między końcem poprzedniego zasiłku a zdarzeniem (bez obu tych dni) obejmuje cały
 * miesiąc kalendarzowy, od 1. do ostatniego dnia. Tylko wtedy przerwa nie jest „krótsza niż miesiąc
 * kalendarzowy” (UZ art. 43). Odczytanie do potwierdzenia z praktyką ZUS.
 */
function przerwaObejmujePelnyMiesiac(koniecPoprzedniego: ISODate, dataZdarzenia: ISODate): boolean {
  const pierwszyDzienPrzerwy = dodajDni(koniecPoprzedniego, 1);
  const ostatniDzienPrzerwy = dodajDni(dataZdarzenia, -1);
  const miesiacPrzerwy = miesiacDaty(pierwszyDzienPrzerwy);
  const pierwszyPelny = czesciDaty(pierwszyDzienPrzerwy).dzien === 1 ? miesiacPrzerwy : dodajMiesiaceDoMiesiaca(miesiacPrzerwy, 1);
  return porownaj(ostatniDzienMiesiaca(pierwszyPelny), ostatniDzienPrzerwy) <= 0;
}

/**
 * Pełne miesiące kalendarzowe nieprzerwanego ubezpieczenia przed miesiącem zdarzenia, najwyżej `maks`
 * (UZ art. 36 ust. 1, 2 i 4). Miesiąc początku ubezpieczenia liczy się tylko, gdy ubezpieczenie
 * zaczęło się 1. dnia miesiąca.
 */
function okresOdniesienia(w: WejsciePodstawy, maks: number): Miesiac[] {
  const miesiacZdarzenia = miesiacDaty(w.dataZdarzenia);
  const start = miesiacDaty(w.poczatekUbezpieczenia);
  const pierwszyPelny = czesciDaty(w.poczatekUbezpieczenia).dzien === 1 ? start : dodajMiesiaceDoMiesiaca(start, 1);
  const ile = Math.max(0, Math.min(maks, porownajMiesiace(miesiacZdarzenia, pierwszyPelny)));
  return Array.from({ length: ile }, (_, i) => dodajMiesiaceDoMiesiaca(miesiacZdarzenia, i - ile));
}

/** Zdarzenie w 1. miesiącu ubezpieczenia (UZ art. 37 ust. 2 pkt 1, art. 49 ust. 1). */
function pierwszyMiesiac(w: WejsciePodstawy, limit: Limit, kroki: Krok[], ostrzezenia: Ostrzezenie[]): Wymierna | null {
  if (czyZadeklarowanaKwota(w.tytul)) {
    const miesiacZdarzenia = miesiacDaty(w.dataZdarzenia);
    const najnizsza = w.miesiaceNiepracownika?.find((m) => m.miesiac === miesiacZdarzenia)?.najnizszaPodstawa;
    if (najnizsza === undefined) {
      ostrzezenia.push({
        kod: 'BRAK_DANYCH',
        komunikat: `Zdarzenie wypadło w pierwszym miesiącu działalności. Podaj najniższą podstawę składek obowiązującą Cię w miesiącu ${miesiacZdarzenia}, żeby policzyć podstawę.`,
        podstawaPrawna: ['UZ art. 49 ust. 1 pkt 1'],
      });
      return null;
    }
    kroki.push({
      opis: 'Podstawą jest najniższa podstawa składki na ubezpieczenie chorobowe za miesiąc zdarzenia, niezależnie od zadeklarowanej kwoty.',
      podstawaPrawna: ['UZ art. 49 ust. 1 pkt 1'],
      kwota: najnizsza,
    });
    return calkowita(najnizsza);
  }

  const pracownik = w.tytul === 'umowa_o_prace';
  const przepis = pracownik ? 'UZ art. 37 ust. 2 pkt 1' : 'UZ art. 49 ust. 1 pkt 2';
  if (w.wynagrodzenieZUmowy === undefined) {
    ostrzezenia.push({
      kod: 'BRAK_DANYCH',
      komunikat: pracownik
        ? 'Zdarzenie wypadło w pierwszym miesiącu pracy. Podaj miesięczne wynagrodzenie z umowy, żeby policzyć podstawę.'
        : 'Zdarzenie wypadło w pierwszym miesiącu umowy zlecenia. Podaj miesięczny przychód z umowy, żeby policzyć podstawę.',
      podstawaPrawna: [przepis],
    });
    return null;
  }
  kroki.push({
    opis: pracownik
      ? 'Podstawą jest wynagrodzenie, które przysługiwałoby za pełny miesiąc według umowy.'
      : 'Podstawą jest przychód określony w umowie zlecenia za miesiąc zdarzenia.',
    podstawaPrawna: [przepis],
    kwota: w.wynagrodzenieZUmowy,
  });
  return calkowita(limit(w.wynagrodzenieZUmowy));
}

function czyNiepelny(m: MiesiacPracownika): boolean {
  return m.dniPrzepracowane !== undefined && m.dniDoPrzepracowania !== undefined && m.dniPrzepracowane < m.dniDoPrzepracowania;
}

function czyPonizejPolowy(m: MiesiacPracownika): boolean {
  return czyNiepelny(m) && (m.dniPrzepracowane ?? 0) * 2 < (m.dniDoPrzepracowania ?? 0);
}

/** UZ art. 37 ust. 2 w zw. z art. 38 ust. 2 pkt 2: składnik stały w pełnej kwocie, zmienny proporcjonalnie do dni. */
function uzupelnij(m: MiesiacPracownika): Wymierna {
  const stala = calkowita(m.skladnikStalyZUmowy ?? 0);
  const przepracowane = m.dniPrzepracowane ?? 0;
  if (przepracowane === 0 || m.skladnikZmiennyFaktyczny === undefined) return stala;
  return dodaj(stala, ulamek(m.skladnikZmiennyFaktyczny * (m.dniDoPrzepracowania ?? 0), przepracowane));
}

/** Przeciętne miesięczne wynagrodzenie brutto z premiami (UZ art. 38, art. 42), przed odliczeniem składek. */
function sredniaPracownika(w: WejsciePodstawy, okres: Miesiac[], miesiaceOkresu: number, kroki: Krok[], ostrzezenia: Ostrzezenie[]): Wymierna | null {
  const miesiace = (w.miesiacePracownika ?? []).filter((m) => okres.includes(m.miesiac));
  if (miesiace.length === 0) return brakMiesiecy(ostrzezenia);
  const wszystkiePonizej = miesiace.length > 0 && miesiace.every(czyPonizejPolowy);
  const uwzglednione = wszystkiePonizej ? miesiace : miesiace.filter((m) => !czyPonizejPolowy(m));
  const bezSkladnikow = uwzglednione.filter((m) => czyNiepelny(m) && m.skladnikStalyZUmowy === undefined && m.skladnikZmiennyFaktyczny === undefined);
  if (bezSkladnikow.length > 0) {
    ostrzezenia.push({
      kod: 'BRAK_DANYCH',
      komunikat: `Miesiące niepełne bez podziału na składnik stały i zmienny: ${bezSkladnikow.map((m) => m.miesiac).join(', ')}. Przyjęliśmy kwotę wypłaconą bez uzupełnienia, więc podstawa może być zaniżona.`,
      podstawaPrawna: ['UZ art. 38 ust. 2 pkt 2', 'UZ art. 37 ust. 2'],
    });
  }
  const kwoty = uwzglednione.map((m) => (czyNiepelny(m) && !bezSkladnikow.includes(m) ? uzupelnij(m) : calkowita(m.brutto)));
  const srednia = razy(suma(kwoty), ulamek(1, kwoty.length));
  const premie = ulamek((w.premieKwartalne ?? 0) + (w.premieRoczne ?? 0), miesiaceOkresu);
  kroki.push({
    opis: `Przeciętne wynagrodzenie z ${kwoty.length} z ${miesiace.length} miesięcy, z 1/${miesiaceOkresu} premii kwartalnych i rocznych.`,
    podstawaPrawna: ['UZ art. 38', 'UZ art. 42 ust. 2 i 3'],
  });
  return dodaj(srednia, premie);
}

/** Przeciętny miesięczny przychód (podstawa składki chorobowej) nie-pracownika (UZ art. 48, art. 38 ust. 1). */
function sredniaNiepracownika(w: WejsciePodstawy, okres: Miesiac[], limit: Limit, kroki: Krok[], ostrzezenia: Ostrzezenie[]): Wymierna | null {
  const miesiace = (w.miesiaceNiepracownika ?? []).filter((m) => okres.includes(m.miesiac) && m.podstawaSkladkiChorobowej > 0);
  if (miesiace.length === 0) return brakMiesiecy(ostrzezenia);
  // UZ art. 50: przy pracy przez mniej niż połowę miesiąca wyłącz miesiąc; co najmniej połowa: bez uzupełnienia.
  const ponizejPolowy = (m: MiesiacNiepracownika) => m.dniWykonywania !== undefined && m.dniWykonywania * 2 < dniWMiesiacu(m.miesiac);
  const wszystkiePonizej = miesiace.every(ponizejPolowy);
  const uwzglednione = wszystkiePonizej ? miesiace : miesiace.filter((m) => !ponizejPolowy(m));
  const kwoty = uwzglednione.map((m) => calkowita(limit(m.podstawaSkladkiChorobowej)));
  kroki.push({
    opis: `Przeciętna miesięczna podstawa składki chorobowej z ${kwoty.length} z ${miesiace.length} miesięcy.`,
    podstawaPrawna: ['UZ art. 48 ust. 1', 'UZ art. 38 ust. 1', 'UZ art. 50'],
  });
  return razy(suma(kwoty), ulamek(1, kwoty.length));
}

/** Podstawa składki to kwota zadeklarowana (działalność, osoba współpracująca), UZ art. 48a ust. 1. */
function czyZadeklarowanaKwota(tytul: TytulUbezpieczenia): boolean {
  return tytul === 'dzialalnosc' || tytul === 'osoba_wspolpracujaca';
}

/**
 * Działalność krócej niż 12 miesięcy (UZ art. 48a ust. 1): przeciętna najniższa podstawa plus 1/12
 * nadwyżki przeciętnej deklaracji ponad nią za każdy pełny miesiąc ubezpieczenia (przed odliczeniem składek).
 */
function art48a(
  w: WejsciePodstawy,
  okres: Miesiac[],
  miesiaceOkresu: number,
  najnizszaZUstawySystemowej: Grosze,
  limit: Limit,
  kroki: Krok[],
  ostrzezenia: Ostrzezenie[],
): Wymierna | null {
  const n = okres.length;
  const miesiace = (w.miesiaceNiepracownika ?? []).filter((m) => okres.includes(m.miesiac));
  if (miesiace.length === 0) return brakMiesiecy(ostrzezenia);

  // UZ art. 48a ust. 5: deklaracja przez cały okres co najmniej w kwocie najniższej z ustawy systemowej.
  const ust5 = miesiace.every((m) => m.podstawaSkladkiChorobowej >= najnizszaZUstawySystemowej);
  if (miesiace.some((m) => m.najnizszaPodstawa === undefined) && !ust5) {
    ostrzezenia.push({
      kod: 'BRAK_DANYCH',
      komunikat: 'Podaj najniższą podstawę składek obowiązującą Cię w każdym miesiącu (np. przy składkach preferencyjnych), żeby policzyć podstawę.',
      podstawaPrawna: ['UZ art. 48a ust. 1'],
    });
    return null;
  }
  const najnizsza = (m: MiesiacNiepracownika): Grosze => m.najnizszaPodstawa ?? najnizszaZUstawySystemowej;

  const sumaNajnizszych = miesiace.reduce((a, m) => a + najnizsza(m), 0);
  const sumaDeklaracji = miesiace.reduce((a, m) => a + limit(m.podstawaSkladkiChorobowej), 0);
  const sredniaNajnizsza = ulamek(sumaNajnizszych, miesiace.length);
  const nadwyzka = ulamek(Math.max(0, sumaDeklaracji - sumaNajnizszych) * n, miesiace.length * miesiaceOkresu);
  kroki.push({
    opis: `Działalność krócej niż ${miesiaceOkresu} miesięcy: przeciętna najniższa podstawa plus ${n}/${miesiaceOkresu} nadwyżki zadeklarowanej podstawy ponad nią.`,
    podstawaPrawna: ust5 ? ['UZ art. 48a ust. 1', 'UZ art. 48a ust. 5'] : ['UZ art. 48a ust. 1'],
  });
  return dodaj(sredniaNajnizsza, nadwyzka);
}

function brakMiesiecy(ostrzezenia: Ostrzezenie[]): null {
  ostrzezenia.push({
    kod: 'BRAK_DANYCH',
    komunikat: 'Brak kwot za miesiące okresu odniesienia. Podaj wynagrodzenie albo podstawę składki za każdy pełny miesiąc ubezpieczenia.',
    podstawaPrawna: ['UZ art. 36 ust. 1 i 2'],
  });
  return null;
}

const POZA_ZAKRESEM: Record<keyof OkolicznosciPozaZakresem, { komunikat: string; podstawaPrawna: string[] }> = {
  zbiegTytulow: {
    komunikat: 'Masz więcej niż jeden tytuł ubezpieczenia. Policzyliśmy podstawę tylko z jednego; z każdego tytułu przysługuje osobny zasiłek.',
    podstawaPrawna: ['UZ art. 36', 'UZ art. 48'],
  },
  zmianaWymiaruCzasuPracy: {
    komunikat: 'Wymiar czasu pracy zmienił się w okresie odniesienia. Policzyliśmy podstawę z podanych miesięcy po zmianie; ostatecznie ustala ją płatnik albo ZUS.',
    podstawaPrawna: ['UZ art. 40'],
  },
  skladnikiWylaczone: {
    komunikat: 'Część składników wynagrodzenia może nie wchodzić do podstawy (np. zachowanych w czasie zasiłku). Nie uwzględniamy tych wyłączeń.',
    podstawaPrawna: ['UZ art. 41'],
  },
  przejscieZInnegoTytulu: {
    komunikat: 'Ubezpieczenie zaczęło się krótko po innym tytule. Nie doliczamy miesięcy z poprzedniego tytułu.',
    podstawaPrawna: ['UZ art. 48a ust. 2–4', 'UZ art. 49 ust. 2 i 3'],
  },
};

/** Okoliczności spoza MVP: liczymy dalej, ale wynik oznaczamy jako orientacyjny. */
function ostrzezeniaPozaZakresem(okolicznosci: OkolicznosciPozaZakresem | undefined): Ostrzezenie[] {
  if (!okolicznosci) return [];
  return (Object.keys(POZA_ZAKRESEM) as (keyof OkolicznosciPozaZakresem)[])
    .filter((k) => okolicznosci[k] === true)
    .map((k) => ({ kod: 'WYNIK_ORIENTACYJNY', komunikat: `Wynik orientacyjny. ${POZA_ZAKRESEM[k].komunikat}`, podstawaPrawna: POZA_ZAKRESEM[k].podstawaPrawna }));
}

/** Przycina miesięczną podstawę składki chorobowej do dopuszczalnego maksimum. */
type Limit = (kwota: Grosze) => Grosze;

const bezLimitu: Limit = (kwota) => kwota;

/**
 * Dobrowolna składka chorobowa ma górną granicę podstawy (250% prognozowanego przeciętnego wynagrodzenia),
 * więc wyższa kwota nie może zwiększyć podstawy zasiłku. Ostrzeżenie dodajemy raz.
 */
function limitSkladki(maks: Grosze, ostrzezenia: Ostrzezenie[]): Limit {
  let ostrzezono = false;
  return (kwota) => {
    if (kwota <= maks) return kwota;
    if (!ostrzezono) {
      ostrzezono = true;
      ostrzezenia.push({
        kod: 'PODSTAWA_SKLADKI_PONAD_MAKSIMUM',
        komunikat: `Podana podstawa składki chorobowej przekracza maksimum ${kwotaTekst(maks)} miesięcznie. Do wyliczenia przyjęliśmy maksimum.`,
        podstawaPrawna: ['ustawa o systemie ubezpieczeń społecznych art. 20 ust. 3', 'UZ art. 3 pkt 4'],
      });
    }
    return maks;
  };
}
