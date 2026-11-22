/**
 * R-DL-*: zadłużenie składkowe (UZ art. 2a; diagram 8 specu) i przerwa w dobrowolnym ubezpieczeniu.
 *
 * Odstępstwo od diagramu 8: dług powyżej progu, niespłacony, przed upływem 6 miesięcy daje „nie_przysluguje”
 * z terminem spłaty (a nie „ryzyko”), bo art. 2a ust. 1 mówi wprost, że świadczenie „nie przysługuje do czasu
 * spłaty całości zadłużenia” (T04: odmowa ZUS). Przepis ma pierwszeństwo przed diagramem.
 */

import { czescPromilowa, kwotaTekst, procentTekst } from '../wspolne/kwoty';
import { dodajMiesiace, porownaj } from '../wspolne/daty';
import { art2a, dobrowolne, dzienPowstaniaPrawa, okresWDniuLubOstatni, type GrupaRegul, type KontekstOceny } from './kontekst';
import type { WynikReguly } from './typy';

export const regulyDL: GrupaRegul = (k) => [...zadluzenie(k), ...nieoplaconaSkladka(k)];

function zadluzenie(k: KontekstOceny): WynikReguly[] {
  const w = k.wejscie;
  const dzienPrawa = dzienPowstaniaPrawa(w);
  if (!dzienPrawa) return [];
  const okres = okresWDniuLubOstatni(k.okresy, dzienPrawa);
  if (!okres || !art2a(okres.tytul)) return [];

  const podstawaPrawna = ['UZ art. 2a ust. 1', 'UZ art. 2a ust. 2'];
  const wynik = (status: WynikReguly['status'], komunikat: string, dodatki: Partial<WynikReguly> = {}): WynikReguly[] => [
    { regula: 'R-DL-01', status, swiadczenie: 'zasilek_macierzynski', komunikat, podstawaPrawna, ...dodatki },
  ];

  if (w.zadluzenieSkladkoweNaDzienPrawa === undefined) {
    return wynik(
      'nieznane',
      `Prowadzisz działalność (albo z nią współpracujesz), więc zasiłek zależy od braku zaległości w składkach na dzień ${dzienPrawa}. Pobierz z PUE/eZUS zaświadczenie o niezaleganiu i podaj kwotę zadłużenia.`,
      { brakujaceDane: ['zadluzenieSkladkoweNaDzienPrawa'] },
    );
  }

  const progPromile = k.param('progZadluzenia');
  const prog = czescPromilowa(k.param('placaMinimalna'), progPromile);
  const progTekst = procentTekst(progPromile);
  const dlug = w.zadluzenieSkladkoweNaDzienPrawa;
  if (dlug <= prog) {
    return wynik(
      'informacja',
      `Zaległość w składkach (${kwotaTekst(dlug)}) nie przekracza ${progTekst} minimalnego wynagrodzenia (${kwotaTekst(prog)}), więc nie blokuje zasiłku.`,
    );
  }

  const miesiaceNaSplate = k.param('miesiaceNaSplateZadluzenia');
  const termin = dodajMiesiace(dzienPrawa, miesiaceNaSplate);
  const splata = w.dataSplatyZadluzenia;
  if (splata && porownaj(splata, termin) <= 0) {
    return wynik(
      'przysluguje',
      `Zaległość w składkach spłacono ${splata}, w ciągu ${miesiaceNaSplate} mies. od dnia powstania prawa – zasiłek zostanie wypłacony.`,
      { skutek: { od: splata } },
    );
  }
  if (splata || porownaj(w.dzis, termin) > 0) {
    return wynik(
      'nie_przysluguje',
      `Zaległość w składkach (${kwotaTekst(dlug)}) przekraczała ${progTekst} minimalnego wynagrodzenia (${kwotaTekst(prog)}) i nie została spłacona do ${termin}. Prawo do zasiłku przedawniło się.`,
    );
  }
  return wynik(
    'nie_przysluguje',
    `Na Twoim koncie w ZUS jest zaległość w składkach (${kwotaTekst(dlug)}) powyżej ${progTekst} minimalnego wynagrodzenia (${kwotaTekst(prog)}). Dopóki jej całej nie spłacisz, ZUS nie wypłaci zasiłku. Spłać całość do ${termin} – inaczej prawo do zasiłku się przedawni.`,
    { termin },
  );
}

function nieoplaconaSkladka(k: KontekstOceny): WynikReguly[] {
  const przerwa = k.okresy.find((o) => dobrowolne(o.tytul) && o.przyczynaUstania === 'nieoplacenie_skladki');
  if (!przerwa) return [];
  return [
    {
      regula: 'R-DL-02',
      status: 'ryzyko',
      komunikat:
        'Twoje dobrowolne ubezpieczenie chorobowe ustało, bo składka nie została opłacona w terminie. Taka przerwa oznacza, że okres wyczekiwania na zasiłek chorobowy liczy się od nowa, a jeśli przypadnie na dzień porodu – zasiłek macierzyński nie przysługuje. Pilnuj terminowej zapłaty składki.',
      podstawaPrawna: ['UZ art. 48a ust. 4', 'ustawa o systemie ubezpieczeń społecznych art. 14 ust. 2 pkt 2 (poza materiałami)'],
    },
  ];
}
