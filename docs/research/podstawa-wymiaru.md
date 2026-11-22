# Podstawa wymiaru zasiłku: pełny algorytm i minimum na MVP

Odpowiedź na issue #6. Dokument opisuje, jak ustalić **podstawę wymiaru zasiłku** (patrz `GLOSSARY.md`) dla **ubezpieczonego** z trzech **tytułów ubezpieczenia**: umowa o pracę, umowa zlecenia, działalność gospodarcza. Ta sama podstawa służy do liczenia **zasiłku chorobowego w ciąży**, **zasiłku macierzyńskiego** i **zasiłku w wysokości zasiłku macierzyńskiego** (art. 47 i art. 52 ustawy zasiłkowej).

Skróty źródeł:

- **UZ**: `docs/task/wyciąg z ustawy o świadczeniach pieniężnych z ubezpieczeń społecznych w razie choroby i macierzyństwa (ustawa zasiłkowa).md`
- **Zał.**: `docs/task/Załącznik_ maksymalny czas trwania zasiłków, wysokość, podstawa wymiaru.docx.md` (część „Podstawa wymiaru zasiłków”)
- **Poradnik**: `docs/task/Poradnik dla rodziców, ZUS 2026.md`
- **Zadanie**: `docs/task/ZUS - Pełna treść zadania konkursowego.md`

---

## 1. Stałe na 2026 rok

| Stała | Wartość | Źródło | Uwagi |
|---|---|---|---|
| Odliczenie składek społecznych (emerytalna 9,76% + rentowa 1,5% + chorobowa 2,45%) | **13,71%** | UZ art. 3 pkt 3 i 4, art. 45 | U pracownika odlicza się składki faktycznie potrącone (art. 3 pkt 3), więc 13,71% to typowa wartość, nie stała ustawowa (zob. §7, pytanie O3) |
| Minimalne wynagrodzenie 2026 | **4 806,00 zł** | Zał. pkt 2 | |
| Minimalna podstawa pracownika na pełnym etacie | **4 147,10 zł** = 4 806 × 0,8629 | UZ art. 45 ust. 1; Zał. pkt 2 | W Zał. tabela z wartością się nie wyrenderowała, wyliczamy sami |
| Maksymalna miesięczna podstawa dobrowolnej składki chorobowej (250% prognozowanego przeciętnego wynagrodzenia) | **23 550,00 zł** | Zał. „Dla nie pracowników”; Poradnik l. 325, 558 | Po odliczeniu 13,71%: **20 321,30 zł**, czyli najwyższa możliwa podstawa zasiłku nie-pracownika |
| Prognozowane przeciętne wynagrodzenie 2026 | **9 420,00 zł** | **wyliczone**: 23 550 / 2,5 | Kwoty nie ma wprost w źródłach |
| „Duży ZUS”: minimalna zadeklarowana podstawa działalności (60% prognozowanego) | **5 652,00 zł** | Poradnik l. 464 (reguła 60%); kwota **wyliczona** | Po odliczeniu: 4 877,11 zł |
| Preferencyjna podstawa działalności (30% minimalnego wynagrodzenia) | **1 441,80 zł** | Poradnik l. 468–494 (reguła 30%); kwota **wyliczona** | Po odliczeniu: 1 244,13 zł |
| Kwota świadczenia rodzicielskiego (dolny próg zasiłku macierzyńskiego) | **brak w źródłach** | UZ art. 31 ust. 3a | Do potwierdzenia, zob. O1 |
| 100% przeciętnego wynagrodzenia (górny limit podstawy po ustaniu ubezpieczenia) | **brak w źródłach** | UZ art. 46 | Ogłaszane kwartalnie, zob. O8 |

W kodzie: `WSPOLCZYNNIK_PO_ODLICZENIU = 0.8629` (czyli 1 − 0,1371).

---

## 2. Pełny algorytm: pracownik (umowa o pracę)

Podstawa prawna: UZ art. 36–43 i art. 45, stosowane do zasiłku macierzyńskiego „odpowiednio” (art. 47).

### 2.1 Okres odniesienia (art. 36)

1. **Miesiąc zdarzenia** `M0`:
   - zasiłek chorobowy w ciąży: miesiąc, w którym powstała niezdolność do pracy (data początku e-ZLA z kodem B, art. 36 ust. 1);
   - zasiłek macierzyński: miesiąc, w którym powstało prawo do zasiłku (poród, przyjęcie dziecka albo początek urlopu macierzyńskiego przed porodem). To jest odczytanie słowa „odpowiednio” z art. 47, zob. O2.
2. **Ciągłość podstawy (art. 43)**: jeżeli między poprzednim zasiłkiem (np. chorobowym w ciąży) a obecnym nie było przerwy albo przerwa była krótsza niż miesiąc kalendarzowy, **nie ustala się podstawy na nowo**, tylko przyjmuje się poprzednią. Poradnik (l. 856) potwierdza to dla macierzyńskiego po chorobowym w ciąży. Wyjątek z Poradnika (l. 764): zmiana wymiaru czasu pracy między okresami.
3. **Okres**: 12 pełnych miesięcy kalendarzowych przed `M0` (art. 36 ust. 1), tylko z okresu **nieprzerwanego ubezpieczenia chorobowego** u danego płatnika (art. 36 ust. 4).
4. **Ubezpieczenie krótsze niż 12 miesięcy**: bierze się wszystkie **pełne** miesiące kalendarzowe ubezpieczenia (art. 36 ust. 2).
5. **Brak pełnego miesiąca** (zdarzenie w 1. miesiącu ubezpieczenia), art. 37: podstawą jest wynagrodzenie, które pracownik osiągnąłby za pełny miesiąc:
   - składnik stały: kwota miesięczna z umowy (art. 37 ust. 2 pkt 1);
   - składnik zmienny, gdy pracownik przepracował choćby 1 dzień: `osiągnięte / dni przepracowane × dni do przepracowania` (pkt 2);
   - gdy nie przepracował ani dnia: przeciętny składnik zmienny pracowników na podobnym stanowisku (pkt 3).
   - Zał. (tabela 1): zdarzenie w **2. miesiącu** pracy oznacza 1 pełny miesiąc, a jeśli pierwszy był niepełny, bierze się go po uzupełnieniu.

### 2.2 Wynagrodzenie za miesiąc (art. 3 pkt 3, art. 38, art. 42)

„Wynagrodzenie” to przychód stanowiący podstawę składki chorobowej **po odliczeniu składek** emerytalnej, rentowej i chorobowej potrąconych pracownikowi, czyli zwykle `brutto × 0,8629`.

Dla każdego miesiąca w okresie:

| Sytuacja w miesiącu (nieobecność usprawiedliwiona) | Postępowanie | Źródło |
|---|---|---|
| Przepracował pełny miesiąc | Wynagrodzenie faktyczne | art. 38 ust. 1 |
| Przepracował **co najmniej połowę** obowiązującego czasu pracy | **Uzupełnienie** według art. 37 ust. 2: składnik stały w pełnej kwocie z umowy, składnik zmienny `faktyczny / dni przepracowane × dni robocze` | art. 38 ust. 2 pkt 2; Zał. pkt 4 |
| Przepracował **mniej niż połowę** | Miesiąc **wyłączony** (nie wchodzi ani do licznika, ani do mianownika) | art. 38 ust. 2 pkt 1 |
| W **każdym** miesiącu okresu przepracował mniej niż połowę | Bierze się **wszystkie** miesiące, każdy po uzupełnieniu | art. 38 ust. 3 |

Przeciętne miesięczne wynagrodzenie = suma wynagrodzeń z uwzględnionych miesięcy / liczba tych miesięcy (art. 38 ust. 1).

### 2.3 Składniki z zaświadczenia Z-3 (art. 41, art. 42; Zał. pkt 3)

| Składnik | Jak wliczać | Źródło |
|---|---|---|
| Miesięczne stałe i zmienne (zasadnicze, urlopowe, premie regulaminowe pomniejszane za L4) | W kwocie wypłaconej za miesiące z okresu, a w miesiącach niepełnych po uzupełnieniu | art. 42 ust. 1; Zał. pkt 3 |
| Miesięczne nieuzupełniane (nadgodziny, dodatki nocne, prowizje niepomniejszane za L4) | W kwocie faktycznie wypłaconej, bez uzupełniania | Zał. pkt 3 |
| **Kwartalne** (premie, nagrody) | **1/12** sumy wypłaconej za **4 kwartały** przed `M0`, doliczana do przeciętnej miesięcznej | art. 42 ust. 2 |
| **Roczne** (trzynastka, nagroda roczna) | **1/12** kwoty wypłaconej za rok przed `M0` | art. 42 ust. 3 |
| Za inne okresy (np. półroczne) | Analogicznie: 1/12 kwot wypłaconych za 12 miesięcy | art. 42 ust. 4 |
| Jeszcze niewypłacone do czasu sporządzenia listy wypłat | Przyjmuje się kwoty za okres poprzedni | art. 42 ust. 5 |
| Zachowywane w czasie zasiłku (np. dodatek stażowy, gdy przysługuje w czasie choroby) | **Pomijane** | art. 41 ust. 1 |
| Przysługujące tylko do określonego terminu albo których wypłaty zaprzestano | Pomijane za okres po tym terminie | art. 41 ust. 2–3 |
| Zasiłek wyrównawczy | Traktowany jak wynagrodzenie | art. 39 |

Uwaga do kwartalnych i rocznych: dzieli się zawsze przez **12**, także wtedy, gdy miesięcy w okresie jest mniej (sformułowanie art. 42 ust. 2–3 „jedna dwunasta”). Czy przy ubezpieczeniu krótszym niż rok ZUS przelicza to inaczej, zob. O5.

### 2.4 Zmiana wymiaru etatu (art. 40)

Jeżeli zmiana wymiaru czasu pracy nastąpiła w miesiącu zdarzenia albo w okresie odniesienia, podstawą jest wynagrodzenie **ustalone dla nowego wymiaru** (zwykle z umowy, jak w art. 37).

### 2.5 Podstawa minimalna (art. 45)

`podstawa = max(podstawa, minimalne_wynagrodzenie × 0,8629)`, ale **tylko przy pełnym etacie** i tylko u pracowników, do których stosuje się ustawę o minimalnym wynagrodzeniu (art. 45 ust. 2). W 2026 jest to **4 147,10 zł**. Przy niepełnym etacie nie ma proporcjonalnego minimum.

### 2.6 Od podstawy do kwoty zasiłku

- Stawka dzienna = podstawa / 30 (art. 36 ust. 3). Zasiłek przysługuje za każdy dzień kalendarzowy (art. 11 ust. 4, art. 31 ust. 5).
- Procent: chorobowy w ciąży 100% (art. 11 ust. 2 pkt 1); macierzyński 100%, 70% albo 81,5% (art. 31). To są osobne zagadnienia.
- Poradnik (l. 754) mówi też o odliczeniu zaliczki PIT. Dotyczy to kwoty **wypłaty netto**, nie podstawy. Podstawa to kwota brutto po 13,71%.

---

## 3. Pełny algorytm: zleceniobiorca i prowadzący działalność (nie-pracownik)

Podstawa prawna: UZ art. 48–50, stosowane do zasiłku macierzyńskiego przez art. 52. Z rozdziału 8 stosuje się tylko art. 36 ust. 2–4, art. 38 ust. 1, art. 42 i art. 43 (art. 48 ust. 2, art. 52). **Nie stosuje się art. 45**, więc dla nie-pracownika nie ma podstawy minimalnej z płacy minimalnej (jej rolę pełni najniższa podstawa składek, jeśli istnieje).

### 3.1 Przychód (art. 3 pkt 4)

„Przychód” to **podstawa wymiaru składki na ubezpieczenie chorobowe** za miesiąc pomniejszona o 13,71% tej kwoty. Tu odliczenie zawsze wynosi 13,71%, niezależnie od faktycznych składek.

- Zleceniobiorca: podstawa składki = przychód z umowy w danym miesiącu (zmienny, jeśli rozliczenie godzinowe).
- Działalność: podstawa składki = **zadeklarowana kwota** (co najmniej 60% prognozowanego, 30% minimalnego przy preferencji albo wyliczona w małym ZUS+; maksymalnie 23 550 zł dla składki chorobowej).

### 3.2 Okres pełny: co najmniej 12 miesięcy ubezpieczenia (art. 48 ust. 1, art. 38 ust. 1)

`podstawa = średnia(przychód_m)` z 12 miesięcy kalendarzowych przed `M0`, przy czym dzieli się przez liczbę miesięcy, w których przychód osiągnięto.

**Miesiące niepełne (art. 50)**: jeżeli przychód zmalał wskutek niewykonywania pracy w okresie pobierania zasiłku chorobowego, macierzyńskiego, opiekuńczego, świadczenia rehabilitacyjnego albo ćwiczeń wojskowych:

- miesiąc, w którym pracę wykonywano przez mniej niż połowę miesiąca: **wyłącza się**;
- co najmniej połowę: **przyjmuje się bez uzupełnienia** (inaczej niż u pracownika);
- jeśli tak było w każdym miesiącu: bierze się wszystkie.

Ciągłość: „nieprzerwane ubezpieczenie” obejmuje kolejne umowy zlecenia z tym samym zleceniodawcą albo kolejne okresy prowadzenia działalności (Poradnik l. 786).

### 3.3 Ubezpieczenie krótsze niż 12 miesięcy

- **Zleceniobiorca**: średnia z pełnych miesięcy kalendarzowych ubezpieczenia (art. 36 ust. 2 w zw. z art. 48 ust. 2).
- **Działalność (zadeklarowana kwota), art. 48a**: wzór, który przy krótkim stażu „rozkłada” nadwyżkę ponad minimum na 12 miesięcy (ograniczenie gwałtownego podwyższania deklaracji tuż przed zasiłkiem):

```
n        = liczba pełnych miesięcy kalendarzowych ubezpieczenia (< 12)
MIN_avg  = przeciętna najniższa podstawa składki chorobowej z tych miesięcy
DEK_avg  = przeciętna zadeklarowana podstawa składki chorobowej z tych miesięcy
k        = 0,8629

podstawa = MIN_avg × k  +  (1/12) × (DEK_avg − MIN_avg) × k × n
```

  - „Najniższa podstawa” to minimum obowiązujące **tę** osobę (np. 30% minimalnego wynagrodzenia przy preferencji). Gdy ktoś przez cały okres działalności deklarował co najmniej 60% prognozowanego, za najniższą przyjmuje się kwotę z art. 18 ust. 8 ustawy systemowej, czyli 60% (art. 48a ust. 5).
  - Przy przerwie nie dłuższej niż 30 dni od ustania ubezpieczenia chorobowego z innego tytułu do `n` dolicza się pełne miesiące z poprzedniego tytułu (razem najwyżej 12), ale średnie liczy się tylko z bieżącego tytułu (art. 48a ust. 2–3).
  - Przerwa wynikająca wyłącznie z nieopłacenia albo spóźnienia składki: uwzględnia się także przychód sprzed przerwy (art. 48a ust. 4).

### 3.4 Zdarzenie w 1. miesiącu ubezpieczenia (art. 49)

- Działalność (jest najniższa podstawa): **najniższa podstawa** składki chorobowej za ten miesiąc × 0,8629 (art. 49 ust. 1 pkt 1).
- Zleceniobiorca: **kwota przychodu z umowy** za ten miesiąc × 0,8629. Jeśli umowa jej nie określa, przeciętny przychód innych zleceniobiorców płatnika z podobnymi umowami (art. 49 ust. 1 pkt 2).
- Przy przejściu z innego tytułu z przerwą nie dłuższą niż 30 dni: art. 37 ust. 1 (jak u pracownika), a dla działalności art. 48a z miesiącem zdarzenia wliczonym do `n` (art. 49 ust. 2–3).

### 3.5 Limity

- Górny limit wynika pośrednio z limitu składki: maks. 23 550 zł, czyli podstawa najwyżej **20 321,30 zł** (Zał.).
- Art. 46 (100% przeciętnego wynagrodzenia) dotyczy tylko zasiłku chorobowego **po ustaniu tytułu** i nie odnosi się do macierzyńskiego (art. 52 go nie wymienia, wymienia tylko przy świadczeniu rehabilitacyjnym).
- Zadanie (l. 307): ZUS może zakwestionować podwyższenie podstawy składek w ciąży dokonane wyłącznie w celu uzyskania wyższego zasiłku. Narzędzie powinno to **sygnalizować**, a nie liczyć.

---

## 4. Pseudokod gotowy do TS

Wszystkie kwoty liczymy w **groszach** (liczby całkowite), żeby uniknąć błędów zmiennoprzecinkowych. Funkcja jest czysta i zwraca kroki wyjaśnienia do pokazania w UI.

```ts
// ---- stałe 2026 ----
export const ODLICZENIE = 0.1371;
export const K = 1 - ODLICZENIE; // 0.8629
export const STALE_2026 = {
  minimalneWynagrodzenie: 480_600,      // gr
  maxPodstawaSkladkiChorobowej: 2_355_000,
  prognozowanePrzecietne: 942_000,      // wyliczone: 23 550 / 2,5
} as const;

type Grosze = number;
type YearMonth = `${number}-${string}`; // "2026-03"

type TytulUbezpieczenia = "pracownik" | "zleceniobiorca" | "dzialalnosc";

interface MiesiacPracownika {
  miesiac: YearMonth;
  brutto: Grosze;                 // przychód z Z-3 (składniki miesięczne)
  // tylko gdy był niepełny z przyczyn usprawiedliwionych:
  dniDoPrzepracowania?: number;
  dniPrzepracowane?: number;
  skladnikStalyZUmowy?: Grosze;   // do uzupełnienia
  skladnikZmiennyFaktyczny?: Grosze;
}

interface MiesiacNiepracownika {
  miesiac: YearMonth;
  podstawaSkladkiChorobowej: Grosze;  // zadeklarowana albo z umowy
  najnizszaPodstawa?: Grosze;         // tylko działalność
  wykonywalPrzezMniejNizPolowe?: boolean; // art. 50, z powodu zasiłku itp.
}

interface WejsciePodstawy {
  tytul: TytulUbezpieczenia;
  miesiacZdarzenia: YearMonth;          // M0
  poczatekUbezpieczenia: string;        // ISO date, nieprzerwane ubezp. chorobowe
  pelnyEtat?: boolean;                  // pracownik
  miesiacePracownika?: MiesiacPracownika[];
  miesiaceNiepracownika?: MiesiacNiepracownika[];
  premieKwartalneZa4Kwartaly?: Grosze;  // brutto, art. 42 ust. 2
  premieRoczneZaRokPoprzedni?: Grosze;  // brutto, art. 42 ust. 3
  wynagrodzenieZUmowy?: Grosze;         // fallback na 1. miesiąc (art. 37 / 49)
  poprzedniaPodstawa?: { kwota: Grosze; przerwaKrotszaNizMiesiac: boolean }; // art. 43
}

interface Wynik { podstawa: Grosze; stawkaDzienna: Grosze; kroki: string[]; ostrzezenia: string[] }

const r = (x: number) => Math.round(x); // zaokrąglenie do grosza, zob. O4

export function podstawaWymiaru(w: WejsciePodstawy): Wynik {
  const kroki: string[] = [], ostrzezenia: string[] = [];

  // art. 43: ciągłość
  if (w.poprzedniaPodstawa?.przerwaKrotszaNizMiesiac) {
    kroki.push("Art. 43: przerwa < 1 miesiąca, przyjmujemy poprzednią podstawę.");
    return wynik(w.poprzedniaPodstawa.kwota, kroki, ostrzezenia);
  }

  const okres = pelneMiesiaceOkresu(w.miesiacZdarzenia, w.poczatekUbezpieczenia); // ≤ 12, art. 36 ust. 1–2, 4
  let podstawa: Grosze;

  if (okres.length === 0) {
    podstawa = pierwszyMiesiac(w, kroki);                        // art. 37 / art. 49
  } else if (w.tytul === "pracownik") {
    podstawa = podstawaPracownika(w, okres, kroki);
  } else if (w.tytul === "dzialalnosc" && okres.length < 12) {
    podstawa = art48a(w, okres, kroki);
  } else {
    podstawa = sredniaPrzychodu(w, okres, kroki);                // art. 48, 50
  }

  if (w.tytul === "pracownik" && w.pelnyEtat) {                  // art. 45
    const min = r(STALE_2026.minimalneWynagrodzenie * K);
    if (podstawa < min) { kroki.push(`Art. 45: podniesiono do minimum ${min} gr.`); podstawa = min; }
  }
  return wynik(podstawa, kroki, ostrzezenia);
}

function podstawaPracownika(w: WejsciePodstawy, okres: YearMonth[], kroki: string[]): Grosze {
  const ms = w.miesiacePracownika!.filter(m => okres.includes(m.miesiac));
  const czyNiepelny = (m: MiesiacPracownika) =>
    m.dniPrzepracowane != null && m.dniDoPrzepracowania != null && m.dniPrzepracowane < m.dniDoPrzepracowania;
  const czyPonizejPolowy = (m: MiesiacPracownika) =>
    czyNiepelny(m) && m.dniPrzepracowane! * 2 < m.dniDoPrzepracowania!;

  const wszystkiePonizej = ms.length > 0 && ms.every(czyPonizejPolowy);  // art. 38 ust. 3
  const uwzglednione = wszystkiePonizej ? ms : ms.filter(m => !czyPonizejPolowy(m)); // art. 38 ust. 2 pkt 1

  const kwoty = uwzglednione.map(m => {
    if (!czyNiepelny(m)) return m.brutto;
    // art. 37 ust. 2: uzupełnienie
    const stala = m.skladnikStalyZUmowy ?? 0;
    const zmienna = m.skladnikZmiennyFaktyczny != null
      ? (m.skladnikZmiennyFaktyczny / m.dniPrzepracowane!) * m.dniDoPrzepracowania!
      : 0;
    return stala + zmienna;
  });

  const srednia = kwoty.reduce((a, b) => a + b, 0) / kwoty.length;           // art. 38 ust. 1
  const kwartalne = (w.premieKwartalneZa4Kwartaly ?? 0) / 12;                // art. 42 ust. 2
  const roczne = (w.premieRoczneZaRokPoprzedni ?? 0) / 12;                   // art. 42 ust. 3
  kroki.push(`Uwzględniono ${kwoty.length} z ${ms.length} miesięcy.`);
  return r((srednia + kwartalne + roczne) * K);                              // art. 3 pkt 3
}

function sredniaPrzychodu(w: WejsciePodstawy, okres: YearMonth[], kroki: string[]): Grosze {
  const ms = w.miesiaceNiepracownika!.filter(m => okres.includes(m.miesiac) && m.podstawaSkladkiChorobowej > 0);
  const wszystkie = ms.every(m => m.wykonywalPrzezMniejNizPolowe);           // art. 50 ust. 2
  const uwz = wszystkie ? ms : ms.filter(m => !m.wykonywalPrzezMniejNizPolowe); // art. 50 ust. 1
  const srednia = uwz.reduce((a, m) => a + m.podstawaSkladkiChorobowej, 0) / uwz.length;
  return r(srednia * K);                                                     // art. 3 pkt 4
}

function art48a(w: WejsciePodstawy, okres: YearMonth[], kroki: string[]): Grosze {
  const ms = w.miesiaceNiepracownika!.filter(m => okres.includes(m.miesiac));
  const n = ms.length;
  const minAvg = ms.reduce((a, m) => a + (m.najnizszaPodstawa ?? 0), 0) / n;
  const dekAvg = ms.reduce((a, m) => a + m.podstawaSkladkiChorobowej, 0) / n;
  kroki.push(`Art. 48a: n=${n}, nadwyżka ponad minimum liczona w ${n}/12.`);
  return r(minAvg * K + (Math.max(0, dekAvg - minAvg) * K * n) / 12);
}

function pierwszyMiesiac(w: WejsciePodstawy, kroki: string[]): Grosze {
  if (w.tytul === "dzialalnosc") {
    // art. 49 ust. 1 pkt 1: najniższa podstawa (wejście musi ją podać)
    return r((w.miesiaceNiepracownika?.[0]?.najnizszaPodstawa ?? 0) * K);
  }
  // pracownik: art. 37 ust. 2 pkt 1; zleceniobiorca: art. 49 ust. 1 pkt 2
  return r((w.wynagrodzenieZUmowy ?? 0) * K);
}

function wynik(p: Grosze, kroki: string[], ostrzezenia: string[]): Wynik {
  return { podstawa: p, stawkaDzienna: r(p / 30), kroki, ostrzezenia };      // art. 36 ust. 3
}
```

`pelneMiesiaceOkresu(M0, start)` zwraca do 12 miesięcy kalendarzowych bezpośrednio przed `M0`, ale tylko pełne miesiące, które w całości mieszczą się po `start` (czyli miesiąc startu liczy się tylko wtedy, gdy `start` to 1. dzień miesiąca).

---

## 5. Przykłady liczbowe (do testów jednostkowych)

Wszystkie wyniki zaokrąglone do grosza **na końcu**.

**P1. Pracownica, stała pensja, pełny rok.** 12 × 6 000,00 zł brutto. Podstawa = 6 000 × 0,8629 = **5 177,40 zł**. Stawka dzienna 172,58 zł. Zasiłek macierzyński: 100% = 5 177,40 zł/mies.; 81,5% = **4 219,58 zł**; 70% = 3 624,18 zł.

**P2. Pracownica, miesiące niepełne i premia kwartalna.** Pensja zasadnicza 5 000 zł (stała) + premia regulaminowa ok. 800 zł (zmienna, pomniejszana za L4).
- 10 miesięcy pełnych: po 5 800 zł.
- Miesiąc A: przepracowała 12 z 21 dni (co najmniej połowa), wypłacono zmienną 457,14 zł. Uzupełnienie: 5 000 + 457,14 / 12 × 21 = 5 000 + 800,00 = **5 800,00 zł**.
- Miesiąc B: przepracowała 5 z 20 dni (poniżej połowy): **wyłączony**.
- Premie kwartalne za 4 kwartały: 4 × 1 500 = 6 000 zł, czyli 6 000 / 12 = 500 zł.
- Średnia z 11 miesięcy = 5 800; razem 6 300 zł brutto. Podstawa = 6 300 × 0,8629 = **5 436,27 zł**.

**P3. Pracownica na pełnym etacie, podstawa poniżej minimum.** Wyliczona średnia 4 500 zł brutto, czyli 3 883,05 zł. To mniej niż 4 147,10 zł, więc podstawa = **4 147,10 zł** (art. 45). Ta sama sytuacja na ½ etatu: zostaje 3 883,05 zł.

**P4. Pracownica, krótki staż.** Zatrudniona od 15.03.2026, L4 w ciąży od 10.06.2026. Pełne miesiące: kwiecień i maj, po 7 000 zł. Podstawa = 7 000 × 0,8629 = **6 040,30 zł**. Gdyby L4 zaczęło się 20.03.2026 (1. miesiąc), podstawa = wynagrodzenie z umowy 7 000 zł × 0,8629 = **6 040,30 zł** (art. 37 ust. 2 pkt 1).

**P5. Zleceniobiorczyni z dobrowolnym chorobowym, pełny rok.** Podstawa składki: 6 mies. × 4 000 zł i 6 mies. × 5 000 zł. Średnia 4 500 zł. Podstawa = **3 883,05 zł**. Brak podstawy minimalnej (art. 45 nie dotyczy).

**P6. Działalność, „duży ZUS”, pełny rok.** 12 × 5 652 zł. Podstawa = 5 652 × 0,8629 = **4 877,11 zł**. Ta sama osoba na preferencji (12 × 1 441,80 zł): **1 244,13 zł**. Wtedy zasiłek macierzyński 70% = 870,89 zł, prawdopodobnie poniżej kwoty świadczenia rodzicielskiego, więc nastąpi podwyższenie z art. 31 ust. 3a (zob. O1).

**P7. Działalność, 4 pełne miesiące, deklaracja na maksimum (art. 48a).** Najniższa podstawa 5 652 zł (art. 48a ust. 5), deklaracja 23 550 zł, n = 4.
- Część 1: 5 652 × 0,8629 = 4 877,1108
- Część 2: (23 550 − 5 652) × 0,8629 × 4/12 = 17 898 × 0,8629 / 3 = 5 148,0614
- Podstawa = **10 025,17 zł** (dla porównania: przy 12 miesiącach na maksimum byłoby 20 321,30 zł).

**P8. Działalność, zdarzenie w 1. miesiącu.** Najniższa podstawa 5 652 zł, więc podstawa = **4 877,11 zł** niezależnie od deklaracji (art. 49 ust. 1 pkt 1).

---

## 6. Wersja minimalna dla MVP

### 6.1 Co podaje użytkownik (albo **persona demo** „z ZUS”)

Wspólne:
1. Tytuł ubezpieczenia: pracownik / zleceniobiorca / działalność. Jeden tytuł, bez zbiegu.
2. Data zdarzenia: początek L4 w ciąży albo data porodu / przyjęcia dziecka. Z niej wynika `M0`.
3. Data początku nieprzerwanego ubezpieczenia chorobowego z tego tytułu.
4. Czy bezpośrednio wcześniej był zasiłek z przerwą krótszą niż miesiąc? Jeśli tak, podaje poprzednią podstawę (art. 43).

Pracownik:
5. Tryb prosty: jedna kwota „miesięczne wynagrodzenie brutto” (stałe przez okres) + „pełny etat: tak/nie”.
6. Tryb szczegółowy (persona demo, dane jak z Z-3): tabela do 12 miesięcy: brutto, a dla miesięcy z nieobecnością dni przepracowane / do przepracowania oraz rozbicie na składnik stały i zmienny.
7. Opcjonalnie: suma premii kwartalnych za 4 kwartały i premii rocznej za poprzedni rok.

Zleceniobiorca:
5. Miesięczna podstawa składki chorobowej (tryb prosty: jedna kwota; szczegółowy: tabela 12 miesięcy).

Działalność:
5. Zadeklarowana podstawa (jedna kwota albo tabela) + rodzaj minimum: „duży ZUS” 60% / preferencja 30% / mały ZUS+ (wtedy kwota minimum ręcznie).

### 6.2 Co liczymy w MVP

- Art. 36 ust. 1–3 (12 miesięcy albo pełne miesiące przy krótszym stażu, stawka dzienna /30).
- Art. 37 ust. 2 pkt 1–2 i art. 49 ust. 1 pkt 1–2 (1. miesiąc).
- Art. 38 ust. 1–3 (wyłączanie i uzupełnianie) tylko w trybie szczegółowym.
- Art. 42 ust. 2–3 (1/12 premii kwartalnych i rocznych).
- Art. 43 (ciągłość) jako pytanie tak/nie.
- Art. 45 (minimum dla pełnego etatu).
- Art. 48, art. 48a (działalność < 12 mies.) i art. 50 (flaga „poniżej połowy miesiąca”).
- Walidacja: podstawa składki nie-pracownika ≤ 23 550 zł.

### 6.3 Co upraszczamy albo pomijamy (świadomie)

| Uproszczenie | Skutek | Ryzyko |
|---|---|---|
| Stałe 13,71% również u pracownika | Błąd przy przekroczeniu rocznego limitu składek emerytalno-rentowych (30-krotność) albo u osób zwolnionych ze składek | Niskie dla grupy docelowej |
| Brak art. 37 ust. 2 pkt 3 (zmienne „jak u innych pracowników”) | Użytkownik musi podać kwotę | Niskie |
| Brak art. 40 (zmiana etatu) | Użytkownik ręcznie podaje kwotę dla nowego etatu, w UI dajemy podpowiedź | Średnie |
| Brak art. 41 (składniki zachowywane w czasie zasiłku) | Zakładamy, że użytkownik podaje tylko składniki „do podstawy” | Niskie w trybie demo |
| Brak art. 48a ust. 2–4 i art. 49 ust. 2–3 (łączenie z poprzednim tytułem) | Przy zmianie tytułu z krótką przerwą pokazujemy ostrzeżenie „wynik orientacyjny” | Średnie |
| Brak zbiegu tytułów (np. etat + zlecenie u innego płatnika) | Liczymy jeden tytuł; w UI informujemy, że każdy tytuł daje osobny zasiłek | Średnie |
| Brak art. 46 (limit po ustaniu tytułu) | Dotyczy chorobowego po ustaniu ubezpieczenia | Niskie |
| Zaokrąglenie tylko na końcu | Możliwe różnice ±0,01 zł względem ZUS | Niskie |
| Brak oceny „sztucznego podwyższenia” deklaracji | Tylko ostrzeżenie, gdy deklaracja wzrosła w ciąży | Informacyjne |

Każdy wynik pokazujemy z listą `kroki` (z numerem artykułu) i dopiskiem „wynik szacunkowy; ostatecznie ustala płatnik uprawniony albo ZUS”.

---

## 7. Otwarte kwestie

- **O1.** Kwota świadczenia rodzicielskiego (próg z art. 31 ust. 3a) nie występuje w materiałach. Trzeba ją potwierdzić w ustawie o świadczeniach rodzinnych / na zus.pl i dopisać do stałych. Ten temat należy do wysokości zasiłku, nie do podstawy, ale ten sam moduł go potrzebuje.
- **O2.** Miesiąc odniesienia dla zasiłku macierzyńskiego: przyjmujemy miesiąc powstania prawa (poród, przyjęcie dziecka, start urlopu przed porodem). Do potwierdzenia na **sprawach przykładowych** (decyzje są w skanach PDF w `docs/sprawy/`, `pdftotext` nie wyciąga z nich tekstu, potrzebny OCR albo ręczny odczyt).
- **O3.** Pracownik, który przekroczył 30-krotność: odliczenie to wtedy tylko 2,45% w części miesięcy. Czy obsługujemy to w trybie szczegółowym (osobna kolumna „składki potrącone”)?
- **O4.** Zasady zaokrągleń ZUS: czy odliczenie 13,71% stosuje się per miesiąc czy na średniej, czy stawkę dzienną zaokrągla się przed mnożeniem przez dni. Do sprawdzenia na sprawach przykładowych.
- **O5.** Premie kwartalne i roczne przy stażu krótszym niż rok: czy zawsze 1/12, czy proporcjonalnie? (Praktyka ZUS: przy krótszym ubezpieczeniu sumę dzieli się przez liczbę miesięcy, za które je wypłacono. Do weryfikacji, źródła w repo tego nie rozstrzygają.)
- **O6.** Zleceniobiorca pracujący na rzecz własnego pracodawcy jest traktowany jak pracownik (Poradnik l. 191). Czy MVP to wykrywa, czy pytamy wprost?
- **O7.** Mały ZUS+: najniższa podstawa jest liczona indywidualnie z dochodu. Czy wystarczy ręczne wpisanie kwoty?
- **O8.** Wartość „100% przeciętnego wynagrodzenia” (art. 46) na poszczególne kwartały 2026, jeśli kiedykolwiek obsłużymy chorobowy po ustaniu ubezpieczenia.
- **O9.** Wartości wyliczone (prognozowane przeciętne 9 420 zł, 60% = 5 652 zł, 30% = 1 441,80 zł) warto potwierdzić w obwieszczeniu albo na zus.pl. NotebookLM nie był użyty w tym researchu.
- **O10.** Art. 43 a zmiana wymiaru etatu między zasiłkami: Poradnik wskazuje wyjątek, ustawa w wyciągu go nie zawiera. Co pokazujemy w UI?
