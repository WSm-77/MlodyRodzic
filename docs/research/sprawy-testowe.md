# Sprawy przykładowe jako przypadki testowe kalkulatora (issue #7)

Źródło: zanonimizowane **sprawy przykładowe** z `docs/sprawy/Sprawy /` (poza repozytorium; regulamin zabrania ich redystrybucji). Ten plik zawiera **wyłącznie fakty liczbowe**. Nie ma w nim tekstu dokumentów, danych osobowych ani nazw płatników. Sprawy są oznaczone identyfikatorem `Txx` i rodzajem sprawy, bez mapowania na nazwy plików.

## Jak czytać ten plik

- **Dzień 0** = data porodu (albo data przyjęcia dziecka na wychowanie, albo początek wskazanego okresu). Pozostałe daty podano jako przesunięcia w dniach. Okres „dzień A–B” obejmuje oba końce, więc liczba dni to B − A + 1.
- Rok podaję tylko tam, gdzie wpływa na wynik (np. płaca minimalna: 2025 = 4666 zł, 2026 = 4806 zł).
- **Wynik ZUS** to rozstrzygnięcie widoczne w dokumentach: decyzja, adnotacja „wypłacono” albo zakres wypłaty. **Wyliczone** oznacza kwotę policzoną przez nas z danych wejściowych według reguł poniżej. W żadnej sprawie dokumenty nie podają kwoty zasiłku, więc kwoty w testach to wartości wyliczone, a nie przepisane z decyzji.
- Reguły użyte w wyliczeniach (do potwierdzenia w ADR/kodzie):
  - podstawa wymiaru zasiłku (pracownik) = przeciętne miesięczne wynagrodzenie × (1 − 13,71%), zaokrąglone do grosza;
  - przy zmianie wymiaru czasu pracy w okresie bazowym liczy się tylko wynagrodzenie z miesięcy po zmianie;
  - stawka dzienna = podstawa / 30 × stawka procentowa, zaokrąglona do grosza; kwota za okres = stawka dzienna × liczba dni;
  - zasiłek macierzyński: 100% za urlop macierzyński i ojcowski, 70% za rodzicielski; 81,5% za cały okres, jeśli wniosek o oba urlopy złożono do 21 dni po porodzie; 100% przy martwym urodzeniu oraz dla zasiłku w wysokości zasiłku macierzyńskiego.

## Przegląd

| ID | Rodzaj sprawy | Tytuł ubezpieczenia | Wynik ZUS | Pewność danych |
|---|---|---|---|---|
| T01 | urlop macierzyński + rodzicielski, wniosek do 21 dni, zmiana wymiaru etatu | umowa o pracę | przyznano, wypłacono | wysoka |
| T02 | martwe urodzenie | umowa o pracę | przyznano (8 tyg.) | wysoka |
| T03 | urlop ojcowski | umowa o pracę | przyznano, wypłacono | wysoka |
| T04 | urlop ojcowski, zadłużenie składkowe | działalność gospodarcza | **odmowa** | wysoka |
| T05 | urlop macierzyński (9 tyg.) przejęty przez ojca | działalność gospodarcza | przyznano, wypłacono | niska (brak danych o matce) |
| T06 | rodzicielski po przerwie w ubezpieczeniu | działalność gospodarcza | **odmowa** | wysoka |
| T07 | umowa dla pozoru | umowa o pracę (1/8 etatu) | **odmowa** | średnia |
| T08 | brak ubezpieczenia w dniu porodu | (umowa o pracę, ustała) | **odmowa** | wysoka |
| T09 | zasiłek chorobowy w ciąży, brak ubezpieczenia | umowa o pracę (zakwestionowana) | **odmowa** | wysoka |
| T10 | przyjęcie dziecka na wychowanie (przysposobienie) | działalność gospodarcza (ustała) | nieustalony | niska |
| T11 | skrajny wcześniak (≤ 1000 g), uzupełniający urlop macierzyński | umowa o pracę | przyznano | wysoka (okresy), brak kwot |
| T12 | bliźnięta, wcześniaki (28 tyg.), „Za życiem” | umowa o pracę | przyznano (wnioskowane okresy) | średnia |
| T13 | łączenie urlopu rodzicielskiego z pracą na ½ etatu | umowa o pracę | przyznano + podwyższenie do 1000 zł | średnia |
| T14 | zasiłek w wysokości zasiłku macierzyńskiego (rozwiązanie umowy w ciąży) | umowa o pracę (1/3 etatu) | przyznano (zaświadczenie płatnika) | średnia |

---

## T01 — urlop macierzyński i rodzicielski, wniosek do 21 dni, zmiana wymiaru etatu

**Dane wejściowe**
- Tytuł: umowa o pracę; płatnik do 20 ubezpieczonych, więc wypłaca ZUS.
- Zatrudnienie od ok. 2 lat przed porodem. Wymiar czasu pracy 1,0 od dnia −87 (1. dzień miesiąca, 2 miesiące przed miesiącem porodu); wcześniej niepełny etat.
- Wynagrodzenie (2025): 12 mies. wcześniej 570,00 zł / 583,25 zł (niepełny etat), po zmianie wymiaru 2 miesiące × 4666,00 zł; składka 13,71%.
- Wynagrodzenie chorobowe od pracodawcy w miesiącu porodu: dzień −11 do −1 (bez wpływu na zasiłek).
- Wniosek o urlop macierzyński + rodzicielski złożony w dniu 10 (≤ 21 dni).
- 1 dziecko.

**Oczekiwany wynik**
- Prawo: przyznane.
- Okres: dzień 0–363 = 52 tyg. (20 tyg. urlopu macierzyńskiego + 32 tyg. rodzicielskiego; 9 tyg. z 41 zostaje dla drugiego rodzica).
- Stawka: 81,5% za cały okres.
- Wyliczone: podstawa = 4666,00 × 0,8629 = **4026,29 zł** (tylko miesiące po zmianie wymiaru); miesięcznie 81,5% = **3281,43 zł**; stawka dzienna = 134,21 × 0,815 = **109,38 zł**.

## T02 — martwe urodzenie

**Dane wejściowe**
- Tytuł: umowa o pracę, pełny etat, zatrudnienie od ponad 6 lat; płatnik do 20 ubezpieczonych.
- Wynagrodzenie stałe 4500,00 zł/mies.; w okresie bazowym wiele pełnych miesięcy na wcześniejszym zasiłku macierzyńskim (0 dni przepracowanych), potem powrót do pracy.
- Martwe urodzenie w dniu 0 (ciąża III, 7. tydzień przed terminem według zaświadczenia lekarskiego).
- Wniosek o urlop macierzyński w dniu 11.

**Oczekiwany wynik**
- Prawo: przyznane.
- Okres: dzień 0–55 = **8 tygodni (56 dni)**, czyli minimalny urlop macierzyński przy martwym urodzeniu; bez rodzicielskiego.
- Stawka: 100%.
- Wyliczone: podstawa = 4500 × 0,8629 = **3883,05 zł**; dziennie **129,44 zł**; za 56 dni **7248,64 zł**.

## T03 — urlop ojcowski (pracownik)

**Dane wejściowe**
- Tytuł: umowa o pracę, pełny etat, zatrudnienie od ok. 3,5 roku; płatnik do 20 ubezpieczonych.
- Wynagrodzenie stałe 6400,00 zł/mies. przez 12 miesięcy (jeden miesiąc przepracowany w połowie: 10/20 dni).
- Wniosek o urlop ojcowski złożony 28 dni przed jego rozpoczęciem; urlop w ciągu 12 miesięcy od porodu.
- 1 dziecko.

**Oczekiwany wynik**
- Prawo: przyznane, wypłacono.
- Okres: **7 dni** (1 tydzień z 2 przysługujących).
- Stawka: 100%.
- Wyliczone: podstawa = 6400 × 0,8629 = **5522,56 zł**; dziennie **184,09 zł**; za 7 dni **1288,63 zł**.

## T04 — urlop ojcowski, działalność gospodarcza, zadłużenie składkowe → odmowa

**Dane wejściowe**
- Tytuł: działalność gospodarcza (kod 0570); dobrowolne ubezpieczenie chorobowe od ok. 10 miesięcy przed urlopem.
- Zadeklarowana podstawa składek: 1290,00 zł (pierwszy miesiąc), potem 1399,80 zł/mies. (poniżej 60% prognozowanego przeciętnego wynagrodzenia).
- Wniosek o zasiłek za urlop ojcowski: okres **14 dni** (2 tygodnie).
- W dniu powstania prawa: zadłużenie składkowe **> 1% płacy minimalnej (2025: 46,66 zł)**, nieuregulowane.

**Oczekiwany wynik**
- Prawo: **odmowa** za cały okres 14 dni.
- Powód: zadłużenie z tytułu składek > 1% minimalnego wynagrodzenia w dniu powstania prawa (dotyczy prowadzących działalność i osób współpracujących). Prawo wraca po spłacie całości długu; przedawnia się, jeśli dług nie zostanie spłacony w ciągu 6 miesięcy.
- Wariant testu: dług ≤ 46,66 zł albo spłacony, więc prawo przyznane.

## T05 — urlop macierzyński przejęty przez ojca (9 tygodni)

**Dane wejściowe**
- Tytuł: działalność gospodarcza (ojciec), objęty ubezpieczeniem chorobowym i wypadkowym.
- Wnioskowany okres: urlop macierzyński **9 tygodni (63 dni)**. Daty w skanie są częściowo nieczytelne.
- Sytuacja matki (powód przejęcia urlopu) nie jest widoczna w czytelnych stronach.

**Oczekiwany wynik**
- Prawo: przyznane, wypłacono.
- Okres: 63 dni; stawka i kwota nieustalone (brak danych o podstawie).
- Uwaga: test można użyć tylko do sprawdzenia długości (20 tyg. − 11 tyg. wykorzystanych przez matkę = 9 tyg.). Warunek dotyczący matki trzeba założyć, np. rezygnacja po ≥ 14 tyg. albo niezdolność do samodzielnej egzystencji.

## T06 — rodzicielski po przerwie w ubezpieczeniu (działalność) → odmowa

**Dane wejściowe**
- Tytuł: działalność gospodarcza. W dokumentach ZUS określa ją jako pozorną, ale podstawą odmowy jest brak ubezpieczenia.
- Zasiłek macierzyński wypłacony za dzień 0–139 (20 tyg. urlopu macierzyńskiego).
- Od dnia 140 brak ponownego zgłoszenia do dobrowolnego ubezpieczenia chorobowego.
- Wniosek o zasiłek za urlop rodzicielski: dzień 153–376 = **32 tyg. (224 dni)**, po przerwie 13 dni.

**Oczekiwany wynik**
- Prawo: **odmowa** za dzień 153–376.
- Powód: w dniu rozpoczęcia rodzicielskiego ubezpieczony nie podlegał ubezpieczeniu chorobowemu (zasiłek macierzyński przysługuje osobie objętej ubezpieczeniem chorobowym).
- Długość okresu wnioskowanego: 41 − 9 = 32 tyg.

## T07 — umowa dla pozoru → odmowa

**Dane wejściowe**
- Tytuł: umowa o pracę od dnia −71, wymiar **1/8 etatu** (w formularzu „1,8”; interpretacja do potwierdzenia).
- Wynagrodzenie 1273,49 zł/mies. przez 2 pełne miesiące przed porodem.
- Wniosek o urlop macierzyński + rodzicielski w dniu 7 (≤ 21 dni), okres dzień 0–363 (52 tyg.).
- ZUS po postępowaniu kontrolnym stwierdza decyzją, że ubezpieczona nie podlega ubezpieczeniom od pierwszego dnia zatrudnienia.

**Oczekiwany wynik**
- Prawo: **odmowa** za cały okres 52 tyg.
- Powód: brak tytułu do ubezpieczenia chorobowego (umowa zawarta dla pozoru).
- Dla kalkulatora: wejście „ubezpieczenie chorobowe = nie” (lub „zakwestionowane”) daje odmowę. Kalkulator nie ocenia pozorności, ale może ostrzegać o ryzyku: zatrudnienie krótko przed porodem, ułamkowy etat, wynagrodzenie nieproporcjonalne do etatu.

## T08 — brak ubezpieczenia w dniu porodu → odmowa

**Dane wejściowe**
- Tytuł: umowa o pracę, ale ZUS decyzją stwierdził niepodleganie ubezpieczeniom od dnia **−251** (ok. 8 miesięcy przed porodem).
- Wniosek złożony w dniu 20 o zasiłek za dzień 0–363 (52 tyg.).

**Oczekiwany wynik**
- Prawo: **odmowa** za dzień 0–363.
- Powód: poród poza okresem ubezpieczenia chorobowego (i poza urlopem wychowawczym).

## T09 — zasiłek chorobowy w ciąży, brak ubezpieczenia → odmowa

**Dane wejściowe**
- Tytuł: umowa o pracę, pełny etat, od dnia −149 względem początku okresu zasiłku.
- Wynagrodzenie: 3 mies. × 4666,00 zł (2025), 1 mies. × 4806,00 zł (2026).
- Niezdolność do pracy w ciąży; wniosek o zasiłek chorobowy za **29 dni** (dzień 0–28). Data badania uprawnień: dzień −24 (koniec okresu wynagrodzenia chorobowego od pracodawcy).
- ZUS decyzją stwierdził niepodleganie ubezpieczeniom od pierwszego dnia zatrudnienia.

**Oczekiwany wynik**
- Prawo: **odmowa** (ustanie tytułu na podstawie decyzji ZUS).
- Wariant hipotetyczny (gdyby tytuł był ważny): okres wyczekiwania 30 dni minął, stawka 100%; podstawa = średnia z 4 pełnych miesięcy = (3 × 4666 + 4806) / 4 = 4701,00 × 0,8629 = **4056,49 zł**, dziennie **135,22 zł**, za 29 dni **3921,38 zł** (wyliczone).

## T10 — przyjęcie dziecka na wychowanie (przysposobienie)

**Dane wejściowe**
- Tytuł: działalność gospodarcza. Ubezpieczenie chorobowe trwało od dnia −45 do dnia 18 (dzień 0 = przyjęcie dziecka); potem wyrejestrowanie, bo tytuł ustał.
- Zadeklarowana podstawa składek: 1080,00 zł/mies. (poniżej 60% prognozowanego przeciętnego wynagrodzenia).
- Dziecko w wieku ok. 5 lat w dniu przyjęcia; wniosek do sądu o przysposobienie; później sąd orzeka przysposobienie pełne.
- Wniosek: urlop macierzyński dzień 0–139 (20 tyg.) + rodzicielski 32 tyg.; później prośba o przedłużenie w związku z zaświadczeniem „Za życiem”.

**Oczekiwany wynik**
- W przeczytanych stronach nie ma rozstrzygnięcia. Nazwa sprawy nie wskazuje odmowy.
- Proponowane asercje do weryfikacji: prawo przyznane (przyjęcie dziecka w okresie ubezpieczenia; dziecko do 14 lat, więc urlop na warunkach macierzyńskiego 20 tyg. + rodzicielski); brak okresu wyczekiwania dla zasiłku macierzyńskiego.
- Wyliczone: podstawa = 1080 × 0,8629 = **931,93 zł**.
- Ten przypadek **nie** nadaje się na test „złotej ścieżki”, dopóki nie zostanie potwierdzony wynik.

## T11 — skrajny wcześniak (masa urodzeniowa ≤ 1000 g)

**Dane wejściowe**
- Tytuł: umowa o pracę (dane o wynagrodzeniu niewypełnione/nieczytelne).
- 1 dziecko; masa urodzeniowa ≤ 1000 g; pobyt w szpitalu od dnia 0 do dnia 120.
- Wniosek o urlop macierzyński + uzupełniający urlop macierzyński + rodzicielski.

**Oczekiwany wynik (decyzja przyznająca)**
- Urlop macierzyński: dzień 0–139 = **20 tyg.**
- Uzupełniający urlop macierzyński: dzień 140–244 = **15 tyg.** (maksimum przy masie ≤ 1000 g albo porodzie przed 28. tyg., niezależnie od długości hospitalizacji).
- Urlop rodzicielski: dzień 245–468 = **32 tyg.**
- Łącznie: dzień 0–468 = **67 tyg.**
- Kwoty: brak danych.

## T12 — bliźnięta, wcześniaki (28. tydzień ciąży), zaświadczenie „Za życiem”

**Dane wejściowe**
- Tytuł: umowa o pracę.
- **2 dzieci** (poród mnogi) w 28. tygodniu ciąży; oboje mają zaświadczenie „Za życiem”; hospitalizacja dzieci od dnia 0, w dniu wniosku nadal trwała (> 8 dni).
- Wniosek złożony w dniu 15 (≤ 21 dni) o urlop macierzyński + uzupełniający + rodzicielski, ze stawką 81,5% za całość.

**Oczekiwany wynik (wnioskowane okresy; nazwa sprawy wskazuje przyznanie)**
- Urlop macierzyński: dzień 0–216 = **31 tyg.** (dwoje dzieci przy jednym porodzie).
- Uzupełniający urlop macierzyński: dzień 217–272 = **8 tyg.** (poród po ukończeniu 28. tyg., masa > 1000 g).
- Urlop rodzicielski: dzień 273–678 = **58 tyg.** (67 tyg. przy porodzie mnogim z „Za życiem” − 9 tyg. dla drugiego rodzica).
- Łącznie **97 tyg.**; stawka **81,5%** za całość.
- Kwoty: brak danych o wynagrodzeniu w przeczytanych stronach.

## T13 — łączenie urlopu rodzicielskiego z pracą (½ etatu)

**Dane wejściowe**
- Tytuł: umowa o pracę.
- Wynagrodzenie (9 miesięcy w okresie bazowym; składniki stałe + zmienne + premie):
  - 1 mies.: 3100,00 + 434,00 + 310,00 = 3844,00 zł;
  - 5 mies.: 3300,00 + 495,00 + 330,00 = 4125,00 zł;
  - 3 mies.: 3410,00 + 511,50 + 341,00 = 4262,50 zł.
- Wniosek o urlop macierzyński (20 tyg.) w dniu 20 i osobny wniosek o urlop rodzicielski (32 tyg.) w dniu 117. Nie złożono łącznego wniosku w ciągu 21 dni.
- Praca na ½ etatu w trakcie urlopu rodzicielskiego od dnia 161.
- Na wniosek ubezpieczonej wypłata wstrzymana od dnia 437.

**Oczekiwany wynik (zakres wypłaty)**
- Zasiłek macierzyński za urlop macierzyński: dzień 0–139 (20 tyg.), stawka 100%.
- Zasiłek za urlop rodzicielski: dzień 140–436. Dzień 140–160 (3 tyg.) w pełnym wymiarze, od dnia 161 łączony z pracą na ½ etatu, więc pozostałe 29 tyg. wydłużają się proporcjonalnie (do 58 tyg.). Stawka 70%.
- Od dnia 437 wypłata wstrzymana (rezygnacja).
- **Podwyższenie** zasiłku do kwoty świadczenia rodzicielskiego (1000 zł) za dzień 161–436.
- Wyliczone: podstawa = 37 256,50 / 9 = 4139,61 × 0,8629 = **3572,07 zł**; za macierzyński 100% = 3572,07 zł/mies.; rodzicielski 70% = 2500,45 zł/mies.; przy ½ etatu połowa = **1250,22 zł/mies.** brutto.
- **Do wyjaśnienia:** 1250,22 zł > 1000 zł, a mimo to ZUS wypłacił podwyższenie. Albo podstawa ZUS była inna (np. inne miesiące lub składniki), albo porównanie z 1000 zł odbywa się po odliczeniu zaliczki na podatek, albo pomniejszenie przy łączeniu z pracą liczy się inaczej. Test asercji podwyższenia oznaczyć jako `todo` do czasu ustalenia reguły.

## T14 — zasiłek w wysokości zasiłku macierzyńskiego (utrata pracy w ciąży)

**Dane wejściowe**
- Tytuł: umowa o pracę, wymiar **1/3 etatu** (0,333) od 7. miesiąca zatrudnienia; umowa trwała 19 miesięcy i ustała w dniu −1 (dzień 0 = dzień po rozwiązaniu umowy). Wniosek na ZAS-55, czyli rozwiązanie z powodu upadłości lub likwidacji pracodawcy.
- Wynagrodzenie od zmiany wymiaru: 3 mies. × 1556,00 zł (2025), 7 mies. × 2200,00 zł (2026); składka 13,71%.
- Wynagrodzenie chorobowe od pracodawcy: ostatnie 24 dni zatrudnienia.
- Kobieta w ciąży; wnioskowany okres do dnia porodu: dzień 0–174.

**Oczekiwany wynik**
- Prawo: zasiłek w wysokości zasiłku macierzyńskiego za dzień 0–174 (**175 dni**). W przeczytanych stronach widać zaświadczenie płatnika i wniosek, ale nie decyzję.
- Stawka: 100%.
- Wyliczone: przeciętne wynagrodzenie z 10 miesięcy po zmianie wymiaru = (3 × 1556 + 7 × 2200) / 10 = 2006,80 zł; podstawa = 2006,80 × 0,8629 = **1731,67 zł**; dziennie **57,72 zł**; za 175 dni **10 101,00 zł**.

---

## Szkic testów Vitest (kształt)

```ts
// tests/sprawy-przykladowe.test.ts — wejścia/oczekiwania z docs/research/sprawy-testowe.md
it('T02 martwe urodzenie: 8 tyg., 100%', () => {
  const r = oblicz({ tytul: 'umowa_o_prace', zdarzenie: 'martwe_urodzenie', dzieci: 1,
    wynagrodzenia: Array(12).fill(4500), dataZdarzenia: D0 });
  expect(r.prawo).toBe(true);
  expect(r.okresy).toEqual([{ rodzaj: 'macierzynski', od: D0, dni: 56, procent: 100 }]);
  expect(r.podstawa).toBe(3883.05);
  expect(r.stawkaDzienna).toBe(129.44);
});
it('T04 ojcowski, działalność, dług > 1% płacy minimalnej → odmowa', () => {
  const r = oblicz({ tytul: 'dzialalnosc', urlop: 'ojcowski', dni: 14,
    zadluzenieWDniuPrawa: 46.67, placaMinimalna: 4666 });
  expect(r.prawo).toBe(false);
  expect(r.powod).toBe('zadluzenie_skladkowe');
});
```

Sugerowany podział w testach:
- **Złota ścieżka (kwoty):** T01, T02, T03, T14 (oraz wariant hipotetyczny T09).
- **Długości okresów i wymiar zasiłku:** T01, T02, T06, T11, T12, T13, T05.
- **Odmowy:** T04 (zadłużenie), T06 (brak ubezpieczenia w dniu rozpoczęcia rodzicielskiego), T07/T08/T09 (brak tytułu ubezpieczenia).
- **Oznaczyć jako `todo`:** T10 (brak rozstrzygnięcia), T13 (reguła podwyższenia).

## Uwagi o źródle

- Wszystkie 87 plików PDF to skany bez warstwy tekstowej (`pdftotext` zwraca puste wyniki). Przeczytano je jako obrazy stron w niskiej rozdzielczości, bez OCR.
- Przeczytano 14 spraw (po 1–3 na rodzaj), 1 przejrzano tylko na miniaturach (rodzina zastępcza: nie opisano), pozostałe pominięto.
- Żadna przeczytana decyzja nie podaje kwoty zasiłku. ZUS w decyzjach przyznających nie wylicza kwot, a płatnicy podają tylko składniki wynagrodzenia (Z-3). Kwoty „wyliczone” trzeba przed użyciem jako wzorca porównać z regułami w kodzie i z ADR.
