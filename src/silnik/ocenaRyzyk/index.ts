/**
 * Szew 3: czy świadczenie przysługuje, na jakich warunkach i co może je odebrać.
 * Reguły R-*: docs/research/uprawnienia-w-ciazy-i-ryzyka.md; korekty D7–D9 i reguła R-MA-06: komentarz do #14.
 * Ocena ryzyk nie liczy kwot.
 */

import type { KluczParametru, ParametryPrawne } from '../parametry';
import { utworzKontekst, type GrupaRegul } from './kontekst';
import { regulyCH } from './regulyCH';
import { regulyDL } from './regulyDL';
import { regulyKP } from './regulyKP';
import { regulyMA } from './regulyMA';
import { regulyZWM } from './regulyZWM';
import { regulyPU } from './regulyPU';
import { regulyPZ } from './regulyPZ';
import { regulyRE } from './regulyRE';
import type { WejscieRyzyk, WynikRyzyk } from './typy';

export * from './typy';

/**
 * Kolejność oceny (spec #14, „ocenaRyzyk”): R-KP-* → R-DL-* → R-CH-* / R-PU-* / R-RE-01 → R-ZWM-* → R-MA-* → R-PZ-*.
 * Grupy dzielą jeden kontekst (kontekst.ts), więc wcześniejsza grupa może ustalić stan dla późniejszych
 * (R-KP-02 przedłuża umowę terminową do dnia porodu: `kontekst.okresy`, `kontekst.umowaPrzedluzonaDoPorodu`).
 */
const KOLEJNOSC_OCENY: readonly GrupaRegul[] = [
  regulyKP,
  regulyDL,
  regulyCH,
  regulyPU,
  regulyRE,
  regulyZWM,
  regulyMA,
  regulyPZ,
];

export function ocenaRyzyk(wejscie: WejscieRyzyk, parametry: ParametryPrawne): WynikRyzyk {
  const niepotwierdzone = new Set<KluczParametru>();
  const kontekst = utworzKontekst(wejscie, parametry, niepotwierdzone);
  const wyniki = KOLEJNOSC_OCENY.flatMap((grupa) => grupa(kontekst));
  return { wyniki, ostrzezenia: kontekst.ostrzezenia, niepotwierdzoneParametry: [...niepotwierdzone] };
}
