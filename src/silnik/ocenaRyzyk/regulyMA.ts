/**
 * R-MA-*: prawo do zasiłku macierzyńskiego (diagram 7 specu z korektami D7, reguła R-MA-06 z T06).
 * Kolejność węzłów wg korekty D7: D (umowa przedłużona do porodu) → A (ubezpieczenie w dniu porodu
 * lub przyjęcia dziecka) → B (śmierć, upadłość, likwidacja) → C (naruszenie prawa: wyrok / brak wyroku).
 */

import type { ISODate } from '../typy';
import { dodajDni, najpozniejsza, najwczesniejsza, porownaj } from '../wspolne/daty';
import {
  PRZYCZYNY_PO_STRONIE_PRACODAWCY,
  brakPrzyczynyUstania,
  dobrowolne,
  dzienZdarzenia,
  naruszeniePrawa,
  okresWDniu,
  ostatniZakonczonyPrzed,
  pracownica,
  ustaloWCiazy,
  type GrupaRegul,
  type KontekstOceny,
} from './kontekst';
import type { WynikReguly } from './typy';

export const regulyMA: GrupaRegul = (k) => {
  const zdarzenie = dzienZdarzenia(k.wejscie);
  if (!zdarzenie) {
    return [
      {
        regula: 'R-MA-01',
        status: 'nieznane',
        swiadczenie: 'zasilek_macierzynski',
        komunikat:
          'Prawo do zasiłku macierzyńskiego zależy od ubezpieczenia w dniu porodu albo przyjęcia dziecka. Podaj datę porodu, przyjęcia dziecka albo przewidywaną datę porodu.',
        podstawaPrawna: ['UZ art. 29 ust. 1'],
        brakujaceDane: ['dataPorodu', 'dataPrzyjeciaDziecka', 'przewidywanaDataPorodu'],
      },
    ];
  }
  const prawo = prawoDoZasilku(k, zdarzenie.dzien, zdarzenie.prognoza);
  if (prawo.status !== 'przysluguje') return [prawo];
  return [prawo, ...wyrejestrowanieDobrowolnego(k, zdarzenie.dzien), ...urlopBezplatny(k)];
};

const urlopWychowawczyWDniu = (k: KontekstOceny, dzien: ISODate): boolean =>
  (k.wejscie.urlopyBezplatneLubWychowawcze ?? []).some(
    (u) => u.rodzaj === 'wychowawczy' && porownaj(u.od, dzien) <= 0 && porownaj(dzien, u.do) <= 0,
  );

/** R-MA-04 i R-MA-06: dobrowolne chorobowe ustaje z chwilą rozpoczęcia zasiłku; kolejny okres po przerwie wymaga ubezpieczenia. */
function wyrejestrowanieDobrowolnego(k: KontekstOceny, dzien: ISODate): WynikReguly[] {
  const tytul = okresWDniu(k.okresy, dzien)?.tytul;
  if (tytul === undefined || !dobrowolne(tytul)) return [];

  const wyniki: WynikReguly[] = [
    {
      regula: 'R-MA-04',
      status: 'informacja',
      swiadczenie: 'zasilek_macierzynski',
      komunikat:
        'Gdy zaczniesz pobierać zasiłek macierzyński, ZUS wyrejestruje Cię z dobrowolnego ubezpieczenia chorobowego. Jeśli między kolejnymi urlopami (np. macierzyńskim i rodzicielskim) zrobisz przerwę, zgłoś się ponownie do ubezpieczenia chorobowego przed rozpoczęciem kolejnego okresu – inaczej zasiłek za ten okres nie przysługuje.',
      podstawaPrawna: ['Poradnik ZUS (35)'],
    },
  ];

  const okresy = [...(k.wejscie.okresyZasilkuMacierzynskiego ?? [])].sort((a, b) => porownaj(a.od, b.od));
  for (let i = 1; i < okresy.length; i++) {
    const poprzedni = okresy[i - 1]!;
    const okres = okresy[i]!;
    const przerwa = porownaj(okres.od, dodajDni(poprzedni.do, 1)) > 0;
    if (!przerwa || okresWDniu(k.okresy, okres.od) || urlopWychowawczyWDniu(k, okres.od)) continue;
    wyniki.push({
      regula: 'R-MA-06',
      status: 'nie_przysluguje',
      swiadczenie: 'zasilek_macierzynski',
      skutek: { od: okres.od, do: okres.do },
      komunikat: `Zasiłek za okres od ${okres.od} do ${okres.do} nie przysługuje: ten okres nie następuje bezpośrednio po poprzednim, a w dniu jego rozpoczęcia nie masz ubezpieczenia chorobowego (wyrejestrowanie z dobrowolnego ubezpieczenia na czas zasiłku). Zgłoś się do ubezpieczenia chorobowego przed rozpoczęciem kolejnego urlopu albo zaplanuj go bez przerwy.`,
      podstawaPrawna: ['UZ art. 29 ust. 1'],
    });
  }
  return wyniki;
}

/** R-MA-05: zasiłek nie przysługuje za okres urlopu bezpłatnego (UZ art. 31 ust. 5 w zw. z art. 12 ust. 2 pkt 1). */
function urlopBezplatny(k: KontekstOceny): WynikReguly[] {
  const wyniki: WynikReguly[] = [];
  for (const urlop of k.wejscie.urlopyBezplatneLubWychowawcze ?? []) {
    if (urlop.rodzaj !== 'bezplatny') continue;
    for (const okres of k.wejscie.okresyZasilkuMacierzynskiego ?? []) {
      const od = najpozniejsza(urlop.od, okres.od);
      const do_ = najwczesniejsza(urlop.do, okres.do);
      if (porownaj(od, do_) > 0) continue;
      wyniki.push({
        regula: 'R-MA-05',
        status: 'nie_przysluguje',
        swiadczenie: 'zasilek_macierzynski',
        skutek: { od, do: do_ },
        komunikat: `Za czas urlopu bezpłatnego (od ${od} do ${do_}) zasiłek macierzyński nie jest wypłacany.`,
        podstawaPrawna: ['UZ art. 31 ust. 5', 'UZ art. 12 ust. 2 pkt 1'],
      });
    }
  }
  return wyniki;
}

function prawoDoZasilku(k: KontekstOceny, dzien: ISODate, prognoza: boolean): WynikReguly {
  const w = k.wejscie;
  const zasilek = (regula: string, status: WynikReguly['status'], komunikat: string, podstawaPrawna: string[], brakujaceDane?: string[]): WynikReguly => ({
    regula,
    status,
    swiadczenie: 'zasilek_macierzynski',
    komunikat,
    podstawaPrawna,
    ...(brakujaceDane ? { brakujaceDane } : {}),
  });

  // Węzeł D oceniany pierwszy (korekta D7): R-KP-02 przedłużyła umowę terminową do dnia porodu.
  if (k.umowaPrzedluzonaDoPorodu) {
    return zasilek(
      'R-MA-02',
      'przysluguje',
      'Twoja umowa terminowa przedłużyła się do dnia porodu. Po porodzie umowa się kończy, ale zasiłek macierzyński dostaniesz w pełnym wymiarze.',
      ['UZ art. 30 ust. 4', 'KP art. 177 § 3'],
    );
  }

  if (okresWDniu(k.okresy, dzien)) {
    return zasilek(
      'R-MA-01',
      'przysluguje',
      'W dniu porodu (przyjęcia dziecka) masz ubezpieczenie chorobowe – przysługuje Ci zasiłek macierzyński. Nie obowiązuje okres wyczekiwania.',
      ['UZ art. 29 ust. 1'],
    );
  }
  if (urlopWychowawczyWDniu(k, dzien)) {
    return zasilek(
      'R-MA-01',
      'przysluguje',
      'Dziecko urodziło się (zostało przyjęte) w czasie Twojego urlopu wychowawczego – przysługuje Ci zasiłek macierzyński.',
      ['UZ art. 29 ust. 1'],
    );
  }

  const ostatni = ostatniZakonczonyPrzed(k.okresy, dzien);
  const brakujace = ostatni && w.dataPrzyjeciaDziecka === undefined ? brakPrzyczynyUstania(w, ostatni) : undefined;
  if (brakujace) {
    return zasilek(
      'R-MA-02',
      'nieznane',
      'Twoja umowa o pracę ustała przed porodem. Podaj przyczynę ustania: przy śmierci, upadłości lub likwidacji pracodawcy albo rozwiązaniu umowy z naruszeniem prawa w czasie ciąży zasiłek macierzyński może przysługiwać mimo braku ubezpieczenia w dniu porodu.',
      ['UZ art. 30 ust. 1'],
      brakujace,
    );
  }
  const porodPoUstaniu =
    w.dataPrzyjeciaDziecka === undefined &&
    ostatni !== undefined &&
    pracownica(ostatni.tytul) &&
    (PRZYCZYNY_PO_STRONIE_PRACODAWCY.includes(ostatni.przyczynaUstania!) || naruszeniePrawa(ostatni.przyczynaUstania));

  if (ostatni && porodPoUstaniu) {
    const wCiazy = ustaloWCiazy(w, ostatni);
    if (wCiazy === undefined) {
      return zasilek(
        'R-MA-02',
        'nieznane',
        'Nie wiemy, czy ubezpieczenie ustało w czasie ciąży. Podaj datę początku ciąży z zaświadczenia lekarskiego.',
        ['UZ art. 30 ust. 1'],
        ['dataPoczatkuCiazy'],
      );
    }
    if (wCiazy) {
      if (ostatni.przyczynaUstania === 'naruszenie_prawa_bez_wyroku') {
        return zasilek(
          'R-MA-02',
          'nieznane',
          'Umowę rozwiązano z naruszeniem prawa, ale nie ma jeszcze prawomocnego wyroku sądu. Zasiłek macierzyński będzie przysługiwał, jeśli sąd prawomocnie to stwierdzi.',
          ['UZ art. 30 ust. 1 pkt 2'],
          ['prawomocny wyrok sądu stwierdzający naruszenie prawa'],
        );
      }
      if (ostatni.przyczynaUstania === 'naruszenie_prawa_prawomocny_wyrok') {
        return zasilek(
          'R-MA-02',
          'przysluguje',
          'Sąd prawomocnie stwierdził, że umowę rozwiązano z naruszeniem prawa – mimo braku ubezpieczenia w dniu porodu przysługuje Ci zasiłek macierzyński. Dołącz wyrok do wniosku.',
          ['UZ art. 30 ust. 1 pkt 2'],
        );
      }
      return zasilek(
        'R-MA-02',
        'przysluguje',
        'Ubezpieczenie ustało w ciąży z powodu śmierci, upadłości lub likwidacji pracodawcy – mimo to po porodzie przysługuje Ci zasiłek macierzyński.',
        ['UZ art. 30 ust. 1 pkt 1'],
      );
    }
  }

  const powod =
    ostatni?.przyczynaUstania === 'decyzja_zus_o_niepodleganiu'
      ? ` ZUS wydał decyzję, że od ${dodajDni(ostatni.do, 1)} nie podlegasz ubezpieczeniom.`
      : '';
  if (prognoza) {
    return zasilek(
      'R-MA-03',
      'ryzyko',
      `Uwaga: w przewidywanym dniu porodu (${dzien}) nie będziesz mieć ubezpieczenia chorobowego, więc zasiłek macierzyński nie będzie przysługiwał.${powod} Sprawdź, czy możesz utrzymać ubezpieczenie do porodu. Możesz mieć prawo do świadczenia rodzicielskiego (tzw. kosiniakowego) z innego systemu.`,
      ['UZ art. 29 ust. 1'],
    );
  }
  return zasilek(
    'R-MA-03',
    'nie_przysluguje',
    `W dniu porodu nie masz ubezpieczenia chorobowego, więc zasiłek macierzyński nie przysługuje.${powod} Możesz mieć prawo do świadczenia rodzicielskiego (tzw. kosiniakowego) z innego systemu.`,
    ['UZ art. 29 ust. 1'],
  );
}
