/**
 * Okresy zasiłku macierzyńskiego obojga rodziców, stawki i kwoty (#18; reguly-wymiaru-zasilku-macierzynskiego.md
 * §6.4, §8–§10, diagram 6 specu z korektą D6). Kolejność: okresy (plan albo maksimum) → wariant stawek →
 * utrata 81,5% → stawki → kwoty z podwyższeniem → wyrównanie na wniosek → suma i porównanie wariantów.
 */

import { dodajDni, dodajMiesiace, najpozniejsza, porownaj } from '../../wspolne/daty';
import { kwotaDzienna, kwotaTekst, procentTekst } from '../../wspolne/kwoty';
import type { Grosze, ISODate } from '../../typy';
import type { OkresZasilku, WariantStawek, WejscieUrlopow, Wyrownanie } from '../index';
import { nowyKontekst, type Kontekst } from '../kontekst';
import { stanDzieci } from '../wymiary/dzieci';
import type { Wymiary } from '../wymiary';
import { policzKwoty, sumaKwot } from './kwoty';
import { rozplanuj, type OkresBazowy } from './plan';
import { nadajStawki } from './stawki';
import { ustalWariant } from './wariant';

export interface WynikOkresow {
  okresy: OkresZasilku[];
  wariant: WariantStawek;
  wyrownanie?: Wyrownanie;
  suma: Grosze | null;
  porownanieWariantow?: { wariant100_70: Grosze | null; wariant815: Grosze | null };
}

const dataZdarzenia = (w: WejscieUrlopow): ISODate => (w.zdarzenie.rodzaj === 'urodzenie' ? w.zdarzenie.dataPorodu : w.zdarzenie.dataPrzyjecia);

/** Ostatni dzień pierwszego roku życia (najmłodszego) dziecka. */
function koniecPierwszegoRoku(w: WejscieUrlopow, k: Kontekst): ISODate {
  const urodzenie = w.dzieci.length ? najpozniejsza(...w.dzieci.map((d) => d.dataUrodzenia)) : dataZdarzenia(w);
  return dodajDni(dodajMiesiace(urodzenie, k.param('miesiaceNaRozpoczecieRodzicielskiego815')), -1);
}

/** UZ art. 31 ust. 3g: przy wniosku 81,5% brak choćby jednego dnia rodzicielskiego w pierwszym roku życia dziecka. */
function czyUtrata815(w: WejscieUrlopow, wymiary: Wymiary, okresy: OkresBazowy[], k: Kontekst): boolean {
  if (!wymiary.rodzicielski?.przysluguje) return false;
  const koniec = koniecPierwszegoRoku(w, k);
  const przepisy = ['UZ art. 31 ust. 3g', 'UZ art. 31 ust. 4'];
  if (porownaj(koniec, dataZdarzenia(w)) < 0) {
    k.ostrzezenia.push({
      kod: 'ZALOZENIE_815_DZIECKO_STARSZE',
      komunikat: `Dziecko w dniu przyjęcia skończyło już rok, więc warunku wykorzystania rodzicielskiego w pierwszym roku życia nie da się spełnić. Przyjmuję, że stawka ${procentTekst(k.param('stawkaJednolita'))} nie przepada. Do potwierdzenia w ZUS.`,
      podstawaPrawna: przepisy,
    });
    return false;
  }
  const utrata = !okresy.some((o) => o.rodzaj === 'rodzicielski' && porownaj(o.od, koniec) <= 0);
  k.ostrzezenia.push(
    utrata
      ? {
          kod: 'UTRATA_815',
          komunikat: `Urlop rodzicielski nie zaczyna się w pierwszym roku życia dziecka (do ${koniec}): zasiłek za rodzicielski wyniesie ${procentTekst(k.param('stawkaRodzicielski'))}, a za macierzyński można dostać jednorazowe wyrównanie do ${procentTekst(k.param('stawkaMacierzynski'))} — tylko na wniosek.`,
          podstawaPrawna: przepisy,
          termin: koniec,
        }
      : {
          kod: 'TERMIN_RODZICIELSKIEGO_815',
          komunikat: `Przy zasiłku ${procentTekst(k.param('stawkaJednolita'))} trzeba wykorzystać co najmniej jeden dzień urlopu rodzicielskiego do ${koniec}. Inaczej zasiłek za rodzicielski spadnie do ${procentTekst(k.param('stawkaRodzicielski'))}.`,
          podstawaPrawna: przepisy,
          termin: koniec,
        },
  );
  return utrata;
}

function wyrownanie(okresy: OkresZasilku[], w: WejscieUrlopow, wnioskodawca: OkresZasilku['rodzic'], k: Kontekst): Wyrownanie {
  const podstawaPrawna = ['UZ art. 31 ust. 4'];
  const podstawa = w.rodzice.find((r) => r.rola === wnioskodawca)?.podstawaWymiaru;
  const dzielnik = k.param('dzielnikDzienny');
  const pelna = k.param('stawkaMacierzynski');
  const macierzynskie = okresy.filter(
    (o) => o.rodzic === wnioskodawca && (o.rodzaj === 'macierzynski' || o.rodzaj === 'naWarunkachMacierzynskiego') && o.stawka < pelna,
  );
  const kwota =
    podstawa === undefined
      ? null
      : macierzynskie.reduce((s, o) => s + o.dni * (kwotaDzienna(podstawa, pelna, dzielnik) - kwotaDzienna(podstawa, o.stawka, dzielnik)), 0);
  k.kroki.push({
    opis: `Jednorazowe wyrównanie macierzyńskiego do ${procentTekst(pelna)} (na wniosek): ${kwota === null ? 'kwota nieznana' : kwotaTekst(kwota)}.`,
    podstawaPrawna,
    ...(kwota !== null ? { kwota } : {}),
  });
  return { rodzic: wnioskodawca, kwota, podstawaPrawna };
}

export function policzOkresy(w: WejscieUrlopow, wymiary: Wymiary, k: Kontekst): WynikOkresow {
  const zdarzenie = dataZdarzenia(w);
  const wszystkieZmarly = stanDzieci(w.dzieci, k).wszystkieZmarly;
  const { okresy: bazowe, wnioskodawca } = rozplanuj(w, wymiary, zdarzenie, k);
  sprawdzTerminUzupelniajacego(wymiary, k);

  const wariant = ustalWariant(w, zdarzenie, wszystkieZmarly, k);
  const utrata815 = wariant === '81_5' && czyUtrata815(w, wymiary, bazowe, k);
  const okresy = policzKwoty(nadajStawki(bazowe, { wariant, utrata815, wnioskodawca }, k), w.rodzice, k);
  const suma = sumaKwot(okresy);
  const wynik: WynikOkresow = { okresy, wariant, suma };
  if (utrata815 && wnioskodawca) wynik.wyrownanie = wyrownanie(okresy, w, wnioskodawca, k);

  if (!wszystkieZmarly) {
    // Drugi wariant dla tego samego planu, bez ostrzeżeń i kroków (user story 34).
    const inny: WariantStawek = wariant === '81_5' ? '100_70' : '81_5';
    const kk = nowyKontekst(k.parametry);
    const utrataInnego = inny === '81_5' && czyUtrata815(w, wymiary, bazowe, kk);
    const sumaInnego = sumaKwot(policzKwoty(nadajStawki(bazowe, { wariant: inny, utrata815: utrataInnego, wnioskodawca }, kk), w.rodzice, kk));
    wynik.porownanieWariantow = wariant === '81_5' ? { wariant100_70: sumaInnego, wariant815: suma } : { wariant100_70: suma, wariant815: sumaInnego };
  }
  return wynik;
}

/** Wniosek o uzupełniający urlop najpóźniej 21 dni przed końcem urlopu macierzyńskiego (KP art. 180² § 4). */
function sprawdzTerminUzupelniajacego(wymiary: Wymiary, k: Kontekst): void {
  const u = wymiary.uzupelniajacyMacierzynski;
  const koniec = (wymiary.macierzynski ?? wymiary.naWarunkachMacierzynskiego)?.okres?.do;
  if (!u?.przysluguje || !koniec) return;
  const dniPrzed = k.param('dniWnioskuUzupelniajacegoPrzedKoncem');
  const termin = dodajDni(koniec, -dniPrzed);
  k.ostrzezenia.push({
    kod: 'TERMIN_WNIOSKU_UZUPELNIAJACEGO',
    komunikat: `Wniosek o uzupełniający urlop macierzyński (z zaświadczeniem ze szpitala) trzeba złożyć najpóźniej ${termin}, czyli ${dniPrzed} dni przed końcem urlopu macierzyńskiego.`,
    podstawaPrawna: ['KP art. 180² § 4–5'],
    termin,
  });
}
