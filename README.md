# MlodyRodzic – Zasiłkowy Przewodnik Przyszłego Rodzica

Projekt na HackNation 2026 (zadanie ZUS). Narzędzie pokazuje rodzicom ich indywidualne uprawnienia: świadczenia w ciąży, okres i wysokość zasiłku macierzyńskiego obojga rodziców, ryzyka utraty prawa, a także dokumenty, adresatów i terminy.

## Uruchomienie

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # testy silnika reguł i warstwy aplikacji
npm run typecheck
npm run build && npm start
```

Panel ustawień dla pracowników ma osobne logowanie pod `/admin/logowanie` (niezależne od logowania rodzica przez mObywatel). Hasło: zmienna `ADMIN_HASLO`, domyślnie `demo`; sesja w ciasteczku httpOnly na 8 godzin, podpisana sekretem `ADMIN_SEKRET` (domyślnie wyprowadzonym z hasła).

## Ekrany

| Ścieżka | Co robi |
|---|---|
| `/` | Wprowadzenie (za pierwszym razem), potem trzy wejścia: mObywatel, Przewodnik, Szybkie wyliczenie |
| `/logowanie` | Symulacja logowania mObywatel i pobrania danych z ZUS. Do wyboru 7 fikcyjnych person demo. Stąd też wejście do panelu ustawień |
| `/przewodnik/1`–`7` | Przewodnik krok po kroku: dane wpisane samodzielnie, bez logowania (adopcja, rodzina zastępcza, „Za życiem”, wcześniak, martwe urodzenie) |
| `/szybko` | Szybkie wyliczenie z kilku pytań, wynik przybliżony |
| `/plan` | Pulpit: suma zasiłków dla rodziny, okres, kto wypłaca, trzy najbliższe sprawy |
| `/plan/kalkulator` | Zintegrowany kalkulator: wariant 100/70 albo 81,5%, podział urlopu rodzicielskiego między rodziców, łączenie z pracą, ojcowski, oś czasu |
| `/plan/swiadczenia` | Świadczenia każdego z rodziców: okres, stawka, podstawa wymiaru, kwota, ryzyka i podstawa prawna |
| `/plan/wnioski` | Dokumenty i terminy: co, do kogo (pracodawca czy ZUS), do kiedy, z linkami do formularzy |
| `/plan/wnioski/[id]` | Wypełnienie i symulowana wysyłka wniosku: wniosek urlopowy do pracodawcy (treść według rozporządzenia, Dz.U. 2025 poz. 322), ZAM wypełniony danymi Planu (PDF do pobrania, wysyłka przez eZUS), wniosek o odpis aktu urodzenia |
| `/sprawy` | Sprawy przykładowe ZUS: wybór sprawy (T01–T14) z porównaniem „decyzja ZUS / MłodyRodzic” oraz wczytanie edytowalnego PDF (ZAM, Z-3, Z-3a) do Przewodnika |
| `/sprawy/[id]` | Porównanie jednej sprawy z rozstrzygnięciem ZUS, Plan rodzica tej sprawy jednym kliknięciem i Z-3 sprawy wypełniony na oficjalnym wzorze ZUS |
| `/ezus` | Symulacja eZUS: okresy ubezpieczenia, wynagrodzenia lub podstawa składek, podgląd e-ZLA, zaległość w składkach z zaświadczeniem o stanie rozliczeń, pytanie do ZUS |
| `/wsparcie` | 11 zweryfikowanych organizacji charytatywnych, telefony kryzysowe, oficjalne źródła (zus.pl, gov.pl, PIP) |
| `/admin/logowanie` | Logowanie pracownika do panelu ustawień (hasło, nie mObywatel) |
| `/admin` | Panel parametrów prawnych (stawki, wymiary, kwoty, terminy) bez zmiany kodu; bez sesji przekierowuje do logowania |

## Jak sprawdzić sprawy przykładowe ZUS

1. Na ekranie startowym wybierz „Sprawy przykładowe ZUS” (albo wejdź na `/sprawy`).
2. Wybierz sprawę. Ekran zestawia rozstrzygnięcie ZUS (prawo, okresy, stawka) i kwoty wyliczone z danych płacowych Z-3 z wynikiem silnika. Wszystkie 10 spraw w katalogu daje wynik zgodny z ZUS (test `src/aplikacja/sprawy.test.ts`).
3. „Otwórz Plan rodzica tej sprawy” wczytuje sprawę do aplikacji: kalkulator, świadczenia, wnioski i terminy liczą się na dzień wniosku w sprawie, z płacą minimalną z roku sprawy.
4. „Pobierz Z-3 tej sprawy” daje oficjalny edytowalny wzór ZUS wypełniony danymi płacowymi. Wczytaj ten plik w sekcji „Wczytaj formularz PDF”: aplikacja odczyta pola i przeniesie je do Przewodnika.

Skany z zestawów ZUS nie mają pól formularza ani warstwy tekstowej (sprawdziliśmy wszystkie 87 plików), więc automatycznie odczytujemy tylko formularze wypełnione elektronicznie. Odczyt skanu wymagałby OCR, a aplikacja świadomie nie używa AI. Dane ze skanu wpisuje się w Przewodniku. Sprawy T05, T06, T10 i T13 sprawdzają testy silnika (`src/silnik/sprawy.test.ts`), bo Sytuacja rodziny ich nie wyraża.

## Architektura

- `src/silnik/` – silnik reguł (czysty TypeScript, trzy szwy: `podstawaWymiaru`, `urlopyIZasilek`, `ocenaRyzyk`), testy spraw przykładowych T01–T14.
- `src/aplikacja/` – Sytuacja rodziny i Plan rodzica, most do silnika (`rozpatrz.ts`), dokumenty i terminy według macierzy z `docs/research/sciezka-dokumentow.md`, mapowanie pól ZAM, persony demo, organizacje wsparcia.
- `src/aplikacja/sprawy.ts` – katalog spraw przykładowych jako Sytuacje rodziny z rozstrzygnięciem ZUS; `formularzePdf.ts` – mapowanie pól Z-3, Z-3a i ZAM w obie strony; `wnioski.ts` – treść wniosków urlopowych według rozporządzenia.
- `src/serwer/` – wypełnianie i odczyt PDF (pdf-lib z czcionką DejaVu) i parametry z panelu (tylko nadpisania: Postgres, gdy ustawiono `DATABASE_URL`, inaczej `data/parametry.json`).
- `src/app/` – Next.js App Router. Silnik liczy w przeglądarce, stan w `localStorage`. Route Handlers: `/api/zus/[persona]`, `/api/parametry` (PUT tylko w sesji pracownika), `/api/admin/sesja`, `/api/wnioski/zam` (wypełniony ZAM), `/api/sprawy/[id]/z3` (Z-3 sprawy przykładowej), `/api/formularze/odczyt` (POST z plikiem PDF: odczyt pól ZAM, Z-3, Z-3a).

Wyniki mają charakter informacyjny. Logowanie, dane z ZUS, wysyłka wniosków (do pracodawcy, ZUS i urzędu stanu cywilnego) są symulowane na fikcyjnych danych.

## Wykorzystanie AI

**Aplikacja nie korzysta z AI.** Wszystkie wyliczenia (podstawa wymiaru, okresy, kwoty, ryzyka, dokumenty i terminy) robi deterministyczny silnik reguł w TypeScript. Każda reguła ma wskazaną podstawę prawną i jest sprawdzana testami na sprawach przykładowych ZUS. Żadne dane użytkownika nie trafiają do modeli AI.

Przy tworzeniu rozwiązania zespół korzystał z narzędzi AI:

- **Claude Code** (Anthropic): pomoc przy pisaniu kodu, testów i dokumentacji. Commity współtworzone z asystentem mają w opisie linię `Co-Authored-By: Claude`.
- **Google Stitch**: makiety ekranów i ilustracja na pulpicie (sylwetka matki i dziecka w sercu).

## Deploy (Render + Neon)

Aplikacja to zwykły serwer Next.js (`npm run build && npm start`). Plik [`render.yaml`](render.yaml) opisuje usługę jako Render Blueprint.

1. **Neon:** utwórz projekt (region *AWS Europe Central 1, Frankfurt*). W *Connect* skopiuj connection string w wersji *pooled*. Tabela `nadpisania_parametrow` powstaje sama przy pierwszym użyciu panelu.
2. **Render:** *New → Blueprint*, wybierz to repozytorium. Render odczyta `render.yaml` i zapyta o:
   - `ADMIN_HASLO`: hasło do panelu ustawień (podaj je jury w opisie zgłoszenia),
   - `DATABASE_URL`: connection string z Neon.

   `ADMIN_SEKRET` Render wygeneruje sam.
3. Po pierwszym deployu sprawdź `https://<usługa>.onrender.com/api/parametry`. Potem zaloguj się do `/admin`, zmień parametr, zrestartuj usługę (*Manual Deploy → Restart*) i sprawdź, że zmiana została.

Bez `DATABASE_URL` aplikacja działa, ale zmiany z panelu trafiają do pliku na dysku usługi i znikają przy każdym deployu i restarcie. Plan *Free* usypia usługę po 15 minutach bez ruchu, a pierwsze wejście trwa wtedy około minuty. Żeby tego uniknąć, workflow [`keep-alive.yml`](.github/workflows/keep-alive.yml) co 10 minut odpytuje stronę główną. Włącza się po ustawieniu zmiennej repozytorium `RENDER_URL` (*Settings → Secrets and variables → Actions → Variables*). Alternatywą bez pingowania jest plan *Starter*.

Zmienne środowiskowe opisuje [`.env.example`](.env.example).
