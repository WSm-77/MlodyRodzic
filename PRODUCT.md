# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Rodzice (główni użytkownicy):** przyszli i obecni rodzice, biologiczni, adopcyjni oraz rodziny zastępcze niezawodowe. Najczęściej używają telefonu i są zmęczeni, bez wiedzy prawniczej. Chcą wiedzieć, jakie świadczenia z ubezpieczenia chorobowego ZUS im przysługują, ile wyniosą, jak długo będą trwały oraz co i do kiedy złożyć.
- **Pracownicy publiczni:** utrzymują parametry prawne (płaca minimalna, wymiary urlopów, progi, stawki) w panelu ustawień.
- **Jury hackathonu HackNation 2026:** publiczność demo; przechodzi aplikację przez persony demo.

## Product Purpose

MłodyRodzic pokazuje rodzinie, jakie świadczenia z ubezpieczenia chorobowego ZUS (zasiłek chorobowy w ciąży, macierzyński za urlopy związane z rodzicielstwem, ojcowski) jej przysługują, ile wyniosą i jak o nie wystąpić. Sukces: rodzic po kilku minutach zna kwoty, okresy, terminy i dokumenty, a także ryzyka, które mogą odebrać prawo do zasiłku.

## Positioning

Kalkulator ZUS policzy kwotę. MłodyRodzic układa **Plan rodzica** dla całej rodziny:
- urlopy obojga rodziców na jednej osi czasu;
- terminy i ścieżka dokumentów zależne od tego, kto wypłaca (płatnik uprawniony, płatnik nieuprawniony, ZUS);
- ryzyka utraty lub obniżenia prawa do zasiłku;
- przy każdym wniosku link do oficjalnego formularza (edytowalne PDF-y ZUS) albo do przepisu, który określa treść wniosku.

Wszystko jest liczone z danych „z ZUS”, a każda zmiana w Zintegrowanym kalkulatorze przelicza cały Plan.

## Operating Context

Są trzy wejścia:
- symulowane logowanie przez mObywatel z wyborem Persony demo i podglądem danych „z ZUS”;
- Przewodnik, czyli kreator Sytuacji rodziny krok po kroku;
- Szybkie wyliczenie z kilkoma pytaniami i resztą wartości domyślnych.

Wynik to Plan rodzica z ekranami: Pulpit, Kalkulator, Świadczenia (Uprawnienia i ryzyka), Wnioski i terminy, Wsparcie, Dane z ZUS. Dokumenty urzędowe to ZAM, ZAS-53, Z-3, e-ZLA, odpis aktu urodzenia i wnioski urlopowe. Aplikacja nie ma własnych ekranów wypełniania wniosków.

## Capabilities and Constraints

- To demo. Dane person są fikcyjne, logowanie mObywatel i połączenie z eZUS są symulowane. ZUS nie udostępnia danych ubezpieczonego innym aplikacjom; w prawdziwej usłudze źródłem byłoby zaświadczenie z eZUS z pieczęcią ZUS. Dane z ZUS pokazujemy tylko w zakresie, który ubezpieczony widzi w eZUS (bez informacji, czy płatnik zgłasza ponad 20 osób).
- Dane Sytuacji rodziny zostają w przeglądarce. Nie ma kont użytkowników.
- Tylko język polski.
- Parametry prawne obowiązują od 2026 r. i są edytowalne w panelu ustawień.
- Terminologia pochodzi z `GLOSSARY.md`. Słownik jest nadrzędny dla nazw w UI, np. Sytuacja rodziny, Plan rodzica, Przewodnik, Szybkie wyliczenie, Płatnik uprawniony.
- Prosty język. Każdy termin prawny i każda wartość ma objaśnienie pod ikonką ⓘ.

## Brand Commitments

- Nazwa: MłodyRodzic.
- Ton: urzędowa wiarygodność połączona z empatią wobec zmęczonych rodziców. Mało tekstu, jasne kroki, bez biurokratycznego chłodu.
- System wizualny jest w `DESIGN.md`.

## Evidence on Hand

- Persony demo: `src/aplikacja/persony.ts` (7 przypadków).
- Sprawy przykładowe od ZUS: `docs/sprawy/`.
- Oficjalny wzór ZAM w PDF.
- Lista organizacji wsparcia: `src/aplikacja/wsparcie.ts`.
- Nie ma prawdziwych opinii użytkowników, statystyk ani logotypów partnerów. Nie wolno ich wymyślać.

## Product Principles

1. Najpierw to, co trzeba zrobić teraz: terminy i działania przed szczegółami.
2. Mniej tekstu na ekranie, objaśnienia na żądanie (ⓘ).
3. Każda liczba ma wytłumaczalne pochodzenie: źródło danych i wyliczenie.
4. Jedna zmiana decyzji przelicza cały Plan (kwoty, terminy, ryzyka).
5. Rodzic na telefonie jest punktem wyjścia; komputer to rozszerzenie.

## Accessibility & Inclusion

- Wymóg: WCAG 2.1 AA.
- Cel: AAA dla tekstu i kontrolek.
- Pełna obsługa klawiaturą.
- Cele dotykowe co najmniej 48 px.
- Język zrozumiały dla osób bez wiedzy prawniczej.
- Uwzględnione sytuacje szczególne: śmierć dziecka, poronienie, wcześniactwo.
