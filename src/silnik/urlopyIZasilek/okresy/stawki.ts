/**
 * Stawki okresów (UZ art. 31; diagram 6 specu, korekta D6 do #14):
 * - macierzyński i na warunkach macierzyńskiego 100%, przy wniosku 81,5%;
 * - rodzicielski 70%, przy wniosku 81,5%; 9 tygodni drugiego rodzica zawsze 70% (ust. 3f);
 * - brak dnia rodzicielskiego w pierwszym roku życia dziecka przy wniosku: rodzicielski 70% (ust. 3g);
 * - uzupełniający i ojcowski zawsze 100% (ust. 1).
 * Założenia OK-6 (ostrzeżenia): 81,5% dla ojca za przekazaną mu część rodzicielskiego i za przejętą część macierzyńskiego.
 */

import { dodajDni } from '../../wspolne/daty';
import { procentTekst } from '../../wspolne/kwoty';
import type { PodstawaPrawna, Promile, RolaRodzica } from '../../typy';
import type { WariantStawek } from '../index';
import type { Kontekst } from '../kontekst';
import { zuzycieDnia, type OkresBazowy } from './plan';

export interface OkresZeStawka extends OkresBazowy {
  stawka: Promile;
  podstawaPrawna: PodstawaPrawna[];
}

export interface DaneStawek {
  wariant: WariantStawek;
  /** Wariant 81,5% przy braku dnia rodzicielskiego w pierwszym roku życia dziecka (UZ art. 31 ust. 3g). */
  utrata815: boolean;
  wnioskodawca: RolaRodzica | undefined;
}

const LACZENIE = ['UZ art. 31 ust. 4a', 'KP art. 182¹ᵉ'];

export function nadajStawki(okresy: OkresBazowy[], d: DaneStawek, k: Kontekst): OkresZeStawka[] {
  const sto = k.param('stawkaMacierzynski');
  const siedemdziesiat = k.param('stawkaRodzicielski');
  const jednolita = k.param('stawkaJednolita');
  const z815 = d.wariant === '81_5';
  /** Wykorzystana część nieprzenoszalna drugiego rodzica, dni puli. */
  const nieprzenoszalne = k.param('tygodnieNieprzenoszalne') * 7;
  const wykorzystaneNieprzenoszalne = new Map<RolaRodzica, number>();
  let przejecie815 = false;
  let przekazana815 = false;

  const wynik: OkresZeStawka[] = [];
  for (const o of okresy) {
    const laczenie = o.wymiarPracy ? LACZENIE : [];
    switch (o.rodzaj) {
      case 'macierzynski':
      case 'naWarunkachMacierzynskiego':
        if (z815 && o.rodzic !== d.wnioskodawca) przejecie815 = true;
        wynik.push({ ...o, stawka: z815 ? jednolita : sto, podstawaPrawna: [z815 ? 'UZ art. 31 ust. 3' : 'UZ art. 31 ust. 1'] });
        break;
      case 'uzupelniajacyMacierzynski':
      case 'ojcowski':
        wynik.push({ ...o, stawka: sto, podstawaPrawna: ['UZ art. 31 ust. 1'] });
        break;
      case 'rodzicielski': {
        if (!z815) {
          wynik.push({ ...o, stawka: siedemdziesiat, podstawaPrawna: ['UZ art. 31 ust. 2', ...laczenie] });
          break;
        }
        if (d.utrata815) {
          wynik.push({ ...o, stawka: siedemdziesiat, podstawaPrawna: ['UZ art. 31 ust. 3g', ...laczenie] });
          break;
        }
        if (o.rodzic === d.wnioskodawca) {
          wynik.push({ ...o, stawka: jednolita, podstawaPrawna: ['UZ art. 31 ust. 3', ...laczenie] });
          break;
        }
        // Drugi rodzic: najpierw jego 9 tygodni po 70% (ust. 3f), dalej część przekazana przez wnioskodawcę (81,5%, OK-6).
        const wykorzystane = wykorzystaneNieprzenoszalne.get(o.rodzic) ?? 0;
        const pozostalo = Math.max(0, nieprzenoszalne - wykorzystane);
        const u = zuzycieDnia(o.wymiarPracy);
        const dniPo70 = Math.min(o.dni, Math.ceil(pozostalo / u - 1e-9));
        wykorzystaneNieprzenoszalne.set(o.rodzic, wykorzystane + Math.min(pozostalo, dniPo70 * u));
        if (dniPo70 > 0) {
          const do70 = dodajDni(o.od, dniPo70 - 1);
          wynik.push({ ...o, do: do70, dni: dniPo70, stawka: siedemdziesiat, podstawaPrawna: ['UZ art. 31 ust. 3f', 'KP art. 182¹ᵃ § 4', ...laczenie] });
        }
        if (dniPo70 < o.dni) {
          przekazana815 = true;
          wynik.push({ ...o, od: dodajDni(o.od, dniPo70), dni: o.dni - dniPo70, stawka: jednolita, podstawaPrawna: ['UZ art. 31 ust. 3', 'UZ art. 30a ust. 3', ...laczenie] });
        }
        break;
      }
    }
  }

  if (przejecie815)
    k.ostrzezenia.push({
      kod: 'ZALOZENIE_815_PRZEJECIE_MACIERZYNSKIEGO',
      komunikat: `Za przejętą część urlopu macierzyńskiego liczę ${procentTekst(k.param('stawkaJednolita'))} podstawy osoby przejmującej, tak jak u matki. Przepisy tego nie rozstrzygają, do potwierdzenia w ZUS.`,
      podstawaPrawna: ['UZ art. 31 ust. 3', 'UZ art. 29a ust. 2'],
    });
  if (przekazana815)
    k.ostrzezenia.push({
      kod: 'ZALOZENIE_815_CZESC_PRZEKAZANA',
      komunikat: `Za część urlopu rodzicielskiego przekazaną przez matkę (poza ${k.param('tygodnieNieprzenoszalne')} tygodniami ojca) liczę ojcu ${procentTekst(k.param('stawkaJednolita'))} jego podstawy. Przepisy tego nie rozstrzygają, do potwierdzenia w ZUS.`,
      podstawaPrawna: ['UZ art. 30a ust. 3', 'UZ art. 31 ust. 3'],
    });
  return wynik;
}
