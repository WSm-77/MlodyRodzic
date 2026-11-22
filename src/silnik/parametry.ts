/**
 * Zestaw parametrów prawnych. Jedyne miejsce w silniku, w którym wolno trzymać wartości prawne
 * (kwoty, procenty, liczby tygodni i dni, terminy). Reguły dostają zestaw jako wejście;
 * wybór zestawu według daty zdarzenia należy do wywołującego.
 *
 * Jednostki: kwoty w groszach, stawki w promilach (1000 = 100%), odliczenie w punktach bazowych
 * (10000 = 100%), czas w tygodniach / dniach / miesiącach / latach zgodnie z nazwą pola.
 */

import type { ISODate } from './typy';

export type StatusParametru = 'potwierdzony' | 'do_potwierdzenia';

export interface Parametr<T = number> {
  wartosc: T;
  /** Przepis albo dokument, z którego pochodzi wartość. */
  zrodlo: string;
  status: StatusParametru;
}

export interface ParametryPrawne {
  // --- Podstawa wymiaru (UZ rozdz. 8) ---
  /** Odliczenie składek społecznych finansowanych przez ubezpieczonego, punkty bazowe (1371 = 13,71%). */
  odliczenieSkladek: Parametr;
  /** Dzielnik podstawy przy liczeniu kwoty za 1 dzień. */
  dzielnikDzienny: Parametr;
  /** Minimalne wynagrodzenie za pracę, grosze/mies. */
  placaMinimalna: Parametr;
  /** Maksymalna miesięczna podstawa dobrowolnej składki chorobowej (250% prognozowanego przeciętnego), grosze. */
  maksPodstawaSkladkiChorobowej: Parametr;
  /** Prognozowane przeciętne wynagrodzenie, grosze/mies. */
  prognozowanePrzecietneWynagrodzenie: Parametr;
  /** Najniższa podstawa składek działalności („duży ZUS”, 60% prognozowanego), grosze/mies. */
  najnizszaPodstawaDzialalnosci: Parametr;
  /** Pełne miesiące okresu odniesienia podstawy. */
  miesiaceOkresuOdniesienia: Parametr;

  // --- Zadłużenie składkowe (UZ art. 2a) ---
  /** Próg zadłużenia jako część płacy minimalnej, promile (10 = 1%). Blokuje kwota przekraczająca próg. */
  progZadluzenia: Parametr;
  /** Okres na spłatę zadłużenia od dnia powstania prawa, miesiące; potem prawo się przedawnia. */
  miesiaceNaSplateZadluzenia: Parametr;

  // --- Zasiłek chorobowy w ciąży (UZ rozdz. 2, KP art. 92) ---
  okresWyczekiwaniaObowiazkowe: Parametr;
  okresWyczekiwaniaDobrowolne: Parametr;
  /** Przerwa między okresami ubezpieczenia, która nie przerywa okresu wyczekiwania, dni (włącznie). */
  przerwaNieprzerywajacaWyczekiwania: Parametr;
  okresZasilkowyDni: Parametr;
  okresZasilkowyCiazaDni: Parametr;
  okresZasilkowyPoUstaniuDni: Parametr;
  /** Przerwa między niezdolnościami, przy której okresy wlicza się do jednego okresu zasiłkowego, dni. */
  przerwaLaczacaOkresZasilkowy: Parametr;
  /** Niezdolność po ustaniu tytułu: musi powstać najpóźniej tyle dni po ustaniu. */
  dniNaNiezdolnoscPoUstaniu: Parametr;
  /** Niezdolność po ustaniu tytułu: minimalny czas trwania bez przerwy, dni. */
  minimalnaNiezdolnoscPoUstaniu: Parametr;
  stawkaChorobowy: Parametr;
  stawkaChorobowyCiaza: Parametr;
  dniWynagrodzeniaChorobowego: Parametr;
  dniWynagrodzeniaChorobowego50: Parametr;
  swiadczenieRehabilitacyjneMaksMiesiace: Parametr;
  stawkaRehabilitacyjnePierwsze3Miesiace: Parametr;
  /** Przez tyle pierwszych miesięcy świadczenia rehabilitacyjnego obowiązuje wyższa stawka. */
  miesiaceStawkiRehabilitacyjnejPierwszej: Parametr;
  stawkaRehabilitacyjneDalej: Parametr;
  stawkaRehabilitacyjneCiaza: Parametr;
  /** Umowa terminowa przedłuża się do porodu, jeśli rozwiązałaby się po upływie tylu miesięcy ciąży. */
  miesiaceCiazyOchronyUmowyTerminowej: Parametr;
  /** Okres próbny nieprzekraczający tylu miesięcy nie przedłuża się do porodu. */
  maksOkresProbnyBezPrzedluzenia: Parametr;
  /** „Za miesiąc uważa się 30 dni” przy okresach zasiłku chorobowego i świadczenia rehabilitacyjnego, dni. */
  dniMiesiacaZasilkowego: Parametr;
  /** Od tego dnia jeden okres zasiłkowy niezależnie od liczby tytułów i zwolnienie z części tytułów (ISO). */
  dataJednegoOkresuZasilkowego: Parametr<ISODate>;

  // --- Urlop macierzyński (KP art. 180–182) ---
  /** Wymiar wg liczby dzieci przy jednym porodzie: indeks 0 = 1 dziecko, ostatni = 5 i więcej, tygodnie. */
  tygodnieMacierzynskiego: Parametr<readonly number[]>;
  tygodniePrzedPorodemMaks: Parametr;
  /** Część urlopu po porodzie zastrzeżona dla matki przy rezygnacji, tygodnie. */
  tygodnieMacierzynskiegoTylkoMatki: Parametr;
  /** Minimum po porodzie w przypadkach szczególnych (orzeczenie, szpital, porzucenie), tygodnie. */
  tygodnieMacierzynskiegoMinimum: Parametr;
  tygodnieMartweUrodzenie: Parametr;
  /** Prawo do urlopu trwa jeszcze tyle dni od dnia zgonu dziecka. */
  dniPoZgonieDziecka: Parametr;

  // --- Uzupełniający urlop macierzyński (KP art. 180²) ---
  /** Granica kategorii A: poród przed ukończeniem tego tygodnia ciąży. */
  tydzienCiazyKategoriaA: Parametr;
  /** Granica kategorii B: poród przed ukończeniem tego tygodnia ciąży. */
  tydzienCiazyKategoriaB: Parametr;
  /** Masa urodzeniowa nie większa niż ta wartość daje kategorię A, gramy. */
  masaGranicznaKategoriaA: Parametr;
  tygodnieUzupelniajacyA: Parametr;
  tygodnieUzupelniajacyB: Parametr;
  tygodnieUzupelniajacyC: Parametr;
  /** Okna liczenia hospitalizacji, dni po porodzie (dzień porodu = 1), włącznie. */
  oknoUzupelniajacyA: Parametr<{ od: number; do: number }>;
  oknoUzupelniajacyB: Parametr<{ od: number; do: number }>;
  oknoUzupelniajacyC: Parametr<{ od: number; do: number }>;
  /** Warunek wejścia kategorii C: pierwszy dzień pobytu w tym przedziale dni po porodzie. */
  oknoStartuPobytuC: Parametr<{ od: number; do: number }>;
  /** Warunek wejścia kategorii C: minimalna liczba kolejnych dni pobytu. */
  minimalneKolejneDniPobytuC: Parametr;
  /** Wniosek o uzupełniający najpóźniej tyle dni przed końcem urlopu macierzyńskiego. */
  dniWnioskuUzupelniajacegoPrzedKoncem: Parametr;

  // --- Przyjęcie dziecka na wychowanie (KP art. 183) ---
  wiekMaksPrzysposobienie: Parametr;
  wiekMaksRodzinaZastepcza: Parametr;
  wiekMaksRodzinaZastepczaOdroczenie: Parametr;
  tygodnieNaWarunkachMinimum: Parametr;
  tygodnieRodzicielskiegoPrzyMinimum: Parametr;
  tygodnieRodzicielskiegoPrzyMinimumZaZyciem: Parametr;

  // --- Urlop rodzicielski (KP art. 182¹ᵃ–182¹ᵍ) ---
  tygodnieRodzicielskiego: Parametr;
  tygodnieRodzicielskiegoMnogi: Parametr;
  tygodnieRodzicielskiegoZaZyciem: Parametr;
  tygodnieRodzicielskiegoZaZyciemMnogi: Parametr;
  /** Część wyłącznie dla każdego z rodziców, nieprzenoszalna, tygodnie. */
  tygodnieNieprzenoszalne: Parametr;
  maksCzesciRodzicielskiego: Parametr;
  /** Rodzicielski najpóźniej do końca roku kalendarzowego, w którym dziecko kończy tyle lat. */
  rokZyciaKoniecRodzicielskiego: Parametr;
  /** Maksymalny wymiar pracy przy łączeniu z rodzicielskim, promile etatu (500 = ½). */
  maksWymiarPracyPrzyLaczeniu: Parametr;

  // --- Urlop ojcowski (KP art. 182³) ---
  tygodnieOjcowskiego: Parametr;
  maksCzesciOjcowskiego: Parametr;
  minimalnaCzescOjcowskiegoTygodnie: Parametr;
  miesiaceNaOjcowski: Parametr;
  wiekMaksOjcowskiPrzysposobienie: Parametr;

  // --- Wysokość zasiłku macierzyńskiego (UZ art. 30a, 31) ---
  stawkaMacierzynski: Parametr;
  stawkaRodzicielski: Parametr;
  stawkaJednolita: Parametr;
  /** Wniosek o wariant 81,5% najpóźniej tyle dni po porodzie / przyjęciu (bez dnia zdarzenia). */
  dniNaWniosek815: Parametr;
  /** Wariant 81,5% przepada, jeśli w tylu miesiącach życia dziecka nie wykorzystano dnia rodzicielskiego. */
  miesiaceNaRozpoczecieRodzicielskiego815: Parametr;
  /** Kwota świadczenia rodzicielskiego (dolny próg miesięcznego zasiłku), grosze. */
  kwotaSwiadczeniaRodzicielskiego: Parametr;
}

export type KluczParametru = keyof ParametryPrawne;

const UZ = 'UZ';
const KP = 'KP';

/** Domyślny zestaw na 2026 r. Wartości ze specu #14 i docs/research (podstawa-wymiaru.md §1, reguly-wymiaru-zasilku-macierzynskiego.md §1). */
export const PARAMETRY_2026: ParametryPrawne = {
  odliczenieSkladek: { wartosc: 1371, zrodlo: `${UZ} art. 3 pkt 3 i 4; Załącznik „Podstawa wymiaru”`, status: 'potwierdzony' },
  dzielnikDzienny: { wartosc: 30, zrodlo: `${UZ} art. 36 ust. 3 (w zw. z art. 47)`, status: 'potwierdzony' },
  placaMinimalna: { wartosc: 480_600, zrodlo: 'Załącznik pkt 2 (minimalne wynagrodzenie 2026)', status: 'do_potwierdzenia' },
  maksPodstawaSkladkiChorobowej: { wartosc: 2_355_000, zrodlo: 'Załącznik „Dla nie pracowników”; Poradnik ZUS 2026', status: 'potwierdzony' },
  prognozowanePrzecietneWynagrodzenie: { wartosc: 942_000, zrodlo: 'wyliczone: 23 550 zł / 2,5', status: 'do_potwierdzenia' },
  najnizszaPodstawaDzialalnosci: { wartosc: 565_200, zrodlo: 'Poradnik ZUS 2026 (60% prognozowanego przeciętnego); kwota wyliczona', status: 'do_potwierdzenia' },
  miesiaceOkresuOdniesienia: { wartosc: 12, zrodlo: `${UZ} art. 36 ust. 1, art. 48 ust. 1`, status: 'potwierdzony' },

  progZadluzenia: { wartosc: 10, zrodlo: `${UZ} art. 2a ust. 1`, status: 'potwierdzony' },
  miesiaceNaSplateZadluzenia: { wartosc: 6, zrodlo: `${UZ} art. 2a ust. 2`, status: 'potwierdzony' },

  okresWyczekiwaniaObowiazkowe: { wartosc: 30, zrodlo: `${UZ} art. 4 ust. 1 pkt 1`, status: 'potwierdzony' },
  okresWyczekiwaniaDobrowolne: { wartosc: 90, zrodlo: `${UZ} art. 4 ust. 1 pkt 2`, status: 'potwierdzony' },
  przerwaNieprzerywajacaWyczekiwania: { wartosc: 30, zrodlo: `${UZ} art. 4 ust. 2`, status: 'potwierdzony' },
  okresZasilkowyDni: { wartosc: 182, zrodlo: `${UZ} art. 8 ust. 1`, status: 'potwierdzony' },
  okresZasilkowyCiazaDni: { wartosc: 270, zrodlo: `${UZ} art. 8 ust. 1`, status: 'potwierdzony' },
  okresZasilkowyPoUstaniuDni: { wartosc: 91, zrodlo: `${UZ} art. 8 ust. 2`, status: 'potwierdzony' },
  przerwaLaczacaOkresZasilkowy: { wartosc: 60, zrodlo: `${UZ} art. 9 ust. 2`, status: 'potwierdzony' },
  dniNaNiezdolnoscPoUstaniu: { wartosc: 14, zrodlo: `${UZ} art. 7 pkt 1`, status: 'potwierdzony' },
  minimalnaNiezdolnoscPoUstaniu: { wartosc: 30, zrodlo: `${UZ} art. 7`, status: 'potwierdzony' },
  stawkaChorobowy: { wartosc: 800, zrodlo: `${UZ} art. 11 ust. 1`, status: 'potwierdzony' },
  stawkaChorobowyCiaza: { wartosc: 1000, zrodlo: `${UZ} art. 11 ust. 2`, status: 'potwierdzony' },
  dniWynagrodzeniaChorobowego: { wartosc: 33, zrodlo: `${KP} art. 92 § 1 pkt 1`, status: 'potwierdzony' },
  dniWynagrodzeniaChorobowego50: { wartosc: 14, zrodlo: `${KP} art. 92 § 1 pkt 1`, status: 'potwierdzony' },
  swiadczenieRehabilitacyjneMaksMiesiace: { wartosc: 12, zrodlo: `${UZ} art. 18 ust. 2`, status: 'potwierdzony' },
  stawkaRehabilitacyjnePierwsze3Miesiace: { wartosc: 900, zrodlo: `${UZ} art. 19 ust. 1`, status: 'potwierdzony' },
  miesiaceStawkiRehabilitacyjnejPierwszej: { wartosc: 3, zrodlo: `${UZ} art. 19 ust. 1`, status: 'potwierdzony' },
  stawkaRehabilitacyjneDalej: { wartosc: 750, zrodlo: `${UZ} art. 19 ust. 1`, status: 'potwierdzony' },
  stawkaRehabilitacyjneCiaza: { wartosc: 1000, zrodlo: `${UZ} art. 19 ust. 1`, status: 'potwierdzony' },
  miesiaceCiazyOchronyUmowyTerminowej: { wartosc: 3, zrodlo: `${KP} art. 177 § 3`, status: 'potwierdzony' },
  maksOkresProbnyBezPrzedluzenia: { wartosc: 1, zrodlo: `${KP} art. 177 § 3`, status: 'potwierdzony' },
  dniMiesiacaZasilkowego: { wartosc: 30, zrodlo: `${UZ} art. 11 ust. 5 (w zw. z art. 22)`, status: 'potwierdzony' },
  dataJednegoOkresuZasilkowego: {
    wartosc: '2027-01-01',
    zrodlo: `${UZ} art. 9 ust. 4, art. 17 ust. 1c–1e (w mocy od 1.01.2027)`,
    status: 'do_potwierdzenia',
  },

  tygodnieMacierzynskiego: { wartosc: [20, 31, 33, 35, 37], zrodlo: `${KP} art. 180 § 1`, status: 'potwierdzony' },
  tygodniePrzedPorodemMaks: { wartosc: 6, zrodlo: `${KP} art. 180 § 2`, status: 'potwierdzony' },
  tygodnieMacierzynskiegoTylkoMatki: { wartosc: 14, zrodlo: `${KP} art. 180 § 4`, status: 'potwierdzony' },
  tygodnieMacierzynskiegoMinimum: { wartosc: 8, zrodlo: `${KP} art. 180 § 6, § 10, § 13; art. 182`, status: 'potwierdzony' },
  tygodnieMartweUrodzenie: { wartosc: 8, zrodlo: `${KP} art. 180¹ § 1`, status: 'potwierdzony' },
  dniPoZgonieDziecka: { wartosc: 7, zrodlo: `${KP} art. 180¹ § 1 i § 2`, status: 'potwierdzony' },

  tydzienCiazyKategoriaA: { wartosc: 28, zrodlo: `${KP} art. 180² § 1 pkt 1`, status: 'potwierdzony' },
  tydzienCiazyKategoriaB: { wartosc: 37, zrodlo: `${KP} art. 180² § 1 pkt 2`, status: 'potwierdzony' },
  masaGranicznaKategoriaA: { wartosc: 1000, zrodlo: `${KP} art. 180² § 1 pkt 1`, status: 'potwierdzony' },
  tygodnieUzupelniajacyA: { wartosc: 15, zrodlo: `${KP} art. 180² § 1 pkt 1`, status: 'potwierdzony' },
  tygodnieUzupelniajacyB: { wartosc: 8, zrodlo: `${KP} art. 180² § 1 pkt 2`, status: 'potwierdzony' },
  tygodnieUzupelniajacyC: { wartosc: 8, zrodlo: `${KP} art. 180² § 1 pkt 3`, status: 'potwierdzony' },
  oknoUzupelniajacyA: { wartosc: { od: 1, do: 105 }, zrodlo: `${KP} art. 180² § 1 pkt 1`, status: 'potwierdzony' },
  oknoUzupelniajacyB: { wartosc: { od: 1, do: 56 }, zrodlo: `${KP} art. 180² § 1 pkt 2`, status: 'potwierdzony' },
  oknoUzupelniajacyC: { wartosc: { od: 5, do: 56 }, zrodlo: `${KP} art. 180² § 1 pkt 3`, status: 'potwierdzony' },
  oknoStartuPobytuC: { wartosc: { od: 5, do: 28 }, zrodlo: `${KP} art. 180² § 1 pkt 3`, status: 'potwierdzony' },
  minimalneKolejneDniPobytuC: { wartosc: 2, zrodlo: `${KP} art. 180² § 1 pkt 3`, status: 'potwierdzony' },
  dniWnioskuUzupelniajacegoPrzedKoncem: { wartosc: 21, zrodlo: `${KP} art. 180² § 4`, status: 'potwierdzony' },

  wiekMaksPrzysposobienie: { wartosc: 14, zrodlo: `${KP} art. 183 § 1¹; ${UZ} art. 29 ust. 1 pkt 2`, status: 'potwierdzony' },
  wiekMaksRodzinaZastepcza: { wartosc: 7, zrodlo: `${KP} art. 183 § 1; ${UZ} art. 29 ust. 1 pkt 3`, status: 'potwierdzony' },
  wiekMaksRodzinaZastepczaOdroczenie: { wartosc: 10, zrodlo: `${KP} art. 183 § 1; ${UZ} art. 29 ust. 1 pkt 3`, status: 'potwierdzony' },
  tygodnieNaWarunkachMinimum: { wartosc: 9, zrodlo: `${KP} art. 183 § 3`, status: 'potwierdzony' },
  tygodnieRodzicielskiegoPrzyMinimum: { wartosc: 38, zrodlo: `${KP} art. 183 § 4 pkt 3, § 4²`, status: 'potwierdzony' },
  tygodnieRodzicielskiegoPrzyMinimumZaZyciem: { wartosc: 62, zrodlo: `${KP} art. 183 § 4³ pkt 3, § 4⁵`, status: 'potwierdzony' },

  tygodnieRodzicielskiego: { wartosc: 41, zrodlo: `${KP} art. 182¹ᵃ § 1 pkt 1`, status: 'potwierdzony' },
  tygodnieRodzicielskiegoMnogi: { wartosc: 43, zrodlo: `${KP} art. 182¹ᵃ § 1 pkt 2`, status: 'potwierdzony' },
  tygodnieRodzicielskiegoZaZyciem: { wartosc: 65, zrodlo: `${KP} art. 182¹ᵃ § 2 pkt 1`, status: 'potwierdzony' },
  tygodnieRodzicielskiegoZaZyciemMnogi: { wartosc: 67, zrodlo: `${KP} art. 182¹ᵃ § 2 pkt 2`, status: 'potwierdzony' },
  tygodnieNieprzenoszalne: { wartosc: 9, zrodlo: `${KP} art. 182¹ᵃ § 4; ${UZ} art. 31 ust. 3f`, status: 'potwierdzony' },
  maksCzesciRodzicielskiego: { wartosc: 5, zrodlo: `${KP} art. 182¹ᶜ`, status: 'potwierdzony' },
  rokZyciaKoniecRodzicielskiego: { wartosc: 6, zrodlo: `${KP} art. 182¹ᶜ`, status: 'potwierdzony' },
  maksWymiarPracyPrzyLaczeniu: { wartosc: 500, zrodlo: `${KP} art. 182¹ᵉ § 1`, status: 'potwierdzony' },

  tygodnieOjcowskiego: { wartosc: 2, zrodlo: `${KP} art. 182³ § 1`, status: 'potwierdzony' },
  maksCzesciOjcowskiego: { wartosc: 2, zrodlo: `${KP} art. 182³ § 1¹`, status: 'potwierdzony' },
  minimalnaCzescOjcowskiegoTygodnie: { wartosc: 1, zrodlo: `${KP} art. 182³ § 1¹`, status: 'potwierdzony' },
  miesiaceNaOjcowski: { wartosc: 12, zrodlo: `${KP} art. 182³ § 1 pkt 1`, status: 'potwierdzony' },
  wiekMaksOjcowskiPrzysposobienie: { wartosc: 14, zrodlo: `${KP} art. 182³ § 1 pkt 2`, status: 'potwierdzony' },

  stawkaMacierzynski: { wartosc: 1000, zrodlo: `${UZ} art. 31 ust. 1`, status: 'potwierdzony' },
  stawkaRodzicielski: { wartosc: 700, zrodlo: `${UZ} art. 31 ust. 2`, status: 'potwierdzony' },
  stawkaJednolita: { wartosc: 815, zrodlo: `${UZ} art. 31 ust. 3`, status: 'potwierdzony' },
  dniNaWniosek815: { wartosc: 21, zrodlo: `${UZ} art. 30a ust. 1 i 2`, status: 'potwierdzony' },
  miesiaceNaRozpoczecieRodzicielskiego815: { wartosc: 12, zrodlo: `${UZ} art. 31 ust. 3g`, status: 'potwierdzony' },
  kwotaSwiadczeniaRodzicielskiego: { wartosc: 100_000, zrodlo: `${UZ} art. 31 ust. 3a (kwota z ustawy o świadczeniach rodzinnych, spoza materiałów)`, status: 'do_potwierdzenia' },
};

/**
 * Pomocnik dla reguł: odczytuje wartość parametru i notuje go w zbiorze użytych niepotwierdzonych.
 * Każdy szew tworzy własny zbiór i oddaje go w `niepotwierdzoneParametry`.
 */
export function odczytaj<K extends KluczParametru>(
  parametry: ParametryPrawne,
  klucz: K,
  niepotwierdzone: Set<KluczParametru>,
): ParametryPrawne[K]['wartosc'] {
  const p = parametry[klucz];
  if (p.status === 'do_potwierdzenia') niepotwierdzone.add(klucz);
  return p.wartosc;
}
