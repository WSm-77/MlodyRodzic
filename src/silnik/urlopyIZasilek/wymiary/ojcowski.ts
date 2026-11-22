/** Urlop ojcowski (KP art. 182³): 2 tygodnie, najwyżej 2 części po co najmniej tydzień, termin wykorzystania. */

import type { ISODate } from '../../typy';
import type { WymiarUrlopu } from '../index';
import type { Kontekst } from '../kontekst';
import type { StanDzieci } from './dzieci';

export function wymiarOjcowskiego(
  terminWykorzystania: ISODate | undefined,
  przepisTerminu: string,
  stan: StanDzieci,
  k: Kontekst,
): WymiarUrlopu {
  if (stan.wszystkieZmarly) {
    // Urlop ojcowski służy opiece nad dzieckiem; KP nie przewiduje go po zgonie dziecka (art. 182³ § 1, § 3).
    return { rodzaj: 'ojcowski', przysluguje: false, tygodnie: 0, dni: 0, podstawaPrawna: ['KP art. 182³ § 1'] };
  }
  const tygodnie = k.param('tygodnieOjcowskiego');
  const podstawaPrawna = ['KP art. 182³ § 1', przepisTerminu, 'KP art. 182³ § 1¹', 'UZ art. 31 ust. 1'];
  k.kroki.push({ opis: `Urlop ojcowski: ${tygodnie} tyg., do wykorzystania do ${terminWykorzystania ?? 'terminu z postanowienia sądu'}.`, podstawaPrawna });
  return {
    rodzaj: 'ojcowski',
    przysluguje: true,
    tygodnie,
    dni: tygodnie * 7,
    maksCzesci: k.param('maksCzesciOjcowskiego'),
    ...(terminWykorzystania ? { terminWykorzystania } : {}),
    podstawaPrawna,
  };
}
