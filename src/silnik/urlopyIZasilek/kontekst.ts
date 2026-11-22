/**
 * Wewnętrzny kontekst jednego wywołania szwu urlopyIZasilek: parametry, zebrane ostrzeżenia, kroki
 * i użyte niepotwierdzone parametry. Reguły (wymiary, a dalej okresy, stawki i kwoty) dopisują do niego wyniki.
 */

import { odczytaj, type KluczParametru, type ParametryPrawne } from '../parametry';
import type { Krok, Ostrzezenie } from '../typy';

export interface Kontekst {
  parametry: ParametryPrawne;
  niepotwierdzone: Set<KluczParametru>;
  ostrzezenia: Ostrzezenie[];
  kroki: Krok[];
  /** Odczyt parametru z notowaniem niepotwierdzonych. */
  param<K extends KluczParametru>(klucz: K): ParametryPrawne[K]['wartosc'];
}

export function nowyKontekst(parametry: ParametryPrawne): Kontekst {
  const niepotwierdzone = new Set<KluczParametru>();
  return {
    parametry,
    niepotwierdzone,
    ostrzezenia: [],
    kroki: [],
    param: (klucz) => odczytaj(parametry, klucz, niepotwierdzone),
  };
}
