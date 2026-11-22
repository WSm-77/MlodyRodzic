/**
 * R-RE-01: świadczenie rehabilitacyjne po wyczerpaniu okresu zasiłkowego (tabela C; UZ art. 18–19, art. 22).
 * Oceniane, gdy zwolnienie trwa dłużej niż okres zasiłkowy (nadal niezdolna do pracy).
 */

import { dodajDni } from '../wspolne/daty';
import { procentTekst } from '../wspolne/kwoty';
import { analizaZwolnien } from './chorobowe';
import type { GrupaRegul } from './kontekst';

export const regulyRE: GrupaRegul = (k) => {
  const a = analizaZwolnien(k).find((x) => x.zakresy.some((z) => z.rodzaj === 'wyczerpany'));
  const wyczerpany = a?.zakresy.find((z) => z.rodzaj === 'wyczerpany');
  if (!a || !wyczerpany) return [];

  const w = k.wejscie;
  const regula = 'R-RE-01';
  const swiadczenie = 'swiadczenie_rehabilitacyjne';
  const s = w.swiadczeniaWykluczajace;
  const wykluczenia = [
    s?.emeryturaLubRenta && 'masz prawo do emerytury lub renty',
    s?.zasilekDlaBezrobotnychLubPrzedemerytalny && 'masz prawo do zasiłku dla bezrobotnych albo świadczenia przedemerytalnego',
    s?.rodzicielskieSwiadczenieUzupelniajace && 'masz prawo do rodzicielskiego świadczenia uzupełniającego',
  ].filter((x): x is string => typeof x === 'string');
  if (wykluczenia.length > 0) {
    return [
      {
        regula,
        status: 'nie_przysluguje',
        swiadczenie,
        komunikat: `Świadczenie rehabilitacyjne nie przysługuje, bo ${wykluczenia.join('; ')}.`,
        podstawaPrawna: ['UZ art. 18 ust. 7'],
      },
    ];
  }

  const maksDni = k.param('swiadczenieRehabilitacyjneMaksMiesiace') * k.param('dniMiesiacaZasilkowego');
  const podstawaPrawna = ['UZ art. 18 ust. 1', 'UZ art. 18 ust. 2', 'UZ art. 18 ust. 3', 'UZ art. 19 ust. 1'];
  if (w.rokowanieOdzyskaniaZdolnosci === undefined) {
    return [
      {
        regula,
        status: 'nieznane',
        swiadczenie,
        komunikat: `Okres zasiłkowy wyczerpie się ${dodajDni(wyczerpany.od, -1)}. Jeśli nadal nie będziesz zdolna do pracy, możesz wystąpić o świadczenie rehabilitacyjne (do ${k.param('swiadczenieRehabilitacyjneMaksMiesiace')} miesięcy). O tym, czy leczenie rokuje odzyskanie zdolności do pracy, orzeka lekarz orzecznik ZUS. Od orzeczenia przysługuje sprzeciw do komisji lekarskiej ZUS.`,
        podstawaPrawna: [...podstawaPrawna, 'UZ art. 18 ust. 4'],
        brakujaceDane: ['rokowanieOdzyskaniaZdolnosci'],
      },
    ];
  }
  if (!w.rokowanieOdzyskaniaZdolnosci) {
    return [
      {
        regula,
        status: 'nie_przysluguje',
        swiadczenie,
        komunikat:
          'Lekarz orzecznik ZUS uznał, że dalsze leczenie nie rokuje odzyskania zdolności do pracy, więc świadczenie rehabilitacyjne nie przysługuje. Od orzeczenia możesz wnieść sprzeciw do komisji lekarskiej ZUS.',
        podstawaPrawna: [...podstawaPrawna, 'UZ art. 18 ust. 4'],
      },
    ];
  }
  const stawka = k.param(a.ciaza ? 'stawkaRehabilitacyjneCiaza' : 'stawkaRehabilitacyjnePierwsze3Miesiace');
  const wysokosc = a.ciaza
    ? `W ciąży wynosi ${procentTekst(stawka)} podstawy wymiaru.`
    : `Wynosi ${procentTekst(stawka)} podstawy wymiaru przez pierwsze ${k.param('miesiaceStawkiRehabilitacyjnejPierwszej')} mies., a potem ${procentTekst(k.param('stawkaRehabilitacyjneDalej'))}.`;
  return [
    {
      regula,
      status: 'przysluguje',
      swiadczenie,
      komunikat: `Po wyczerpaniu okresu zasiłkowego przysługuje Ci świadczenie rehabilitacyjne od ${wyczerpany.od}, na czas potrzebny do odzyskania zdolności do pracy, najwyżej ${k.param('swiadczenieRehabilitacyjneMaksMiesiace')} miesięcy. ${wysokosc}`,
      podstawaPrawna,
      skutek: { od: wyczerpany.od, stawka, maksDni },
    },
  ];
};
