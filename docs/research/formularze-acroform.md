# Formularze zasiłkowe ZUS: wzory PDF i pola AcroForm

Odpowiedź na issue #2. Stan na 21.11.2026. Źródło: zus.pl → „Wzory formularzy” → „Zasiłki”. Wszystkie pięć formularzy ma na zus.pl **aktualizację z 24.10.2026** (ZAS-12: 26.10.2026), czyli wersję po zmianach obowiązujących od 24.10.2026.

Pliki leżą w `public/forms/`. Każdy formularz ZUS publikuje w dwóch wariantach:

- `*_edytowalny.pdf` („Wypełnij i wydrukuj” / „do zapisu”, WCAG): **ma pola AcroForm** (formularz hybrydowy: AcroForm + XFA + JavaScript walidujący + podpis uprawnień Reader `/Perms`);
- `*_do-druku.pdf` („Pobierz i drukuj”): **nie ma pól AcroForm** (0 pól), nadaje się tylko do druku i do wyświetlania podglądu.

## Podsumowanie

| Formularz | Do czego służy | Kto wypełnia | AcroForm? | Liczba pól | Wersja (zus.pl / metadane PDF) | Plik |
|---|---|---|---|---|---|---|
| **ZAM** (dawniej ZAS-54) | Wniosek o zasiłek macierzyński za urlop macierzyński / na warunkach macierzyńskiego / rodzicielski / uzupełniający / ojcowski | Ubezpieczony (świadczeniobiorca) | edytowalny: tak; do druku: nie | 85 (46 tekst, 39 checkbox), 7 stron (5 formularza) | akt. 24.10.2026; druk „zam. nr 2965/26(E)”; ModDate 2026-10-26 | [strona](https://www.zus.pl/-/wniosek-zas-54) · [edytowalny](https://www.zus.pl/documents/10182/4223950/ZAM_wypelnij_i_wydrukuj.pdf/4e4534c6-e7cd-b934-9c5e-aab4d64f3f20) · [do druku](https://www.zus.pl/documents/10182/4223950/ZAM_pobierz+i+drukuj.pdf/f1ad7e3f-0eaa-fdbc-20ec-5b07ab59566a) |
| **Z-3** | Zaświadczenie płatnika składek dla **pracownika** (zasiłek chorobowy, opiekuńczy, macierzyński, w wysokości zasiłku macierzyńskiego, wyrównawczy, świadczenie rehabilitacyjne) | Płatnik (pracodawca), gdy zasiłek wypłaca ZUS | edytowalny: tak; do druku: nie | 276 (235 tekst, 41 checkbox), 9 stron | akt. 24.10.2026; ModDate 2026-10-23 | [strona](https://www.zus.pl/-/zaswiadczenie-zus-z-3) · [edytowalny](https://www.zus.pl/documents/10182/12636166/Z-3_WCAG__do+zapisu.pdf/2dede7ee-dc99-9255-ace7-d950fb7231d0) · [do druku](https://www.zus.pl/documents/10182/12636166/Z-3_do+druku.pdf/388eed46-ea41-6a75-cb21-739c5f83aac7) |
| **Z-3a** | Zaświadczenie płatnika dla ubezpieczonego **niebędącego pracownikiem** (np. zleceniobiorca), bez przedsiębiorców, współpracujących, duchownych i marynarzy | Płatnik (np. zleceniodawca) | edytowalny: tak; do druku: nie | 146 (102 tekst, 44 checkbox), 7 stron | akt. 24.10.2026; ModDate 2026-10-26 | [strona](https://www.zus.pl/-/zaswiadczenie-zus-z-3a) · [edytowalny](https://www.zus.pl/documents/10182/4223950/Z-3a_wypelnij_i_wydrukuj_edytowalny.pdf/f901f37f-d46b-c38c-ee08-b27302b62c86) · [do druku](https://www.zus.pl/documents/10182/4223950/Z-3a_pobierz_plik_do_wydruku.pdf/7dd8fb4c-e8f6-05c8-7f69-92b82fa33571) |
| **ZAS-53** | Wniosek o zasiłek chorobowy (przedsiębiorca, współpracujący, duchowny, marynarz, choroba po ustaniu ubezpieczenia). W naszym zakresie: **zasiłek chorobowy w ciąży** dla osób prowadzących działalność | Ubezpieczony | edytowalny: tak; do druku: nie | 31 (22 tekst, 9 checkbox), 4 strony | akt. 24.10.2026; druk „2869_26”; ModDate 2026-10-26 | [strona](https://www.zus.pl/-/zaswiadczenie-zas-53) · [edytowalny](https://www.zus.pl/documents/10182/10157865/ZAS-53_WCAG2_do+zapisu.pdf/b6f67bac-5887-3bd0-18ca-d857fa6504e1) · [do druku](https://www.zus.pl/documents/10182/10157865/ZAS-53_do+wydruku.pdf/fb9f344f-b24d-031a-d1ca-18e26c19027d) |
| **ZAS-12** | Zaświadczenie płatnika: prawo do zasiłku chorobowego / opiekuńczego **za dalszy okres** nieprzerwanej niezdolności (kolejne zwolnienie po Z-3/Z-3a) | Płatnik | edytowalny: tak; do druku: nie | 33 (29 tekst, 4 checkbox), 3 strony | akt. 26.10.2026; ModDate 2026-10-20 | [strona](https://www.zus.pl/-/zaswiadczenie-zas-4) · [edytowalny](https://www.zus.pl/documents/10182/4447142/ZAS-12_interaktywna_wypelnij_i_wydrukuj.pdf/b6d26c4b-68ae-98e3-b7c0-ea217d9fcd1c) · [do druku](https://www.zus.pl/documents/10182/4447142/ZAS-12_pobierz_plik.pdf/85b82e86-6c8d-93c2-95f0-8fc46dcb7683) |

Uwagi wspólne:

- Adresy stron na zus.pl mają mylące slugi: ZAM jest pod `wniosek-zas-54` (stary symbol), ZAS-53 pod `zaswiadczenie-zas-53`, ZAS-12 pod `zaswiadczenie-zas-4`.
- **Każde pole ma tooltip (`/TU`)** z opisem w języku ZUS; kolumna „Znaczenie” poniżej to dosłownie ten tooltip, a tam, gdzie tooltip lub nazwa myli się z nadrukiem, dodałem uwagę na podstawie pozycji pola i tekstu strony.
- Nazwy pól są w stylu XFA (`topmostSubform[0].PageN[0].Nazwa[0]`); w tabelach skracam je do `PageN.Nazwa[i]`. Nazwy często nie odpowiadają treści (np. `Numerlokalu2` w ZAM to „która część urlopu ojcowskiego”), więc mapowanie trzeba robić po pełnej nazwie i tooltipie, nie po nazwie.
- Checkboxy mają jeden stan „włączony” `/1` (wyłączony `/Off`). Brak pól radio i list wyboru: pary TAK/NIE to **dwa niezależne checkboxy**, więc aplikacja sama musi pilnować wykluczania.
- Daty: pola z `MaxLen 8` przyjmują `ddmmrrrr` bez separatorów (pola grzebieniowe). PESEL `MaxLen 11`, NIP `MaxLen 10`, REGON `MaxLen 14`, rachunek `MaxLen 26`.
- Programowe wypełnianie (np. pdf-lib): należy usunąć `/XFA` z `/AcroForm` (inaczej Adobe Reader pokaże stary stan XFA) oraz `/Perms` (zmiana pliku unieważnia podpis uprawnień Reader i Reader wyświetla ostrzeżenie). Przeglądarki i tak renderują warstwę AcroForm.
- Żaden z tych formularzy nie ma pola na kwotę zasiłku: wyliczenie robi płatnik zasiłku (ZUS albo płatnik uprawniony), a do wyliczenia służą dane płacowe z Z-3 / Z-3a.

## ZAM: wniosek o zasiłek macierzyński (85 pól)

Struktura nadruku: dane ubezpieczonego i płatnika (s. 1); rachunek, zakres wniosku, informacje o ubezpieczeniu, przyczyna 1 (urodzenie / przyjęcie na wychowanie) (s. 2); przyczyna 2 (przewidywana data porodu), 3 (urodzenie po ustaniu zatrudnienia), 4 (uzupełniający urlop macierzyński: wcześniak / szpital) (s. 3); dane dziecka do pkt 4 i przyczyna 5 (sytuacja matki: skrócenie, przerwanie, praca, porzucenie, śmierć) wraz z danymi matki (s. 4); przyczyna 6 (wypisanie ze szpitala), oświadczenie o urlopie ojcowskim, informacja o drugim rodzicu i jego dane, data i podpis (s. 5).

| Str. | Pole | Typ | Znaczenie (tooltip ZUS) |
|---|---|---|---|
| 1 | `Page1.PESEL[0]` | tekst (max 11) | Wpisz swój numer PESEL |
| 1 | `Page1.Dataurodzenia[0]` | tekst (max 8) | Jeśli nie masz nadanego numeru PESEL, wpisz swoją datę urodzenia w formacie dd mm rrrr |
| 1 | `Page1.Rodzajseriainumerdokumentu[0]` | tekst | Jeśli nie masz nadanego numeru PESEL, wpisz rodzaj, serię i numer dokumentu potwierdzającego Twoją tożsamość |
| 1 | `Page1.Imie[0]` | tekst | Wpisz swoje imię |
| 1 | `Page1.Nazwisko[0]` | tekst | Wpisz swoje nazwisko |
| 1 | `Page1.Ulica[0]` | tekst | Twój adres - wpisz ulicę |
| 1 | `Page1.Numerdomu[0]` | tekst | Twój adres - wpisz numer domu |
| 1 | `Page1.Numerlokalu[0]` | tekst | Twój adres - wpisz numer lokalu |
| 1 | `Page1.Kodpocztowy[0]` | tekst | Twój adres - wpisz kod pocztowy |
| 1 | `Page1.Poczta[0]` | tekst | Twój adres - wpisz miejscowość |
| 1 | `Page1.Nazwapaństwa[0]` | tekst | Jeśli Twój adres jest inny niż polski, wpisz nazwę państwa |
| 1 | `Page1.Numertelefonu[0]` | tekst | Wpisz swój numer telefonu. Ułatwi nam to kontakt w Twojej sprawie. To pole jest dobrowolne |
| 1 | `Page1.NIP[0]` | tekst (max 10) | Wpisz NIP płatnika składek |
| 1 | `Page1.REGON[0]` | tekst (max 14) | Jeśli płatnik składek nie ma nadanego NIP, wpisz REGON |
| 1 | `Page1.PESEL_1[0]` | tekst (max 11) | Jeśli płatnik składek nie ma nadanego NIP i REGON, wpisz PESEL |
| 1 | `Page1.Rodzajseriainumerdokumentu_1[0]` | tekst | Jeśli płatnik składek nie ma nadanego NIP, REGON i PESEL, wpisz rodzaj, serię i numer dokumentu potwierdzającego jego tożsamość |
| 1 | `Page1.Nazwaplatnika[0]` | tekst | Wpisz nazwę albo imię i nazwisko płatnika składek |
| 2 | `Page2.Numerrachunku[0]` | tekst (max 26) | Jeśli chcesz otrzymywać wypłatę zasiłku na rachunek bankowy, wpisz numer rachunku. To pole jest dobrowolne. Jeśli nie wypełnisz tego pola, zasiłek wypłacimy Ci przekazem pocztowym na podany wyżej adres |
| 2 | `Page2.macierzynskiego[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński za okres urlopu macierzyńskiego |
| 2 | `Page2.nawarunkach[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński za okres urlopu na warunkach urlopu macierzyńskiego |
| 2 | `Page2.Okres[0]` | tekst | Jeśli wnioskujesz o zasiłek macierzyński za okres urlopu macierzyńskiego lub urlopu na warunkach urlopu macierzyńskiego, wpisz okres od-do |
| 2 | `Page2.rodzicielskiego[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński za okres urlopu rodzicielskiego |
| 2 | `Page2.Okres2[0]` | tekst | Jeśli wnioskujesz o zasiłek macierzyński za okres urlopu rodzicielskiego, wpisz okres od-do |
| 2 | `Page2.czesc[0]` | tekst | Wpisz, która to część urlopu rodzicielskiego |
| 2 | `Page2.uzMacierzynskiego[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński za okres uzupełniającego urlopu macierzyńskiego |
| 2 | `Page2.Okres3[0]` | tekst | Jeśli wnioskujesz o zasiłek macierzyński za okres uzupełniającego urlopu macierzyńskiego, wpisz okres od-do |
| 2 | `Page2.ojcowskiego[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński za okres urlopu ojcowskiego |
| 2 | `Page2.Okres4[0]` | tekst | Jeśli wnioskujesz o zasiłek macierzyński za okres urlopu ojcowskiego, wpisz okres od-do |
| 2 | `Page2.Numerlokalu2[0]` | tekst | Wpisz, która to część urlopu ojcowskiego |
| 2 | `Page2.Data2[0]` | tekst (max 8) | Jeśli wnioskujesz o zasiłek macierzyński na zasadach uzupełniającego urlopu macierzyńskiego, wpisz datę zakończenia okresu pobierania zasiłku macierzyńskiego za okres urlopu macierzyńskiego / urlopu na warunkach urlopu macierzyńskiego (w formacie dd mm rrrr) |
| 2 | `Page2.informuje[0]` | checkbox | Zaznacz, jeśli zamierzasz skorzystać z pełnego wymiaru urlopu macierzyńskiego/ urlopu na warunkach urlopu macierzyńskiego i urlopu rodzicielskiego z tytułu sprawowania opieki nad dzieckiem i co najmniej jeden dzień urlopu rodzicielskiego przypadać będzie w pierwszym roku życia dziecka |
| 2 | `Page2.TAK[0]` | checkbox | Zaznacz, jeśli prowadzisz pozarolniczą działalność gospodarczą albo jesteś osobą współpracującą z osobą prowadzącą pozarolniczą działalność, jesteś duchownym albo marynarzem i jesteś objęty ubezpieczeniem w razie choroby i macierzyństwa |
| 2 | `Page2.NIE[0]` | checkbox | Zaznacz, jeśli prowadzisz pozarolniczą działalność gospodarczą albo jesteś osobą współpracującą z osobą prowadzącą pozarolniczą działalność, jesteś duchownym albo marynarzem, ale nie jesteś objęty ubezpieczeniem w razie choroby i macierzyństwa |
| 2 | `Page2.ZaznaczX1a[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z urodzeniem dziecka lub dzieci |
| 2 | `Page2.ZaznaczX1b[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z przyjęciem na wychowanie dziecka lub dzieci i wystąpieniem do sądu opiekuńczego w sprawie jego przysposobienia |
| 2 | `Page2.Data[0]` | tekst (max 8) | Jeśli wnioskujesz o zasiłek macierzyński w związku z przyjęciem na wychowanie dziecka lub dzieci, wpisz datę przyjęcia dziecka/ dzieci na wychowanie (w formacie dd mm rrrr) |
| 2 | `Page2.ZaznaczX1c[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z przyjęciem na wychowanie dziecka lub dzieci w ramach rodziny zastępczej, z wyjątkiem rodziny zastępczej zawodowej |
| 3 | `Page3.Tekst1[0]` | tekst | Wpisz dane dziecka lub dzieci: imię i nazwisko oraz datę i miejsce urodzenia |
| 3 | `Page3.ZaznaczX1[0]` | checkbox | Zaznacz, jeśli oświadczasz, że dziecko lub dzieci posiadają zaświadczenie, o którym mowa w art. 4 ust. 3 ustawy z dnia 4 listopada 2016 r. o wspieraniu kobiet w ciąży i rodzin "Za życiem" |
| 3 | `Page3.podajimie1[0]` | tekst | Jeśli oświadczasz, że dziecko lub dzieci posiadają zaświadczenie, o którym mowa w art. 4 ust. 3 ustawy z dnia 4 listopada 2016 r. o wspieraniu kobiet w ciąży i rodzin "Za życiem", wpisz imię lub imiona dzieci |
| 3 | `Page3._2[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z przewidywaną datą porodu |
| 3 | `Page3.Data2a[0]` | tekst (max 8) | Jeśli wnioskujesz o zasiłek macierzyński w związku z przewidywaną datą porodu, wpisz tę datę (w formacie dd mm rrrr) |
| 3 | `Page3._3[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z urodzeniem dziecka lub dzieci po ustaniu zatrudnienia; mój pracodawca |
| 3 | `Page3.upadlosc[0]` | checkbox | Zaznacz, jeśli Twój pracodawca ogłosił upadłość |
| 3 | `Page3.likwidacje[0]` | checkbox | Zaznacz, jeśli Twój pracodawca ogłosił likwidację |
| 3 | `Page3.rozwiazal[0]` | checkbox | Zaznacz, jeśli Twój pracodawca rozwiązał z Tobą umowę o pracę z naruszeniem przepisów prawa, stwierdzonym prawomocnym orzeczeniem sądu |
| 3 | `Page3.zmarl[0]` | checkbox | Zaznacz, jeśli Twój pracodawca zmarł |
| 3 | `Page3.Tekst13B[0]` | tekst | Wpisz dane dziecka lub dzieci: imię i nazwisko oraz datę i miejsce urodzenia |
| 3 | `Page3.ZaznaczX1d[0]` | checkbox | Zaznacz, jeśli oświadczasz, że dziecko lub dzieci posiadają zaświadczenie, o którym mowa w art. 4 ust. 3 ustawy z dnia 4 listopada 2016 r. o wspieraniu kobiet w ciąży i rodzin "Za życiem" |
| 3 | `Page3.podajimie[0]` | tekst | Jeśli oświadczasz, że dziecko lub dzieci posiadają zaświadczenie, o którym mowa w art. 4 ust. 3 ustawy z dnia 4 listopada 2016 r. o wspieraniu kobiet w ciąży i rodzin "Za życiem", wpisz imię lub imiona dzieci |
| 3 | `Page3._4[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z urodzeniem dziecka i jego pobytem w szpitalu (uzupełniający urlop macierzyński) |
| 3 | `Page3.skroceniem[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z urodzeniem dziecka przed ukończeniem 28 tygodnia ciąży |
| 3 | `Page3.przerwaniem4A[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z masą urodzeniową dziecka nie większą niż 1000 g |
| 3 | `Page3.przerwaniem4B[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z urodzeniem dziecka po ukończeniu 28. tygodnia ciąży i przed ukończeniem 37 tygodnia ciąży i z masą urodzeniową większą niż 1000 g |
| 3 | `Page3.podjeciem[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z urodzeniem dziecka po ukończeniu 37 tygodnia ciąży i pobyt dziecka w szpitalu trwał co najmniej 2 kolejne dni przy czym pierwszy z tych dni przypadał w okresie od 5 do 28 dnia po porodzie |
| 3 | `Page3.Tekst4a[0]` | tekst | Wpisz okres pobytu dziecka w szpitalu od-do |
| 4 | `Page4.Tekst13[0]` | tekst | Wpisz dane matki: imię i nazwisko oraz PESEL, jeśli nie ma nadanego PESEL, podaj serię i numer dokumentu tożsamości i datę urodzenia |
| 4 | `Page4._5[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z sytuacją matki dziecka, to jest |
| 4 | `Page4.skroceniem[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z sytuacją matki dziecka, to jest skróceniem przez matkę okresu wypłaty zasiłku macierzyńskiego po wykorzystaniu co najmniej 14 tygodni po porodzie |
| 4 | `Page4.przerwaniem4A[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z sytuacją matki dziecka, to jest przerwaniem na wniosek matki okresu wypłaty zasiłku macierzyńskiego z powodu jej pobytu w szpitalu po wykorzystaniu zasiłku macierzyńskiego w wymiarze co najmniej 8 tygodni po porodzie; o wypisaniu matki ze szpitala zobowiązuję się poinformować płatnika zasiłku |
| 4 | `Page4.przerwaniem4B[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z sytuacją matki dziecka, to jest przerwaniem przez matkę okresu wypłaty zasiłku macierzyńskiego z powodu posiadania orzeczenia o niezdolności do samodzielnej egzystencji lub o niepełnosprawności w stopniu znacznym po wykorzystaniu co najmniej 8 tygodni zasiłku macierzyńskiego po porodzie |
| 4 | `Page4.podjeciem[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z sytuacją matki dziecka, to jest podjęciem pracy przez matkę w wymiarze nie niższym niż połowa pełnego etatu; o ustaniu zatrudnienia matki zobowiązuję się poinformować płatnika zasiłku |
| 4 | `Page4.porzuceniem[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z sytuacją matki dziecka, to jest porzuceniem dziecka lub dzieci przez matkę |
| 4 | `Page4.smiercia[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z sytuacją matki dziecka, to jest śmiercią matki |
| 4 | `Page4.Data5[0]` | tekst (max 8) | Wpisz datę wystąpienia podanej okoliczności (w formacie dd mm rrrr) |
| 4 | `Page4.Tekst4b[0]` | tekst | Wpisz dane dzieci: imię i nazwisko oraz datę i miejsce urodzenia |
| 4 | `Page4.Tekst4c[0]` | tekst | Wpisz dane dzieci: imię i nazwisko oraz datę i miejsce urodzenia |
| 4 | `Page4.podajimie[0]` | tekst | Jeśli oświadczasz, że dziecko lub dzieci posiadają zaświadczenie, o którym mowa w art. 4 ust. 3 ustawy z dnia 4 listopada 2016 r. o wspieraniu kobiet w ciąży i rodzin "Za życiem", wpisz imię lub imiona dzieci |
| 4 | `Page4.ZaznaczX1d[0]` | checkbox | Zaznacz, jeśli oświadczasz, że dziecko lub dzieci posiadają zaświadczenie, o którym mowa w art. 4 ust. 3 ustawy z dnia 4 listopada 2016 r. o wspieraniu kobiet w ciąży i rodzin "Za życiem" |
| 5 | `Page5._6[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z wypisaniem ze szpitala |
| 5 | `Page5.mnie5[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z wypisaniem ze szpitala siebie |
| 5 | `Page5.dziecka5[0]` | checkbox | Zaznacz, jeśli wnioskujesz o zasiłek macierzyński w związku z wypisaniem ze szpitala dziecka |
| 5 | `Page5.Data6[0]` | tekst (max 8) | Wpisz datę wypisania ze szpitala (w formacie dd mm rrrr) |
| 5 | `Page5.TAK2[0]` | checkbox | Zaznacz, jeśli drugi rodzic dziecka lub dzieci będzie korzystał z zasiłku macierzyńskiego za okres urlopu rodzicielskiego lub uzupełniającego urlopu macierzyńskiego |
| 5 | `Page5.NIE2[0]` | checkbox | Zaznacz, jeśli drugi rodzic dziecka lub dzieci nie będzie korzystał z zasiłku macierzyńskiego za okres urlopu rodzicielskiego lub uzupełniającego urlopu macierzyńskiego |
| 5 | `Page5.Okres1[0]` | tekst | Jeśli drugi rodzic dziecka lub dzieci będzie korzystał z zasiłku macierzyńskiego za okres urlopu rodzicielskiego lub uzupełniającego urlopu macierzyńskiego, wpisz okres od-do |
| 5 | `Page5.TAK[0]` | checkbox | Zaznacz, jeśli prowadzisz pozarolniczą działalność gospodarczą albo jesteś osobą współpracującą z osobą prowadzącą pozarolniczą działalność, jesteś duchownym albo marynarzem i jesteś objęty ubezpieczeniem w razie choroby i macierzyństwa |
| 5 | `Page5.NIE[0]` | checkbox | Zaznacz, jeśli prowadzisz pozarolniczą działalność gospodarczą albo jesteś osobą współpracującą z osobą prowadzącą pozarolniczą działalność, jesteś duchownym albo marynarzem, ale nie jesteś objęty ubezpieczeniem w razie choroby i macierzyństwa |
| 5 | `Page5.Okres[0]` | tekst | Jeśli drugi rodzic dziecka lub dzieci będzie korzystał z zasiłku macierzyńskiego za okres urlopu rodzicielskiego lub uzupełniającego urlopu macierzyńskiego, wpisz okres od-do |
| 5 | `Page5.PESEL[0]` | tekst (max 11) | Wpisz numer PESEL drugiego rodzica |
| 5 | `Page5.Dataurodzenia[0]` | tekst (max 8) | Jeśli drugi rodzic nie ma nadanego numeru PESEL, wpisz jego datę urodzenia w formacie dd mm rrrr |
| 5 | `Page5.Rodzajseriainumerdokumentu[0]` | tekst | Jeśli drugi rodzic nie ma nadanego numeru PESEL, wpisz rodzaj, serię i numer dokumentu potwierdzającego jego tożsamość |
| 5 | `Page5.Imie[0]` | tekst | Wpisz imię drugiego rodzica |
| 5 | `Page5.Nazwisko[0]` | tekst | Wpisz nazwisko drugiego rodzica |
| 5 | `Page5.Data[0]` | tekst (max 8) | Wpisz datę wypełnienia formularza w formacie dd mm rrrr. Obok znajduje się pole na podpis |

Błędy i pułapki w ZAM (zweryfikowane pozycją pól względem nadruku):

- `Page5.TAK2[0]` / `Page5.NIE2[0]` / `Page5.Okres1[0]` (y≈607/582) to w rzeczywistości **oświadczenie przy urlopie ojcowskim**: „Pobierałem z innego tytułu zasiłek macierzyński za okres urlopu ojcowskiego: TAK/NIE; jeśli TAK, podaj tytuł i okres”. Tooltipy błędnie mówią o drugim rodzicu.
- `Page5.TAK[0]` / `Page5.NIE[0]` / `Page5.Okres[0]` (y≈469/443) to **informacja, czy drugi rodzic będzie korzystał z zasiłku za urlop rodzicielski / uzupełniający; jeśli TAK, okres od–do**. Tooltipy TAK/NIE błędnie kopiują pytanie o działalność ze s. 2.
- `Page2.Numerlokalu2[0]` to „która to część urlopu ojcowskiego”, a `Page2.czesc[0]` to „która to część urlopu rodzicielskiego”.
- `Page2.Okres[0]` dotyczy zarówno urlopu macierzyńskiego, jak i urlopu na warunkach urlopu macierzyńskiego (jedno pole okresu na oba checkboxy).
- Pola `Page3._2/_3/_4`, `Page4._5`, `Page5._6` to checkboxy przyczyn 2–6; przyczynę 1 wyrażają `Page2.ZaznaczX1a/1b/1c`.
- Dane dziecka występują w czterech polach zależnie od przyczyny: `Page3.Tekst1` (przyczyna 1), `Page3.Tekst13B` (3), `Page4.Tekst4c` (4), `Page4.Tekst4b` (5). Analogicznie oświadczenie o zaświadczeniu „Za życiem” (`ZaznaczX1`/`ZaznaczX1d` + `podajimie*`) powtarza się przy przyczynach 1, 3 i 5.
- W ZAM nie ma pola na datę porodu przy przyczynie 1: data urodzenia dziecka wchodzi do tekstu wolnego „imię i nazwisko oraz datę i miejsce urodzenia”.

## Z-3: zaświadczenie płatnika dla pracownika (276 pól)

Pola poza tabelami wynagrodzeń (85):

| Str. | Pole | Typ | Znaczenie (tooltip ZUS) |
|---|---|---|---|
| 1 | `Page1.pierwszywniosek[0]` | checkbox | Zaznacz, jeśli to jest zaświadczenie do pierwszego wniosku o świadczenie |
| 1 | `Page1.wniosekkontynuacja[0]` | checkbox | Zaznacz, jeśli składasz wniosek o kontynuację świadczenia |
| 1 | `Page1.NIP[0]` | tekst (max 10) | Wpisz NIP płatnika składek |
| 1 | `Page1.REGON[0]` | tekst (max 14) | Wpisz REGON płatnika składek, jeśli nie podałeś NIP |
| 1 | `Page1.PESEL[0]` | tekst (max 11) | Wpisz PESEL, jeśli płatnik składek nie ma nadanego NIP i REGON |
| 1 | `Page1.Rodzajseriainumerdokumentu[0]` | tekst | Wpisz rodzaj, serię i numer dokumentu potwierdzającego tożsamość płatnika składek, jeśli płatnik składek nie ma nadanego NIP, REGON i PESEL |
| 1 | `Page1.Nazwaplatnika[0]` | tekst | Wpisz nazwę albo imię i nazwisko płatnika składek |
| 1 | `Page1.Ulica[0]` | tekst | Adres płatnika składek - wpisz ulicę |
| 1 | `Page1.Numerdomu[0]` | tekst | Adres płatnika składek - wpisz numer domu |
| 1 | `Page1.Numerlokalu[0]` | tekst | Adres płatnika składek - wpisz numer lokalu |
| 1 | `Page1.Kodpocztowy[0]` | tekst | Adres płatnika składek - wpisz kod pocztowy |
| 1 | `Page1.Poczta[0]` | tekst | Adres płatnika składek - wpisz miejscowość |
| 1 | `Page1.Nazwapanstwa[0]` | tekst | Adres płatnika składek - wpisz nazwę państwa, jeśli adres jest inny niż polski |
| 1 | `Page1.Numertelefonu[0]` | tekst | Wpisz swój numer telefonu. To pole jest dobrowolne, ale jeśli podasz nam tę informację, ułatwi nam to kontakt w Twojej sprawie |
| 1 | `Page1.PESEL2[0]` | tekst (max 11) | Wpisz PESEL osoby ubezpieczonej |
| 1 | `Page1.Dataurodzenia[0]` | tekst (max 8) | Jeśli osoba ubezpieczona nie ma nadanego numeru PESEL wpisz jej datę urodzenia w formacie dd mm rrrr |
| 1 | `Page1.Rodzajseriainumerdokumentu2[0]` | tekst | Jeśli osoba ubezpieczona nie ma nadanego numeru PESEL, wpisz rodzaj, serię i numer dokumentu potwierdzającego jej tożsamość |
| 1 | `Page1.Imie[0]` | tekst | Wpisz imię osoby ubezpieczonej |
| 1 | `Page1.Nazwisko[0]` | tekst | Wpisz nazwisko osoby ubezpieczonej |
| 2 | `Page2.Ulica2[0]` | tekst | Adres osoby ubezpieczonej - wpisz ulicę |
| 2 | `Page2.Numerdomu2[0]` | tekst | Adres osoby ubezpieczonej - wpisz numer domu |
| 2 | `Page2.Numerlokalu2[0]` | tekst | Adres osoby ubezpieczonej - wpisz numer lokalu |
| 2 | `Page2.Kodpocztowy2[0]` | tekst | Adres osoby ubezpieczonej - wpisz kod pocztowy |
| 2 | `Page2.Poczta2[0]` | tekst | Adres osoby ubezpieczonej - wpisz miejscowość |
| 2 | `Page2.Nazwapanstwa2[0]` | tekst | Jeśli adres osoby ubezpieczonej jest inny niż polski, wpisz nazwę państwa |
| 2 | `Page2.Numerrachunku[0]` | tekst (max 26) | Jeśli Twój pracownik chce otrzymywać wypłatę zasiłku na rachunek bankowy, wpisz numer jego rachunku. To pole jest dobrowolne. Jeśli nie wypełnisz tego pola, zasiłek wypłacimy pracownikowi przekazem pocztowym na jego podany wyżej adres |
| 2 | `Page2._1[0]` | checkbox | Zaznacz, jeśli ubezpieczony występuje o zasiłek chorobowy |
| 2 | `Page2.Tekst[0]` | tekst | Jeśli ubezpieczony występuje o zasiłek chorobowy, wpisz okres zwolnienia (daty od–do) oraz – jeśli znasz – serię i numer zaświadczenia lekarskiego |
| 2 | `Page2._2[0]` | checkbox | Zaznacz, jeśli ubezpieczony występuje o zasiłek opiekuńczy |
| 2 | `Page2.Tekstzo[0]` | tekst | Jeśli ubezpieczony występuje o zasiłek opiekuńczy, wpisz okres zwolnienia (daty od–do) oraz – jeśli znasz – serię i numer zaświadczenia lekarskiego |
| 2 | `Page2._3[0]` | checkbox | Zaznacz, jeśli ubezpieczony występuje o zasiłek macierzyński |
| 2 | `Page2.Tekstzm[0]` | tekst | Jeśli ubezpieczony występuje o zasiłek macierzyński, wpisz okres (daty od–do) |
| 2 | `Page2.zasilekwwysokosci[0]` | checkbox | Zaznacz, jeśli ubezpieczony występuje o zasiłek w wysokości zasiłku macierzyńskiego |
| 2 | `Page2.Tekstzww[0]` | tekst | Jeśli ubezpieczony występuje o zasiłek w wysokości zasiłku macierzyńskiego, wpisz okres (daty od–do) |
| 2 | `Page2.zasilekwyrownawczy[0]` | checkbox | Zaznacz, jeśli ubezpieczony występuje o zasiłek wyrównawczy |
| 2 | `Page2.Tekstzwyr[0]` | tekst | Jeśli ubezpieczony występuje o zasiłek wyrównawczy, wpisz okres (daty od–do) |
| 2 | `Page2._4[0]` | checkbox | Zaznacz, jeśli ubezpieczony występuje o świadczenie rehabilitacyjne |
| 2 | `Page2.Tekstsr[0]` | tekst | Jeśli ubezpieczony występuje o świadczenie rehabilitacyjne, wpisz okres (daty od–do) |
| 3 | `Page3.A6[0]` | checkbox | Zaznacz, jeśli pracownikowi udzielono urlopu macierzyńskiego |
| 3 | `Page3.B6[0]` | checkbox | Zaznacz, jeśli pracownikowi udzielono urlopu rodzicielskiego |
| 3 | `Page3.C6[0]` | checkbox | Zaznacz, jeśli pracownikowi udzielono urlopu na warunkach urlopu macierzyńskiego |
| 3 | `Page3.D6[0]` | checkbox | Zaznacz, jeśli pracownikowi udzielono uzupełniającego urlopu macierzyńskiego |
| 3 | `Page3.E6[0]` | checkbox | Zaznacz, jeśli pracownikowi udzielono urlopu ojcowskiego |
| 3 | `Page3.NIE6[0]` | checkbox | Zaznacz, jeśli pracownikowi nie udzielono urlopu macierzyńskiego, urlopu rodzicielskiego, urlopu na warunkach urlopu macierzyńskiego, uzupełniającego urlopu macierzyńskiego lub urlopu ojcowskiego, bo wniosek dotyczy zasiłku macierzyńskiego po ustaniu zatrudnienia |
| 3 | `Page3.Tekst6[0]` | tekst | Jeśli pracownikowi udzielono urlopu macierzyńskiego, urlopu na warunkach urlopu macierzyńskiego, urlopu rodzicielskiego, uzupełniającego urlopu macierzyńskiego lub urlopu ojcowskiego, wpisz okres od–do oraz datę wniosku |
| 3 | `Page3._1_5[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa pracownik korzysta z urlopu bezpłatnego |
| 3 | `Page3._2_5[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa pracownik przebywa w areszcie tymczasowym |
| 3 | `Page3._3_5[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa pracownik korzysta z urlopu wychowawczego |
| 3 | `Page3._4_5[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa pracownik odbywa karę pozbawienia wolności |
| 3 | `Page3.TAK_5[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa pracownik korzysta z urlopu bezpłatnego, przebywa w areszcie tymczasowym, korzysta z urlopu opiekuńczego przysługującego z Kodeksu pracy, korzysta z urlopu wychowawczego lub odbywa karę pozbawienia wolności |
| 3 | `Page3.NIE_5[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa pracownik nie korzysta z urlopu bezpłatnego, nie przebywa w areszcie tymczasowym, nie korzysta z urlopu opiekuńczego przysługującego z Kodeksu pracy, nie korzysta z urlopu wychowawczego i nie odbywa kary pozbawienia wolności |
| 3 | `Page3.Tekst5[0]` | tekst | Jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa pracownik korzysta z urlopu bezpłatnego, przebywa w areszcie tymczasowym, korzysta z urlopu wychowawczego lub urlopu opiekuńczego przysługującego z Kodeksu pracy albo odbywa karę pozbawienia wolności, wpisz okresy od–do |
| 3 | `Page3._1_4[0]` | checkbox | Zaznacz, jeśli niezdolność do pracy powstała z powodu choroby zawodowej |
| 3 | `Page3._2_4[0]` | checkbox | Zaznacz, jeśli niezdolność do pracy powstała z powodu wypadku przy pracy |
| 3 | `Page3._3_4[0]` | checkbox | Zaznacz, jeśli niezdolność do pracy powstała z powodu wypadku w drodze do pracy lub z pracy |
| 3 | `Page3.TAK_4[0]` | checkbox | Zaznacz, jeśli niezdolność do pracy powstała z powodu choroby zawodowej, wypadku przy pracy lub wypadku w drodze do pracy lub z pracy |
| 3 | `Page3.NIE_4[0]` | checkbox | Zaznacz, jeśli niezdolność do pracy nie powstała z powodu choroby zawodowej, wypadku przy pracy lub wypadku w drodze do pracy lub z pracy |
| 3 | `Page3.Tekst4[0]` | tekst | Wpisz rodzaj dokumentu potwierdzającego niezdolność do pracy (decyzja, protokół, karta wypadku) i datę jego sporządzenia |
| 3 | `Page3.TAK_2[0]` | checkbox | Zaznacz, jeśli pracownik jest zatrudniony na podstawie umowy o pracę tymczasową |
| 3 | `Page3.NIE_2[0]` | checkbox | Zaznacz, jeśli pracownik nie jest zatrudniony na podstawie umowy o pracę tymczasową |
| 3 | `Page3.TAK_3[0]` | checkbox | Zaznacz, jeśli pracownik wykonuje pracę za granicą |
| 3 | `Page3.NIE_3[0]` | checkbox | Zaznacz, jeśli pracownik nie wykonuje pracy za granicą |
| 3 | `Page3._5_5[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa pracownik korzysta z urlopu opiekuńczego przysługującego z Kodeksu pracy |
| 3 | `Page3._5_6[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa pracownik ma usprawiedliwioną nieobecność w pracy, o której mowa w art. 63[2] § 8 Kodeksu pracy (śmierć pracodawcy) |
| 3 | `Page3.UCHpodlega[0]` | tekst | Wpisz datę, od kiedy pracownik jest zatrudniony lub okres zatrudnienia od–do |
| 3 | `Page3.UZpodlega[0]` | tekst | Wpisz wymiar czasu pracy |
| 3 | `Page3.Podajdate[0]` | tekst | Wpisz datę, od kiedy jest zatrudniony w tym wymiarze (dd mm rrrr) |
| 3 | `Page3.Tekst1[0]` | tekst | Wpisz dane dziecka lub dzieci. Imię i nazwisko, PESEL, datę i miejsce urodzenia |
| 3 | `Page3.Tekst2[0]` | tekst | Wpisz dane drugiego rodzica albo członka rodziny. Imię i nazwisko, PESEL albo serię i numer dokumentu stwierdzającego tożsamość i datę urodzenia, jeżeli nie nadano mu numeru PESEL |
| 4 | `Page4.TAK_PI[0]` | checkbox | Zaznacz, jeśli zgłosiłeś do ubezpieczenia chorobowego do 20 ubezpieczonych |
| 4 | `Page4.NIE_PI[0]` | checkbox | Zaznacz, jeśli zgłosiłeś do ubezpieczenia chorobowego powyżej 20 ubezpieczonych |
| 4 | `Page4.TAK_2[0]` | checkbox | Zaznacz, jeśli wypłaciłeś wynagrodzenie za okresy orzeczonej niezdolności do pracy w danym roku kalendarzowym na podstawie art. 92 Kodeksu pracy |
| 4 | `Page4.NIE_2[0]` | checkbox | Zaznacz, jeśli nie wypłaciłeś wynagrodzenia za okresy orzeczonej niezdolności do pracy w danym roku kalendarzowym na podstawie art. 92 Kodeksu pracy |
| 4 | `Page4.Tekst2[0]` | tekst | Jeśli wypłaciłeś Zaznacz, jeśli wypłaciłeś wynagrodzenie za okresy orzeczonej niezdolności do pracy w danym roku kalendarzowym na podstawie art. 92 Kodeksu pracy, wpisz okresy od–do oraz kod literowy. Wpisz okresy wynagrodzenia wypłaconego w poprzednim roku kalendarzowym |
| 4 | `Page4.TAK_3[0]` | checkbox | Zaznacz, jeśli wypłaciłeś zasiłek charobowy |
| 4 | `Page4.NIE_3[0]` | checkbox | Zaznacz, jeśli nie wypłaciłeś zasiłku chorobowego |
| 4 | `Page4.Tekst3[0]` | tekst | Jeśli wypłaciłeś zasiłek chorobowy, wpisz okresy od–do oraz kod literowy. Wpisz okresy wliczone do jednego okresu zasiłkowego lub mające wpływ na okres, z którego wynagrodzenie jest uwzględniane w podstawie wymiaru zasiłku |
| 4 | `Page4.NIE_7[0]` | checkbox | Zaznacz, jeśli pracownik w czasie urlopu rodzicielskiego nie wykonuje pracy u swojego pracodawcy |
| 4 | `Page4.TAK_7[0]` | checkbox | Zaznacz, jeśli pracownik w czasie urlopu rodzicielskiego wykonuje pracę u swojego pracodawcy |
| 4 | `Page4.Tekst7[0]` | tekst | Jeśli pracownik wykonuje pracę u swojego pracodawcy w czasie urlopu rodzicielskiego, wpisz okres od-do i wymiar czasu pracy |
| 5 | `Page5.TAK_5[0]` | checkbox | Zaznacz, jeśli z pracownikiem jest zawarta umowa zlecenia, umowa agencyjna lub inna umowa o świadczenie usług, do której zgodnie z Kodeksem cywilnym stosuje się przepisy dotyczące zlecenia albo umowa o dzieło lub inna umowa i przysługuje pracownikowi składnik wynagrodzenia przyznany do określonego terminu. |
| 5 | `Page5.NIE_5[0]` | checkbox | Zaznacz, jeśli z pracownikiem nie jest zawarta umowa zlecenia, umowa agencyjna lub inna umowa o świadczenie usług, do której zgodnie z Kodeksem cywilnym stosuje się przepisy dotyczące zlecenia albo umowa o dzieło lub inna umowa i nie przysługuje pracownikowi składnik wynagrodzenia przyznany do określonego terminu. |
| 5 | `Page5.Tekst5[0]` | tekst | Jeśli z pracownikiem jest zawarta umowa zlecenia, umowa agencyjna lub inna umowa o świadczenie usług, do której zgodnie z Kodeksem cywilnym stosuje się przepisy dotyczące zlecenia albo umowa o dzieło lub inna umowa i przysługuje pracownikowi składnik wynagrodzenia przyznany do określonego terminu, wpisz datę, do której zawarta jest umowa zlecenia (lub inna) – wpisz datę, do której składnik przysługuje oraz wpisz kwotę wynagrodzenia z tych tytułów za poszczególne miesiące |
| 6 | `Page6.Tekst[0]` | tekst | Jeśli potrzebujesz, wpisz uwagi |
| 6 | `Page6.Data[0]` | tekst (max 8) | Wpisz datę wypełnienia formularza w formacie dd mm rrrr. Obok znajduje się pole na podpis osoby upoważnionej, oraz pieczątkę z imieniem, nazwiskiem i stanowiskiem |

Tabele wynagrodzeń (191 pól tekstowych, nazwy są nieczytelne, np. `Miesiac[1]` to liczba dni przepracowanych, a `Liczbadni[i]` to przyczyna nieprzepracowania):

- **s. 4, okresy miesięczne**: 12 wierszy × 9 kolumn (`ROK[0–11]`, `Miesiac[5i]` miesiąc, `Miesiac[5i+1]` dni przepracowane, `Przepracowal[i]` dni do przepracowania, `Liczbadni[i]` przyczyna nieprzepracowania całego miesiąca, `Podstawawymiaru[i]` stałe wynagrodzenie w pełnej miesięcznej wysokości, `Miesiac[5i+2]` zmienne wynagrodzenie pomniejszane proporcjonalnie, `Miesiac[5i+3]` premie i inne składniki w kwocie faktycznej, `Miesiac[5i+4]` procent potrąconej składki), razem 108 pól;
- **s. 5, okresy kwartalne**: 5 wierszy × 7 (rok, kwartał, kwota, dni przepracowane, dni do przepracowania, przyczyna, % składki), razem 35;
- **s. 5, okresy roczne**: 4 wiersze × 6 (`ROK[5–8]`: rok, kwota, dni przepracowane, dni do przepracowania, przyczyna, % składki), razem 24;
- **s. 5, inne okresy**: 4 wiersze × 6 (`ROK[9–12]`: okres, kwota, dni, dni, przyczyna, % składki), razem 24.

## Z-3a: zaświadczenie płatnika dla niebędącego pracownikiem (146 pól)

Pola poza tabelą przychodu (86):

| Str. | Pole | Typ | Znaczenie (tooltip ZUS) |
|---|---|---|---|
| 1 | `Page1.pierwszywniosek[0]` | checkbox | Zaznacz, jeśli to jest zaświadczenie do pierwszego wniosku o świadczenie |
| 1 | `Page1.wniosekkontynuacja[0]` | checkbox | Zaznacz, jeśli składasz wniosek o kontynuację świadczenia |
| 1 | `Page1.NIP[0]` | tekst (max 10) | Wpisz NIP płatnika składek |
| 1 | `Page1.REGON[0]` | tekst (max 14) | Wpisz REGON płatnika składek, jeśli nie podałeś NIP |
| 1 | `Page1.PESEL[0]` | tekst (max 11) | Wpisz PESEL, jeśli płatnik składek nie ma nadanego NIP i REGON |
| 1 | `Page1.Rodzajseriainumerdokumentu[0]` | tekst | Wpisz rodzaj, serię i numer dokumentu potwierdzającego tożsamość płatnika składek, jeśli nie ma nadanego NIP, REGON lub PESEL |
| 1 | `Page1.Nazwaplatnika[0]` | tekst | Wpisz nazwę albo imię i nazwisko płatnika składek |
| 1 | `Page1.Ulica[0]` | tekst | Adres płatnika składek - wpisz ulicę |
| 1 | `Page1.Numerdomu[0]` | tekst | Adres płatnika składek - wpisz numer domu |
| 1 | `Page1.Numerlokalu[0]` | tekst | Adres płatnika składek - wpisz numer lokalu |
| 1 | `Page1.Kodpocztowy[0]` | tekst | Adres płatnika składek - wpisz kod pocztowy |
| 1 | `Page1.Poczta[0]` | tekst | Adres płatnika składek - wpisz miejscowość |
| 1 | `Page1.Nazwapanstwa[0]` | tekst | Jeśli Twój adres jest inny niż polski, wpisz nazwę państwa |
| 1 | `Page1.Numertelefonu[0]` | tekst | Wpisz swój numer telefonu. To pole jest dobrowolne, ale jeśli podasz nam tę informację, ułatwi nam to kontakt w Twojej sprawie |
| 1 | `Page1.PESEL2[0]` | tekst (max 11) | Wpisz numer PESEL osoby ubezpieczonej |
| 1 | `Page1.Dataurodzenia[0]` | tekst (max 8) | Wpisz datę urodzenia osoby ubezpieczonej w formacie dd mm rrrr |
| 1 | `Page1.Rodzajseriainumerdokumentu2[0]` | tekst | Jeśli osoba ubezpieczona nie ma nadanego numeru PESEL, wpisz rodzaj, serię i numer dokumentu potwierdzającego jej tożsamość |
| 1 | `Page1.Imie[0]` | tekst | Wpisz imię osoby ubezpieczonej |
| 1 | `Page1.Nazwisko[0]` | tekst | Wpisz nazwisko osoby ubezpieczonej |
| 2 | `Page2.Ulica2[0]` | tekst | Adres osoby ubezpieczonej - wpisz ulicę |
| 2 | `Page2.Numerdomu2[0]` | tekst | Adres osoby ubezpieczonej - wpisz numer domu |
| 2 | `Page2.Numerlokalu2[0]` | tekst | Adres osoby ubezpieczonej - wpisz numer lokalu |
| 2 | `Page2.Kodpocztowy2[0]` | tekst | Adres osoby ubezpieczonej - wpisz kod pocztowy |
| 2 | `Page2.Poczta2[0]` | tekst | Adres osoby ubezpieczonej - wpisz miejscowość |
| 2 | `Page2.Nazwapanstwa2[0]` | tekst | Jeśli adres osoby ubezpieczonej jest inny niż polski, wpisz nazwę państwa |
| 2 | `Page2.Numerrachunku[0]` | tekst (max 26) | Jeśli Twój ubezpieczony chce otrzymywać wypłatę zasiłku na rachunek bankowy, wpisz numer rachunku. To pole jest dobrowolne. Jeśli nie wypełnisz tego pola, zasiłek wypłacimy ubezpieczonemu przekazem pocztowym na jego podany wyżej adres |
| 2 | `Page2._1[0]` | checkbox | Zaznacz, jeśli ubezpieczony występuje o zasiłek chorobowy |
| 2 | `Page2.Tekst[0]` | tekst | Jeśli ubezpieczony występuje o zasiłek chorobowy, wpisz okres zwolnienia (daty od–do) oraz – jeśli znasz – serię i numer zaświadczenia lekarskiego |
| 2 | `Page2._2[0]` | checkbox | Zaznacz, jeśli ubezpieczony występuje o zasiłek opiekuńczy |
| 2 | `Page2.Tekstzo[0]` | tekst | Jeśli ubezpieczony występuje o zasiłek opiekuńczy, wpisz okres zwolnienia (daty od–do) oraz – jeśli znasz – serię i numer zaświadczenia lekarskiego |
| 2 | `Page2._3[0]` | checkbox | Zaznacz, jeśli ubezpieczony występuje o zasiłek macierzyński |
| 2 | `Page2.Tekstzm[0]` | tekst | Jeśli ubezpieczony występuje o zasiłek macierzyński, wpisz okres (daty od–do) |
| 2 | `Page2._4[0]` | checkbox | Zaznacz, jeśli ubezpieczony występuje o świadczenie rehabilitacyjne |
| 2 | `Page2.Tekstsr[0]` | tekst | Jeśli ubezpieczony występuje o świadczenie rehabilitacyjne, wpisz okres (daty od–do) |
| 2 | `Page2.Data[0]` | tekst (max 8) | Wpisz datę złożenia wniosku o zasiłek macierzyński w formacie dd mm rrrr |
| 2 | `Page2.procent[0]` | tekst | Jeśli wypłacałeś zasiłek macierzyński, wpisz stawkę procentową wypłaconego zasiłku |
| 2 | `Page2.Dane_tekst[0]` | tekst | Wpisz dane dziecka/dzieci: imię i nazwisko, PESEL oraz datę i miejsce urodzenia |
| 3 | `Page3.dane_2tekst[0]` | tekst | Wpisz imię i nazwisko, PESEL albo serię i numer dokumentu stwierdzającego tożsamość i datę urodzenia, jeżeli nie nadano numeru PESEL |
| 3 | `Page3.Informacje1A[0]` | checkbox | Zaznacz jeśli ubezpieczony jest objęty ubezpieczeniem w razie choroby i macierzyństwa (ubezpieczenie chorobowe) |
| 3 | `Page3.Informacje1B[0]` | checkbox | Zaznacz jeśli ubezpieczony nie jest objęty ubezpieczeniem w razie choroby i macierzyństwa (ubezpieczenie chorobowe) |
| 3 | `Page3.Informacje1C[0]` | checkbox | Zaznacz jeśli ubezpieczony jest objęty ubezpieczeniem z tytułu wypadków przy pracy i chorób zawodowych (ubezpieczenie wypadkowe) |
| 3 | `Page3.Informacje1D[0]` | checkbox | Zaznacz jeśli ubezpieczony nie jest objęty ubezpieczeniem z tytułu wypadków przy pracy i chorób zawodowych (ubezpieczenie wypadkowe) |
| 3 | `Page3.ZaznaczX1[0]` | checkbox | Zaznacz, jeśli ubezpieczony jest objęty ubezpieczeniem jako członek rolniczej spółdzielni produkcyjnej lub spółdzielni kółek rolniczych |
| 3 | `Page3.ZaznaczX2[0]` | checkbox | Zaznacz, jeśli ubezpieczony jest objęty ubezpieczeniem jako osoba wykonująca pracę na podstawie umowy agencyjnej lub umowy zlecenia albo innej umowy o świadczeniu usług, do której zgodnie z kodeksem cywilnym stosuje się przepisy dotyczące zlecenia, lub jako osoba współpracująca |
| 3 | `Page3.ZaznaczX3[0]` | checkbox | Zaznacz, jeśli ubezpieczony jest objęty ubezpieczeniem jako osoba wykonująca umowę o pracę nakładczą |
| 3 | `Page3.ZaznaczX4[0]` | checkbox | Zaznacz, jeśli ubezpieczony jest objęty ubezpieczeniem jako osoba wykonująca odpłatnie pracę na podstawie skierowania do pracy w czasie odbywania kary pozbawienia wolności albo tymczasowego aresztowania |
| 3 | `Page3.ZaznaczX5[0]` | checkbox | Zaznacz, jeśli ubezpieczony jest objęty ubezpieczeniem jako poseł lub senator pobierający uposażenie |
| 3 | `Page3.ZaznaczX6[0]` | checkbox | Zaznacz, jeśli ubezpieczony jest objęty ubezpieczeniem jako osoba pobierająca stypendium sportowe |
| 3 | `Page3.ZaznaczX7[0]` | checkbox | Zaznacz, jeśli ubezpieczony jest objęty ubezpieczeniem jako słuchacz Krajowej Szkoły Administracji Publicznej pobierający stypendium |
| 3 | `Page3.ZaznaczX8[0]` | checkbox | Zaznacz, jeśli ubezpieczony jest objęty ubezpieczeniem jako osoba pobierająca stypendium w okresie odbywania szkolenia, stażu lub przygotowania zawodowego dorosłych, na które została skierowana przez powiatowy urząd pracy lub inny podmiot kierujący, albo osoba pobierająca stypendium na podstawie przepisów o promocji zatrudnienia i instytucjach rynku pracy w okresie odbywania studiów podyplomowych |
| 3 | `Page3.ZaznaczX9[0]` | checkbox | Zaznacz, jeśli ubezpieczony jest objęty ubezpieczeniem jako osoba odbywająca służbę zastępczą |
| 3 | `Page3.ZaznaczX10[0]` | checkbox | Zaznacz, jeśli ubezpieczony jest objęty ubezpieczeniem jako osoba sprawująca opiekę nad dzieckiem na podstawie umowy uaktywniającej w rozumieniu ustawy z dnia 4 lutego 2011 r. o opiece nad dzieckiem do lat 3 |
| 3 | `Page3.ZaznaczX11[0]` | checkbox | Zaznacz, jeśli ubezpieczony jest objęty ubezpieczeniem jako doktorant, który otrzymuje stypendium doktoranckie |
| 3 | `Page3.UCHpodlega[0]` | tekst | Wpisz datę, od kiedy ubezpieczony podlega ubezpieczeniu chorobowemu lub okres podlegania od–do |
| 3 | `Page3.UZpodlega[0]` | tekst | Wpisz datę, od kiedy ubezpieczony podlega ubezpieczeniu wypadkowemu lub okres podlegania od–do |
| 3 | `Page3.Informacje3TAK[0]` | checkbox | Zaznacz, jeśli tytuł ubezpieczenia ustał |
| 3 | `Page3.Informacje3NIE[0]` | checkbox | Zaznacz, jeśli tytuł ubezpieczenia nie ustał |
| 3 | `Page3.Data3[0]` | tekst (max 8) | Wpisz datę ustania ubezpieczenia w formacie dd mm rrrr |
| 4 | `Page4.Informacje4A[0]` | checkbox | Zaznacz, jeśli niezdolność do pracy powstała z powodu choroby zawodowej |
| 4 | `Page4.Informacje4B[0]` | checkbox | Zaznacz, jeśli niezdolność do pracy powstała z powodu wypadku przy pracy |
| 4 | `Page4.Informacje4C[0]` | checkbox | Zaznacz, jeśli niezdolność do pracy powstała z powodu wypadku w drodze do pracy lub z pracy |
| 4 | `Page4.Informacje4TAK[0]` | checkbox | Zaznacz, jeśli niezdolność do pracy powstała z powodu choroby zawodowej, wypadku przy pracy lub wypadku w drodze do pracy lub z pracy |
| 4 | `Page4.Informacje4NIE[0]` | checkbox | Zaznacz, jeśli niezdolność do pracy nie powstała z powodu choroby zawodowej, wypadku przy pracy lub wypadku w drodze do pracy lub z pracy |
| 4 | `Page4.Tekst4[0]` | tekst | Jeśli niezdolność do pracy powstała z powodu choroby zawodowej, wypadku przy pracy lub wypadku w drodze do pracy lub z pracy, to wpisz dokument potwierdzający (decyzja/ karta wypadku), numer oraz datę jego sporządzenia |
| 4 | `Page4.Informacje5A[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa korzysta z urlopu bezpłatnego |
| 4 | `Page4.Informacje5B[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa przebywa w areszcie tymczasowym |
| 4 | `Page4.Informacje5C[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa korzysta z urlopu opiekuńczego przysługującego z Kodeksu pracy |
| 4 | `Page4.Informacje5D[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa korzysta z urlopu wychowawczego |
| 4 | `Page4.Informacje5E[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa odbywa karę pozbawienia wolności |
| 4 | `Page4.Informacje5F[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa ma usprawiedliwioną nieobecność w pracy, o której mowa w art. 63 § 8 Kodeksu pracy (śmierć pracodawcy) |
| 4 | `Page4.Informacje5TAK[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa korzysta z urlopu bezpłatnego, przebywa w areszcie tymczasowym, korzysta z urlopu wychowawczego lub odbywa karę pozbawienia wolności |
| 4 | `Page4.Informacje5NIE[0]` | checkbox | Zaznacz, jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa nie korzysta z urlopu bezpłatnego, nie przebywa w areszcie tymczasowym, nie korzysta z urlopu wychowawczego i nie odbywa kary pozbawienia wolności |
| 4 | `Page4.Tekst5[0]` | tekst | Jeśli w okresie niezdolności do pracy z powodu choroby, sprawowania opieki lub macierzyństwa korzysta z urlopu bezpłatnego, przebywa w areszcie tymczasowym, korzysta z urlopu wychowawczego lub urlopu opiekuńczego przysługującego z Kodeksu pracy albo odbywa karę pozbawienia wolności, wpisz okresy od–do |
| 4 | `Page4.Informacje1TAK[0]` | checkbox | Zaznacz, jeśli wypłaciłeś wynagrodzenie za okresy orzeczonej niezdolności do pracy w danym roku kalendarzowym na podstawie art. 92 Kodeksu pracy (dotyczy osoby wykonującej pracę nakładczą oraz osoby odbywającej służbę zastępczą) |
| 4 | `Page4.Informacje1NIE[0]` | checkbox | Zaznacz, jeśli nie wypłaciłeś wynagrodzenia za okresy orzeczonej niezdolności do pracy w danym roku kalendarzowym na podstawie art. 92 Kodeksu pracy (dotyczy osoby wykonującej pracę nakładczą oraz osoby odbywającej służbę zastępczą) |
| 4 | `Page4.Tekst1A[0]` | tekst | Jeśli wypłaciłeś wynagrodzenie za okresy orzeczonej niezdolności do pracy w danym roku kalendarzowym na podstawie art. 92 Kodeksu pracy (dotyczy osoby wykonującej pracę nakładczą oraz osoby odbywającej służbę zastępczą), wpisz okresy od–do oraz kod literowy. Wpisz także okresy wynagrodzenia wypłaconego w poprzednim roku wliczane do jednego okresu zasiłkowego |
| 4 | `Page4.Informacje2TAK[0]` | checkbox | Zaznacz, jeśli wypłaciłeś zasiłek chorobowy |
| 4 | `Page4.Informacje2NIE[0]` | checkbox | Zaznacz, jeśli nie wypłaciłeś zasiłku chorobowego |
| 4 | `Page4.Tekst2A[0]` | tekst | Jeśli wypłaciłeś zasiłek chorobowy, wpisz okresy od–do oraz kod literowy. Podaj okresy wliczone do jednego okresu zasiłkowego |
| 4 | `Page4.Informacje4BTAK[0]` | checkbox | Zaznacz, jeśli wypłaciłeś uposażenie, stypendium lub inne świadczenie za okresy orzeczonej niezdolności do pracy (dotyczy tylko osób, o których mowa w pkt 5–8 sekcji Informacje o ubezpieczeniu) |
| 4 | `Page4.Informacje4BNIE[0]` | checkbox | Zaznacz, jeśli nie wypłaciłeś uposażenia, stypendium lub innego świadczenia za okresy orzeczonej niezdolności do pracy (dotyczy tylko osób, o których mowa w pkt 5–8 sekcji Informacje o ubezpieczeniu) |
| 4 | `Page4.Tekst2[0]` | tekst | Jeśli wypłaciłeś uposażenie, stypendium lub inne świadczenie za okresy orzeczonej niezdolności do pracy (dotyczy tylko osób, o których mowa w pkt 5–8 sekcji Informacje o ubezpieczeniu), wpisz okresy od–do oraz kod literowy. Wpisz okresy wliczone do jednego okresu zasiłkowego |
| 4 | `Page4.PozostaleA[0]` | checkbox | Zaznacz, jeśli zgłosiłeś do ubezpieczenia chorobowego do dwudziestu ubezpieczonych |
| 4 | `Page4.PozostaleB[0]` | checkbox | Zaznacz, jeśli zgłosiłeś do ubezpieczenia chorobowego powyżej dwudziestu ubezpieczonych |
| 5 | `Page5.Tekst[0]` | tekst | Jeśli potrzebujesz, wpisz uwagi |
| 5 | `Page5.Data[0]` | tekst (max 8) | Wpisz datę wypełnienia formularza w formacie dd mm rrrr. Obok znajduje się pole na podpis osoby upoważnionej oraz pieczątkę zawierającą imię, nazwisko i stanowisko |

Tabela przychodu stanowiącego podstawę wymiaru składek (s. 5, 60 pól): 12 wierszy × 5 kolumn: `ROK[i]` rok, `Miesiac[i]` miesiąc, `Przepracowal[i]` dni przepracowane, `Liczbadni[i]` dni do przepracowania, `Podstawawymiaru[i]` podstawa wymiaru składek.

## ZAS-53: wniosek o zasiłek chorobowy (31 pól)

| Str. | Pole | Typ | Znaczenie (tooltip ZUS) |
|---|---|---|---|
| 1 | `Page1.PESEL[0]` | tekst (max 11) | Wpisz swój numer PESEL |
| 1 | `Page1.Dataurodzenia[0]` | tekst (max 8) | Jeśli nie masz nadanego numeru PESEL, wpisz swoją datę urodzenia w formacie dd mm rrrr |
| 1 | `Page1.Rodzajseriainumerdokumentu[0]` | tekst | Jeśli nie masz nadanego numeru PESEL wpisz rodzaj, serię i numer dokumentu potwierdzającego Twoją tożsamość |
| 1 | `Page1.Imie[0]` | tekst | Wpisz swoje imię |
| 1 | `Page1.Nazwisko[0]` | tekst | Wpisz swoje nazwisko |
| 1 | `Page1.Ulica[0]` | tekst | Twój adres - wpisz ulicę |
| 1 | `Page1.Numerdomu[0]` | tekst | Twój adres - wpisz numer domu |
| 1 | `Page1.Numerlokalu[0]` | tekst | Twój adres - wpisz numer lokalu |
| 1 | `Page1.Kodpocztowy[0]` | tekst | Twój adres - wpisz kod pocztowy |
| 1 | `Page1.Poczta[0]` | tekst | Twój adres - wpisz miejscowość |
| 1 | `Page1.Nazwapaństwa[0]` | tekst | Jeśli Twój adres jest inny niż polski, wpisz nazwę państwa |
| 1 | `Page1.Numertelefonu[0]` | tekst | Wpisz swój numer telefonu. Ułatwi nam to kontakt w Twojej sprawie. To pole jest dobrowolne |
| 1 | `Page1.NIP[0]` | tekst (max 10) | Wpisz NIP płatnika składek |
| 1 | `Page1.REGON[0]` | tekst (max 14) | Jeśli płatnik składek nie ma nadanego NIP, wpisz jego REGON |
| 1 | `Page1.PESEL_1[0]` | tekst (max 11) | Jeśli płatnik składek nie ma nadanego NIP i REGON, wpisz jego PESEL |
| 1 | `Page1.Rodzajseriainumerdokumentu_1[0]` | tekst | Jeśli płatnik składek nie ma nadanego NIP, REGON i PESEL, wpisz rodzaj, serię i numer dokumentu potwierdzającego jego tożsamość |
| 1 | `Page1.Nazwaplatnika[0]` | tekst | Wpisz nazwę albo imię i nazwisko płatnika składek |
| 2 | `Page2.Numerrachunku[0]` | tekst (max 26) | Jeśli chcesz otrzymywać wypłatę zasiłku chorobowego na rachunek bankowy, wpisz numer rachunku. To pole jest dobrowolne. Jeśli nie wypełnisz tego pola, zasiłek chorobowy wypłacimy Ci przekazem pocztowym na podany wyżej adres |
| 2 | `Page2.Tekst[0]` | tekst | Wpisz datę lub daty (od–do) oraz – jeśli znasz – serię i numer zwolnienia lekarskiego |
| 2 | `Page2.wniosek1A[0]` | checkbox | Zaznacz, jeśli wniosek dotyczy okresu niezdolności do pracy z powodu choroby przypadającego w okresie ubezpieczenia chorobowego lub wypadkowego |
| 2 | `Page2.wniosek1B[0]` | checkbox | Zaznacz, jeśli wniosek dotyczy okresu niezdolności do pracy z powodu choroby przypadającego po ustaniu tytułu ubezpieczenia chorobowego lub wypadkowego |
| 2 | `Page2.Data[0]` | tekst (max 8) | Jeśli wniosek dotyczy okresu niezdolności do pracy z powodu choroby przypadającego po ustaniu tytułu ubezpieczenia chorobowego lub wypadkowego, wpisz datę ustania tytułu ubezpieczenia w formacie dd mm rrrr |
| 2 | `Page2.choroby[0]` | checkbox | Zaznacz, jeśli wniosek dotyczy niezdolności do pracy z powodu choroby zawodowej |
| 2 | `Page2.przypracy[0]` | checkbox | Zaznacz, jeśli wniosek dotyczy niezdolności do pracy z powodu wypadku przy pracy |
| 2 | `Page2.wdrodze[0]` | checkbox | Zaznacz, jeśli wniosek dotyczy niezdolności do pracy z powodu wypadku w drodze do pracy lub z pracy |
| 2 | `Page2.Data2[0]` | tekst (max 8) | Wpisz datę wypełnienia formularza w formacie dd mm rrrr. Obok znajduje się miejsce na podpis |
| 2 | `Page2.TAK_5[0]` | checkbox | Zaznacz, jeśli wniosek dotyczy niezdolności do pracy z powodu choroby zawodowej, wypadku przy pracy lub wypadku w drodze do pracy lub z pracy |
| 2 | `Page2.NIE_5[0]` | checkbox | Zaznacz, jeśli wniosek nie dotyczy niezdolności do pracy z powodu choroby zawodowej, wypadku przy pracy lub wypadku w drodze do pracy lub z pracy |
| 2 | `Page2.Tekst5[0]` | tekst | Jeśli wniosek dotyczy niezdolności do pracy, to wpisz rodzaj dokumentu potwierdzającego (decyzja, protokół lub karta wypadku), numer oraz datę jego sporządzenia |
| 2 | `Page2.TAK_6[0]` | checkbox | Zaznacz, jeżeli jesteś marynarzem i za okres niezdolności do pracy, za który ubiegasz się o zasiłek chorobowy przysługuje Ci wynagrodzenie za pracę, o którym mowa w art. 75 pkt. 2 ustawy z dnia 5 sierpnia 2015 r. o pracy na morzu |
| 2 | `Page2.NIE_6[0]` | checkbox | Zaznacz, jeżeli jesteś marynarzem i za okres niezdolności do pracy, za który ubiegasz się o zasiłek chorobowy nie przysługuje Ci wynagrodzenie za pracę, o którym mowa w art. 75 pkt. 2 ustawy z dnia 5 sierpnia 2015 r. o pracy na morzu |

Formularz nie ma osobnego pola „niezdolność w ciąży”: przy zasiłku chorobowym w ciąży kod „B” wynika z e-ZLA, a wniosek wskazuje tylko okres zwolnienia (`Page2.Tekst[0]`).

## ZAS-12: zaświadczenie płatnika za dalszy okres (33 pola)

| Str. | Pole | Typ | Znaczenie (tooltip ZUS) |
|---|---|---|---|
| 1 | `Page1.NIP[0]` | tekst (max 10) | Wpisz NIP płatnika składek |
| 1 | `Page1.REGON[0]` | tekst (max 14) | Jeśli płatnik składek nie ma nadanego NIP, wpisz REGON |
| 1 | `Page1.PESEL[0]` | tekst (max 11) | Jeśli płatnik składek nie ma nadanego NIP i REGON, wpisz numer PESEL |
| 1 | `Page1.Rodzajseriainumerdokumentu[0]` | tekst | Jeśli płatnik składek nie ma nadanego NIP, REGON i numeru PESEL, wpisz rodzaj, serię i numer dokumentu potwierdzającego jego tożsamość |
| 1 | `Page1.Nazwaplatnika[0]` | tekst | Wpisz nazwę albo imię i nazwisko płatnika składek |
| 1 | `Page1.Ulica[0]` | tekst | Adres płatnika składek. Wpisz ulicę |
| 1 | `Page1.Numerdomu[0]` | tekst | Adres płatnika składek. Wpisz numer domu |
| 1 | `Page1.Numerlokalu[0]` | tekst | Adres płatnika składek. Wpisz numer lokalu |
| 1 | `Page1.Kodpocztowy[0]` | tekst | Adres płatnika składek. Wpisz kod pocztowy |
| 1 | `Page1.Poczta[0]` | tekst | Adres płatnika składek. Wpisz miejscowość |
| 1 | `Page1.Nazwapanstwa[0]` | tekst | Jeśli adres płatnika składek jest inny niż polski, wpisz nazwę państwa |
| 1 | `Page1.Numertelefonu[0]` | tekst | Wpisz swój numer telefonu. To pole jest dobrowolne, ale jeśli podasz nam tę informację, ułatwi nam to kontakt w Twojej sprawie |
| 1 | `Page1.PESEL2[0]` | tekst (max 11) | Wpisz numer PESEL osoby ubezpieczonej |
| 1 | `Page1.DataUr[0]` | tekst (max 8) | Jeśli osoba ubezpieczona nie ma nadanego numeru PESEL, wpisz jej datę urodzenia w formacie dd mm rrrr |
| 1 | `Page1.Rodzajseriainumerdokumentu2[0]` | tekst | Jeśli osoba ubezpieczona nie ma nadanego numeru PESEL, wpisz rodzaj, serię i numer dokumentu potwierdzającego jej tożsamość |
| 1 | `Page1.Imie[0]` | tekst | Wpisz imię osoby ubezpieczonej |
| 1 | `Page1.Nazwisko[0]` | tekst | Wpisz nazwisko osoby ubezpieczonej |
| 2 | `Page2.Ulica[0]` | tekst | Adres osoby ubezpieczonej. Wpisz ulicę |
| 2 | `Page2.Kodpocztowy[0]` | tekst | Adres osoby ubezpieczonej. Wpisz kod pocztowy |
| 2 | `Page2.Numerlokalu[0]` | tekst | Adres osoby ubezpieczonej. Wpisz numer lokalu |
| 2 | `Page2.Poczta[0]` | tekst | Adres osoby ubezpieczonej. Wpisz miejscowość |
| 2 | `Page2.Numerdomu[0]` | tekst | Adres osoby ubezpieczonej. Wpisz numer domu |
| 2 | `Page2.Nazwapanstwa[0]` | tekst | Jeśli adres osoby ubezpieczonej jest inny niż polski, wpisz nazwę państwa |
| 2 | `Page2.Numerrachunku[0]` | tekst (max 26) | Jeśli Twój pracownik/ ubezpieczony chce otrzymywać wypłatę zasiłku na rachunek bankowy, wpisz numer jego rachunku. To pole jest dobrowolne. Jeśli nie wypełnisz tego pola, zasiłek wypłacimy pracownikowi/ ubezpieczonemu przekazem pocztowym na jego podany wyżej adres |
| 2 | `Page2.TAK[0]` | checkbox | Zaznacz, jeśli zatrudnienie/ tytuł ubezpieczenia trwa nadal |
| 2 | `Page2.NIE[0]` | checkbox | Zaznacz, jeśli zatrudnienie/ tytuł ubezpieczenia wygasło |
| 2 | `Page2.Data2[0]` | tekst (max 8) | Jeśli zatrudnienie/ tytuł ubezpieczenia ustało, wpisz datę zakończenia ubezpieczenia (w formacie dd mm rrrr) |
| 2 | `Page2.Data3[0]` | tekst (max 8) | Jeśli tytuł ubezpieczenia trwa nadal, ale ubezpieczenie chorobowe ustało (ustanie), wpisz datę zakończenia ubezpieczenia (w formacie dd mm rrrr) |
| 2 | `Page2.Data[0]` | tekst (max 8) | Wpisz datę wypełnienia formularza w formacie dd mm rrrr. Obok znajduje się pole na podpis osoby upoważnionej do wystawienia zaświadczenia i numer telefonu |
| 2 | `Page2._1[0]` | checkbox | Zaznacz, jeśli ubezpieczony wnioskuje o zasiłek chorobowy |
| 2 | `Page2.Tekst[0]` | tekst | Jeśli ubezpieczony wnioskuje o zasiłek chorobowy, wpisz okres zwolnienia (daty od–do) oraz – jeśli znasz – serię i numer zaświadczenia lekarskiego |
| 2 | `Page2._2[0]` | checkbox | Zaznacz, jeśli ubezpieczony wnioskuje o zasiłek opiekuńczy |
| 2 | `Page2.Tekstzo[0]` | tekst | Jeśli ubezpieczony wnioskuje o zasiłek opiekuńczy, wpisz okres zwolnienia (daty od–do) oraz – jeśli znasz – serię i numer zaświadczenia lekarskiego |

Uwaga: na s. 2 nazwy `Ulica[0]`, `Kodpocztowy[0]` itd. powtarzają nazwy ze s. 1, ale pełne nazwy różnią się prefiksem `Page2`, więc kolizji nie ma.

## Pola edytowalne w symulacji wniosku

Rekomendacja dla symulacji **ZAM** (persona demo po logowaniu mObywatel):

**Prefill z danych persony, tylko do odczytu** (dane, które ZUS już zna):
`Page1.PESEL`, `Imie`, `Nazwisko`, adres (`Ulica`, `Numerdomu`, `Numerlokalu`, `Kodpocztowy`, `Poczta`, `Nazwapaństwa`), dane płatnika (`NIP`, `REGON`, `PESEL_1`, `Nazwaplatnika`), pytanie o objęcie ubezpieczeniem chorobowym przy działalności (`Page2.TAK`/`NIE`, wynika z tytułu ubezpieczenia).

**Prefill z możliwością edycji**:
`Page1.Numertelefonu` (dobrowolne), `Page2.Numerrachunku` (dobrowolne, bez niego przekaz pocztowy), dane drugiego rodzica (`Page5.PESEL`, `Imie`, `Nazwisko`, `Dataurodzenia`, `Rodzajseriainumerdokumentu`), `Page5.Data` (dzisiejsza data).

**Edytowalne przez użytkownika, sterowane kreatorem** (to jest właściwa „symulacja”, z której liczymy wymiar zasiłku):

- zakres wniosku: checkboxy `macierzynskiego`, `nawarunkach`, `rodzicielskiego`, `uzMacierzynskiego`, `ojcowskiego` z okresami `Okres`, `Okres2`, `Okres3`, `Okres4` i częściami `czesc`, `Numerlokalu2` (część urlopu ojcowskiego), `Data2`;
- deklaracja `informuje` (pełny wymiar urlopu macierzyńskiego i rodzicielskiego w 1. roku życia dziecka, istotna dla stawki 81,5%);
- przyczyna: `ZaznaczX1a/1b/1c` (+ `Page2.Data` przy przyjęciu na wychowanie), `Page3._2` + `Data2a` (przewidywana data porodu), `Page3._3` + przyczyna ustania zatrudnienia, `Page3._4` + warianty wcześniak / masa ≤1000 g / szpital + `Tekst4a`;
- dane dziecka (`Page3.Tekst1` i odpowiedniki) oraz oświadczenie „Za życiem” (`ZaznaczX1*` + `podajimie*`);
- informacja o drugim rodzicu: `Page5.TAK`/`NIE` + `Page5.Okres` (patrz błąd tooltipów wyżej), oraz dla ojca `Page5.TAK2`/`NIE2` + `Okres1`.

**Pominąć w MVP** (rzadkie scenariusze, wystarczy przekierowanie do pełnego PDF): przyczyna 5 (sytuacja matki, s. 4, z danymi matki `Tekst13`) i 6 (wypisanie ze szpitala), osoba bez PESEL (`Dataurodzenia`, `Rodzajseriainumerdokumentu*`).

Z-3, Z-3a i ZAS-12 wypełnia płatnik, więc w aplikacji służą tylko jako źródło danych wejściowych (wynagrodzenie, dni, tytuł ubezpieczenia, płatnik do / powyżej 20 ubezpieczonych) i podgląd, nie jako formularz do edycji przez ubezpieczonego. ZAS-53 jest potrzebny tylko dla przedsiębiorczyni w ścieżce zasiłku chorobowego w ciąży.

## Otwarte kwestie

- Nie weryfikowałem, czy ZUS opublikował jeszcze inne formularze dla rodziców w tym samym wydaniu (np. ZUR za urlop rodzicielski, ZAO za urlop ojcowski, ZAS-34, ZPM, ZAS-40); na stronie „Zasiłek macierzyński” widnieją odnośniki do nich, ale nie wchodzą w zakres issue.
- Zachowanie pól XFA / JavaScript po wypełnieniu przez pdf-lib trzeba sprawdzić w Adobe Reader na gotowym prototypie.
