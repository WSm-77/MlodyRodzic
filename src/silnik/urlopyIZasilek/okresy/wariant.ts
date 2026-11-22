/**
 * Wariant stawek (diagram 6 specu, korekta D6 do #14): wniosek z UZ art. 30a złożony najpóźniej
 * w dniu porodu / przyjęcia + 21 dni (dnia zdarzenia nie wlicza się, KC art. 111 § 2) daje 81,5%.
 * Po martwym urodzeniu albo zgonie wszystkich dzieci wniosek jest bez przedmiotu: 100%.
 */

import { dodajDni, porownaj } from '../../wspolne/daty';
import { procentTekst } from '../../wspolne/kwoty';
import type { ISODate } from '../../typy';
import type { WariantStawek, WejscieUrlopow } from '../index';
import type { Kontekst } from '../kontekst';

const PRZEPISY = ['UZ art. 30a ust. 1 i 2', 'UZ art. 31 ust. 3'];

export function ustalWariant(
  wejscie: WejscieUrlopow,
  dataZdarzenia: ISODate,
  wszystkieDzieciZmarly: boolean,
  k: Kontekst,
): WariantStawek {
  const termin = dodajDni(dataZdarzenia, k.param('dniNaWniosek815'));
  const wniosek = wejscie.wniosek815;
  const macierzynski = procentTekst(k.param('stawkaMacierzynski'));
  const rodzicielski = procentTekst(k.param('stawkaRodzicielski'));
  const jednolita = procentTekst(k.param('stawkaJednolita'));
  const bezWniosku = `${macierzynski} za macierzyński i ${rodzicielski} za rodzicielski`;

  if (wszystkieDzieciZmarly) {
    if (wniosek?.zlozony)
      k.ostrzezenia.push({
        kod: 'WNIOSEK_815_BEZ_PRZEDMIOTU',
        komunikat: `Po martwym urodzeniu albo zgonie dziecka zasiłek macierzyński wynosi ${macierzynski} podstawy. Wniosek o ${jednolita} nie ma zastosowania.`,
        podstawaPrawna: ['UZ art. 31 ust. 1'],
      });
    return '100_70';
  }

  if (!wniosek?.zlozony) {
    const minal = wejscie.dzis !== undefined && porownaj(wejscie.dzis, termin) > 0;
    k.ostrzezenia.push({
      kod: 'TERMIN_WNIOSKU_815',
      komunikat: minal
        ? `Termin na wniosek o zasiłek ${jednolita} za cały okres minął ${termin}. Liczę ${bezWniosku}.`
        : `Zasiłek ${jednolita} za cały okres wymaga pisemnego wniosku najpóźniej ${termin}. Bez wniosku liczę ${bezWniosku}.`,
      podstawaPrawna: PRZEPISY,
      termin,
    });
    k.kroki.push({ opis: `Bez wniosku o ${jednolita}: macierzyński ${macierzynski}, rodzicielski ${rodzicielski}.`, podstawaPrawna: ['UZ art. 31 ust. 1–2'] });
    return '100_70';
  }

  if (wniosek.dataZlozenia === undefined) {
    k.ostrzezenia.push({
      kod: 'BRAK_DATY_WNIOSKU_815',
      komunikat: `Nie podano daty wniosku o ${jednolita}. Przyjmuję, że złożono go w terminie (najpóźniej ${termin}).`,
      podstawaPrawna: PRZEPISY,
      termin,
    });
  } else if (porownaj(wniosek.dataZlozenia, termin) > 0) {
    k.ostrzezenia.push({
      kod: 'WNIOSEK_815_PO_TERMINIE',
      komunikat: `Wniosek o ${jednolita} złożono ${wniosek.dataZlozenia}, po terminie (${termin}). Liczę ${bezWniosku}.`,
      podstawaPrawna: PRZEPISY,
      termin,
    });
    k.kroki.push({ opis: `Wniosek o ${jednolita} po terminie: macierzyński ${macierzynski}, rodzicielski ${rodzicielski}.`, podstawaPrawna: PRZEPISY });
    return '100_70';
  }
  k.kroki.push({ opis: `Wniosek o ${jednolita} w terminie (do ${termin}): macierzyński i rodzicielski ${jednolita}.`, podstawaPrawna: PRZEPISY });
  return '81_5';
}
