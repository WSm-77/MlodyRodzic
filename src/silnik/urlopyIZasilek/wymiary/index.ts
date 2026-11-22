/**
 * Wymiary urlopów związanych z rodzicielstwem (#17). Wynik jest punktem wyjścia dla okresów,
 * stawek i kwot zasiłku (#18): okresy macierzyńskiego / na warunkach macierzyńskiego wynikają z `okres`
 * i `podzial`, uzupełniający ma `okres` bezpośrednio po nich, rodzicielski i ojcowski — wymiar,
 * części i termin wykorzystania (ich okresy zależą od planu rodziny).
 */

import { dodajDni, dodajLata, dodajMiesiace, koniecRoku } from '../../wspolne/daty';
import type { RodzajUrlopu } from '../../typy';
import type { WejscieUrlopow, WymiarUrlopu, Zdarzenie } from '../index';
import type { Kontekst } from '../kontekst';
import { stanDzieci, type StanDzieci } from './dzieci';
import { wymiarMacierzynskiego } from './macierzynski';
import { wymiarOjcowskiego } from './ojcowski';
import { zastosujPrzejecie } from './przejecie';
import { wymiaryPrzyjecia } from './przyjecie';
import { wymiarRodzicielskiego } from './rodzicielski';
import { wymiarUzupelniajacego } from './uzupelniajacy';

export type Wymiary = Partial<Record<RodzajUrlopu, WymiarUrlopu>>;

export function policzWymiary(wejscie: WejscieUrlopow, k: Kontekst): Wymiary {
  const z = wejscie.zdarzenie;
  const stan = stanDzieci(wejscie.dzieci, k);
  if (wejscie.dzieci.length === 0) {
    k.ostrzezenia.push({
      kod: 'BRAK_DANYCH_DZIECI',
      komunikat:
        'Nie podano dzieci urodzonych albo przyjętych na wychowanie, więc wymiar urlopów może być niepełny (przy porodzie liczę jak dla jednego dziecka). Podaj dzieci, żeby uwzględnić poród mnogi, zgon dziecka, „Za życiem”, wiek przyjętego dziecka i uzupełniający urlop macierzyński.',
      podstawaPrawna: ['KP art. 180 § 1', 'KP art. 182¹ᵃ § 1'],
    });
  }
  const ubezpieczeni = wejscie.rodzice.filter((r) => r.ubezpieczony).length;
  if (z.rodzaj === 'urodzenie') return wymiaryUrodzenia(wejscie, z, stan, ubezpieczeni, k);
  return wymiaryPrzyjecia(wejscie, z, stan, ubezpieczeni, k);
}

function wymiaryUrodzenia(
  wejscie: WejscieUrlopow,
  z: Extract<Zdarzenie, { rodzaj: 'urodzenie' }>,
  stan: StanDzieci,
  ubezpieczeniRodzice: number,
  k: Kontekst,
): Wymiary {
  const macierzynski = wymiarMacierzynskiego(z, stan, k);
  if (wejscie.przejecie) zastosujPrzejecie(macierzynski, wejscie.przejecie, z.dataPorodu, k);
  const koniec = macierzynski.okres?.do ?? z.dataPorodu;
  const uzupelniajacyMacierzynski = wymiarUzupelniajacego(wejscie.dzieci, stan, koniec, undefined, k);

  const dataUrodzenia = wejscie.dzieci[0]?.dataUrodzenia ?? z.dataPorodu;
  // „Za życiem” liczy się dla dziecka żyjącego.
  const zaZyciem = wejscie.dzieci.some((d) => d.zaswiadczenieZaZyciem && !d.martweUrodzenie && !d.dataZgonu);
  const mnogi = stan.liczba > 1;
  const rodzicielski = wymiarRodzicielskiego(
    {
      liczbaDzieci: stan.zyjace,
      zaZyciem,
      przypadekMinimum: false,
      terminWykorzystania: koniecRoku(dodajLata(dataUrodzenia, k.param('rokZyciaKoniecRodzicielskiego'))),
      koniecPoprzedniegoUrlopu: uzupelniajacyMacierzynski.okres?.do ?? koniec,
      podstawaPrawna: [`KP art. 182¹ᵃ § ${zaZyciem ? 2 : 1} pkt ${mnogi ? 2 : 1}`],
      ubezpieczeniRodzice,
    },
    stan,
    k,
  );
  const terminOjcowskiego = dodajDni(dodajMiesiace(dataUrodzenia, k.param('miesiaceNaOjcowski')), -1);
  const ojcowski = wymiarOjcowskiego(terminOjcowskiego, 'KP art. 182³ § 1 pkt 1', stan, k);
  return { macierzynski, uzupelniajacyMacierzynski, rodzicielski, ojcowski };
}
