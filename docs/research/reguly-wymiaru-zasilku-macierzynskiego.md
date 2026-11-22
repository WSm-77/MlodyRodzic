# Reguły wymiaru i wysokości zasiłku macierzyńskiego — specyfikacja silnika

Issue: #3. Cel: specyfikacja, z której da się zaimplementować **czysty silnik reguł w TS** (bez I/O), wyliczający dla danej sytuacji **wymiar zasiłku** (maksymalny czas trwania) za każdy **urlop związany z rodzicielstwem** oraz **wysokość zasiłku** (stawka × podstawa wymiaru zasiłku) z rozkładem kwot na okresy.

Słownictwo zgodne z `GLOSSARY.md` (ubezpieczony, płatnik, świadczeniobiorca, podstawa wymiaru zasiłku, wymiar zasiłku, urlop związany z rodzicielstwem).

## Źródła i skróty

| Skrót | Źródło (plik w `docs/task/`) | Zaufanie |
|---|---|---|
| **KP** | `Kodeks pracy (wyciąg z przepisów).md` — dział VIII, art. 175¹–184 | wysokie (przepis) |
| **UZ** | `wyciąg z ustawy o świadczeniach pieniężnych … (ustawa zasiłkowa).md` — art. 29–31, 36, 45, 47 | wysokie (przepis) |
| **ZAŁ** | `Załącznik_ maksymalny czas trwania zasiłków, wysokość, podstawa wymiaru.docx.md` | wysokie (materiał organizatora, streszczenie) |
| **POR** | `Poradnik dla rodziców, ZUS 2026.md` (s. 27–35) | średnie (omówienie ZUS, miejscami nieprecyzyjne) |
| **ZAD** | `ZUS - Pełna treść zadania konkursowego.md` | kontekst |

Przy konflikcie: przepis (KP/UZ) > ZAŁ > POR. Notatnika NotebookLM nie użyto (opcjonalny; wszystkie potrzebne przepisy są w wyciągach).

Ważna zasada ogólna: zasiłek macierzyński przysługuje **przez okres ustalony przepisami KP jako okres** odpowiedniego urlopu (UZ art. 29a ust. 1). Ubezpieczony, który nie jest pracownikiem (zleceniobiorca, przedsiębiorca), nie dostaje urlopu, ale ma zasiłek za **okres odpowiadający** urlopowi — na tych samych zasadach co do wymiaru i wysokości (ZAD l. 129, 149; KP art. 184).

---

## 1. Model danych silnika (wejście / wyjście)

```ts
type Data = string; // ISO 'YYYY-MM-DD'

type Zdarzenie =
  | { rodzaj: 'urodzenie'; dataPorodu: Data; tygodniePrzedPorodem: number /* 0..6 */ }
  | { rodzaj: 'przysposobienie'; dataPrzyjecia: Data }            // przyjęcie + wniosek do sądu opiekuńczego
  | { rodzaj: 'rodzinaZastepczaNiezawodowa'; dataPrzyjecia: Data };

interface Dziecko {
  dataUrodzenia: Data;
  martweUrodzenie?: boolean;
  dataZgonu?: Data;
  masaUrodzeniowaG?: number;           // dla uzupełniającego urlopu
  ukonczoneTygodnieCiazy?: number;     // tydzień ciąży przy porodzie (ukończone tygodnie)
  hospitalizacje?: { od: Data; do: Data }[];  // pobyty w szpitalu po porodzie / po przyjęciu
  odroczenieObowiazkuSzkolnego?: boolean;     // tylko rodzina zastępcza
  zaswiadczenieZaZyciem?: boolean;            // art. 4 ust. 3 ustawy „Za życiem”
}

interface Rodzic {
  id: 'matka' | 'ojciec' | 'inny';     // 'inny' = inny członek najbliższej rodziny (KP art. 175¹ pkt 3–4)
  ubezpieczony: boolean;               // podlega ubezpieczeniu chorobowemu w dniu powstania prawa
  pracownik: boolean;                  // umowa o pracę (urlop) vs. „okres odpowiadający” urlopowi
  podstawaWymiaru: number;             // miesięczna podstawa wymiaru zasiłku (zł) — liczona osobno (inne issue)
  orzeczenieNiezdolnosciDoSamodzielnejEgzystencji?: boolean;
}

interface Wniosek815 { zlozony: boolean; dataZlozenia?: Data } // UZ art. 30a

interface OkresPlanowany {          // jak rodzina chce wykorzystać urlopy (opcjonalne; bez tego silnik liczy maksimum)
  rodzaj: RodzajUrlopu; rodzic: Rodzic['id']; od: Data; do: Data;
  wymiarPracy?: number;             // 0..0.5 — łączenie rodzicielskiego z pracą (KP art. 182¹ᵉ)
}

type RodzajUrlopu =
  | 'macierzynski' | 'naWarunkachMacierzynskiego' | 'uzupelniajacyMacierzynski'
  | 'rodzicielski' | 'ojcowski';

// WYJŚCIE
interface OkresZasilku {
  rodzaj: RodzajUrlopu;
  rodzic: Rodzic['id'];
  od: Data; do: Data; dni: number;
  stawka: 1.0 | 0.815 | 0.7 | number;  // number: po redukcji za łączenie z pracą
  kwotaDzienna: number;                  // zł, zaokrąglona do grosza
  kwota: number;                         // kwotaDzienna × dni (+ ewentualne podwyższenie do kwoty minimalnej)
  podstawaPrawna: string[];              // np. ['KP art. 180 § 1 pkt 1', 'UZ art. 31 ust. 1']
}

interface Wynik {
  wymiary: Record<RodzajUrlopu, { tygodnie: number; dni: number; podstawaPrawna: string[] }>;
  okresy: OkresZasilku[];
  ostrzezenia: string[];   // np. „wniosek 81,5% złożony po 21 dniach — stawka 100/70”
}
```

Stałe (parametryzowane, nie zaszyte w regułach):

```ts
const DNI_W_TYGODNIU = 7;                     // KP art. 183¹ § 1
const DZIELNIK_DZIENNY = 30;                  // UZ art. 36 ust. 3 (via art. 47)
const KWOTA_SWIADCZENIA_RODZICIELSKIEGO = 1000; // zł/mies. — UZ art. 31 ust. 3a odsyła do ustawy o świadczeniach rodzinnych; kwota SPOZA źródeł → Otwarte kwestie
const PLACA_MINIMALNA_2026 = 4806;            // ZAŁ, „Minimalna podstawa”
const SKLADKI_PRACOWNIKA = 0.1371;            // ZAŁ; UZ art. 45 ust. 1
```

Konwencja liczenia dni: **dzień porodu = dzień 1** (KP art. 183¹ § 2: pierwszym dniem urlopu macierzyńskiego jest dzień porodu, gdy nie korzystano z urlopu przed porodem). „n-ty dzień po porodzie” = dzień o numerze n; „upływ k-tego tygodnia po porodzie” = koniec dnia 7·k. Patrz Otwarte kwestie OK-3.

---

## 2. Urlop macierzyński (urodzenie dziecka)

### 2.1 Wymiar wg liczby dzieci urodzonych przy jednym porodzie

| Liczba dzieci (`n`) | Tygodnie | Dni | Przepis |
|---|---|---|---|
| 1 | 20 | 140 | KP art. 180 § 1 pkt 1 |
| 2 | 31 | 217 | KP art. 180 § 1 pkt 2 |
| 3 | 33 | 231 | KP art. 180 § 1 pkt 3 |
| 4 | 35 | 245 | KP art. 180 § 1 pkt 4 |
| ≥ 5 | 37 | 259 | KP art. 180 § 1 pkt 5 |

```ts
const WYMIAR_MACIERZYNSKI = (n: number) => n <= 1 ? 20 : n === 2 ? 31 : n === 3 ? 33 : n === 4 ? 35 : 37;
```

Zasady:
- Przed przewidywaną datą porodu maks. **6 tygodni** (KP art. 180 § 2); reszta po porodzie aż do wyczerpania wymiaru (§ 3). Tygodnie przed porodem **pomniejszają** część po porodzie.
- Bez urlopu przed porodem — start w dniu porodu (KP art. 183¹ § 2).
- Tydzień = 7 dni kalendarzowych (KP art. 183¹ § 1).
- **Pierwsze 14 tygodni po porodzie** (8 w przypadkach szczególnych, §6 niżej) — tylko matka (KP art. 180 § 4; POR l. 946).
- Porzucenie dziecka / umieszczenie w pieczy zastępczej lub zakładzie: matka traci część po tym dniu, ale urlop po porodzie ≥ 8 tygodni (KP art. 182).
- Dziecko wymagające opieki szpitalnej: po 8 tyg. po porodzie matka może odłożyć resztę urlopu do wyjścia dziecka ze szpitala (KP art. 181) — wymiar bez zmian, przesunięcie okresu.
- Stawka: **100%** (UZ art. 31 ust. 1) albo **81,5%** przy wniosku z art. 30a (§ 9).

### 2.2 Przejęcie urlopu macierzyńskiego przez ojca / innego członka rodziny

Okres drugiej osoby = **wymiar − okres wykorzystany przez matkę** (UZ art. 29a ust. 2; KP art. 180 § 14 — łącznie nie więcej niż wymiar z § 1).

| Przypadek | Minimum wykorzystane przez matkę **po porodzie** | Kto może przejąć | Przepis |
|---|---|---|---|
| Rezygnacja matki (powrót do pracy) | 14 tyg. | ojciec | KP art. 180 § 4–5; UZ art. 29 ust. 3 (ust. 4: odpowiednio przy adopcji/zastępczej) |
| Rezygnacja matki z orzeczeniem o niezdolności do samodzielnej egzystencji | 8 tyg. | ojciec albo inny członek najbliższej rodziny | KP art. 180 § 6–7; UZ art. 29 ust. 5 |
| Pobyt matki w szpitalu (stan zdrowia uniemożliwia opiekę) — **przerwanie** na czas pobytu | 8 tyg. | ojciec / inny członek rodziny; zasiłek matki przerywa się | KP art. 180 § 10–11; UZ art. 29 ust. 6 |
| Zgon matki | brak minimum | ojciec / inny członek rodziny — część po dniu zgonu | KP art. 180 § 12; UZ art. 29 ust. 7 |
| Porzucenie dziecka przez matkę | 8 tyg. | ojciec / inny członek rodziny — część po dniu porzucenia | KP art. 180 § 13; UZ art. 29 ust. 7 zd. 2 |
| Matka nieubezpieczona: zgon / porzucenie / orzeczenie o niezdolności do samodzielnej egzystencji | brak minimum | ojciec / inny członek rodziny — część po dniu zdarzenia | KP art. 180 § 15; UZ art. 29 ust. 9 |
| Matka bez tytułu do ubezpieczenia podejmuje zatrudnienie ≥ ½ etatu | brak minimum | ojciec — od dnia podjęcia zatrudnienia, nie dłużej niż trwa zatrudnienie matki | KP art. 180 § 17; UZ art. 29 ust. 10 |

Reguły silnika:
```
dniMatkiPoPorodzie >= minimum (14·7 albo 8·7, wg tabeli)
dniDrugiejOsoby = wymiarDni − dniMatki (przed + po porodzie)
dniDrugiejOsoby + dniMatki <= wymiarDni
```
Pułapka: **tygodnie przed porodem nie liczą się do 14 tygodni „po porodzie”**. Przy 1 dziecku i 6 tyg. przed porodem matce zostaje dokładnie 14 tyg. po porodzie, więc w trybie „rezygnacji” nie ma czego przekazać.

Wysokość zasiłku drugiej osoby: liczona od **jej własnej** podstawy wymiaru; stawka 100% (UZ art. 31 ust. 1). Przypadek przejęcia przy wniosku 81,5% — OK-6.

---

## 3. Martwe urodzenie i zgon dziecka

| Sytuacja | Wymiar urlopu macierzyńskiego | Przepis |
|---|---|---|
| Martwe urodzenie albo zgon przed upływem 8 tyg. życia | **8 tyg. po porodzie**, nie krócej niż **7 dni od dnia zgonu** | KP art. 180¹ § 1 zd. 1; POR l. 1062 |
| Zgon po upływie 8 tyg. życia | prawo zachowane przez **7 dni od dnia zgonu** | KP art. 180¹ § 2 zd. 1 |
| Poród mnogi, zgon części dzieci | wymiar **wg liczby dzieci pozostałych przy życiu** (tabela 2.1), nie krócej niż 7 dni od dnia zgonu | KP art. 180¹ § 1 zd. 2, § 2 zd. 2 |

Stawka 100% (POR l. 1112; UZ art. 31 ust. 1). Dotyczy też ubezpieczonych niebędących pracownicami (POR l. 1064).

Formuła (dzień porodu = dzień 1, `koniecPierwotny` = koniec urlopu przed zdarzeniem):
```
jeśli wszystkie dzieci zmarły / martwe:
  jeśli zgon (lub martwe urodzenie) przed upływem 56. dnia:
      koniec = max(porod + 55 dni, dataZgonu + 7 dni)
  inaczej:
      koniec = min(koniecPierwotny, dataZgonu + 7 dni)
jeśli część dzieci żyje:
  wymiar = WYMIAR_MACIERZYNSKI(liczbaZyjacych); koniec = max(start + wymiar − 1, dataZgonu + 7 dni)
```
Urlopy „następcze” po zgonie: KP art. 180¹ § 2 stosuje się odpowiednio do uzupełniającego (KP art. 180² § 7) i rodzicielskiego (KP art. 182¹ᵍ) — **prawo trwa 7 dni od dnia zgonu**, potem wygasa. Przy martwym urodzeniu nie powstaje prawo do urlopu rodzicielskiego, uzupełniającego ani ojcowskiego (brak dziecka, nad którym sprawuje się opiekę — wniosek z celu urlopów, KP art. 182¹ᵃ § 1, 182³ § 1).

Poza zakresem zasiłku macierzyńskiego, ale warte pokazania: zasiłek pogrzebowy 7000 zł przy martwym urodzeniu (POR l. 1152).

---

## 4. Uzupełniający urlop macierzyński (wcześniak / hospitalizacja)

Przysługuje matce **albo** ojcu wychowującemu dziecko, **bezpośrednio po** urlopie macierzyńskim, **jednorazowo** (KP art. 180² § 1, § 4). Stawka **100%** — także gdy złożono wniosek 81,5% (UZ art. 31 ust. 1; ust. 3 nie obejmuje tego urlopu; ZAŁ tabela „Wysokość”; POR l. 1108).

### 4.1 Kategoria (decyzja)

| Kat. | Warunek | Okno liczenia hospitalizacji | Maks. | Przepis |
|---|---|---|---|---|
| **A** | urodzenie **przed ukończeniem 28. tyg.** ciąży **LUB** masa **≤ 1000 g** | dni 1–105 (do upływu 15. tyg. po porodzie) | 15 tyg. | KP art. 180² § 1 pkt 1 |
| **B** | **po ukończeniu 28.** i **przed ukończeniem 37.** tyg. **I** masa **> 1000 g** | dni 1–56 (do upływu 8. tyg.) | 8 tyg. | KP art. 180² § 1 pkt 2 |
| **C** | **po ukończeniu 37.** tyg.; warunek wejścia: pobyt ≥ **2 kolejne dni**, z których pierwszy w dniach **5–28** po porodzie | dni 5–56 | 8 tyg. | KP art. 180² § 1 pkt 3 |

```ts
function kategoria(tyg: number, masaG: number): 'A' | 'B' | 'C' {
  if (tyg < 28 || masaG <= 1000) return 'A';
  if (tyg < 37) return 'B';            // tu masa > 1000 z definicji
  return 'C';
}
```

### 4.2 Wymiar

```
dniHosp = liczba różnych dni kalendarzowych pobytu w szpitalu ∩ okno kategorii   // okresy SUMUJE SIĘ (§ 3)
tygodnie = ceil(dniHosp / 7)                                                      // niepełny tydzień w górę (§ 3)
dla C: jeśli brak pobytu ≥2 kolejnych dni z 1. dniem w [5..28] → 0
wymiar = min(tygodnie, maks. kategorii)
```

- Poród mnogi: kategoria wg **najniższej masy urodzeniowej**, liczba dni wg **dziecka najdłużej hospitalizowanego** (KP art. 180² § 2; ZAŁ wiersz 6). Tydzień ciąży jest wspólny dla porodu.
- Adopcja / rodzina zastępcza: uzupełniający przysługuje, jeżeli pobyt w szpitalu był **po przyjęciu** dziecka na wychowanie (KP art. 183 § 3¹).
- Wniosek ≥ 21 dni przed końcem urlopu macierzyńskiego + zaświadczenie ze szpitala (KP art. 180² § 4–5); oświadczenie drugiego rodzica, że nie korzysta (POR l. 1004). Dla silnika: ostrzeżenie o terminie, nie warunek wymiaru.

---

## 5. Przyjęcie dziecka na wychowanie (urlop na warunkach urlopu macierzyńskiego)

### 5.1 Uprawnienie i limity wieku dziecka

| Tryb | Wiek dziecka przy przyjęciu (prawo do zasiłku) | Urlop trwa nie dłużej niż do | Przepis |
|---|---|---|---|
| Przysposobienie (przyjęcie + wniosek do sądu opiekuńczego) | do 14. roku życia | ukończenia przez dziecko **14** lat | KP art. 183 § 1¹; UZ art. 29 ust. 1 pkt 2 |
| Rodzina zastępcza **niezawodowa** | do 7. roku życia (**10.** przy odroczeniu obowiązku szkolnego) | ukończenia **7** (**10**) lat | KP art. 183 § 1; UZ art. 29 ust. 1 pkt 3 |
| Rodzina zastępcza **zawodowa** | **brak prawa** | — | KP art. 183 § 1; UZ art. 29 ust. 1 pkt 3 |

Uprawniony może być mężczyzna i kobieta (UZ art. 29 ust. 2).

### 5.2 Wymiar

| Liczba dzieci przyjętych jednocześnie | Urlop na warunkach macierzyńskiego | Rodzicielski | Rodzicielski „Za życiem” | Przepis |
|---|---|---|---|---|
| 1 | 20 tyg. | 41 tyg. | 65 tyg. | KP art. 183 § 1, § 1¹, § 4, § 4¹, § 4³, § 4⁴ |
| 2 | 31 | 43 | 67 | j.w. |
| 3 | 33 | 43 | 67 | j.w. |
| 4 | 35 | 43 | 67 | j.w. |
| ≥ 5 | 37 | 43 | 67 | j.w. |
| **przypadek § 3** (minimum) | **9 tyg.** | **38 tyg.** | **62 tyg.** | KP art. 183 § 3, § 4 pkt 3, § 4², § 4³ pkt 3, § 4⁵ |

```
dniDoLimitu = (data ukończenia limitu wieku) − dataPrzyjecia
wymiarNaWarunkach = min(tabela(n)·7, dniDoLimitu)
jeśli wymiarNaWarunkach < 9·7 → wymiarNaWarunkach = 9·7, rodzicielski = 38 (62 „Za życiem”)   // KP art. 183 § 3; ZAŁ „Minimalny okres”
```
(interpretacja § 3 — patrz OK-8).

- Wniosek o urlop w 7 dni od przyjęcia, start nie później niż 21. dnia od przyjęcia (KP art. 183 § 6).
- Zmiana z rodziny zastępczej na przysposobienie: nowy wymiar (§ 1¹ / § 4¹) **pomniejsza się o wykorzystany** urlop z tytułu pieczy zastępczej (KP art. 183 § 7–8).
- Przejęcia przez drugą osobę — jak w § 2.2 (KP art. 183 § 2 odsyła do art. 180 § 4–17; UZ art. 29 ust. 4).
- Rodzicielski: max 5 części (KP art. 183 § 4⁶), 9 tyg. nieprzenoszalne itd. (§ 5 → art. 182¹ᵃ § 3–7, 182¹ᶜ–182¹ᵍ).
- Stawki identyczne jak przy urodzeniu, w tym 81,5% przy wniosku w 21 dni **od przyjęcia** (UZ art. 30a ust. 2; art. 31 ust. 3; POR l. 1104).

---

## 6. Urlop rodzicielski

### 6.1 Wymiar (łącznie dla obojga rodziców)

| Sytuacja | Bazowo | Z łączeniem z pracą (max) | Przepis |
|---|---|---|---|
| 1 dziecko | 41 tyg. (287 dni) | 82 tyg. | KP art. 182¹ᵃ § 1 pkt 1; 182¹ᶠ § 1 pkt 1 |
| ≥ 2 dzieci (poród mnogi) | 43 tyg. (301 dni) | 86 tyg. | KP art. 182¹ᵃ § 1 pkt 2; 182¹ᶠ § 1 pkt 2 |
| 1 dziecko „Za życiem” | 65 tyg. | 130 tyg. | KP art. 182¹ᵃ § 2 pkt 1; 182¹ᶠ § 1¹ pkt 1 |
| ≥ 2 dzieci „Za życiem” | 67 tyg. | 134 tyg. | KP art. 182¹ᵃ § 2 pkt 2; 182¹ᶠ § 1¹ pkt 2 |
| adopcja/zastępcza — przypadek minimum | 38 tyg. (62 „Za życiem”) | 2× (wniosek z proporcji) | KP art. 183 § 4 pkt 3, § 4², § 4⁵ |

„Za życiem” — wydłużenie wynika z KP; POR l. 1030–1038 potwierdza.

### 6.2 Podział między rodziców

- Wymiar przysługuje **łącznie** obojgu (KP art. 182¹ᵃ § 3); mogą korzystać **jednocześnie**, ale suma ≤ wymiar (§ 6–7; UZ art. 29a ust. 3–4).
- **9 tygodni** (63 dni) wyłącznie dla każdego z rodziców, **nieprzenoszalne** (KP art. 182¹ᵃ § 4). Wykorzystanie ≥ 9 tyg. = wykorzystanie tej puli (§ 5).
- Stąd: `maksJednegoRodzica = wymiar − 9 tyg.` (41 → **32**, 43 → **34**, 65 → **56**, 67 → **58**; POR l. 1096 podaje 32/34). Niewykorzystane 9 tyg. drugiego rodzica przepada.
- Wyjątki od rezerwacji (rodzic samotny, zmarły itp.) — OK-5.

### 6.3 Części i termin

- Jednorazowo albo **maks. 5 części**, **nie później niż do końca roku kalendarzowego, w którym dziecko kończy 6 lat** (KP art. 182¹ᶜ; POR l. 1028).
- Liczba części = liczba złożonych wniosków **obojga** rodziców, w tym wniosków o zasiłek osób niebędących pracownikami (KP art. 182¹ᵈ § 2). Silnik liczy części łącznie dla rodziny.
- Brak w przepisach minimalnej długości części rodzicielskiego (OK-7).
- Walidacja: `ostatniDzien <= 31.12.(rokUrodzenia + 6)`, `liczbaCzesci(rodzina) <= 5`.

### 6.4 Łączenie z pracą (proporcjonalne wydłużenie i zmniejszenie zasiłku)

Dotyczy pracownika łączącego urlop z pracą **u pracodawcy udzielającego urlopu**, w wymiarze **≤ ½ etatu** (KP art. 182¹ᵉ § 1). Zasady:

1. Wydłużenie = `tygodnieŁączenia × wymiarPracy` (KP art. 182¹ᶠ § 2), tylko dla tej części (§ 3, § 5).
2. Wynik niebędący wielokrotnością tygodnia → w **dniach**, **niepełny dzień pomija się** (floor) (§ 4).
3. Łączenie także na części powstałej z wydłużenia: `długość = częśćWydłużenia / (1 − wymiarPracy)` (§ 7).
4. Górne limity: 82/86/130/134 tyg. (§ 1, § 1¹).
5. Zasiłek **zmniejsza się proporcjonalnie** do wymiaru pracy: `stawkaEfektywna = stawka × (1 − wymiarPracy)` (UZ art. 31 ust. 4a).

Równoważny, prostszy w implementacji niezmiennik (wynika z pkt 1–3):
```
Σ_i  dniKalendarzowe_i × (1 − wymiarPracy_i)  ≤  wymiarDni   (zużycie puli)
dniKalendarzowe_łącznie ≤ limit z pkt 4
```
Konsekwencja: **łączna kwota zasiłku za urlop rodzicielski nie zależy od łączenia z pracą** — rozkłada się tylko na dłuższy okres.

---

## 7. Urlop ojcowski

| Element | Reguła | Przepis |
|---|---|---|
| Wymiar | **2 tyg.** (14 dni) | KP art. 182³ § 1 |
| Termin (urodzenie) | do ukończenia przez dziecko **12 miesięcy** | KP art. 182³ § 1 pkt 1 |
| Termin (przysposobienie) | do 12 mies. od uprawomocnienia postanowienia o przysposobieniu, nie dłużej niż do **14. roku** życia | KP art. 182³ § 1 pkt 2 |
| Podział | jednorazowo albo **maks. 2 części**, każda **≥ 1 tydzień** | KP art. 182³ § 1¹; POR l. 1056 |
| Wniosek | ≥ 7 dni przed rozpoczęciem | KP art. 182³ § 2 |
| Stawka | **100%** (zawsze, niezależnie od wniosku 81,5%) | UZ art. 31 ust. 1; ZAŁ; POR l. 1110 |
| Niezależność | własne prawo ojca, także gdy matka nieubezpieczona | POR l. 1042 |

Rodzina zastępcza: KP przewiduje ojcowski tylko przy urodzeniu i przysposobieniu — dla rodziny zastępczej brak (wynika z brzmienia § 1).

Walidacja części: `czesci ∈ {[14]}, {[7..],[7..]}` z sumą 14 dni, każda ≥ 7.

---

## 8. Wysokość zasiłku

### 8.1 Stawki

| Okres | Wariant bez wniosku (100/70) | Wariant z wnioskiem z art. 30a (81,5) | Przepis |
|---|---|---|---|
| Urlop macierzyński (w tym przed porodem) | 100% | 81,5% | UZ art. 31 ust. 1, ust. 3 |
| Urlop na warunkach macierzyńskiego | 100% | 81,5% | j.w. |
| Rodzicielski — część matki (w tym jej 9 tyg.) | 70% | 81,5% | UZ art. 31 ust. 2, ust. 3 |
| Rodzicielski — **9 tyg. drugiego rodzica** | 70% | **70%** | UZ art. 31 ust. 3f; KP art. 182¹ᵃ § 4 |
| Rodzicielski — część dzielona przekazana ojcu | 70% | 81,5%? | OK-6 |
| Uzupełniający macierzyński | 100% | 100% | UZ art. 31 ust. 1 |
| Ojcowski | 100% | 100% | UZ art. 31 ust. 1 |
| Martwe urodzenie / zgon dziecka | 100% | (wniosek bez przedmiotu) | UZ art. 31 ust. 1; POR l. 1112 |

### 8.2 Warunki wariantu 81,5%

- Ubezpieczona — matka składa pisemny wniosek **nie później niż 21 dni po porodzie** o zasiłek za urlop macierzyński i rodzicielski **w pełnym wymiarze**, z wyłączeniem 9 tyg. ojca (UZ art. 30a ust. 1). POR l. 1096: wystarczy też **deklaracja** takiego zamiaru.
- Przyjęcie dziecka: wniosek ubezpieczonego **21 dni po przyjęciu** (UZ art. 30a ust. 2).
- Matka może dzielić się z ojcem częścią rodzicielskiego (bez 9 tyg.) (UZ art. 30a ust. 3–4).
- **Utrata 81,5%:** jeśli w **pierwszym roku życia dziecka** nie wykorzystano **ani jednego dnia** rodzicielskiego → rodzicielski 70% (UZ art. 31 ust. 3g), a za macierzyński przysługuje **jednorazowe wyrównanie do 100%** — na wniosek (UZ art. 31 ust. 4).

```
wariant = wniosek.zlozony && wniosek.dataZlozenia <= dataPorodu + 21 dni ? '81.5' : '100/70'
jeśli wariant === '81.5' && pierwszyDzienRodzicielskiego > dataUrodzenia + 1 rok (lub brak):
    stawkaRodzicielski = 0.7
    wyrownanie = Σ dniMacierzynskiego × (podstawa/30) × (1.0 − 0.815)
```

### 8.3 Kwoty

```
podstawaDzienna = podstawaWymiaru / 30                     // UZ art. 36 ust. 3 via art. 47
kwotaDzienna    = round2(podstawaDzienna × stawka × (1 − wymiarPracy))
kwotaOkresu     = kwotaDzienna × liczbaDniKalendarzowych   // zasiłek za każdy dzień, także wolny: UZ art. 11 ust. 4 via art. 31 ust. 5
```
- Zasiłek za okres urlopu wychowawczego nie przysługuje (UZ art. 31 ust. 5 → art. 12 ust. 2 pkt 2; POR l. 1144).
- **Kwota minimalna:** jeśli miesięczny zasiłek < kwoty świadczenia rodzicielskiego → podwyższenie do tej kwoty; za część miesiąca proporcjonalnie (UZ art. 31 ust. 3a, 3c). POR l. 580: porównanie po potrąceniu zaliczki na PIT; przy kilku tytułach — porównuje się sumę. Silnik: `jeśli kwotaMiesieczna_netto < KWOTA_SWIADCZENIA_RODZICIELSKIEGO → dopłata × (dniWMiesiącu / dniMiesiąca)`.
- Minimalna podstawa (pełny etat, pracownik): `4806 × (1 − 0,1371) = 4147,10 zł` (UZ art. 45 ust. 1 via art. 47; ZAŁ). Maksymalna podstawa dla ubezpieczonych dobrowolnie w 2026: 20 321,30 zł (ZAŁ). Samo ustalanie podstawy — osobne issue.

---

## 9. Przykłady liczbowe (do testów jednostkowych)

**P1 — 1 dziecko, wariant 81,5%, ojciec bierze 9 tyg.** Matka: podstawa 6000 zł (200 zł/dzień); ojciec: 9000 zł (300 zł/dzień). Wniosek w 21 dni.
| Okres | Dni | Stawka | Dziennie | Kwota |
|---|---|---|---|---|
| Macierzyński (matka) | 140 | 81,5% | 163,00 | 22 820,00 |
| Rodzicielski (matka, 32 tyg.) | 224 | 81,5% | 163,00 | 36 512,00 |
| Rodzicielski (ojciec, 9 tyg.) | 63 | 70% | 210,00 | 13 230,00 |
| Ojcowski (ojciec) | 14 | 100% | 300,00 | 4 200,00 |

Dla porównania wariant 100/70 matki: 140×200 + 224×140 = 28 000 + 31 360 = **59 360** vs **59 332** przy 81,5% (różnica 28 zł; 81,5% to praktycznie średnia ważona 20×100% + 32×70% na 52 tyg.). Różnica jest istotna tylko przy niepełnym wykorzystaniu rodzicielskiego.

**P2 — utrata 81,5%.** Jak P1, ale matka nie zaczyna rodzicielskiego przed 1. urodzinami dziecka → rodzicielski 70% (140 zł/dzień); wyrównanie macierzyńskiego: 140 × (200 − 163) = **5 180 zł** (na wniosek).

**P3 — bliźnięta, wariant 100/70.** Podstawa 4500 zł (150 zł/dzień). Macierzyński 31 tyg. = 217 dni × 150 = 32 550 zł. Rodzicielski 43 tyg.: matka max 34 tyg. = 238 dni × 105 = 24 990 zł; 9 tyg. dla ojca.

**P4 — uzupełniający.**
- (a) 26 ukończonych tyg., 900 g, szpital dni 1–90 → kat. A, 90 dni w oknie 1–105 → ceil(90/7) = **13 tyg.**
- (b) 32 tyg., 1600 g, szpital dni 1–12 i 20–33 → kat. B, 12 + 14 = 26 dni w oknie 1–56 → **4 tyg.**
- (c) 39 tyg., 3400 g, szpital dni 1–3 i 9–14 → kat. C; pobyt 9–14 spełnia warunek (≥2 dni, start w 5–28); w oknie 5–56 liczy się 6 dni → **1 tydz.** (dni 1–3 poza oknem).
- (d) bliźnięta, 30 tyg., masy 1100 g i 950 g; szpital: dziecko 1 dni 1–50, dziecko 2 dni 1–30 → kategoria wg 950 g = **A** (mimo 30 tyg.); dni wg dziecka 1 = 50 → **8 tyg.**
- (e) 30 tyg., 1500 g, szpital dni 1–70 → B, okno 1–56 → 56 dni → **8 tyg.** (dni 57–70 nie liczą się).

**P5 — łączenie z pracą.** Matka, 100/70, podstawa 6000, rodzicielski 32 tyg. Pierwsze 16 tyg. pracuje na ½ etatu: zużywa 8 tyg. puli, wydłużenie 16 × 0,5 = 8 tyg. → razem **40 tyg.** kalendarzowych. Kwoty: 112 dni × (200 × 0,7 × 0,5 = 70) = 7 840 + 168 dni × 140 = 23 520 → **31 360 zł** (tyle co bez łączenia).

**P6 — martwe urodzenie / zgon.** Podstawa 5000 (166,67 zł/dzień).
- Martwe urodzenie 2026-03-01 → urlop 2026-03-01–2026-04-25 (56 dni) → 9 333,52 zł.
- Zgon dziecka w 54. dniu życia (2026-04-23) → koniec = max(04-25, 04-23 + 7 = 04-30) = **2026-04-30** (61 dni).
- Bliźnięta, jedno umiera w 10. dniu → wymiar dla 1 żyjącego dziecka = 20 tyg.; rodzicielski 41 tyg. (KP art. 182¹ᵃ § 1 odwołuje się do przypadku z art. 180 § 1 — por. OK-9).

**P7 — przejęcie przez ojca.** 1 dziecko; matka 2 tyg. przed porodem + 14 tyg. po → ojciec przejmuje **4 tyg.** (20 − 16). Gdyby matka wzięła 6 tyg. przed porodem — po 14 tyg. po porodzie wymiar jest wyczerpany, ojcu nic nie zostaje.

**P8 — rodzina zastępcza niezawodowa.** Dziecko 6 lat i 11 mies. (bez odroczenia), do 7. urodzin 30 dni → min(140, 30) = 30 < 63 → **9 tyg.** + rodzicielski **38 tyg.** (interpretacja OK-8). Dziecko 3-letnie → 20 + 41 tyg.

---

## 10. Kolejność reguł w silniku (pseudokod)

```
1. Uprawnienie: ubezpieczony w dniu powstania prawa (UZ art. 29 ust. 1); tryb przyjęcia i limity wieku (§5.1); rodzina zawodowa → brak.
2. n = liczba dzieci (żyjących, jeśli był zgon — §3).
3. Macierzyński / na warunkach: tabela 2.1 / 5.2 (+ limit wieku, minimum 9 tyg.).
4. Zdarzenia szczególne: zgon/martwe urodzenie (§3), porzucenie (KP 182), przejęcie (§2.2).
5. Uzupełniający: kategoria + dni hospitalizacji (§4).
6. Rodzicielski: wymiar (§6.1), podział i 9 tyg. (§6.2), części i termin (§6.3), łączenie z pracą (§6.4).
7. Ojcowski (§7).
8. Wariant stawek (§8.2) → stawki okresów (§8.1) → kwoty dzienne i okresowe (§8.3) → kwota minimalna.
9. Ostrzeżenia: terminy wniosków (14/21/7 dni), 5 części, koniec roku 6. urodzin, 1. rok życia przy 81,5%.
```

---

## Otwarte kwestie

- **OK-1. Zaokrąglenia kwot.** Źródła nie mówią, czy zaokrąglać stawkę dzienną (do grosza) czy kwotę okresu. Przyjęto `round2(kwotaDzienna)` × dni (praktyka ZUS dla zasiłków) — do potwierdzenia na sprawach przykładowych.
- **OK-2. Kwota świadczenia rodzicielskiego** (dolny próg zasiłku, UZ art. 31 ust. 3a) nie występuje w źródłach; 1000 zł to wartość z ustawy o świadczeniach rodzinnych (spoza `docs/task/`) — parametr do weryfikacji. POR każe porównywać kwotę **netto** (po zaliczce PIT), UZ mówi o „miesięcznej kwocie zasiłku” — silnik potrzebuje zaliczki PIT albo uproszczenia.
- **OK-3. Liczenie dni „po porodzie”.** Czy dzień porodu to dzień 1 (przyjęto, zgodnie z KP art. 183¹ § 2), czy dzień 0? Wpływa na okna uzupełniającego (dni 5–28, upływ 8./15. tygodnia) i na „7 dni od dnia zgonu” (przyjęto: termin liczony od dnia następnego, koniec = dataZgonu + 7).
- **OK-4. Progi uzupełniającego — rozbieżności opisów.** KP: „przed ukończeniem 28. tyg.” i masa „niewiększa niż 1000 g” (≤). POR l. 982: „poniżej 1000 g” (<) i „po 28. tygodniu”; ZAŁ: „przed 28. tygodniem”. POR l. 974: „jeśli dziecko przebywa w szpitalu co najmniej 5 dni po narodzinach” — sprzeczne z KP dla kat. A/B (tam brak takiego warunku). Przyjęto brzmienie KP. Nieuregulowane: dokładnie 28 ukończonych tyg. przy masie > 1000 g (KP pkt 2 „po ukończeniu 28.” — przyjęto kat. B) i dokładnie 37 (przyjęto C).
- **OK-5. Nieprzenoszalne 9 tyg., gdy drugi rodzic nie istnieje / zmarł / nieznany / nieubezpieczony.** KP art. 182¹ᵃ § 4 mówi o „pracownikach – rodzicach”; UZ art. 30a i 31 ust. 3f wyłączają 9 tyg. „przysługujące ojcu”. Źródła nie przewidują wyjątku — silnik domyślnie odejmuje 9 tyg.; wymaga potwierdzenia u ZUS (szczególnie dla samotnych matek i ubezpieczonych niebędących pracownikami).
- **OK-6. Stawka ojca przy wniosku 81,5% matki.** UZ art. 30a ust. 3 pozwala matce dzielić się częścią rodzicielskiego z ojcem, a art. 31 ust. 3 daje 81,5% „w przypadku wniosku” — nie jest jasne, czy ojciec za przekazaną część (poza swoimi 9 tyg.) dostaje 81,5% swojej podstawy, czy 70%. Podobnie przejęcie macierzyńskiego przy 81,5% (§2.2). Przyjęto 81,5% — do weryfikacji.
- **OK-7. Minimalna długość części rodzicielskiego i jednostka (tygodnie/dni).** KP art. 182¹ᶜ nie określa minimum; tylko przy wydłużeniu wprost dopuszcza dni (§ 4 art. 182¹ᶠ). Przyjęto: dowolna liczba pełnych tygodni; dni tylko z wydłużenia — do potwierdzenia.
- **OK-8. Rodzina zastępcza / adopcja — przypadek KP art. 183 § 3 (9 tyg. + 38 tyg.).** Przepis jest niejasny: przyjęto, że 9 tyg. to minimum, gdy limit wieku skróciłby urlop (zgodnie z ZAŁ „nie może trwać krócej niż 9 tygodni”), i że wtedy rodzicielski wynosi 38 (62) tyg. Niejasne też, czy rodzicielski dla dziecka przyjętego np. w wieku 6–10 lat podlega terminowi „do końca roku, w którym dziecko kończy 6 lat” (KP art. 183 § 5 odsyła „odpowiednio” do art. 182¹ᶜ) oraz jaki jest limit dla rodzicielskiego w rodzinie zastępczej (§ 4 nie podaje limitu wieku, w przeciwieństwie do § 4¹).
- **OK-9. Rodzicielski po zgonie jednego z dzieci z porodu mnogiego.** Czy wymiar to 43 tyg. (poród mnogi — art. 180 § 1 pkt 2) czy 41 (jedno żyjące dziecko, analogicznie do art. 180¹)? Przepisy nie rozstrzygają; przyjęto 41.
- **OK-10. Ojcowski dla ubezpieczonych niebędących pracownikami** — wyciąg UZ nie zawiera przepisu o zasiłku za okres odpowiadający urlopowi ojcowskiemu (tylko art. 29a ust. 1 i art. 31 ust. 1); prawo potwierdza POR l. 1042. Brak też w KP ojcowskiego dla rodziny zastępczej.
- **OK-11. Rozbieżność POR co do limitu łączenia z pracą „Za życiem”.** POR l. 1040 łączy 130/134 tyg. także z „przyjęciem na wychowanie”; KP art. 182¹ᶠ § 1¹ mówi o dziecku z zaświadczeniem (stosowane do adopcji przez art. 183 § 5). Zgodne co do liczb, ale POR milczy o limicie 82/86 dla zwykłego przypadku.
- **OK-12. Zasiłek po ustaniu ubezpieczenia** (UZ art. 30 — upadłość/likwidacja/śmierć pracodawcy, bezprawne rozwiązanie, umowa przedłużona do porodu z KP art. 177 § 3): wyciąg nie mówi, za które urlopy przysługuje (praktyka: tylko okres odpowiadający urlopowi macierzyńskiemu). Poza zakresem tego silnika — do osobnej analizy.
