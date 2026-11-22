/**
 * Urlop macierzyński przy urodzeniu dziecka: wymiar wg liczby dzieci (KP art. 180 § 1),
 * część przed porodem (§ 2–3).
 */

import { dniWlacznie, dodajDni, koniecOkresu, najpozniejsza, najwczesniejsza } from '../../wspolne/daty';
import type { ISODate, Okres, RodzajUrlopu } from '../../typy';
import type { StanDzieci } from './dzieci';
import type { Kontekst } from '../kontekst';
import type { WymiarUrlopu } from '../index';

const PUNKTY_ART_180 = ['pkt 1', 'pkt 2', 'pkt 3', 'pkt 4', 'pkt 5'];

/** Tygodnie urlopu macierzyńskiego dla `n` dzieci urodzonych przy jednym porodzie (KP art. 180 § 1). */
export function tygodnieWgLiczbyDzieci(n: number, k: Kontekst): { tygodnie: number; przepis: string } {
  const tabela = k.param('tygodnieMacierzynskiego');
  const indeks = Math.min(Math.max(n, 1), tabela.length) - 1;
  return { tygodnie: tabela[indeks] ?? 0, przepis: `KP art. 180 § 1 ${PUNKTY_ART_180[indeks] ?? ''}`.trim() };
}

/** Pierwszy dzień urlopu: dzień porodu albo wcześniej o tygodnie wykorzystane przed porodem (KP art. 180 § 2, art. 183¹ § 2). */
function poczatekUrlopu(dataPorodu: ISODate, tygodniePrzed: number, k: Kontekst): ISODate {
  const maks = k.param('tygodniePrzedPorodemMaks');
  if (tygodniePrzed > maks) {
    k.ostrzezenia.push({
      kod: 'ZA_DUZO_TYGODNI_PRZED_PORODEM',
      komunikat: `Przed przewidywaną datą porodu można wykorzystać najwyżej ${maks} tygodni urlopu macierzyńskiego. Liczę ${maks} tygodni.`,
      podstawaPrawna: ['KP art. 180 § 2'],
    });
  }
  return dodajDni(dataPorodu, -7 * Math.min(Math.max(tygodniePrzed, 0), maks));
}

/** Wymiar urlopu o znanym okresie: dni i pełne tygodnie z dat. */
export function wymiarZOkresu(rodzaj: RodzajUrlopu, okres: Okres, podstawaPrawna: string[]): WymiarUrlopu {
  const dni = dniWlacznie(okres.od, okres.do);
  return { rodzaj, przysluguje: true, tygodnie: Math.floor(dni / 7), dni, okres, podstawaPrawna };
}

/**
 * Koniec urlopu po zgonie dziecka albo martwym urodzeniu (KP art. 180¹; korekta D4 do #14).
 * Zwraca `undefined`, gdy wszystkie dzieci żyją.
 */
function koniecPoZgonie(
  start: ISODate,
  dataPorodu: ISODate,
  koniecPierwotny: ISODate,
  stan: StanDzieci,
  k: Kontekst,
): { koniec: ISODate; przepis: string } | undefined {
  if (stan.koniecPrawaPoZgonie === undefined) return undefined;
  const przepis = stan.zgonPrzedUplywem8Tygodni ? 'KP art. 180¹ § 1' : 'KP art. 180¹ § 2';
  if (stan.wszystkieZmarly) {
    const koniec = stan.zgonPrzedUplywem8Tygodni
      ? najpozniejsza(koniecOkresu(dataPorodu, k.param('tygodnieMartweUrodzenie') * 7), stan.koniecPrawaPoZgonie)
      : najwczesniejsza(koniecPierwotny, stan.koniecPrawaPoZgonie);
    return { koniec, przepis };
  }
  // Poród mnogi: wymiar wg dzieci pozostałych przy życiu, nie krócej niż 7 dni od zgonu.
  const zyjacych = koniecOkresu(start, tygodnieWgLiczbyDzieci(stan.zyjace, k).tygodnie * 7);
  return { koniec: najwczesniejsza(koniecPierwotny, najpozniejsza(zyjacych, stan.koniecPrawaPoZgonie)), przepis };
}

export function wymiarMacierzynskiego(
  zdarzenie: { dataPorodu: ISODate; tygodniePrzedPorodem?: number },
  stan: StanDzieci,
  k: Kontekst,
): WymiarUrlopu {
  const { tygodnie, przepis } = tygodnieWgLiczbyDzieci(stan.liczba, k);
  const od = poczatekUrlopu(zdarzenie.dataPorodu, zdarzenie.tygodniePrzedPorodem ?? 0, k);
  const koniecPierwotny = koniecOkresu(od, tygodnie * 7);
  const podstawaPrawna = [przepis];
  if (od !== zdarzenie.dataPorodu) podstawaPrawna.push('KP art. 180 § 2–3');
  const poZgonie = koniecPoZgonie(od, zdarzenie.dataPorodu, koniecPierwotny, stan, k);
  if (poZgonie) podstawaPrawna.push(poZgonie.przepis);
  return wymiarZOkresu('macierzynski', { od, do: poZgonie?.koniec ?? koniecPierwotny }, podstawaPrawna);
}
