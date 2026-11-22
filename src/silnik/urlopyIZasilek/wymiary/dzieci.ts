/** Stan dzieci po zdarzeniu: ile urodzono / przyjęto, ile żyje, kiedy nastąpił ostatni zgon (KP art. 180¹). */

import { dodajDni, najpozniejsza, roznicaDni } from '../../wspolne/daty';
import type { ISODate } from '../../typy';
import type { Dziecko } from '../index';
import type { Kontekst } from '../kontekst';

export interface StanDzieci {
  liczba: number;
  zyjace: number;
  wszystkieZmarly: boolean;
  /** Dzień ostatniego zgonu (martwe urodzenie = dzień urodzenia). */
  ostatniZgon?: ISODate;
  /** Zgon nastąpił przed upływem 8 tygodni życia (KP art. 180¹ § 1), a nie po nim (§ 2). */
  zgonPrzedUplywem8Tygodni?: boolean;
  /** Ostatni dzień, w którym trwa prawo do urlopu po zgonie: dzień zgonu + 7 dni. */
  koniecPrawaPoZgonie?: ISODate;
}

const dataZgonu = (d: Dziecko): ISODate | undefined => (d.martweUrodzenie ? d.dataUrodzenia : d.dataZgonu);

export function stanDzieci(dzieci: Dziecko[], k: Kontekst): StanDzieci {
  const zmarle = dzieci.filter((d) => dataZgonu(d) !== undefined);
  const stan: StanDzieci = {
    liczba: dzieci.length,
    zyjace: dzieci.length - zmarle.length,
    wszystkieZmarly: dzieci.length > 0 && zmarle.length === dzieci.length,
  };
  const ostatnie = zmarle.reduce<Dziecko | undefined>(
    (a, d) => (a === undefined || najpozniejsza(dataZgonu(a)!, dataZgonu(d)!) === dataZgonu(d) ? d : a),
    undefined,
  );
  if (ostatnie === undefined) return stan;
  const zgon = dataZgonu(ostatnie)!;
  const dzienZycia = roznicaDni(ostatnie.dataUrodzenia, zgon) + 1;
  return {
    ...stan,
    ostatniZgon: zgon,
    zgonPrzedUplywem8Tygodni: dzienZycia <= k.param('tygodnieMartweUrodzenie') * 7,
    koniecPrawaPoZgonie: dodajDni(zgon, k.param('dniPoZgonieDziecka')),
  };
}
