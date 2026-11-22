/**
 * Przejęcie części urlopu macierzyńskiego (albo urlopu na warunkach macierzyńskiego) przez ojca
 * albo innego członka najbliższej rodziny w siedmiu sytuacjach z KP art. 180 § 4–17 (art. 183 § 2).
 * Łączny wymiar się nie zmienia (§ 14); zmienia się tylko podział okresu między osoby.
 */

import { dniWlacznie, dodajDni, najwczesniejsza, porownaj } from '../../wspolne/daty';
import type { KluczParametru } from '../../parametry';
import type { ISODate, Okres, RolaRodzica } from '../../typy';
import type { CzescWymiaru, PrzejecieMacierzynskiego, PrzyczynaPrzejecia, WymiarUrlopu } from '../index';
import type { Kontekst } from '../kontekst';

interface RegulaPrzejecia {
  przepisy: string[];
  /** Część, którą matka musi wykorzystać po porodzie, zanim druga osoba przejmie urlop. */
  minimumMatki?: Extract<KluczParametru, 'tygodnieMacierzynskiegoTylkoMatki' | 'tygodnieMacierzynskiegoMinimum'>;
  tylkoOjciec?: boolean;
  /** Część drugiej osoby zaczyna się w dniu zdarzenia, a nie „po dniu” zdarzenia. */
  odDniaZdarzenia?: boolean;
  /** Część drugiej osoby kończy się z końcem pobytu matki w szpitalu albo jej zatrudnienia. */
  doDatyKonca?: boolean;
  /** Matka bez tytułu do ubezpieczenia nie ma własnego urlopu ani zasiłku. */
  matkaBezUrlopu?: boolean;
}

const REGULY: Record<PrzyczynaPrzejecia, RegulaPrzejecia> = {
  rezygnacja: {
    przepisy: ['KP art. 180 § 4–5', 'UZ art. 29 ust. 3'],
    minimumMatki: 'tygodnieMacierzynskiegoTylkoMatki',
    tylkoOjciec: true,
  },
  rezygnacja_z_orzeczeniem: {
    przepisy: ['KP art. 180 § 6–7', 'UZ art. 29 ust. 5'],
    minimumMatki: 'tygodnieMacierzynskiegoMinimum',
  },
  pobyt_matki_w_szpitalu: {
    przepisy: ['KP art. 180 § 10–11', 'UZ art. 29 ust. 6'],
    minimumMatki: 'tygodnieMacierzynskiegoMinimum',
    odDniaZdarzenia: true,
    doDatyKonca: true,
  },
  zgon_matki: { przepisy: ['KP art. 180 § 12', 'UZ art. 29 ust. 7'] },
  porzucenie_dziecka: {
    przepisy: ['KP art. 180 § 13', 'KP art. 182', 'UZ art. 29 ust. 7'],
    minimumMatki: 'tygodnieMacierzynskiegoMinimum',
  },
  matka_nieubezpieczona: { przepisy: ['KP art. 180 § 15', 'UZ art. 29 ust. 9'], matkaBezUrlopu: true },
  zatrudnienie_matki_nieubezpieczonej: {
    przepisy: ['KP art. 180 § 17', 'UZ art. 29 ust. 10'],
    tylkoOjciec: true,
    odDniaZdarzenia: true,
    doDatyKonca: true,
    matkaBezUrlopu: true,
  },
};

const czesc = (rodzic: RolaRodzica, od: ISODate, do_: ISODate): CzescWymiaru => ({ rodzic, od, do: do_, dni: dniWlacznie(od, do_) });

/** Dzieli okres urlopu `wymiar.okres` między matkę i osobę przejmującą; dopisuje podział i przepisy do `wymiar`. */
export function zastosujPrzejecie(
  wymiar: WymiarUrlopu,
  przejecie: PrzejecieMacierzynskiego,
  dataZdarzenia: ISODate,
  k: Kontekst,
): void {
  const okres: Okres | undefined = wymiar.okres;
  if (!okres || !wymiar.przysluguje) return;
  const r = REGULY[przejecie.przyczyna];

  if (r.tylkoOjciec && przejecie.przez !== 'ojciec') {
    k.ostrzezenia.push({
      kod: 'PRZEJECIE_NIEDOZWOLONE',
      komunikat: 'W tej sytuacji część urlopu macierzyńskiego może przejąć tylko ojciec dziecka, nie inny członek rodziny.',
      podstawaPrawna: r.przepisy,
    });
    return;
  }

  let od = r.odDniaZdarzenia ? przejecie.data : dodajDni(przejecie.data, 1);
  if (r.minimumMatki) {
    const tygodnie = k.param(r.minimumMatki);
    const najwczesniej = dodajDni(dataZdarzenia, tygodnie * 7);
    if (porownaj(od, najwczesniej) < 0) {
      k.ostrzezenia.push({
        kod: 'PRZEJECIE_ZA_WCZESNIE',
        komunikat: `Matka musi najpierw wykorzystać ${tygodnie} tygodni urlopu po porodzie. Druga osoba może przejąć urlop najwcześniej od ${najwczesniej}.`,
        podstawaPrawna: r.przepisy,
        termin: najwczesniej,
      });
      od = najwczesniej;
    }
  }

  let do_ = okres.do;
  if (r.doDatyKonca) {
    if (przejecie.dataKonca) do_ = najwczesniejsza(przejecie.dataKonca, okres.do);
    else
      k.ostrzezenia.push({
        kod: 'PRZEJECIE_BRAK_DATY_KONCA',
        komunikat: 'Nie podano, kiedy kończy się pobyt matki w szpitalu albo jej zatrudnienie. Przyjmuję, że trwa do końca urlopu.',
        podstawaPrawna: r.przepisy,
      });
  }

  if (porownaj(od, do_) > 0) {
    k.ostrzezenia.push({
      kod: 'PRZEJECIE_BRAK_CZESCI',
      komunikat: 'Urlop macierzyński zostanie wyczerpany, zanim druga osoba mogłaby go przejąć. Nie ma części do przejęcia.',
      podstawaPrawna: r.przepisy,
    });
    return;
  }

  const podzial: CzescWymiaru[] = [];
  if (!r.matkaBezUrlopu && porownaj(okres.od, od) < 0) podzial.push(czesc('matka', okres.od, dodajDni(od, -1)));
  podzial.push(czesc(przejecie.przez, od, do_));
  if (!r.matkaBezUrlopu && r.doDatyKonca && porownaj(do_, okres.do) < 0) podzial.push(czesc('matka', dodajDni(do_, 1), okres.do));

  wymiar.podzial = podzial;
  wymiar.podstawaPrawna.push(...r.przepisy);
  k.kroki.push({
    opis: `Część urlopu od ${od} do ${do_} przejmuje ${przejecie.przez === 'ojciec' ? 'ojciec dziecka' : 'inny członek najbliższej rodziny'}.`,
    podstawaPrawna: r.przepisy,
  });
}
