/**
 * Urlop rodzicielski (KP art. 182¹ᵃ–182¹ᵍ, art. 183 § 4–5): wymiar łączny 41/43 (65/67 „Za życiem”,
 * 38/62 w przypadku minimum przy przyjęciu dziecka), 9 tygodni nieprzenoszalnych dla każdego rodzica,
 * maksimum jednego rodzica, 5 części i termin wykorzystania.
 */

import { porownaj } from '../../wspolne/daty';
import type { ISODate } from '../../typy';
import type { WymiarUrlopu } from '../index';
import type { Kontekst } from '../kontekst';
import type { StanDzieci } from './dzieci';

export interface DaneRodzicielskiego {
  /** Liczba dzieci decydująca o wymiarze (żyjące przy urodzeniu, przyjęte przy przysposobieniu). */
  liczbaDzieci: number;
  zaZyciem: boolean;
  /** Przyjęcie dziecka z urlopem na warunkach macierzyńskiego skróconym do minimum (KP art. 183 § 3). */
  przypadekMinimum: boolean;
  terminWykorzystania?: ISODate;
  /** Ostatni dzień urlopu poprzedzającego (macierzyński albo uzupełniający) — do oceny prawa po zgonie dziecka. */
  koniecPoprzedniegoUrlopu: ISODate;
  podstawaPrawna: string[];
  /** Ilu rodziców jest ubezpieczonych: przy jednym 9 tygodni drugiego rodzica to założenie do potwierdzenia. */
  ubezpieczeniRodzice: number;
}

function tygodnieWymiaru(d: DaneRodzicielskiego, k: Kontekst): number {
  if (d.przypadekMinimum)
    return k.param(d.zaZyciem ? 'tygodnieRodzicielskiegoPrzyMinimumZaZyciem' : 'tygodnieRodzicielskiegoPrzyMinimum');
  const mnogi = d.liczbaDzieci > 1;
  if (d.zaZyciem) return k.param(mnogi ? 'tygodnieRodzicielskiegoZaZyciemMnogi' : 'tygodnieRodzicielskiegoZaZyciem');
  return k.param(mnogi ? 'tygodnieRodzicielskiegoMnogi' : 'tygodnieRodzicielskiego');
}

export function wymiarRodzicielskiego(d: DaneRodzicielskiego, stan: StanDzieci, k: Kontekst): WymiarUrlopu {
  const podstawaPrawna = [...d.podstawaPrawna];
  let terminWykorzystania = d.terminWykorzystania;

  if (stan.wszystkieZmarly && stan.koniecPrawaPoZgonie) {
    // Po zgonie dziecka prawo trwa 7 dni od zgonu (KP art. 182¹ᵍ w zw. z art. 180¹ § 2).
    podstawaPrawna.push('KP art. 182¹ᵍ', 'KP art. 180¹ § 2');
    if (porownaj(stan.koniecPrawaPoZgonie, d.koniecPoprzedniegoUrlopu) <= 0) {
      return { rodzaj: 'rodzicielski', przysluguje: false, tygodnie: 0, dni: 0, podstawaPrawna };
    }
    terminWykorzystania = stan.koniecPrawaPoZgonie;
  } else if (stan.liczba > 1 && stan.zyjace < stan.liczba) {
    k.ostrzezenia.push({
      kod: 'ZALOZENIE_RODZICIELSKI_PO_ZGONIE_DZIECKA',
      komunikat:
        'Po zgonie jednego z dzieci z porodu mnogiego liczę urlop rodzicielski według liczby dzieci żyjących. Przepisy tego nie rozstrzygają, do potwierdzenia w ZUS.',
      podstawaPrawna: ['KP art. 182¹ᵃ § 1', 'KP art. 180¹'],
    });
  }

  const tygodnie = tygodnieWymiaru(d, k);
  const nieprzenoszalne = k.param('tygodnieNieprzenoszalne');
  if (d.ubezpieczeniRodzice < 2) {
    k.ostrzezenia.push({
      kod: 'ZALOZENIE_NIEPRZENOSZALNE_SAMOTNY_RODZIC',
      komunikat: `${nieprzenoszalne} tygodni urlopu rodzicielskiego jest zarezerwowane dla drugiego rodzica także wtedy, gdy nie może on z nich skorzystać. Przepisy nie przewidują wyjątku, do potwierdzenia w ZUS.`,
      podstawaPrawna: ['KP art. 182¹ᵃ § 4', 'UZ art. 31 ust. 3f'],
    });
  }
  podstawaPrawna.push('KP art. 182¹ᵃ § 3–4', 'KP art. 182¹ᶜ');
  k.kroki.push({
    opis: `Urlop rodzicielski: ${tygodnie} tyg. łącznie dla obojga rodziców, w tym po ${nieprzenoszalne} tyg. wyłącznie dla każdego z nich.`,
    podstawaPrawna,
  });
  return {
    rodzaj: 'rodzicielski',
    przysluguje: true,
    tygodnie,
    dni: tygodnie * 7,
    tygodnieNieprzenoszalne: nieprzenoszalne,
    maksDlaJednegoRodzicaTygodnie: tygodnie - nieprzenoszalne,
    maksCzesci: k.param('maksCzesciRodzicielskiego'),
    ...(terminWykorzystania ? { terminWykorzystania } : {}),
    podstawaPrawna,
  };
}
