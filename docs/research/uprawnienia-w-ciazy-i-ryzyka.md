# Uprawnienia w ciąży i ryzyka ich utraty — tabela decyzyjna

Issue: #4 (rodzic: #1, blokuje #9 i #11).

**Pytanie:** jakie warunki decydują o prawie do świadczeń w okresie ciąży i macierzyństwa oraz o ich utracie lub obniżeniu — w postaci tabeli decyzyjnej dla przewodnika i reguł, które może ocenić silnik reguł w TS.

## Źródła

Wszystkie źródła to pliki w `docs/task/` (wysokie zaufanie). Skróty używane niżej:

| Skrót | Plik |
|---|---|
| **UZ** | `wyciąg z ustawy o świadczeniach pieniężnych … (ustawa zasiłkowa).md` (Dz.U. z 2026 r. poz. 854) |
| **KP** | `Kodeks pracy (wyciąg z przepisów).md` |
| **Poradnik** | `Poradnik dla rodziców, ZUS 2026.md` (numer strony poradnika w nawiasie) |
| **Zał.** | `Załącznik_ maksymalny czas trwania zasiłków, wysokość, podstawa wymiaru.docx.md` |
| **Rozp. dok.** | `rozporządzenie w spr. zakresu informacji o okolicznościach mających wpływ na prawo do zasiłków ..md` |
| **Zadanie** | `ZUS - Pełna treść zadania konkursowego.md` (sekcja H „Zagrożenia…” i I „Szczególna ochrona…”) |

Przepisy spoza `docs/task/` (np. Kodeks cywilny, ustawa o systemie ubezpieczeń społecznych) są oznaczone jako **[poza materiałami]** i wymagają potwierdzenia przed użyciem w produkcie. Notatnika NotebookLM nie używano — materiały z repo wystarczyły.

## Najważniejsze wnioski

1. O wszystkim decydują dwa dni: **dzień powstania niezdolności do pracy** (zasiłek chorobowy w ciąży) i **dzień porodu** (zasiłek macierzyński). W obu dniach ubezpieczony musi podlegać ubezpieczeniu chorobowemu, poza wyjątkami „po ustaniu tytułu ubezpieczenia” (UZ art. 7, art. 30).
2. Okres wyczekiwania (30 dni przy ubezpieczeniu obowiązkowym, 90 przy dobrowolnym) dotyczy **tylko zasiłku chorobowego** (UZ art. 4). Przepisy o zasiłku macierzyńskim (UZ art. 29) go nie przewidują.
3. Kod „B” na e-ZLA jest warunkiem 100% (zamiast 80%) i okresu zasiłkowego 270 dni (zamiast 182). Kod B zeruje też liczenie okresu zasiłkowego po przerwie (UZ art. 9 ust. 2).
4. Przedsiębiorczynię i osobę współpracującą blokuje **zadłużenie składkowe powyżej 1% minimalnego wynagrodzenia w dniu powstania prawa**. Prawo wraca po spłacie całego długu, ale przedawnia się, jeśli dług nie zostanie spłacony w 6 miesięcy (UZ art. 2a).
5. Ochrona z KP art. 177 dotyczy wyłącznie **pracownic** (umowa o pracę). Zleceniobiorczyni i przedsiębiorczyni jej nie mają (Zadanie, sekcja I).

## Tabela decyzyjna

Kolumna „Reguła” wskazuje identyfikator z sekcji [Reguły dla silnika](#reguły-dla-silnika-reguł-ts).

### A. Zasiłek chorobowy w ciąży i wynagrodzenie chorobowe

| # | Warunek | Skutek | Komunikat dla rodzica | Źródło | Reguła |
|---|---|---|---|---|---|
| A1 | Niezdolność do pracy powstała w czasie ubezpieczenia chorobowego | Prawo do zasiłku chorobowego co do zasady istnieje | Masz prawo do świadczenia za czas zwolnienia lekarskiego, jeśli spełniasz pozostałe warunki. | UZ art. 6 ust. 1 | `R-CH-01` |
| A2 | Ubezpieczenie **obowiązkowe** (np. umowa o pracę) trwa nieprzerwanie krócej niż 30 dni | Brak zasiłku i wynagrodzenia chorobowego za dni przed upływem 30 dni; te dni nie wliczają się do okresu zasiłkowego | Zasiłek przysługuje dopiero po 30 dniach nieprzerwanego ubezpieczenia. Za zwolnienie przed tym terminem nie dostaniesz pieniędzy z ubezpieczenia. | UZ art. 4 ust. 1 pkt 1, art. 9 ust. 3; KP art. 92 § 3 pkt 2 | `R-CH-02` |
| A3 | Ubezpieczenie **dobrowolne** (zlecenie, działalność gospodarcza) trwa nieprzerwanie krócej niż 90 dni | Jak A2, próg 90 dni | Przy dobrowolnym ubezpieczeniu chorobowym zasiłek przysługuje dopiero po 90 dniach nieprzerwanego ubezpieczenia. | UZ art. 4 ust. 1 pkt 2, art. 9 ust. 3 | `R-CH-02` |
| A4 | Poprzednie okresy ubezpieczenia chorobowego z przerwą ≤ 30 dni (albo przerwą z powodu urlopu wychowawczego, bezpłatnego, czynnej służby wojskowej) | Wcześniejsze okresy wlicza się do okresu wyczekiwania | Wcześniejsze ubezpieczenie (np. u poprzedniego pracodawcy) liczy się do 30/90 dni, jeśli przerwa nie przekroczyła 30 dni. | UZ art. 4 ust. 2 | `R-CH-02` |
| A5 | Absolwentka objęta ubezpieczeniem w ciągu 90 dni od ukończenia szkoły/studiów; **albo** co najmniej 10 lat wcześniejszego obowiązkowego ubezpieczenia (przy ubezpieczeniu obowiązkowym); albo niezdolność z powodu wypadku w drodze do/z pracy | Zasiłek od pierwszego dnia ubezpieczenia (bez okresu wyczekiwania) | W Twojej sytuacji nie musisz czekać 30/90 dni — zasiłek przysługuje od pierwszego dnia ubezpieczenia. | UZ art. 4 ust. 3 | `R-CH-02` |
| A6 | e-ZLA ma kod „B” (niezdolność przypada w ciąży) | Zasiłek 100% podstawy wymiaru zasiłku; okres zasiłkowy do 270 dni | Zwolnienie z kodem B daje 100% podstawy wymiaru przez maksymalnie 270 dni. | UZ art. 11 ust. 2 pkt 1, art. 8 ust. 1; Poradnik (24) | `R-CH-03` |
| A7 | Ubezpieczona jest w ciąży, ale e-ZLA **nie ma** kodu „B” | Zasiłek 80%, okres zasiłkowy 182 dni | Na Twoim zwolnieniu brakuje kodu B. Jeśli choroba przypada w ciąży, poproś lekarza o korektę — od tego zależy, czy dostaniesz 100%, czy 80%. | UZ art. 11 ust. 1, 2; Poradnik (24) | `R-CH-03` |
| A8 | Sama ciąża bez choroby | Brak podstawy do e-ZLA | Zwolnienie wystawia się z powodu choroby w ciąży, a nie z powodu samej ciąży. | Poradnik (23) | — (informacja) |
| A9 | Pracownica (umowa o pracę), niezdolność w roku kalendarzowym łącznie ≤ 33 dni (≤ 14 dni, jeśli w poprzednich latach ukończyła 50 lat) | Wynagrodzenie chorobowe od pracodawcy, w ciąży 100%; zasiłek z FUS od 34. (15.) dnia | Przez pierwsze 33 dni zwolnienia w roku pracodawca wypłaca Ci wynagrodzenie chorobowe (w ciąży 100%). Od 34. dnia dostajesz zasiłek chorobowy. | KP art. 92 § 1 pkt 2, § 4, § 5; UZ art. 12 ust. 1; Poradnik (23); Zał. | `R-CH-04` |
| A10 | Ubezpieczona nie jest pracownicą (zlecenie, działalność) | Brak wynagrodzenia chorobowego; zasiłek od 1. dnia niezdolności (po okresie wyczekiwania) | Nie dostaniesz wynagrodzenia chorobowego — zasiłek z ZUS albo od płatnika przysługuje od pierwszego dnia zwolnienia. | Poradnik (23); Zadanie (s. 3) | `R-CH-04` |
| A11 | Poprzednie zwolnienie bez kodu B, a nowe zwolnienie z kodem B po przerwie ≤ 60 dni | Okres zasiłkowy liczony od nowa (poprzednich okresów się nie wlicza) | Twój okres zasiłkowy w ciąży liczy się od nowa — wcześniejsze zwolnienia sprzed ciąży go nie skracają. | UZ art. 9 ust. 2 zd. 2; Poradnik (24); Zał. | `R-CH-05` |
| A12 | Kolejne zwolnienia z przerwą ≤ 60 dni (bez sytuacji z A11) | Okresy sumują się do jednego okresu zasiłkowego (270 dni) | Kolejne zwolnienia z przerwą do 60 dni sumują się. Zostało Ci jeszcze {pozostałeDni} dni okresu zasiłkowego. | UZ art. 9 ust. 1–2 | `R-CH-05` |
| A13 | Zwolnienie przypada w czasie urlopu bezpłatnego lub wychowawczego | Zasiłek chorobowy nie przysługuje; tych dni nie wlicza się do okresu zasiłkowego | Za zwolnienie w czasie urlopu bezpłatnego lub wychowawczego zasiłek chorobowy nie przysługuje. | UZ art. 12 ust. 2–3 | `R-CH-06` |
| A14 | W czasie zwolnienia wykonuje pracę zarobkową (poza czynnościami incydentalnymi; polecenie pracodawcy się nie liczy) lub aktywność niezgodną z celem zwolnienia | Utrata zasiłku za **cały** okres zwolnienia | Na zwolnieniu nie pracuj zarobkowo i nie rób niczego, co utrudnia leczenie — możesz stracić zasiłek za całe zwolnienie. Polecenie szefa nie jest usprawiedliwieniem. | UZ art. 17 ust. 1–1b; Poradnik (26) | `R-CH-07` |
| A15 | Kilka tytułów ubezpieczenia, a praca w jednym z nich jest możliwa mimo choroby (od 1.01.2027) | Na żądanie ubezpieczonej lekarz może nie wystawić zwolnienia z tego tytułu; trzeba poinformować płatnika o zwolnieniu z innego tytułu | Jeśli masz kilka umów, od 2027 r. możesz poprosić lekarza o zwolnienie tylko z części z nich. Poinformuj wtedy płatnika. | UZ art. 17 ust. 1c–1e, art. 9 ust. 4 (w mocy od 1.01.2027) | `R-CH-07` |
| A16 | Zaświadczenie lekarskie sfałszowane | Zasiłek nie przysługuje | — (sytuacja wykluczająca; komunikat ogólny o warunkach) | UZ art. 17 ust. 2 | `R-CH-07` |
| A17 | Niezdolność spowodowana umyślnym przestępstwem/wykroczeniem (prawomocny wyrok) / nadużyciem alkoholu | Brak zasiłku za cały okres / za pierwsze 5 dni | — (rzadkie; poza głównym przepływem) | UZ art. 15, 16 | `R-CH-07` |

### B. Zasiłek chorobowy w ciąży po ustaniu tytułu ubezpieczenia

| # | Warunek | Skutek | Komunikat dla rodzica | Źródło | Reguła |
|---|---|---|---|---|---|
| B1 | Niezdolność powstała w czasie ubezpieczenia i trwa po ustaniu tytułu ubezpieczenia | Zasiłek może być wypłacany dalej; w ciąży bez limitu 91 dni — do wyczerpania 270 dni | Jeśli zachorowałaś w czasie zatrudnienia, zasiłek może być wypłacany także po końcu umowy — w ciąży do łącznie 270 dni. | UZ art. 8 ust. 2, art. 13; Zał. | `R-PU-01` |
| B2 | Niezdolność powstała **po** ustaniu tytułu, nie później niż 14 dni od jego ustania, i trwa nieprzerwanie co najmniej 30 dni | Zasiłek chorobowy po ustaniu tytułu (w ciąży do 270 dni) | Zachorowałaś do 14 dni po końcu ubezpieczenia, a choroba trwa co najmniej 30 dni — możesz dostać zasiłek. | UZ art. 7 pkt 1, art. 8 ust. 2 | `R-PU-01` |
| B3 | Jak B2, ale niezdolność krótsza niż 30 dni albo powstała później niż 14 dni po ustaniu tytułu (wyjątek: choroba zakaźna / o długim okresie ujawniania się — 3 miesiące) | Brak zasiłku | Zwolnienie po końcu ubezpieczenia nie spełnia warunków (powstało po 14 dniach lub trwa krócej niż 30 dni), więc zasiłek nie przysługuje. | UZ art. 7 | `R-PU-01` |
| B4 | Po ustaniu tytułu: ma prawo do emerytury/renty, kontynuuje lub podjęła pracę dającą tytuł do ubezpieczenia chorobowego, pobiera zasiłek dla bezrobotnych / przedemerytalny / rodzicielskie świadczenie uzupełniające, podlega KRUS, **albo nie nabyła prawa do zasiłku w czasie ubezpieczenia (nie minął okres wyczekiwania)** | Brak zasiłku za okres po ustaniu tytułu | Po końcu ubezpieczenia zasiłek nie przysługuje, bo {powód}. | UZ art. 13 ust. 1 | `R-PU-02` |
| B5 | Ubezpieczenie ustało już po wyczerpaniu okresu zasiłkowego | Brak zasiłku po ustaniu | — | UZ art. 13 ust. 2 | `R-PU-02` |
| B6 | Zasiłek za okres po ustaniu tytułu | Podstawa wymiaru zasiłku ograniczona do 100% przeciętnego wynagrodzenia | Po końcu ubezpieczenia podstawa wymiaru zasiłku nie może przekroczyć przeciętnego wynagrodzenia, więc zasiłek może być niższy. | UZ art. 46 | `R-PU-03` |

### C. Świadczenie rehabilitacyjne

| # | Warunek | Skutek | Komunikat dla rodzica | Źródło | Reguła |
|---|---|---|---|---|---|
| C1 | Wyczerpany zasiłek chorobowy (270 dni w ciąży), nadal niezdolna do pracy, a leczenie rokuje odzyskanie zdolności — orzeka lekarz orzecznik ZUS | Świadczenie rehabilitacyjne do 12 miesięcy; w ciąży 100% podstawy wymiaru (poza ciążą 90% przez 3 mies., potem 75%) | Jeśli wykorzystasz 270 dni zasiłku, a lekarz uzna, że wrócisz do zdrowia, możesz wystąpić o świadczenie rehabilitacyjne — w ciąży 100% podstawy. | UZ art. 18 ust. 1–3, art. 19 ust. 1; Poradnik (24) | `R-RE-01` |
| C2 | Ma prawo do emerytury/renty, zasiłku dla bezrobotnych, zasiłku/świadczenia przedemerytalnego, rodzicielskiego świadczenia uzupełniającego, nauczycielskiego świadczenia kompensacyjnego lub jest na urlopie dla poratowania zdrowia | Świadczenie rehabilitacyjne nie przysługuje | — | UZ art. 18 ust. 7–8 | `R-RE-01` |
| C3 | Na świadczeniu rehabilitacyjnym wykonuje pracę zarobkową / działania niezgodne z celem; przypada urlop bezpłatny / wychowawczy | Utrata / brak świadczenia jak przy zasiłku chorobowym | Te same zasady co na zwolnieniu: nie pracuj zarobkowo w czasie świadczenia. | UZ art. 22 (odesłanie do art. 12, 13 ust. 1, 15, 17) | `R-CH-06`, `R-CH-07` |
| C4 | Nie zgadza się z orzeczeniem lekarza orzecznika | Sprzeciw do komisji lekarskiej ZUS | Jeśli nie zgadzasz się z orzeczeniem, możesz złożyć sprzeciw do komisji lekarskiej ZUS. | UZ art. 18 ust. 4 | — (informacja) |

### D. Zasiłek w wysokości zasiłku macierzyńskiego (do dnia porodu)

| # | Warunek | Skutek | Komunikat dla rodzica | Źródło | Reguła |
|---|---|---|---|---|---|
| D1 | Pracownica; w ciąży umowa o pracę **wygasła z powodu śmierci pracodawcy** albo **została rozwiązana z powodu upadłości lub likwidacji pracodawcy**; nie zapewniono innego zatrudnienia | Zasiłek w wysokości zasiłku macierzyńskiego (100% podstawy) od ustania zatrudnienia do dnia porodu; potem zasiłek macierzyński (E2) | Straciłaś pracę w ciąży z powodu upadłości, likwidacji lub śmierci pracodawcy — do porodu przysługuje Ci zasiłek w wysokości zasiłku macierzyńskiego (100% podstawy wymiaru). Złóż świadectwo pracy, zaświadczenie lekarskie o ciąży i oświadczenie, że nie masz innej pracy. | UZ art. 30 ust. 3, art. 47; KP art. 177 § 4; Rozp. dok. § 17; Zadanie (s. 3) | `R-ZWM-01` |
| D2 | Jak D1, ale zapewniono inne zatrudnienie | Brak świadczenia (jest nowy tytuł ubezpieczenia) | — | UZ art. 30 ust. 3 | `R-ZWM-01` |
| D3 | Ubezpieczona nie jest pracownicą (zlecenie, działalność) | Świadczenie nie przysługuje | Ten zasiłek przysługuje tylko osobom zatrudnionym na umowę o pracę. | UZ art. 30 ust. 3; Zadanie (sekcja I) | `R-ZWM-01` |
| D4 | Umowa rozwiązana w ciąży z naruszeniem prawa (prawomocny wyrok) | Wg UZ: zasiłek **macierzyński** po porodzie (E3); prawo do zasiłku w wysokości zasiłku macierzyńskiego do porodu — **sporne**, zob. Otwarte kwestie OK-1 | — | UZ art. 30 ust. 1 pkt 2 vs Zadanie (s. 3) | `R-ZWM-02` |

### E. Zasiłek macierzyński — ubezpieczenie na dzień porodu i po ustaniu ubezpieczenia

| # | Warunek | Skutek | Komunikat dla rodzica | Źródło | Reguła |
|---|---|---|---|---|---|
| E1 | W dniu porodu podlega ubezpieczeniu chorobowemu (obowiązkowo lub dobrowolnie) albo jest na urlopie wychowawczym | Prawo do zasiłku macierzyńskiego (bez okresu wyczekiwania) | W dniu porodu masz ubezpieczenie chorobowe — przysługuje Ci zasiłek macierzyński. | UZ art. 29 ust. 1 pkt 1; Poradnik (29) | `R-MA-01` |
| E2 | Poród po ustaniu ubezpieczenia, które ustało w ciąży wskutek śmierci, upadłości lub likwidacji pracodawcy | Zasiłek macierzyński mimo braku ubezpieczenia | Mimo utraty pracy z winy sytuacji pracodawcy zachowujesz prawo do zasiłku macierzyńskiego po porodzie. | UZ art. 30 ust. 1 pkt 1; Rozp. dok. § 15 ust. 1 | `R-MA-02` |
| E3 | Poród po ustaniu ubezpieczenia, które ustało w ciąży z naruszeniem prawa stwierdzonym prawomocnym wyrokiem sądu | Zasiłek macierzyński mimo braku ubezpieczenia | Jeśli sąd prawomocnie stwierdzi, że zwolniono Cię niezgodnie z prawem, masz prawo do zasiłku macierzyńskiego. Potrzebny będzie wyrok. | UZ art. 30 ust. 1 pkt 2; Rozp. dok. § 15 ust. 2 | `R-MA-02` |
| E4 | Pracownica na umowie terminowej przedłużonej do dnia porodu (KP art. 177 § 3) | Zasiłek macierzyński po ustaniu ubezpieczenia (w pełnym wymiarze) | Twoja umowa została przedłużona do dnia porodu. Po porodzie umowa się kończy, ale zasiłek macierzyński dostaniesz w pełnym wymiarze. | UZ art. 30 ust. 4; KP art. 177 § 3 | `R-MA-02` |
| E5 | W dniu porodu brak ubezpieczenia chorobowego i nie zachodzi E2–E4 (np. koniec zlecenia, zamknięcie lub zawieszenie działalności, wyrejestrowanie, niezgłoszenie do dobrowolnego ubezpieczenia, umowa terminowa skończyła się przed upływem 3. miesiąca ciąży) | **Brak zasiłku macierzyńskiego** | Uwaga: w dniu porodu nie będziesz mieć ubezpieczenia chorobowego, więc zasiłek macierzyński nie przysługuje. Sprawdź, czy możesz utrzymać ubezpieczenie do porodu. Możesz mieć prawo do świadczenia rodzicielskiego (tzw. kosiniakowego) z innego systemu. | UZ art. 29 ust. 1; Poradnik (29, 35); Zadanie sekcja H pkt 3 | `R-MA-03` |
| E6 | Ubezpieczona dobrowolnie (zlecenie, działalność) zaczyna pobierać zasiłek macierzyński | Automatyczne wyrejestrowanie z ubezpieczenia chorobowego; po zakończeniu zasiłku trzeba zgłosić się ponownie | Gdy zaczniesz pobierać zasiłek macierzyński, ZUS wyrejestruje Cię z dobrowolnego ubezpieczenia chorobowego. Po zakończeniu zasiłku zgłoś się do niego ponownie. | Poradnik (35) | `R-MA-04` |
| E7 | Poród w czasie urlopu bezpłatnego | Zasiłek macierzyński nie przysługuje za okres urlopu bezpłatnego (UZ art. 31 ust. 5 → art. 12 ust. 2 pkt 1) | Za czas urlopu bezpłatnego zasiłek macierzyński nie jest wypłacany. | UZ art. 31 ust. 5, art. 12 ust. 2 pkt 1 | `R-MA-05` |

### F. Zadłużenie składkowe — działalność gospodarcza i osoby współpracujące

| # | Warunek | Skutek | Komunikat dla rodzica | Źródło | Reguła |
|---|---|---|---|---|---|
| F1 | Osoba prowadząca pozarolniczą działalność lub współpracująca (także współpracująca z osobą fizyczną z art. 18 ust. 1 Prawa przedsiębiorców), duchowny-płatnik, marynarz; **w dniu powstania prawa** zadłużenie z tytułu składek na ubezpieczenia społeczne > 1% minimalnego wynagrodzenia | Zasiłek chorobowy, świadczenie rehabilitacyjne, zasiłek macierzyński i opiekuńczy **nie przysługują do czasu spłaty całego zadłużenia** | Na Twoim koncie w ZUS jest zaległość w składkach ({kwota} zł) powyżej 1% minimalnego wynagrodzenia ({próg} zł). Dopóki jej całej nie spłacisz, ZUS nie wypłaci zasiłku. | UZ art. 2a ust. 1; Poradnik (23, 35, 36) | `R-DL-01` |
| F2 | Jak F1, zadłużenie spłacone w całości w ciągu 6 miesięcy od dnia powstania prawa | Prawo do świadczenia „odblokowane” | Spłać całą zaległość do {data+6 mies.} — wtedy otrzymasz zasiłek. | UZ art. 2a ust. 1–2 | `R-DL-01` |
| F3 | Jak F1, zadłużenie nie spłacone w ciągu 6 miesięcy od dnia powstania prawa | Prawo do świadczenia przedawnia się (traci się je definitywnie) | Minęło 6 miesięcy bez spłaty zaległości — prawo do zasiłku za ten okres wygasło. | UZ art. 2a ust. 2 | `R-DL-01` |
| F4 | Zadłużenie ≤ 1% minimalnego wynagrodzenia | Brak blokady | — | UZ art. 2a ust. 1 | `R-DL-01` |
| F5 | Pracownica, zleceniobiorczyni (składki opłaca płatnik) | Art. 2a nie ma zastosowania | — | UZ art. 2a ust. 1 (krąg osób); Poradnik (23) | `R-DL-01` |
| F6 | Przedsiębiorczyni nie opłaciła w terminie składki na dobrowolne ubezpieczenie chorobowe | Ubezpieczenie chorobowe może ustać (przerwa w ubezpieczeniu) → ryzyko okresu wyczekiwania od nowa i braku ubezpieczenia w dniu porodu | Pilnuj terminowej zapłaty składki chorobowej — spóźnienie może przerwać Twoje ubezpieczenie. | UZ art. 48a ust. 4 (pośrednio); **[poza materiałami]** ustawa o sus art. 14 ust. 2 pkt 2 — zob. OK-3 | `R-DL-02` |

### G. Umowa dla pozoru i podwyższenie podstawy w ciąży

| # | Warunek | Skutek | Komunikat dla rodzica | Źródło | Reguła |
|---|---|---|---|---|---|
| G1 | Umowa o pracę / zlecenia lub działalność zawarta (podjęta) dla pozoru albo w celu obejścia prawa — tylko po to, by objąć się ubezpieczeniem i nabyć prawo do zasiłków | ZUS po postępowaniu wydaje decyzję o **niepodleganiu ubezpieczeniom** → brak prawa do wszystkich zasiłków z tego tytułu | Umowa musi być prawdziwa — praca musi być faktycznie wykonywana. Jeśli ZUS uzna umowę za zawartą tylko dla zasiłku, nie dostaniesz świadczeń. | Poradnik (7, 9); Zadanie sekcja H pkt 1; **[poza materiałami]** KC art. 83 § 1, art. 58 | `R-PZ-01` (sygnał ryzyka) |
| G2 | Wynagrodzenie w umowie o pracę rażąco zawyżone w stosunku do pracy | ZUS może wydać decyzję w sprawie podstawy wymiaru składek → niższa podstawa wymiaru zasiłku | ZUS może sprawdzić, czy Twoje wynagrodzenie odpowiada wykonywanej pracy, i obniżyć podstawę. | Poradnik (7) | `R-PZ-02` (sygnał ryzyka) |
| G3 | Podwyższenie podstawy wymiaru składek w ciąży wyłącznie po to, by mieć wyższy zasiłek | ZUS może wydać decyzję ustalającą niższą podstawę → niższe zasiłki | Jeśli w ciąży podnosisz podstawę składek tylko po to, by dostać wyższy zasiłek, ZUS może ją obniżyć. | Zadanie sekcja H pkt 2 | `R-PZ-02` (sygnał ryzyka) |
| G4 | Ubezpieczona z zadeklarowaną podstawą (np. działalność) ubezpieczona krócej niż 12 miesięcy | Nadwyżka zadeklarowanej kwoty ponad minimum wchodzi do podstawy wymiaru zasiłku tylko proporcjonalnie (× liczba pełnych miesięcy / 12) — krótkotrwałe podwyższenie daje mały efekt | Podstawa zasiłku liczy się z 12 miesięcy. Wyższa składka płacona tylko kilka miesięcy podniesie zasiłek tylko częściowo. | UZ art. 48 ust. 1, art. 48a ust. 1 | `R-PZ-03` (wyliczenie, nie ryzyko) |
| G5 | Zmiana wymiaru czasu pracy w miesiącu powstania niezdolności lub w okresie 12 miesięcy | Podstawa liczona od wynagrodzenia dla **nowego** wymiaru | Zmiana etatu wpływa na wysokość zasiłku — liczy się wynagrodzenie dla nowego wymiaru czasu pracy. | UZ art. 40 | `R-PZ-04` |

### H. Ochrona z Kodeksu pracy

| # | Warunek | Skutek | Komunikat dla rodzica | Źródło | Reguła |
|---|---|---|---|---|---|
| H1 | Pracownica w ciąży (lub na urlopie macierzyńskim / od złożenia wniosku o urlop związany z rodzicielstwem do jego końca) | Pracodawca nie może wypowiedzieć ani rozwiązać umowy (wyjątki: wina pracownicy ze zgodą związku; upadłość/likwidacja) | W ciąży pracodawca nie może Cię zwolnić, poza wyjątkami (Twoja ciężka wina za zgodą związków albo upadłość/likwidacja firmy). | KP art. 177 § 1, § 4 | `R-KP-01` |
| H2 | Umowa na czas określony albo na okres próbny **dłuższy niż 1 miesiąc**, która skończyłaby się **po upływie 3. miesiąca ciąży**, i nie jest umową na zastępstwo | Umowa przedłuża się z mocy prawa do dnia porodu → ubezpieczenie w dniu porodu, potem E4 | Twoja umowa przedłuży się automatycznie do dnia porodu, więc w dniu porodu będziesz ubezpieczona i dostaniesz zasiłek macierzyński. | KP art. 177 § 3; UZ art. 30 ust. 4 | `R-KP-02` |
| H3 | Umowa terminowa kończy się **przed** upływem 3. miesiąca ciąży, albo okres próbny ≤ 1 miesiąca | Brak przedłużenia → ubezpieczenie ustaje; ryzyko E5 | Twoja umowa kończy się przed końcem 3. miesiąca ciąży — nie przedłuży się automatycznie. Bez nowego ubezpieczenia nie dostaniesz zasiłku macierzyńskiego. | KP art. 177 § 3 (a contrario) | `R-KP-02` |
| H4 | Umowa terminowa zawarta na zastępstwo nieobecnego pracownika | Brak przedłużenia do dnia porodu | Umowa na zastępstwo nie przedłuża się do dnia porodu. | KP art. 177 § 3¹ | `R-KP-02` |
| H5 | Zleceniobiorczyni, przedsiębiorczyni, osoba współpracująca | Ochrona KP nie obowiązuje | Ochrona przed zwolnieniem i przedłużenie umowy dotyczą tylko umowy o pracę. Przy zleceniu lub działalności sama pilnuj ciągłości ubezpieczenia do dnia porodu. | Zadanie sekcja I (ostatni akapit) | `R-KP-01`, `R-KP-02` |
| H6 | Rozwiązanie umowy w ciąży z powodu upadłości lub likwidacji pracodawcy, bez innego zatrudnienia | Świadczenia z odrębnych przepisów → D1, E2 | Zob. D1. | KP art. 177 § 4; UZ art. 30 ust. 1 pkt 1, ust. 3 | `R-ZWM-01` |

## Reguły dla silnika reguł (TS)

### Dane wejściowe

Daty jako `ISODate` (`YYYY-MM-DD`). Pola opcjonalne (`?`) oznaczają „nie wiadomo” — reguła zwraca wtedy wynik `"unknown"` z prośbą o uzupełnienie danych, zamiast zgadywać.

```ts
type ISODate = string;

type TytulUbezpieczenia =
  | "umowa_o_prace"          // obowiązkowe chorobowe, pracownik (KP)
  | "umowa_zlecenia"         // dobrowolne chorobowe
  | "dzialalnosc"            // dobrowolne chorobowe, art. 2a
  | "osoba_wspolpracujaca";  // dobrowolne chorobowe, art. 2a

type PrzyczynaUstania =
  | "smierc_pracodawcy"
  | "upadlosc_pracodawcy"
  | "likwidacja_pracodawcy"
  | "naruszenie_prawa_prawomocny_wyrok"
  | "koniec_umowy_terminowej"
  | "wypowiedzenie_lub_porozumienie"
  | "zamkniecie_lub_zawieszenie_dzialalnosci"
  | "wyrejestrowanie_dobrowolnego"
  | "nieoplacenie_skladki";

interface OkresUbezpieczenia {
  tytul: TytulUbezpieczenia;
  od: ISODate;
  do?: ISODate;                       // brak = trwa
  przyczynaUstania?: PrzyczynaUstania;
}

interface Zwolnienie {                // e-ZLA
  od: ISODate;
  do: ISODate;
  kodB: boolean;
  tytul: TytulUbezpieczenia;
  wTrakcieUrlopuBezplatnegoLubWychowawczego: boolean;
}

interface UmowaTerminowa {
  rodzaj: "czas_okreslony" | "okres_probny";
  dlugoscMiesiecy: number;            // dla okresu próbnego
  naZastepstwo: boolean;
  planowanyKoniec: ISODate;
}

interface Wejscie {
  dzis: ISODate;
  dataPoczatkuCiazy?: ISODate;         // do wyliczenia końca 3. miesiąca ciąży
  przewidywanaDataPorodu?: ISODate;
  dataPorodu?: ISODate;
  okresyUbezpieczenia: OkresUbezpieczenia[];   // chronologicznie
  zwolnienia: Zwolnienie[];                    // chronologicznie
  umowaTerminowa?: UmowaTerminowa;
  wiek50Wczesniej: boolean;           // ukończyła 50 lat w poprzednim roku kalendarzowym lub wcześniej (KP art. 92 § 5)
  absolwentkaW90Dni: boolean;         // UZ art. 4 ust. 3 pkt 1
  staz10LatObowiazkowego: boolean;    // UZ art. 4 ust. 3 pkt 3
  zapewnionoInneZatrudnienie?: boolean;
  zadluzenieSkladkoweNaDzienPrawa?: number;   // zł, z PUE/eZUS (symulacja)
  dataSplatyZadluzenia?: ISODate;
  minimalneWynagrodzenie: number;      // parametr roczny
  swiadczeniaWykluczajace: {           // UZ art. 13 ust. 1, art. 18 ust. 7
    emeryturaLubRenta: boolean;
    zasilekDlaBezrobotnychLubPrzedemerytalny: boolean;
    rodzicielskieSwiadczenieUzupelniajace: boolean;
    krus: boolean;
    nowyTytulPoUstaniu: boolean;
  };
  pracaZarobkowaNaZwolnieniu?: boolean;
  rokowanieOdzyskaniaZdolnosci?: boolean;     // orzeczenie lekarza orzecznika
  sygnalyRyzyka: {
    umowaZawartaWCiazy: boolean;
    podwyzkaPodstawyWCiazy: boolean;
    wynagrodzenieZnaczniePowyzejRynkowego?: boolean;
  };
}
```

### Wynik reguły

```ts
type Wynik = {
  regula: string;                      // np. "R-CH-02"
  status: "przysluguje" | "nie_przysluguje" | "ryzyko" | "unknown" | "info";
  skutek?: { procent?: 70 | 80 | 81.5 | 100; maksDni?: number; od?: ISODate; do?: ISODate };
  komunikat: string;                   // z kolumny „Komunikat dla rodzica”
  zrodlo: string[];                    // np. ["UZ art. 4 ust. 1"]
};
```

### Predykaty pomocnicze

```ts
const obowiazkowe = (t: TytulUbezpieczenia) => t === "umowa_o_prace";
const pracownica  = (t: TytulUbezpieczenia) => t === "umowa_o_prace";
const art2a       = (t: TytulUbezpieczenia) => t === "dzialalnosc" || t === "osoba_wspolpracujaca";

// UZ art. 4 ust. 2: sklej okresy z przerwą <= 30 dni (lub przerwą z urlopu wychowawczego/bezpłatnego/służby)
ubezpieczonyNieprzerwanieOd(dzien): ISODate | null;
podlegaUbezpieczeniuChorobowemu(dzien): OkresUbezpieczenia | null;
koniecTrzeciegoMiesiacaCiazy = dataPoczatkuCiazy + 3 miesiące;  // zob. OK-5
```

### Reguły

Wszystkie reguły są czystymi funkcjami `(Wejscie) => Wynik[]`. Zapis logiczny:

| ID | Reguła (boolowsko) | Wynik |
|---|---|---|
| `R-CH-01` | `T = podlegaUbezpieczeniuChorobowemu(zwolnienie.od) != null` | `!T` → przejdź do `R-PU-*`; `T` → kontynuuj |
| `R-CH-02` | `wyczekiwanie = obowiazkowe(T.tytul) ? 30 : 90`; `zwolniony = absolwentkaW90Dni \|\| (obowiazkowe(T.tytul) && staz10LatObowiazkowego)`; `ok = zwolniony \|\| dni(ubezpieczonyNieprzerwanieOd(zwolnienie.od), zwolnienie.od) >= wyczekiwanie` | `!ok` → `nie_przysluguje` za dni przed końcem wyczekiwania (dni nie wliczają się do okresu zasiłkowego); od `ubezpieczonyOd + wyczekiwanie` → `przysluguje` |
| `R-CH-03` | `zwolnienie.kodB` | `true` → `procent=100, maksDni=270`; `false && ciąża trwa w dacie zwolnienia` → `ryzyko`: „brak kodu B”, `procent=80, maksDni=182` |
| `R-CH-04` | `pracownica(T.tytul)`; `limit = wiek50Wczesniej ? 14 : 33`; `dniWRoku = suma dni zwolnień pracownicy w roku kalendarzowym` | pracownica: dni `1..limit` → wynagrodzenie chorobowe od pracodawcy (w ciąży 100%), dni `> limit` → zasiłek z FUS; niepracownica: zasiłek od 1. dnia |
| `R-CH-05` | `okresZasilkowy = suma dni zwolnień, łącząc przerwy <= 60 dni, ALE reset gdy nowe zwolnienie.kodB && poprzednie !kodB` | `pozostale = (kodB ? 270 : 182) - okresZasilkowy`; `pozostale <= 0` → `nie_przysluguje` + przejdź do `R-RE-01` |
| `R-CH-06` | `zwolnienie.wTrakcieUrlopuBezplatnegoLubWychowawczego` | `nie_przysluguje` (dni nie wliczają się do okresu zasiłkowego) |
| `R-CH-07` | `pracaZarobkowaNaZwolnieniu === true` | `ryzyko` → utrata zasiłku za cały okres zwolnienia; `undefined` → `info` z ostrzeżeniem |
| `R-PU-01` | `ustanie = data ustania tytułu`; `(a) zwolnienie.od <= ustanie` (trwa dalej) **lub** `(b) zwolnienie.od <= ustanie + 14 dni && dlugoscNieprzerwana >= 30` | `(a) \|\| (b)` → `przysluguje`, `maksDni = kodB ? 270 : 91` (UZ art. 8 ust. 2); inaczej `nie_przysluguje` |
| `R-PU-02` | `wykl = emeryturaLubRenta \|\| zasilekDlaBezrobotnych... \|\| rodzicielskieSwiadczenieUzupelniajace \|\| krus \|\| nowyTytulPoUstaniu \|\| !nabylaPrawoWCzasieUbezpieczenia(R-CH-02) \|\| okresZasilkowyWyczerpanyPrzedUstaniem` | `wykl` → `nie_przysluguje` za okres po ustaniu |
| `R-PU-03` | `zasilek za okres po ustaniu` | `info`: podstawa ≤ 100% przeciętnego wynagrodzenia |
| `R-RE-01` | `okresZasilkowyWyczerpany && nadalNiezdolna && rokowanieOdzyskaniaZdolnosci && !(emeryturaLubRenta \|\| zasilekDlaBezrobotnych... \|\| rodzicielskieSwiadczenieUzupelniajace)` | `przysluguje`, `maksDni = 12 × 30`, `procent = ciąża ? 100 : (90 przez 3 mies., potem 75)`; `rokowanie == undefined` → `unknown` („orzeka lekarz orzecznik ZUS”) |
| `R-ZWM-01` | `U = ostatni okres ubezpieczenia`; `pracownica(U.tytul) && U.przyczynaUstania ∈ {smierc, upadlosc, likwidacja}_pracodawcy && U.do in [poczatekCiazy, dataPorodu) && zapewnionoInneZatrudnienie === false` | `przysluguje`: zasiłek w wysokości zasiłku macierzyńskiego, `procent=100`, od `U.do + 1` do dnia porodu |
| `R-ZWM-02` | `pracownica && przyczynaUstania === "naruszenie_prawa_prawomocny_wyrok"` | `unknown` — zob. OK-1 |
| `R-MA-01` | `podlegaUbezpieczeniuChorobowemu(dataPorodu) != null \|\| urlopWychowawczy(dataPorodu)` | `przysluguje` (bez okresu wyczekiwania) |
| `R-MA-02` | `!R-MA-01 && U.do in [poczatekCiazy, dataPorodu) && ( U.przyczynaUstania ∈ {smierc, upadlosc, likwidacja}_pracodawcy \|\| U.przyczynaUstania === "naruszenie_prawa_prawomocny_wyrok" \|\| umowaPrzedluzonaDoPorodu(R-KP-02) )` | `przysluguje` (zasiłek macierzyński po ustaniu ubezpieczenia) |
| `R-MA-03` | `!R-MA-01 && !R-MA-02` (dla `dataPorodu` lub `przewidywanaDataPorodu`) | `ryzyko` / `nie_przysluguje`: brak ubezpieczenia na dzień porodu + wskazanie świadczenia rodzicielskiego |
| `R-MA-04` | `!obowiazkowe(tytul) && pobiera zasiłek macierzyński` | `info`: automatyczne wyrejestrowanie z dobrowolnego chorobowego; przypomnienie o ponownym zgłoszeniu po zasiłku |
| `R-MA-05` | `urlopBezplatny(dzien)` w okresie zasiłku macierzyńskiego | `nie_przysluguje` za te dni |
| `R-DL-01` | `art2a(tytul) && zadluzenieSkladkoweNaDzienPrawa > 0.01 * minimalneWynagrodzenie` | `dataSplaty <= dataPrawa + 6 mies.` → `przysluguje` od spłaty (wypłata wstrzymana do spłaty); brak spłaty i `dzis > dataPrawa + 6 mies.` → `nie_przysluguje` (przedawnienie); brak spłaty i termin trwa → `ryzyko` z terminem; `zadluzenie == undefined` → `unknown` („pobierz zaświadczenie o niezaleganiu”) |
| `R-DL-02` | `!obowiazkowe(tytul) && jest okres z przyczynaUstania === "nieoplacenie_skladki"` | `ryzyko`: przerwa w ubezpieczeniu → ponowne liczenie okresu wyczekiwania (`R-CH-02`) i ryzyko `R-MA-03` |
| `R-PZ-01` | `sygnalyRyzyka.umowaZawartaWCiazy && (dni(od zawarcia do pierwszego zwolnienia lub porodu) krótki)` | `ryzyko` (tylko ostrzeżenie; **nie** rozstrzyga — to ocena ZUS w postępowaniu). Próg „krótki” — zob. OK-4 |
| `R-PZ-02` | `sygnalyRyzyka.podwyzkaPodstawyWCiazy \|\| sygnalyRyzyka.wynagrodzenieZnaczniePowyzejRynkowego` | `ryzyko`: ZUS może ustalić niższą podstawę |
| `R-PZ-03` | `tytul ∈ {dzialalnosc, osoba_wspolpracujaca} && pełneMiesiąceUbezpieczenia < 12` | `info`: wyliczenie podstawy wg UZ art. 48a |
| `R-PZ-04` | `zmiana wymiaru czasu pracy w miesiącu powstania niezdolności lub w 12 poprzednich` | `info`: podstawa od wynagrodzenia dla nowego wymiaru |
| `R-KP-01` | `pracownica(tytul) && ciąża trwa` | `info`: ochrona przed zwolnieniem; `!pracownica` → `info`: brak ochrony KP |
| `R-KP-02` | `p = pracownica && umowaTerminowa && !umowaTerminowa.naZastepstwo && (umowaTerminowa.rodzaj === "czas_okreslony" \|\| umowaTerminowa.dlugoscMiesiecy > 1) && umowaTerminowa.planowanyKoniec > koniecTrzeciegoMiesiacaCiazy` | `p` → umowa przedłużona do dnia porodu (nadpisz `okres.do = dataPorodu`) → `R-MA-02`; `!p && umowaTerminowa.planowanyKoniec < przewidywanaDataPorodu` → `ryzyko` → `R-MA-03` |

Kolejność oceny: `R-KP-02` (bo zmienia daty ubezpieczenia) → `R-DL-*` → `R-CH-*` / `R-PU-*` / `R-RE-01` dla każdego zwolnienia → `R-ZWM-*` → `R-MA-*` → `R-PZ-*` (ostrzeżenia).

## Otwarte kwestie

- **OK-1. Zasiłek w wysokości zasiłku macierzyńskiego przy bezprawnym rozwiązaniu umowy.** UZ art. 30 ust. 3 daje to świadczenie tylko przy śmierci pracodawcy, upadłości i likwidacji. Bezprawne rozwiązanie (art. 30 ust. 1 pkt 2) daje zasiłek **macierzyński** po porodzie. Treść zadania (s. 3) i `GLOSSARY.md` wymieniają bezprawne rozwiązanie także jako podstawę zasiłku do dnia porodu. Do decyzji: trzymamy się ustawy (`R-ZWM-02` = `unknown`) i proponuję poprawić definicję w `GLOSSARY.md` albo potwierdzić u mentora ZUS.
- **OK-2. Kwota progu z art. 2a.** Ustawa podaje próg „1% minimalnego wynagrodzenia”, bez kwoty. Minimalne wynagrodzenie na 2026 r. nie występuje w materiałach (wg wiedzy ogólnej 4806 zł → próg ok. 48,06 zł — **do weryfikacji**). Trzeba też doprecyzować „dzień powstania prawa”: dla zasiłku chorobowego to pierwszy dzień zasiłku (po wynagrodzeniu chorobowym?), a dla macierzyńskiego dzień porodu. Starsze brzmienie art. 2a nie miało progu 1% ani 6-miesięcznego przedawnienia — sprawy przykładowe z lat ubiegłych mogą tego nie odzwierciedlać.
- **OK-3. Ustanie dobrowolnego ubezpieczenia za nieopłacenie składki.** Ustawa o systemie ubezpieczeń społecznych (art. 14 ust. 2 pkt 2: brak ubezpieczenia od dnia, za który nie opłacono składki w terminie, chyba że ZUS wyrazi zgodę na opłacenie po terminie) nie jest w `docs/task/`. W materiałach jest tylko pośrednia wzmianka (UZ art. 48a ust. 4). `R-DL-02` oznaczono jako regułę „poza materiałami”.
- **OK-4. Umowa dla pozoru — brak twardych kryteriów.** Pozorność to ocena ZUS lub sądu w konkretnej sprawie. Silnik może tylko sygnalizować ryzyko (umowa zawarta w ciąży, krótko przed zwolnieniem/porodem, wysokie wynagrodzenie, brak następcy na stanowisku). Progi typu „X dni” są heurystyką produktu, nie przepisem — trzeba je oznaczyć w UI jako „sygnał ostrzegawczy”, nie rozstrzygnięcie. Podstawa prawna (KC art. 83, 58) jest poza materiałami.
- **OK-5. „Po upływie trzeciego miesiąca ciąży” (KP art. 177 § 3).** Trzeba ustalić, jak liczymy miesiąc ciąży (od pierwszego dnia ostatniej miesiączki czy od poczęcia; miesiąc kalendarzowy czy 4 tygodnie). Dane pochodzą z zaświadczenia lekarskiego. Do czasu ustalenia proponuję przy dacie granicznej ±7 dni zwracać `unknown` z prośbą o kontakt z PIP/ZUS.
- **OK-6. Limit 91 dni po ustaniu tytułu w ciąży.** UZ art. 8 ust. 2 wyłącza limit 91 dni dla niezdolności „występującej w trakcie ciąży”. Załącznik podaje dla „zasiłku po ustaniu – ciąża” do 270 dni. Nie jest jasne, czy 270 dni liczy się łącznie z okresem sprzed ustania (przyjęto: tak, jeden okres zasiłkowy — UZ art. 9).
- **OK-7. Wynagrodzenie chorobowe a zmiana pracodawcy w roku.** Limit 33 dni liczy się „w ciągu roku kalendarzowego” (KP art. 92 § 1) — u nowego pracodawcy w praktyce wlicza się dni z poprzedniego zatrudnienia w tym roku (na podstawie świadectwa pracy). W wyciągu KP tego nie ma; silnik potrzebuje pola „dni wynagrodzenia chorobowego wykorzystane w tym roku”.
- **OK-8. Zmiany od 1.01.2027.** UZ art. 9 ust. 4 (jeden okres zasiłkowy niezależnie od liczby tytułów) i art. 17 ust. 1d–1e (zwolnienie tylko z części tytułów) wchodzą w życie 1.01.2027. Silnik powinien wersjonować reguły datą zdarzenia (`dataZwolnienia >= 2027-01-01`).
- **OK-9. Zasiłek macierzyński w czasie urlopu wychowawczego.** UZ art. 29 ust. 1 przyznaje prawo przy porodzie w okresie urlopu wychowawczego, a Poradnik (35) mówi, że „zasiłek macierzyński nie przysługuje za czas urlopu wychowawczego”. To prawdopodobnie dwie różne rzeczy (nabycie prawa a okres wypłaty — po porodzie urlop wychowawczy zastępuje urlop macierzyński). Wymaga potwierdzenia przed napisaniem komunikatu.
- **OK-10. Ubezpieczenie dobrowolne a okres wyczekiwania przy zmianie tytułu.** Gdy osoba przechodzi z umowy o pracę (obowiązkowe) na działalność (dobrowolne) z przerwą ≤ 30 dni, poprzedni okres się wlicza (UZ art. 4 ust. 2), ale wymagany próg (30 czy 90) zależy od tytułu w dniu niezdolności. Przyjęto: próg z bieżącego tytułu, okresy z poprzednich tytułów zaliczane.
