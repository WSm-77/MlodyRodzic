/**
 * R-CH-*: zasiłek chorobowy i wynagrodzenie chorobowe w ciąży (tabela A; diagram 9 specu z korektą D9).
 * Reguły oceniane osobno dla każdego zwolnienia e-ZLA.
 */

import { dodajDni, porownaj } from '../wspolne/daty';
import { procentTekst } from '../wspolne/kwoty';
import type { ISODate } from '../typy';
import {
  analizaZwolnien,
  jedenOkresZasilkowy,
  niezdolnoscWCiazy,
  wCiazy,
  type AnalizaZwolnienia,
  type Wyczekiwanie,
} from './chorobowe';
import { okresWDniu, pracownica, type GrupaRegul, type KontekstOceny } from './kontekst';
import type { OkresUbezpieczenia, WynikReguly, Zwolnienie } from './typy';

export const regulyCH: GrupaRegul = (k) => {
  const analizy = analizaZwolnien(k);
  if (analizy.length === 0) return [];
  return [...analizy.flatMap((a) => ocenZwolnienie(k, a)), ...pracaNaZwolnieniu(k), ...kilkaTytulow(k, analizy)];
};

function ocenZwolnienie(k: KontekstOceny, a: AnalizaZwolnienia): WynikReguly[] {
  const { z, okres, wyczekiwanie: wycz } = a;
  if (!okres || !wycz) return a.poUstaniu ? [] : brakUbezpieczenia(k, z);
  const wyniki = [okresWyczekiwania(k, z, wycz)];
  if (porownaj(z.do, wycz.dzienNabycia) < 0) return wyniki;
  return [...wyniki, kodB(k, z), ...wynagrodzenieChorobowe(k, a, okres), okresZasilkowy(k, a), ...urlop(a)];
}

/** R-CH-06: niezdolność w czasie urlopu bezpłatnego lub wychowawczego (UZ art. 12 ust. 2–3). */
function urlop(a: AnalizaZwolnienia): WynikReguly[] {
  return a.zakresy
    .filter((x) => x.rodzaj === 'urlop')
    .map((x) => ({
      regula: 'R-CH-06',
      status: 'nie_przysluguje',
      swiadczenie: 'zasilek_chorobowy',
      komunikat: `Za dni zwolnienia przypadające w czasie urlopu bezpłatnego lub wychowawczego (${zakresyTekst([x])}) zasiłek chorobowy nie przysługuje. Tych dni nie wlicza się do okresu zasiłkowego.`,
      podstawaPrawna: ['UZ art. 12 ust. 2', 'UZ art. 12 ust. 3'],
      skutek: { od: x.od, do: x.do },
    }));
}

/** R-CH-07: praca zarobkowa albo aktywność niezgodna z celem zwolnienia (UZ art. 17 ust. 1–1b, ust. 4). */
function pracaNaZwolnieniu(k: KontekstOceny): WynikReguly[] {
  const praca = k.wejscie.pracaZarobkowaNaZwolnieniu;
  if (praca === false) return [];
  return [
    {
      regula: 'R-CH-07',
      status: praca ? 'ryzyko' : 'informacja',
      komunikat: praca
        ? 'Pracujesz zarobkowo w czasie zwolnienia lekarskiego. Za to tracisz zasiłek za cały okres zwolnienia – nawet jeśli pracowałaś na polecenie szefa. Wyjątkiem są tylko czynności incydentalne wymuszone ważnymi okolicznościami.'
        : 'Na zwolnieniu nie pracuj zarobkowo i nie rób niczego, co utrudnia leczenie – możesz stracić zasiłek za całe zwolnienie. Polecenie szefa nie jest usprawiedliwieniem.',
      podstawaPrawna: ['UZ art. 17 ust. 1', 'UZ art. 17 ust. 1a', 'UZ art. 17 ust. 1b'],
    },
  ];
}

/** R-CH-08 (od 1.01.2027, OK-8): przy kilku tytułach zwolnienie można wystawić tylko z części z nich (UZ art. 17 ust. 1c–1e, art. 9 ust. 4). */
function kilkaTytulow(k: KontekstOceny, analizy: readonly AnalizaZwolnienia[]): WynikReguly[] {
  const a = analizy.find(
    ({ z }) => new Set(k.okresy.filter((o) => okresWDniu([o], z.od)).map((o) => o.tytul)).size > 1 && jedenOkresZasilkowy(k, z.od),
  );
  if (!a) return [];
  return [
    {
      regula: 'R-CH-08',
      status: 'informacja',
      komunikat: `Masz kilka tytułów ubezpieczenia. Od ${k.param('dataJednegoOkresuZasilkowego')}, jeśli w ramach jednego z nich możesz pracować mimo choroby, możesz poprosić lekarza, by nie wystawiał zwolnienia z tego tytułu – wtedy poinformuj płatnika o zwolnieniu z innego tytułu. Okres zasiłkowy jest jeden dla wszystkich tytułów.`,
      podstawaPrawna: ['UZ art. 17 ust. 1c', 'UZ art. 17 ust. 1d', 'UZ art. 17 ust. 1e', 'UZ art. 9 ust. 4'],
    },
  ];
}

/** R-CH-05: okres zasiłkowy – sumowanie zwolnień z przerwą ≤ 60 dni, od nowa przy niezdolności w ciąży (UZ art. 8–9). */
function okresZasilkowy(k: KontekstOceny, a: AnalizaZwolnienia): WynikReguly {
  const regula = 'R-CH-05';
  const podstawaPrawna = ['UZ art. 8 ust. 1', 'UZ art. 9 ust. 1', 'UZ art. 9 ust. 2'];
  const limit = a.limitOkresuZasilkowego;
  const wyczerpany = a.zakresy.find((x) => x.rodzaj === 'wyczerpany');
  if (wyczerpany) {
    return {
      regula,
      status: 'nie_przysluguje',
      swiadczenie: 'zasilek_chorobowy',
      komunikat: `Okres zasiłkowy (${limit} dni) wyczerpie się ${dodajDni(wyczerpany.od, -1)}. Za dalsze dni zwolnienia (od ${wyczerpany.od}) zasiłek chorobowy nie przysługuje. Jeśli nadal nie będziesz zdolna do pracy, możesz wystąpić o świadczenie rehabilitacyjne.`,
      podstawaPrawna,
      skutek: { od: wyczerpany.od, do: a.z.do, maksDni: limit },
    };
  }
  const odNowa = a.odNowaWCiazy
    ? ' Twój okres zasiłkowy w ciąży liczy się od nowa – wcześniejsze zwolnienia sprzed ciąży go nie skracają.'
    : '';
  return {
    regula,
    status: 'informacja',
    swiadczenie: 'zasilek_chorobowy',
    komunikat: `Kolejne zwolnienia z przerwą do ${k.param('przerwaLaczacaOkresZasilkowy')} dni sumują się w jeden okres zasiłkowy (maksymalnie ${limit} dni). Po zwolnieniu do ${a.z.do} zostanie Ci jeszcze ${limit - a.wykorzystaneDni} dni okresu zasiłkowego.${odNowa}`,
    podstawaPrawna: a.odNowaWCiazy ? [...podstawaPrawna, 'UZ art. 9 ust. 2 zd. 2'] : podstawaPrawna,
    skutek: { maksDni: limit },
  };
}

/** R-CH-04: pracownica – wynagrodzenie chorobowe przez 33 (14) dni w roku, potem zasiłek; pozostali – zasiłek od 1. dnia. */
function wynagrodzenieChorobowe(k: KontekstOceny, a: AnalizaZwolnienia, okres: OkresUbezpieczenia): WynikReguly[] {
  const regula = 'R-CH-04';
  const zasilek = a.zakresy.filter((x) => x.rodzaj === 'zasilek');
  const wynagrodzenie = a.zakresy.filter((x) => x.rodzaj === 'wynagrodzenie');
  if (zasilek.length === 0 && wynagrodzenie.length === 0) return [];
  if (!pracownica(okres.tytul)) {
    const od = zasilek[0]?.od ?? a.z.od;
    return [
      {
        regula,
        status: 'informacja',
        swiadczenie: 'zasilek_chorobowy',
        komunikat: `Nie jesteś pracownicą, więc nie dostaniesz wynagrodzenia chorobowego od pracodawcy – zasiłek chorobowy przysługuje od pierwszego dnia zwolnienia po okresie wyczekiwania (od ${od}).`,
        podstawaPrawna: ['KP art. 92 § 1', 'UZ art. 6 ust. 1'],
        skutek: { od },
      },
    ];
  }
  const ciaza = niezdolnoscWCiazy(a.z);
  const stawka = k.param(ciaza ? 'stawkaChorobowyCiaza' : 'stawkaChorobowy');
  const limit = k.param(k.wejscie.wiek50Wczesniej ? 'dniWynagrodzeniaChorobowego50' : 'dniWynagrodzeniaChorobowego');
  const podstawaPrawna = ['KP art. 92 § 1', 'KP art. 92 § 4', 'UZ art. 12 ust. 1'];
  const opisZasilku = zasilek.length > 0 ? ` Za dni ${zakresyTekst(zasilek)} dostaniesz zasiłek chorobowy z ZUS.` : '';
  const pierwszy = wynagrodzenie[0];
  if (!pierwszy) {
    return [
      {
        regula,
        status: 'informacja',
        swiadczenie: 'zasilek_chorobowy',
        komunikat: `Za to zwolnienie pracodawca nie wypłaci wynagrodzenia chorobowego (limit ${limit} dni w roku kalendarzowym jest wykorzystany albo zatrudnienie już ustało).${opisZasilku}`,
        podstawaPrawna,
      },
    ];
  }
  return [
    {
      regula,
      status: 'informacja',
      swiadczenie: 'wynagrodzenie_chorobowe',
      komunikat: `Za pierwsze ${limit} dni niezdolności w roku kalendarzowym pracodawca wypłaca wynagrodzenie chorobowe (${procentTekst(stawka)} wynagrodzenia${ciaza ? ', bo zwolnienie ma kod B – choroba w ciąży' : ''}). Wynagrodzenie dostaniesz za dni ${zakresyTekst(wynagrodzenie)}.${opisZasilku}`,
      podstawaPrawna: ciaza ? [...podstawaPrawna, 'KP art. 92 § 1 pkt 2'] : podstawaPrawna,
      skutek: { stawka, od: pierwszy.od, do: pierwszy.do },
    },
  ];
}

function zakresyTekst(zakresy: readonly { od: ISODate; do: ISODate }[]): string {
  return zakresy.map((x) => (x.od === x.do ? x.od : `${x.od} – ${x.do}`)).join(', ');
}

/** R-CH-03: kod B – 100% i 270 dni; bez kodu B – 80% i 182 dni (UZ art. 8 ust. 1, art. 11). */
function kodB(k: KontekstOceny, z: Zwolnienie): WynikReguly {
  const regula = 'R-CH-03';
  const swiadczenie = 'zasilek_chorobowy';
  if (z.kodB) {
    return {
      regula,
      status: 'informacja',
      swiadczenie,
      komunikat: `Zwolnienie od ${z.od} ma kod B (choroba w ciąży), więc zasiłek wynosi ${procentTekst(k.param('stawkaChorobowyCiaza'))} podstawy wymiaru, a okres zasiłkowy trwa maksymalnie ${k.param('okresZasilkowyCiazaDni')} dni.`,
      podstawaPrawna: ['UZ art. 11 ust. 2 pkt 1', 'UZ art. 8 ust. 1'],
      skutek: { stawka: k.param('stawkaChorobowyCiaza'), maksDni: k.param('okresZasilkowyCiazaDni') },
    };
  }
  const skutek = { stawka: k.param('stawkaChorobowy'), maksDni: k.param('okresZasilkowyDni') };
  const ciaza = wCiazy(k, z.od);
  const [zKodem, bezKodu] = [procentTekst(k.param('stawkaChorobowyCiaza')), procentTekst(skutek.stawka)];
  return {
    regula,
    status: ciaza ? 'ryzyko' : 'informacja',
    swiadczenie,
    komunikat: ciaza
      ? `Na zwolnieniu od ${z.od} brakuje kodu B, choć przypada ono w ciąży. Bez kodu B zasiłek wynosi ${bezKodu} podstawy przez maksymalnie ${skutek.maksDni} dni, a z kodem B – ${zKodem} przez ${k.param('okresZasilkowyCiazaDni')} dni. Poproś lekarza o korektę zwolnienia.`
      : `Zwolnienie od ${z.od} nie ma kodu B, więc zasiłek wynosi ${bezKodu} podstawy przez maksymalnie ${skutek.maksDni} dni. Jeśli choroba przypada w ciąży, poproś lekarza o wpisanie kodu B – wtedy dostaniesz ${zKodem}.`,
    podstawaPrawna: ['UZ art. 11 ust. 1', 'UZ art. 11 ust. 2 pkt 1', 'UZ art. 8 ust. 1'],
    skutek,
  };
}

/** R-CH-02: okres wyczekiwania 30/90 dni (UZ art. 4; dni przed jego upływem nie wlicza się do okresu zasiłkowego – art. 9 ust. 3). */
function okresWyczekiwania(k: KontekstOceny, z: Zwolnienie, wycz: Wyczekiwanie): WynikReguly {
  const regula = 'R-CH-02';
  const swiadczenie = 'zasilek_chorobowy';
  if (wycz.bezWyczekiwania) {
    return {
      regula,
      status: 'przysluguje',
      swiadczenie,
      komunikat: `W Twojej sytuacji nie musisz czekać ${k.param('okresWyczekiwaniaObowiazkowe')} ani ${k.param('okresWyczekiwaniaDobrowolne')} dni – zasiłek przysługuje od pierwszego dnia ubezpieczenia.`,
      podstawaPrawna: ['UZ art. 4 ust. 3'],
    };
  }
  const podstawaPrawna = [wycz.obowiazkowe ? 'UZ art. 4 ust. 1 pkt 1' : 'UZ art. 4 ust. 1 pkt 2', 'UZ art. 4 ust. 2'];
  const rodzaj = wycz.obowiazkowe ? 'obowiązkowym' : 'dobrowolnym';
  if (porownaj(z.od, wycz.dzienNabycia) >= 0) {
    return {
      regula,
      status: 'przysluguje',
      swiadczenie,
      komunikat: `Okres wyczekiwania (${wycz.wymaganeDni} dni nieprzerwanego ubezpieczenia chorobowego przy ubezpieczeniu ${rodzaj}) minął przed zwolnieniem od ${z.od}, więc masz prawo do świadczenia za to zwolnienie.`,
      podstawaPrawna,
    };
  }
  const koniecBezPrawa = porownaj(z.do, wycz.dzienNabycia) < 0 ? z.do : dodajDni(wycz.dzienNabycia, -1);
  const dalej =
    koniecBezPrawa === z.do
      ? 'Za całe to zwolnienie nie dostaniesz pieniędzy z ubezpieczenia.'
      : `Od ${wycz.dzienNabycia} świadczenie już przysługuje.`;
  return {
    regula,
    status: 'nie_przysluguje',
    swiadczenie,
    komunikat: `Przy ubezpieczeniu ${rodzaj} zasiłek przysługuje dopiero po ${wycz.wymaganeDni} dniach nieprzerwanego ubezpieczenia chorobowego (wcześniejsze ubezpieczenie liczy się, jeśli przerwa nie przekroczyła ${k.param('przerwaNieprzerywajacaWyczekiwania')} dni). Za dni od ${z.od} do ${koniecBezPrawa} nie dostaniesz zasiłku ani wynagrodzenia chorobowego. ${dalej}`,
    podstawaPrawna: [...podstawaPrawna, 'UZ art. 9 ust. 3', 'KP art. 92 § 3 pkt 2'],
    skutek: { od: z.od, do: koniecBezPrawa },
    termin: wycz.dzienNabycia,
  };
}

/** R-CH-01: brak ubezpieczenia w dniu powstania niezdolności i brak tytułu, który by ustał (reszta: R-PU-*). */
function brakUbezpieczenia(k: KontekstOceny, z: Zwolnienie): WynikReguly[] {
  const decyzja = k.okresy.some((o) => o.przyczynaUstania === 'decyzja_zus_o_niepodleganiu');
  return [
    {
      regula: 'R-CH-01',
      status: 'nie_przysluguje',
      swiadczenie: 'zasilek_chorobowy',
      komunikat: decyzja
        ? `W dniu, od którego masz zwolnienie (${z.od}), nie podlegałaś ubezpieczeniu chorobowemu – ZUS wydał decyzję, że nie podlegasz ubezpieczeniu z tej umowy. Zasiłek chorobowy za to zwolnienie nie przysługuje. Od decyzji możesz się odwołać do sądu.`
        : `W dniu, od którego masz zwolnienie (${z.od}), nie podlegałaś ubezpieczeniu chorobowemu, więc zasiłek chorobowy za to zwolnienie nie przysługuje.`,
      podstawaPrawna: ['UZ art. 6 ust. 1', 'UZ art. 7'],
      skutek: { od: z.od, do: z.do },
    },
  ];
}
