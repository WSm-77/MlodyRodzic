/**
 * R-PZ-*: umowa dla pozoru, podwyższenie podstawy i inne sygnały wpływające na podstawę.
 * Silnik nigdy nie rozstrzyga pozorności (spec #14, OK-4): wyłącznie „ryzyko” albo „informacja”.
 */

import { czesciDaty, dodajMiesiaceDoMiesiaca, miesiacDaty, porownajMiesiace } from '../wspolne/daty';
import { art2a, dzienPowstaniaPrawa, okresWDniu, type GrupaRegul, type KontekstOceny } from './kontekst';
import type { WynikReguly } from './typy';

export const regulyPZ: GrupaRegul = (k) => {
  const wyniki: WynikReguly[] = [];
  const s = k.wejscie.sygnalyRyzyka ?? {};

  if (s.umowaZawartaWCiazy) {
    const dodatkowe = [
      s.ulamkowyEtat ? 'ułamkowy etat' : undefined,
      s.wynagrodzenieZnaczniePowyzejRynkowego ? 'wynagrodzenie wyraźnie wyższe niż rynkowe' : undefined,
    ].filter((x): x is string => x !== undefined);
    wyniki.push({
      regula: 'R-PZ-01',
      status: 'ryzyko',
      komunikat:
        'Umowę zawarto w czasie ciąży' +
        (dodatkowe.length > 0 ? ` (dodatkowo: ${dodatkowe.join(', ')})` : '') +
        '. ZUS może sprawdzić, czy praca jest faktycznie wykonywana. Jeśli uzna umowę za zawartą tylko dla zasiłku (dla pozoru), wyda decyzję o niepodleganiu ubezpieczeniu i świadczenia nie zostaną wypłacone. To sygnał ostrzegawczy, a nie rozstrzygnięcie.',
      podstawaPrawna: ['Poradnik ZUS (7, 9)', 'KC art. 83 § 1 (poza materiałami)'],
    });
  }

  if (s.podwyzkaPodstawyWCiazy || s.wynagrodzenieZnaczniePowyzejRynkowego) {
    wyniki.push({
      regula: 'R-PZ-02',
      status: 'ryzyko',
      komunikat: s.podwyzkaPodstawyWCiazy
        ? 'Podstawę składek podwyższono w czasie ciąży. Jeśli ZUS uzna, że zrobiono to tylko po to, by dostać wyższy zasiłek, może ustalić niższą podstawę i zasiłek będzie niższy.'
        : 'ZUS może sprawdzić, czy wynagrodzenie odpowiada wykonywanej pracy, i ustalić niższą podstawę wymiaru składek, a przez to niższy zasiłek.',
      podstawaPrawna: ['Poradnik ZUS (7)', 'Treść zadania, sekcja H pkt 2'],
    });
  }

  wyniki.push(...krotkieUbezpieczenieDzialalnosci(k));

  if (k.wejscie.zmianaWymiaruCzasuPracy) {
    wyniki.push({
      regula: 'R-PZ-04',
      status: 'informacja',
      komunikat:
        'Zmiana wymiaru czasu pracy wpływa na wysokość zasiłku – podstawę liczy się z wynagrodzenia dla nowego wymiaru. Silnik w tej wersji nie przelicza tego automatycznie, więc kwota jest orientacyjna.',
      podstawaPrawna: ['UZ art. 40'],
    });
  }

  return wyniki;
};

/** R-PZ-03: działalność ubezpieczona krócej niż 12 pełnych miesięcy – podstawa wg art. 48a (wyliczenie, nie ryzyko). */
function krotkieUbezpieczenieDzialalnosci(k: KontekstOceny): WynikReguly[] {
  const dzien = dzienPowstaniaPrawa(k.wejscie);
  if (!dzien) return [];
  const okres = okresWDniu(k.okresy, dzien);
  if (!okres || !art2a(okres.tytul)) return [];

  const miesiacPoczatku = czesciDaty(okres.od).dzien === 1 ? miesiacDaty(okres.od) : dodajMiesiaceDoMiesiaca(miesiacDaty(okres.od), 1);
  const pelneMiesiace = Math.max(0, porownajMiesiace(miesiacDaty(dzien), miesiacPoczatku));
  const wymagane = k.param('miesiaceOkresuOdniesienia');
  if (pelneMiesiace >= wymagane) return [];

  return [
    {
      regula: 'R-PZ-03',
      status: 'informacja',
      komunikat: `Przed zdarzeniem masz ${pelneMiesiace} pełnych miesięcy ubezpieczenia z działalności, mniej niż ${wymagane}. Nadwyżka zadeklarowanej podstawy ponad minimum wchodzi do podstawy zasiłku tylko proporcjonalnie do liczby miesięcy, więc krótkotrwałe podwyższenie składki niewiele zmienia.`,
      podstawaPrawna: ['UZ art. 48 ust. 1', 'UZ art. 48a ust. 1'],
    },
  ];
}
