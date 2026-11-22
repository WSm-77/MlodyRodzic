/**
 * Kwoty okresów (UZ art. 31, art. 36 ust. 3 w zw. z art. 47): kwota dzienna = podstawa / 30 × stawka
 * × (1 − wymiar pracy), zaokrąglona do grosza; kwota okresu = kwota dzienna × dni kalendarzowe.
 * Podwyższenie do kwoty świadczenia rodzicielskiego (ust. 3a, 3c): gdy miesięczny zasiłek liczony
 * wg ust. 1–3 (bez zmniejszenia za pracę z ust. 4a) jest niższy, dopłata różnicy, za część miesiąca proporcjonalnie.
 */

import { kwotaDzienna, kwotaOkresu, kwotaTekst, procentTekst, zaokraglij } from '../../wspolne/kwoty';
import { dniWlacznie, dniWMiesiacu, dodajDni, miesiacDaty, najwczesniejsza, ostatniDzienMiesiaca, porownaj } from '../../wspolne/daty';
import type { Grosze, RolaRodzica } from '../../typy';
import type { OkresZasilku, Rodzic } from '../index';
import type { Kontekst } from '../kontekst';
import type { OkresZeStawka } from './stawki';

const NAZWY: Record<OkresZasilku['rodzaj'], string> = {
  macierzynski: 'Macierzyński',
  naWarunkachMacierzynskiego: 'Na warunkach macierzyńskiego',
  uzupelniajacyMacierzynski: 'Uzupełniający macierzyński',
  rodzicielski: 'Rodzicielski',
  ojcowski: 'Ojcowski',
};

function podwyzszenie(o: OkresZeStawka, podstawa: Grosze, k: Kontekst): Grosze {
  const prog = k.param('kwotaSwiadczeniaRodzicielskiego');
  const miesieczny = zaokraglij(podstawa * o.stawka, 1000);
  if (miesieczny >= prog) return 0;
  const roznica = prog - miesieczny;
  let suma = 0;
  for (let od = o.od; porownaj(od, o.do) <= 0; ) {
    const miesiac = miesiacDaty(od);
    const do_ = najwczesniejsza(ostatniDzienMiesiaca(miesiac), o.do);
    suma += zaokraglij(roznica * dniWlacznie(od, do_), dniWMiesiacu(miesiac));
    od = dodajDni(do_, 1);
  }
  return suma;
}

export function policzKwoty(okresy: OkresZeStawka[], rodzice: Rodzic[], k: Kontekst): OkresZasilku[] {
  const dzielnik = k.param('dzielnikDzienny');
  const bezPodstawy = new Set<RolaRodzica>();
  let podwyzszono = false;

  const wynik = okresy.map((o): OkresZasilku => {
    const podstawa = rodzice.find((r) => r.rola === o.rodzic)?.podstawaWymiaru;
    if (podstawa === undefined) {
      bezPodstawy.add(o.rodzic);
      return { ...o, kwotaDzienna: null, kwota: null };
    }
    const dzienna = kwotaDzienna(podstawa, o.stawka, dzielnik, o.wymiarPracy);
    const kwota = kwotaOkresu(dzienna, o.dni);
    const dodatek = podwyzszenie(o, podstawa, k);
    const praca = o.wymiarPracy ? `, praca ${o.wymiarPracy.licznik}/${o.wymiarPracy.mianownik} etatu` : '';
    k.kroki.push({
      opis: `${NAZWY[o.rodzaj]} (${o.rodzic}) ${o.od} – ${o.do}: ${o.dni} dni × ${kwotaTekst(dzienna)} (stawka ${procentTekst(o.stawka)}${praca}) = ${kwotaTekst(kwota)}${dodatek > 0 ? `, podwyższenie ${kwotaTekst(dodatek)}` : ''}.`,
      podstawaPrawna: o.podstawaPrawna,
      kwota: kwota + dodatek,
    });
    if (dodatek === 0) return { ...o, kwotaDzienna: dzienna, kwota };
    podwyzszono = true;
    return { ...o, kwotaDzienna: dzienna, kwota, podwyzszenie: dodatek, podstawaPrawna: [...o.podstawaPrawna, 'UZ art. 31 ust. 3a', 'UZ art. 31 ust. 3c'] };
  });

  for (const rola of bezPodstawy)
    k.ostrzezenia.push({
      kod: 'BRAK_PODSTAWY_WYMIARU',
      komunikat: `Brak podstawy wymiaru zasiłku (${rola}): okresy są wyznaczone, ale kwot nie da się policzyć.`,
      podstawaPrawna: ['UZ art. 36', 'UZ art. 47'],
    });
  if (podwyzszono)
    k.ostrzezenia.push({
      kod: 'ZALOZENIE_PODWYZSZENIE',
      komunikat:
        'Zasiłek podwyższono do kwoty świadczenia rodzicielskiego. Porównuję kwotę brutto zasiłku (ZUS może porównywać kwotę po zaliczce na podatek), a za część miesiąca dopłacam proporcjonalnie do dni. Do potwierdzenia w ZUS.',
      podstawaPrawna: ['UZ art. 31 ust. 3a', 'UZ art. 31 ust. 3c'],
    });
  return wynik;
}

export const sumaKwot = (okresy: OkresZasilku[]): Grosze | null =>
  okresy.reduce<Grosze | null>((s, o) => (s === null || o.kwota === null ? null : s + o.kwota + (o.podwyzszenie ?? 0)), 0);
