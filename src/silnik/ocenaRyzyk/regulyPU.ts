/**
 * R-PU-*: zasiłek chorobowy za okres po ustaniu tytułu ubezpieczenia (tabela B; korekta D9: UZ art. 7 i art. 13).
 * Oceniane dla zwolnień, których część przypada po ustaniu ubezpieczenia: niezdolność trwająca od czasu
 * ubezpieczenia (art. 13) albo powstała po jego ustaniu (art. 7).
 * „W ciągu 14 dni od ustania”: dnia ustania nie wlicza się, więc ostatni dzień = ostatni dzień ubezpieczenia + 14.
 */

import { dodajDni, porownaj } from '../wspolne/daty';
import { analizaZwolnien, type AnalizaZwolnienia, type PoUstaniu, type WykluczeniePoUstaniu } from './chorobowe';
import type { GrupaRegul, KontekstOceny } from './kontekst';
import type { WynikReguly } from './typy';

export const regulyPU: GrupaRegul = (k) => analizaZwolnien(k).flatMap((a) => (a.poUstaniu ? ocenPoUstaniu(k, a, a.poUstaniu) : []));

const wykluczenia = (k: KontekstOceny): Record<WykluczeniePoUstaniu, { opis: string; podstawa: string }> => ({
  emerytura_lub_renta: { opis: 'masz ustalone prawo do emerytury lub renty', podstawa: 'UZ art. 13 ust. 1 pkt 1' },
  nowy_tytul: {
    opis: 'kontynuujesz albo podjęłaś pracę lub działalność, która daje tytuł do ubezpieczenia chorobowego',
    podstawa: 'UZ art. 13 ust. 1 pkt 2',
  },
  brak_wyczekiwania: {
    opis: `w czasie ubezpieczenia nie minął okres wyczekiwania (${k.param('okresWyczekiwaniaObowiazkowe')} albo ${k.param('okresWyczekiwaniaDobrowolne')} dni), więc nie nabyłaś prawa do zasiłku`,
    podstawa: 'UZ art. 13 ust. 1 pkt 3',
  },
  zasilek_dla_bezrobotnych: {
    opis: 'masz prawo do zasiłku dla bezrobotnych albo świadczenia przedemerytalnego',
    podstawa: 'UZ art. 13 ust. 1 pkt 4',
  },
  rodzicielskie_swiadczenie_uzupelniajace: {
    opis: 'masz prawo do rodzicielskiego świadczenia uzupełniającego',
    podstawa: 'UZ art. 13 ust. 1 pkt 4',
  },
  krus: { opis: 'podlegasz ubezpieczeniu rolników (KRUS)', podstawa: 'UZ art. 13 ust. 1 pkt 5' },
  wyczerpany_przed_ustaniem: {
    opis: 'ubezpieczenie ustało już po wyczerpaniu okresu zasiłkowego',
    podstawa: 'UZ art. 13 ust. 2',
  },
});

function ocenPoUstaniu(k: KontekstOceny, a: AnalizaZwolnienia, p: PoUstaniu): WynikReguly[] {
  const swiadczenie = 'zasilek_chorobowy_po_ustaniu';
  const art7 = p.trwaZUbezpieczenia ? [] : ['UZ art. 7 pkt 1'];
  const dniNaNiezdolnosc = k.param('dniNaNiezdolnoscPoUstaniu');

  if (p.art7 === 'za_pozno') {
    return [
      {
        regula: 'R-PU-01',
        status: 'nie_przysluguje',
        swiadczenie,
        komunikat: `Ubezpieczenie chorobowe ustało ${p.okres.do}, a niezdolność do pracy powstała ${a.z.od} – później niż w ciągu ${dniNaNiezdolnosc} dni od ustania (ostatni dzień: ${dodajDni(p.okres.do, dniNaNiezdolnosc)}). Zasiłek chorobowy po ustaniu ubezpieczenia nie przysługuje.`,
        podstawaPrawna: ['UZ art. 7 pkt 1'],
        skutek: { od: a.z.od, do: a.z.do },
      },
    ];
  }
  if (p.art7 === 'za_krotko') {
    return [
      {
        regula: 'R-PU-01',
        status: 'nie_przysluguje',
        swiadczenie,
        komunikat: `Niezdolność do pracy powstała po ustaniu ubezpieczenia (${p.okres.do}) i trwa bez przerwy krócej niż ${k.param('minimalnaNiezdolnoscPoUstaniu')} dni (do ${p.koniecNiezdolnosci}). Zasiłek po ustaniu ubezpieczenia przysługuje tylko przy niezdolności trwającej co najmniej ${k.param('minimalnaNiezdolnoscPoUstaniu')} dni.`,
        podstawaPrawna: ['UZ art. 7'],
        skutek: { od: a.z.od, do: a.z.do },
      },
    ];
  }
  if (p.wykluczenia.length > 0) {
    const opisy = wykluczenia(k);
    return [
      {
        regula: 'R-PU-02',
        status: 'nie_przysluguje',
        swiadczenie,
        komunikat: `Za okres po ustaniu ubezpieczenia (od ${p.od}) zasiłek chorobowy nie przysługuje, bo ${p.wykluczenia.map((x) => opisy[x].opis).join('; ')}.`,
        podstawaPrawna: [...new Set(p.wykluczenia.map((x) => opisy[x].podstawa))],
        skutek: { od: p.od, do: a.z.do },
      },
    ];
  }

  const wyplata = a.zakresy.filter((x) => x.rodzaj === 'zasilek' && porownaj(x.od, p.od) >= 0);
  const limit = a.zakresy.find((x) => x.rodzaj === 'limit_po_ustaniu');
  const maksDni = a.ciaza ? a.limitOkresuZasilkowego : k.param('okresZasilkowyPoUstaniuDni');
  const ostatniDzien = wyplata.at(-1)?.do;
  const wyniki: WynikReguly[] = [
    {
      regula: 'R-PU-01',
      status: 'przysluguje',
      swiadczenie,
      komunikat: [
        p.trwaZUbezpieczenia
          ? `Zachorowałaś w czasie ubezpieczenia, więc zasiłek chorobowy przysługuje także po jego ustaniu (od ${p.od}).`
          : `Zachorowałaś w ciągu ${dniNaNiezdolnosc} dni po końcu ubezpieczenia, a niezdolność trwa co najmniej ${k.param('minimalnaNiezdolnoscPoUstaniu')} dni – przysługuje Ci zasiłek chorobowy (od ${p.od}).`,
        a.ciaza
          ? `W ciąży nie ma limitu ${k.param('okresZasilkowyPoUstaniuDni')} dni – zasiłek przysługuje do wyczerpania okresu zasiłkowego (${maksDni} dni łącznie).`
          : `Poza ciążą zasiłek za okres po ustaniu ubezpieczenia przysługuje najwyżej ${maksDni} dni.`,
        limit ? `Limit wyczerpie się ${dodajDni(limit.od, -1)}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
      podstawaPrawna: [...art7, 'UZ art. 8 ust. 2', 'UZ art. 13'],
      skutek: { od: p.od, ...(ostatniDzien ? { do: ostatniDzien } : {}), maksDni },
    },
  ];
  if (p.wykluczeniaNieznane) {
    wyniki.push({
      regula: 'R-PU-02',
      status: 'nieznane',
      swiadczenie,
      komunikat:
        'Zasiłek po ustaniu ubezpieczenia nie przysługuje, jeśli masz prawo do emerytury lub renty, podjęłaś nową pracę lub działalność, masz prawo do zasiłku dla bezrobotnych, przedemerytalnego lub rodzicielskiego świadczenia uzupełniającego albo podlegasz KRUS. Powiedz, czy któraś z tych sytuacji Cię dotyczy.',
      podstawaPrawna: ['UZ art. 13 ust. 1'],
      brakujaceDane: ['swiadczeniaWykluczajace'],
    });
  }
  wyniki.push({
    regula: 'R-PU-03',
    status: 'informacja',
    swiadczenie,
    komunikat:
      'Po końcu ubezpieczenia podstawa wymiaru zasiłku nie może przekroczyć przeciętnego wynagrodzenia, więc zasiłek może być niższy niż w czasie ubezpieczenia.',
    podstawaPrawna: ['UZ art. 46'],
  });
  return wyniki;
}
