/**
 * R-KP-*: ochrona z Kodeksu pracy (tabela H). R-KP-02 jest oceniana pierwsza, bo przedłużenie umowy
 * terminowej do dnia porodu zmienia okresy ubezpieczenia dla kolejnych reguł (korekta D7).
 *
 * „Po upływie trzeciego miesiąca ciąży”: miesiąc liczony kalendarzowo od daty początku ciąży (KC art. 112),
 * czyli trzeci miesiąc upływa w dniu poprzedzającym datę początku + 3 miesiące. Sposób liczenia do potwierdzenia (OK-5).
 */

import type { ISODate } from '../typy';
import { dodajDni, dodajMiesiace, porownaj } from '../wspolne/daty';
import { okresWDniu, pracownica, type GrupaRegul, type KontekstOceny } from './kontekst';
import type { WynikReguly } from './typy';

export const regulyKP: GrupaRegul = (k) => [...umowaTerminowa(k), ...ochronaWCiazy(k)];

function umowaTerminowa(k: KontekstOceny): WynikReguly[] {
  const w = k.wejscie;
  const umowa = w.umowaTerminowa;
  if (!umowa) return [];
  const indeks = ostatniIndeksPracownicy(k);
  if (indeks === undefined) return [];

  const porod = w.dataPorodu ?? w.przewidywanaDataPorodu;
  if (porod && porownaj(umowa.planowanyKoniec, porod) >= 0) return [];

  const podstawaPrawna = ['KP art. 177 § 3', 'KP art. 177 § 3¹'];
  const wynik = (status: WynikReguly['status'], komunikat: string, dodatki: Partial<WynikReguly> = {}): WynikReguly[] => [
    { regula: 'R-KP-02', status, swiadczenie: 'ochrona_stosunku_pracy', komunikat, podstawaPrawna, ...dodatki },
  ];
  const bezPrzedluzenia = (powod: string) =>
    wynik(
      'ryzyko',
      `${powod} Umowa nie przedłuży się do dnia porodu i skończy się ${umowa.planowanyKoniec}. Bez nowego ubezpieczenia chorobowego w dniu porodu zasiłek macierzyński nie przysługuje.`,
      { termin: umowa.planowanyKoniec },
    );

  if (umowa.naZastepstwo) return bezPrzedluzenia('Umowa na zastępstwo nieobecnego pracownika nie przedłuża się do dnia porodu.');
  if (umowa.rodzaj === 'okres_probny') {
    if (umowa.dlugoscMiesiecy === undefined) {
      return wynik('nieznane', 'Podaj długość okresu próbnego – od niej zależy, czy umowa przedłuży się do dnia porodu.', {
        brakujaceDane: ['umowaTerminowa.dlugoscMiesiecy'],
      });
    }
    const maksProbny = k.param('maksOkresProbnyBezPrzedluzenia');
    if (umowa.dlugoscMiesiecy <= maksProbny) {
      return bezPrzedluzenia(`Umowa na okres próbny nieprzekraczający ${maksProbny} mies. nie przedłuża się do dnia porodu.`);
    }
  }
  if (!w.dataPoczatkuCiazy) {
    return wynik('nieznane', 'Podaj datę początku ciąży z zaświadczenia lekarskiego – od niej zależy, czy umowa przedłuży się do dnia porodu.', {
      brakujaceDane: ['dataPoczatkuCiazy'],
    });
  }

  if (porownaj(umowa.planowanyKoniec, w.dataPoczatkuCiazy) < 0) {
    return bezPrzedluzenia(`Umowa kończy się przed początkiem ciąży (${w.dataPoczatkuCiazy}).`);
  }
  const miesiaceOchrony = k.param('miesiaceCiazyOchronyUmowyTerminowej');
  const koniecOchrony = dodajDni(dodajMiesiace(w.dataPoczatkuCiazy, miesiaceOchrony), -1);
  if (porownaj(umowa.planowanyKoniec, koniecOchrony) <= 0) {
    return bezPrzedluzenia(`Umowa kończy się nie później niż z upływem ${miesiaceOchrony}. miesiąca ciąży (${koniecOchrony}).`);
  }

  k.umowaPrzedluzonaDoPorodu = true;
  przedluzOkres(k, indeks, w.dataPorodu);
  return wynik(
    'przysluguje',
    'Twoja umowa przedłuży się automatycznie do dnia porodu, więc w dniu porodu będziesz ubezpieczona. Po porodzie umowa się kończy, ale zasiłek macierzyński dostaniesz w pełnym wymiarze.',
    { podstawaPrawna: ['KP art. 177 § 3', 'UZ art. 30 ust. 4'], ...(w.dataPorodu ? { skutek: { do: w.dataPorodu } } : {}) },
  );
}

function ochronaWCiazy(k: KontekstOceny): WynikReguly[] {
  const w = k.wejscie;
  const wCiazy =
    (w.dataPoczatkuCiazy !== undefined || w.przewidywanaDataPorodu !== undefined) &&
    (w.dataPoczatkuCiazy === undefined || porownaj(w.dataPoczatkuCiazy, w.dzis) <= 0) &&
    (w.dataPorodu === undefined || porownaj(w.dzis, w.dataPorodu) < 0);
  if (!wCiazy) return [];
  const okres = okresWDniu(k.okresy, w.dzis);
  if (!okres) return [];

  if (pracownica(okres.tytul)) {
    return [
      {
        regula: 'R-KP-01',
        status: 'informacja',
        swiadczenie: 'ochrona_stosunku_pracy',
        komunikat:
          'W ciąży pracodawca nie może wypowiedzieć ani rozwiązać Twojej umowy o pracę – poza wyjątkami: Twoja ciężka wina za zgodą związków zawodowych albo upadłość lub likwidacja firmy.',
        podstawaPrawna: ['KP art. 177 § 1', 'KP art. 177 § 4'],
      },
    ];
  }
  return [
    {
      regula: 'R-KP-01',
      status: 'informacja',
      swiadczenie: 'ochrona_stosunku_pracy',
      komunikat:
        'Ochrona przed zwolnieniem w ciąży i przedłużenie umowy do dnia porodu dotyczą tylko umowy o pracę. Przy zleceniu lub działalności sama pilnuj ciągłości ubezpieczenia chorobowego do dnia porodu.',
      podstawaPrawna: ['KP art. 177', 'Treść zadania, sekcja I'],
    },
  ];
}

function ostatniIndeksPracownicy(k: KontekstOceny): number | undefined {
  let wynik: number | undefined;
  k.okresy.forEach((o, i) => {
    if (!pracownica(o.tytul)) return;
    const najpozniejszy = wynik === undefined ? undefined : k.okresy[wynik];
    if (!najpozniejszy || porownaj(o.od, najpozniejszy.od) >= 0) wynik = i;
  });
  return wynik;
}

/** Skutek R-KP-02: ubezpieczenie z umowy trwa do dnia porodu (bez znanej daty porodu – trwa). */
function przedluzOkres(k: KontekstOceny, indeks: number, dataPorodu: ISODate | undefined): void {
  const okres = k.okresy[indeks];
  if (!okres) return;
  const { do: _staryKoniec, przyczynaUstania: _przyczyna, ...reszta } = okres;
  k.okresy = k.okresy.map((o, i) =>
    i === indeks ? (dataPorodu ? { ...reszta, do: dataPorodu, przyczynaUstania: 'koniec_umowy_terminowej' } : reszta) : o,
  );
}
