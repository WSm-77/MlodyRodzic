/**
 * Uzupełniający urlop macierzyński (KP art. 180²; korekta D5 do #14): kategoria A/B/C wg tygodnia ciąży
 * i najniższej masy urodzeniowej, liczba różnych dni pobytu w szpitalu w oknie kategorii dla dziecka
 * najdłużej hospitalizowanego, niepełny tydzień w górę, nie więcej niż maksimum kategorii.
 */

import { dodajDni, koniecOkresu, najwczesniejsza, porownaj } from '../../wspolne/daty';
import type { ISODate } from '../../typy';
import type { Dziecko, KategoriaUzupelniajacego, WymiarUrlopu } from '../index';
import type { Kontekst } from '../kontekst';
import type { StanDzieci } from './dzieci';

const PRZEPIS = 'KP art. 180² § 1';
const PUNKT: Record<KategoriaUzupelniajacego, string> = { A: 'pkt 1', B: 'pkt 2', C: 'pkt 3' };

/** Dni pobytu dziecka w szpitalu (różne dni kalendarzowe), od `poczatek` włącznie. */
function dniPobytu(dziecko: Dziecko, poczatek: ISODate | undefined): Set<ISODate> {
  const dni = new Set<ISODate>();
  for (const h of dziecko.hospitalizacje ?? []) {
    for (let d = h.od; porownaj(d, h.do) <= 0; d = dodajDni(d, 1)) {
      if (poczatek === undefined || porownaj(d, poczatek) >= 0) dni.add(d);
    }
  }
  return dni;
}

/** Dzień `n` po porodzie (dzień porodu = 1). */
const dzien = (urodzenie: ISODate, n: number): ISODate => dodajDni(urodzenie, n - 1);

function ileWOknie(dni: Set<ISODate>, urodzenie: ISODate, okno: { od: number; do: number }): number {
  const od = dzien(urodzenie, okno.od);
  const do_ = dzien(urodzenie, okno.do);
  return [...dni].filter((d) => porownaj(d, od) >= 0 && porownaj(d, do_) <= 0).length;
}

/** Kategoria C: co najmniej 2 kolejne dni pobytu, pierwszy z nich w dniach 5–28 po porodzie. */
function spelniaWarunekC(dni: Set<ISODate>, urodzenie: ISODate, k: Kontekst): boolean {
  const start = k.param('oknoStartuPobytuC');
  const wymagane = k.param('minimalneKolejneDniPobytuC');
  for (let n = start.od; n <= start.do; n++) {
    let kolejne = 0;
    while (kolejne < wymagane && dni.has(dzien(urodzenie, n + kolejne))) kolejne++;
    if (kolejne >= wymagane) return true;
  }
  return false;
}

function kategoria(tydzien: number | undefined, masa: number | undefined, k: Kontekst): KategoriaUzupelniajacego | undefined {
  if ((tydzien !== undefined && tydzien < k.param('tydzienCiazyKategoriaA')) || (masa !== undefined && masa <= k.param('masaGranicznaKategoriaA')))
    return 'A';
  if (tydzien === undefined) return undefined;
  if (tydzien < k.param('tydzienCiazyKategoriaB')) return masa === undefined ? undefined : 'B';
  return 'C';
}

const nieprzysluguje = (podstawaPrawna: string[]): WymiarUrlopu => ({
  rodzaj: 'uzupelniajacyMacierzynski',
  przysluguje: false,
  tygodnie: 0,
  dni: 0,
  podstawaPrawna,
});

/**
 * @param koniecMacierzynskiego ostatni dzień urlopu macierzyńskiego (uzupełniający zaczyna się następnego dnia)
 * @param poczatekLiczenia przy przyjęciu dziecka liczą się tylko pobyty od dnia przyjęcia (KP art. 183 § 3¹)
 */
export function wymiarUzupelniajacego(
  dzieci: Dziecko[],
  stan: StanDzieci,
  koniecMacierzynskiego: ISODate,
  poczatekLiczenia: ISODate | undefined,
  k: Kontekst,
): WymiarUrlopu {
  const urodzone = dzieci.filter((d) => !d.martweUrodzenie);
  const pobyty = urodzone.map((d) => ({ dziecko: d, dni: dniPobytu(d, poczatekLiczenia) }));
  if (pobyty.every((p) => p.dni.size === 0)) return nieprzysluguje([PRZEPIS]);

  const tygodnieCiazy = urodzone.map((d) => d.ukonczoneTygodnieCiazy).filter((t): t is number => t !== undefined);
  const masy = urodzone.map((d) => d.masaUrodzeniowaG).filter((m): m is number => m !== undefined);
  const tydzien = tygodnieCiazy.length ? Math.min(...tygodnieCiazy) : undefined;
  const masa = masy.length ? Math.min(...masy) : undefined;
  const kat = kategoria(tydzien, masa, k);
  if (kat === undefined) {
    k.ostrzezenia.push({
      kod: 'BRAK_DANYCH_UZUPELNIAJACY',
      komunikat:
        'Dziecko było w szpitalu, ale brakuje tygodnia ciąży albo masy urodzeniowej. Uzupełnij dane z karty urodzenia, żeby policzyć uzupełniający urlop macierzyński.',
      podstawaPrawna: [PRZEPIS],
    });
    return nieprzysluguje([PRZEPIS]);
  }
  const przepis = `${PRZEPIS} ${PUNKT[kat]}`;
  if (kat === 'C' || tydzien === k.param('tydzienCiazyKategoriaA') || tydzien === k.param('tydzienCiazyKategoriaB') || masa === k.param('masaGranicznaKategoriaA')) {
    k.ostrzezenia.push({
      kod: 'ZALOZENIE_PROGI_UZUPELNIAJACEGO',
      komunikat:
        'Progi uzupełniającego urlopu macierzyńskiego liczę według Kodeksu pracy, a nie Poradnika ZUS (dokładnie 28. tydzień przy masie powyżej 1000 g to kategoria B, dokładnie 37. tydzień to kategoria C). Do potwierdzenia w ZUS.',
      podstawaPrawna: [przepis],
    });
  }

  const okno = k.param(kat === 'A' ? 'oknoUzupelniajacyA' : kat === 'B' ? 'oknoUzupelniajacyB' : 'oknoUzupelniajacyC');
  const maks = k.param(kat === 'A' ? 'tygodnieUzupelniajacyA' : kat === 'B' ? 'tygodnieUzupelniajacyB' : 'tygodnieUzupelniajacyC');
  const kwalifikujace = kat === 'C' ? pobyty.filter((p) => spelniaWarunekC(p.dni, p.dziecko.dataUrodzenia, k)) : pobyty;
  const dniWOknie = Math.max(0, ...kwalifikujace.map((p) => ileWOknie(p.dni, p.dziecko.dataUrodzenia, okno)));
  const tygodnie = Math.min(Math.ceil(dniWOknie / 7), maks);
  const podstawaPrawna = [przepis, 'KP art. 180² § 2–3'];
  if (tygodnie === 0) return { ...nieprzysluguje(podstawaPrawna), kategoria: kat };

  const od = dodajDni(koniecMacierzynskiego, 1);
  let do_ = koniecOkresu(od, tygodnie * 7);
  if (stan.wszystkieZmarly && stan.koniecPrawaPoZgonie) {
    // Po zgonie dziecka prawo trwa 7 dni od zgonu (KP art. 180² § 7 w zw. z art. 180¹ § 2).
    podstawaPrawna.push('KP art. 180² § 7', 'KP art. 180¹ § 2');
    if (porownaj(stan.koniecPrawaPoZgonie, od) < 0) return { ...nieprzysluguje(podstawaPrawna), kategoria: kat };
    do_ = najwczesniejsza(do_, stan.koniecPrawaPoZgonie);
  }
  k.kroki.push({
    opis: `Uzupełniający urlop macierzyński, kategoria ${kat}: ${dniWOknie} dni w szpitalu w oknie, ${tygodnie} tyg.`,
    podstawaPrawna,
  });
  return { rodzaj: 'uzupelniajacyMacierzynski', przysluguje: true, tygodnie, dni: tygodnie * 7, okres: { od, do: do_ }, kategoria: kat, podstawaPrawna };
}
