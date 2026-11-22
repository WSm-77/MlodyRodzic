# Prezentacja

- `index.html` – slajdy w HTML (scena 1920×1080, strzałki/spacja/przesunięcie palcem), z animacjami: przenikanie slajdów, kolejne wejście elementów, wjazd telefonów, odliczanie liczb. Przy `prefers-reduced-motion` zostaje samo krótkie przenikanie.
- `MlodyRodzic-prezentacja.pdf` – wersja do zgłoszenia (stan końcowy slajdów, tekst wektorowy).
- `MlodyRodzic-prezentacja.pptx` – wersja do PowerPointa z animacjami wejścia w tej samej kolejności co w HTML (start automatyczny) i przenikaniem slajdów. Każdy element to osobny obraz wycięty z HTML, więc wygląd jest identyczny, ale tekstu nie edytuje się w PowerPoincie: zmiany wprowadza się w `index.html` i eksportuje ponownie.

Odtworzenie (z katalogu głównego repo; Playwright i Chrome z `video/`):

```bash
npm run demo                                  # aplikacja na :3123
node prezentacja/narzedzia/zrzuty.mjs         # zrzuty telefonu 390×844 @2x → prezentacja/zrzuty/
node prezentacja/narzedzia/ilustracja.mjs     # ilustracja z pulpitu → zrzuty/ilustracja.svg
node prezentacja/narzedzia/pdf.mjs            # PDF (dodaj --podglad, żeby dostać PNG slajdów)
(cd prezentacja && npm install && npm run pptx)   # PPTX (pptxgenjs)
```

Zrzuty można też wykorzystać osobno jako „zrzuty ekranu” w zgłoszeniu.
