/**
 * Przyjęcie dziecka na wychowanie (KP art. 183; korekta D4 do #14): urlop na warunkach urlopu macierzyńskiego
 * wg liczby dzieci, skrócony limitem wieku dziecka; gdy limit skraca go poniżej 9 tygodni — 9 tygodni
 * i rodzicielski 38 (62 „Za życiem”). Zawodowa rodzina zastępcza nie ma prawa do urlopu.
 */

import { dodajDni, dodajLata, koniecOkresu, koniecRoku, najpozniejsza, porownaj, roznicaDni } from '../../wspolne/daty';
import type { ISODate } from '../../typy';
import type { Dziecko, WejscieUrlopow, WymiarUrlopu, Zdarzenie } from '../index';
import type { Kontekst } from '../kontekst';
import type { StanDzieci } from './dzieci';
import type { Wymiary } from './index';
import { tygodnieWgLiczbyDzieci, wymiarZOkresu } from './macierzynski';
import { wymiarOjcowskiego } from './ojcowski';
import { zastosujPrzejecie } from './przejecie';
import { wymiarRodzicielskiego } from './rodzicielski';
import { wymiarUzupelniajacego } from './uzupelniajacy';

type ZdarzeniePrzyjecia = Exclude<Zdarzenie, { rodzaj: 'urodzenie' }>;

const brak = (rodzaj: WymiarUrlopu['rodzaj'], podstawaPrawna: string[]): WymiarUrlopu => ({
  rodzaj,
  przysluguje: false,
  tygodnie: 0,
  dni: 0,
  podstawaPrawna,
});

function brakPrawa(przepisy: string[], k: Kontekst, opis: string): Wymiary {
  k.kroki.push({ opis, podstawaPrawna: przepisy });
  return {
    naWarunkachMacierzynskiego: brak('naWarunkachMacierzynskiego', przepisy),
    uzupelniajacyMacierzynski: brak('uzupelniajacyMacierzynski', ['KP art. 183 § 3¹']),
    rodzicielski: brak('rodzicielski', ['KP art. 183 § 4']),
    ojcowski: brak('ojcowski', ['KP art. 182³ § 1']),
  };
}

/** Dzień, w którym dziecko kończy limit wieku (urlop trwa najdłużej do dnia poprzedniego). */
function urodzinyLimitu(d: Dziecko, z: ZdarzeniePrzyjecia, k: Kontekst): ISODate {
  const lata =
    z.rodzaj === 'przysposobienie'
      ? k.param('wiekMaksPrzysposobienie')
      : d.odroczenieObowiazkuSzkolnego
        ? k.param('wiekMaksRodzinaZastepczaOdroczenie')
        : k.param('wiekMaksRodzinaZastepcza');
  return dodajLata(d.dataUrodzenia, lata);
}

export function wymiaryPrzyjecia(
  wejscie: WejscieUrlopow,
  z: ZdarzeniePrzyjecia,
  stan: StanDzieci,
  ubezpieczeniRodzice: number,
  k: Kontekst,
): Wymiary {
  if (z.rodzaj === 'rodzinaZastepczaZawodowa') {
    return brakPrawa(['KP art. 183 § 1', 'UZ art. 29 ust. 1 pkt 3'], k, 'Zawodowa rodzina zastępcza nie ma prawa do urlopu na warunkach urlopu macierzyńskiego.');
  }
  const przysposobienie = z.rodzaj === 'przysposobienie';
  const paragraf = przysposobienie ? 'KP art. 183 § 1¹' : 'KP art. 183 § 1';
  const przepisUZ = przysposobienie ? 'UZ art. 29 ust. 1 pkt 2' : 'UZ art. 29 ust. 1 pkt 3';

  const uprawniajace = wejscie.dzieci
    .map((d) => ({ dziecko: d, limit: urodzinyLimitu(d, z, k) }))
    .filter(({ limit }) => porownaj(z.dataPrzyjecia, limit) < 0);
  if (uprawniajace.length === 0) {
    return brakPrawa([paragraf, przepisUZ], k, 'Dziecko w dniu przyjęcia przekroczyło limit wieku: urlop nie przysługuje.');
  }

  // Limit wieku najmłodszego dziecka wyznacza najpóźniejszy koniec urlopu.
  const limit = najpozniejsza(...uprawniajace.map((u) => u.limit));
  const n = uprawniajace.length;
  const tygodnieTabeli = tygodnieWgLiczbyDzieci(n, k).tygodnie;
  const dniDoLimitu = roznicaDni(z.dataPrzyjecia, limit);
  const minimumDni = k.param('tygodnieNaWarunkachMinimum') * 7;
  let dni = Math.min(tygodnieTabeli * 7, dniDoLimitu);
  const przypadekMinimum = dni < minimumDni;
  const podstawaPrawna = [`${paragraf} pkt ${Math.min(n, 5)}`, przepisUZ];
  if (przypadekMinimum) {
    dni = minimumDni;
    podstawaPrawna.push('KP art. 183 § 3');
  }
  const naWarunkach = wymiarZOkresu('naWarunkachMacierzynskiego', { od: z.dataPrzyjecia, do: koniecOkresu(z.dataPrzyjecia, dni) }, podstawaPrawna);
  k.kroki.push({
    opis: przypadekMinimum
      ? `Limit wieku dziecka skraca urlop poniżej ${minimumDni / 7} tygodni: przysługuje ${minimumDni / 7} tygodni.`
      : `Urlop na warunkach urlopu macierzyńskiego: ${dni} dni od dnia przyjęcia dziecka.`,
    podstawaPrawna,
  });
  if (wejscie.przejecie) zastosujPrzejecie(naWarunkach, wejscie.przejecie, z.dataPrzyjecia, k);

  const dzieci = uprawniajace.map((u) => u.dziecko);
  const uzupelniajacy = wymiarUzupelniajacego(dzieci, stan, naWarunkach.okres?.do ?? z.dataPrzyjecia, z.dataPrzyjecia, k);
  uzupelniajacy.podstawaPrawna.push('KP art. 183 § 3¹');

  const zaZyciem = dzieci.some((d) => d.zaswiadczenieZaZyciem);
  const rodzicielski = wymiarRodzicielskiego(
    {
      liczbaDzieci: n,
      zaZyciem,
      przypadekMinimum,
      terminWykorzystania: terminRodzicielskiego(dzieci, z, limit, k),
      koniecPoprzedniegoUrlopu: uzupelniajacy.okres?.do ?? naWarunkach.okres?.do ?? z.dataPrzyjecia,
      podstawaPrawna: [przepisRodzicielskiego(przysposobienie, przypadekMinimum, zaZyciem), 'KP art. 183 § 4⁶', 'KP art. 183 § 5'],
      ubezpieczeniRodzice,
    },
    stan,
    k,
  );

  return {
    naWarunkachMacierzynskiego: naWarunkach,
    uzupelniajacyMacierzynski: uzupelniajacy,
    rodzicielski,
    ojcowski: ojcowskiPrzyjecia(dzieci, z, stan, k),
  };
}

function przepisRodzicielskiego(przysposobienie: boolean, minimum: boolean, zaZyciem: boolean): string {
  if (minimum) return zaZyciem ? 'KP art. 183 § 4⁵' : przysposobienie ? 'KP art. 183 § 4²' : 'KP art. 183 § 4 pkt 3';
  if (zaZyciem) return przysposobienie ? 'KP art. 183 § 4⁴' : 'KP art. 183 § 4³';
  return przysposobienie ? 'KP art. 183 § 4¹' : 'KP art. 183 § 4';
}

/**
 * Termin rodzicielskiego: koniec roku, w którym najmłodsze dziecko kończy 6 lat (KP art. 182¹ᶜ w zw. z art. 183 § 5).
 * Gdy ten rok już minął, przepisy są niejasne (OK-8): przy przysposobieniu przyjmuję limit 14 lat (§ 4¹),
 * przy rodzinie zastępczej nie podaję terminu.
 */
function terminRodzicielskiego(dzieci: Dziecko[], z: ZdarzeniePrzyjecia, limit: ISODate, k: Kontekst): ISODate | undefined {
  const najmlodsze = najpozniejsza(...dzieci.map((d) => d.dataUrodzenia));
  const termin = koniecRoku(dodajLata(najmlodsze, k.param('rokZyciaKoniecRodzicielskiego')));
  if (porownaj(termin, z.dataPrzyjecia) >= 0) return termin;
  k.ostrzezenia.push({
    kod: 'ZALOZENIE_TERMIN_RODZICIELSKIEGO_PRZYJECIE',
    komunikat:
      'Dziecko jest starsze niż wiek, do którego zwykle trzeba wykorzystać urlop rodzicielski. Przepisy nie mówią jasno, do kiedy można z niego skorzystać — potwierdź termin w ZUS albo u pracodawcy.',
    podstawaPrawna: ['KP art. 182¹ᶜ', 'KP art. 183 § 5'],
  });
  return z.rodzaj === 'przysposobienie' ? dodajDni(limit, -1) : undefined;
}

function ojcowskiPrzyjecia(dzieci: Dziecko[], z: ZdarzeniePrzyjecia, stan: StanDzieci, k: Kontekst): WymiarUrlopu {
  if (z.rodzaj !== 'przysposobienie') return brak('ojcowski', ['KP art. 182³ § 1']);
  const najmlodsze = najpozniejsza(...dzieci.map((d) => d.dataUrodzenia));
  const termin = dodajDni(dodajLata(najmlodsze, k.param('wiekMaksOjcowskiPrzysposobienie')), -1);
  k.ostrzezenia.push({
    kod: 'TERMIN_OJCOWSKI_PRZYSPOSOBIENIE',
    komunikat: `Urlop ojcowski trzeba wykorzystać w ciągu ${k.param('miesiaceNaOjcowski')} miesięcy od uprawomocnienia się postanowienia o przysposobieniu, najpóźniej do ${termin}.`,
    podstawaPrawna: ['KP art. 182³ § 1 pkt 2'],
    termin,
  });
  return wymiarOjcowskiego(termin, 'KP art. 182³ § 1 pkt 2', stan, k);
}
