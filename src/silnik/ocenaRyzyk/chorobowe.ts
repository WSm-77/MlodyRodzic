/**
 * Wewnętrzne wyliczenia wspólne dla grup R-CH-*, R-PU-* i R-RE-01: okres wyczekiwania (UZ art. 4)
 * i okres zasiłkowy (UZ art. 8–9). Brak własnych testów: sprawdzane przez szew ocenaRyzyk.
 */

import type { ISODate, Okres } from '../typy';
import { czesciDaty, dodajDni, dniWlacznie, porownaj, roznicaDni } from '../wspolne/daty';
import { okresWDniu, ostatniZakonczonyPrzed, pracownica, type KontekstOceny } from './kontekst';
import type { OkresUbezpieczenia, Zwolnienie } from './typy';

/** Czy dzień przypada w ciąży: znany początek ciąży nie później niż ten dzień i przed porodem. `undefined` = brak daty początku ciąży. */
export function wCiazy(k: KontekstOceny, dzien: ISODate): boolean | undefined {
  const w = k.wejscie;
  if (!w.dataPoczatkuCiazy) return undefined;
  return porownaj(w.dataPoczatkuCiazy, dzien) <= 0 && (w.dataPorodu === undefined || porownaj(dzien, w.dataPorodu) < 0);
}

/**
 * Niezdolność „występująca w trakcie ciąży” (UZ art. 8, art. 11 ust. 2 pkt 1, art. 19 ust. 1) stwierdzona kodem B
 * na e-ZLA. Bez kodu B – 80% i 182 dni nawet przy znanej ciąży; R-CH-03 ostrzega wtedy o korekcie zwolnienia
 * (story 14, research R-CH-05: `pozostale = (kodB ? 270 : 182) - okresZasilkowy`).
 */
export function niezdolnoscWCiazy(z: Zwolnienie): boolean {
  return z.kodB;
}

export interface Wyczekiwanie {
  /** Pierwszy dzień, za który przysługuje zasiłek (po upływie okresu wyczekiwania). */
  dzienNabycia: ISODate;
  /** Wymagany okres wyczekiwania w dniach (30 albo 90); 0 przy wyjątkach z art. 4 ust. 3. */
  wymaganeDni: number;
  /** Wyjątek z UZ art. 4 ust. 3 (absolwentka, 10 lat ubezpieczenia obowiązkowego). */
  bezWyczekiwania: boolean;
  obowiazkowe: boolean;
}

/**
 * Okres wyczekiwania dla niezdolności powstałej w dniu `dzien`, w czasie okresu ubezpieczenia `okres`.
 * Próg wg tytułu w tym dniu (OK-10); wcześniejsze okresy (dowolny tytuł) wlicza się przy przerwie ≤ 30 dni
 * albo przerwie wypełnionej urlopem bezpłatnym lub wychowawczym (UZ art. 4 ust. 2).
 * Okres zawierający `dzien` traktuje się jako trwający dalej, więc dzień nabycia może wypaść po jego końcu
 * (wtedy prawo nie zostało nabyte w czasie ubezpieczenia – UZ art. 13 ust. 1 pkt 3).
 */
export function wyczekiwanie(k: KontekstOceny, okres: OkresUbezpieczenia, dzien: ISODate): Wyczekiwanie {
  const w = k.wejscie;
  const obowiazkowe = pracownica(okres.tytul);
  const lancuch = lancuchUbezpieczenia(k, dzien);
  const poczatek = lancuch[0]?.od ?? okres.od;
  if (w.absolwentkaW90Dni || (obowiazkowe && w.staz10LatObowiazkowego)) {
    return { dzienNabycia: poczatek, wymaganeDni: 0, bezWyczekiwania: true, obowiazkowe };
  }
  const wymaganeDni = k.param(obowiazkowe ? 'okresWyczekiwaniaObowiazkowe' : 'okresWyczekiwaniaDobrowolne');
  let zostalo = wymaganeDni;
  for (const [i, o] of lancuch.entries()) {
    const ostatni = i === lancuch.length - 1;
    const dlugosc = dniWlacznie(o.od, o.do);
    if (ostatni || dlugosc >= zostalo) {
      return { dzienNabycia: dodajDni(o.od, zostalo), wymaganeDni, bezWyczekiwania: false, obowiazkowe };
    }
    zostalo -= dlugosc;
  }
  return { dzienNabycia: dodajDni(poczatek, wymaganeDni), wymaganeDni, bezWyczekiwania: false, obowiazkowe };
}

/**
 * Suma okresów ubezpieczenia (zlane nakładające się i przylegające), połączonych przerwami
 * nieprzerywającymi wyczekiwania, kończąca się okresem obejmującym `dzien`. Chronologicznie.
 */
function lancuchUbezpieczenia(k: KontekstOceny, dzien: ISODate): Okres[] {
  const suma = zlej(
    k.okresy
      .map((o) => ({ od: o.od, do: o.do === undefined || porownaj(o.do, dzien) > 0 ? dzien : o.do }))
      .filter((o) => porownaj(o.od, o.do) <= 0 && porownaj(o.od, dzien) <= 0),
  );
  const iOstatni = suma.findIndex((o) => porownaj(o.do, dzien) >= 0);
  if (iOstatni < 0) return [];
  const maksPrzerwa = k.param('przerwaNieprzerywajacaWyczekiwania');
  let i = iOstatni;
  while (i > 0) {
    const poprzedni = suma[i - 1]!;
    const biezacy = suma[i]!;
    const przerwa = roznicaDni(poprzedni.do, biezacy.od) - 1;
    if (przerwa > maksPrzerwa && !wUrlopie(k, dodajDni(poprzedni.do, 1), dodajDni(biezacy.od, -1))) break;
    i -= 1;
  }
  return suma.slice(i, iOstatni + 1);
}

/** Czy cały zakres dni [od, do_] mieści się w jednym urlopie bezpłatnym lub wychowawczym. */
function wUrlopie(k: KontekstOceny, od: ISODate, do_: ISODate = od): boolean {
  return (k.wejscie.urlopyBezplatneLubWychowawcze ?? []).some((u) => porownaj(u.od, od) <= 0 && porownaj(do_, u.do) <= 0);
}

/** Zlewa okresy nakładające się i przylegające. */
function zlej(okresy: Okres[]): Okres[] {
  const posortowane = [...okresy].sort((a, b) => porownaj(a.od, b.od));
  const wynik: Okres[] = [];
  for (const o of posortowane) {
    const ostatni = wynik[wynik.length - 1];
    if (ostatni && porownaj(o.od, dodajDni(ostatni.do, 1)) <= 0) {
      if (porownaj(o.do, ostatni.do) > 0) ostatni.do = o.do;
    } else {
      wynik.push({ ...o });
    }
  }
  return wynik;
}

/**
 * Rodzaj dnia zwolnienia:
 * - bez_prawa: zasiłek nie przysługuje – przed upływem okresu wyczekiwania (nie wlicza się do okresu
 *   zasiłkowego – UZ art. 9 ust. 3) albo po ustaniu tytułu bez spełnienia warunków (UZ art. 7, art. 13),
 * - urlop: w czasie urlopu bezpłatnego lub wychowawczego (nie wlicza się – UZ art. 12 ust. 2–3),
 * - wynagrodzenie: wynagrodzenie chorobowe od pracodawcy (wlicza się – UZ art. 12 ust. 1),
 * - zasilek: zasiłek chorobowy (także po ustaniu tytułu),
 * - wyczerpany: po wyczerpaniu okresu zasiłkowego (UZ art. 8 ust. 1),
 * - limit_po_ustaniu: po 91 dniach zasiłku za okres po ustaniu tytułu, poza ciążą (UZ art. 8 ust. 2).
 */
export type RodzajDnia = 'bez_prawa' | 'urlop' | 'wynagrodzenie' | 'zasilek' | 'wyczerpany' | 'limit_po_ustaniu';

const WLICZANE: readonly RodzajDnia[] = ['wynagrodzenie', 'zasilek'];

export interface Zakres {
  rodzaj: RodzajDnia;
  od: ISODate;
  do: ISODate;
}

/** Powód wyłączenia zasiłku za okres po ustaniu tytułu (UZ art. 13). */
export type WykluczeniePoUstaniu =
  | 'emerytura_lub_renta'
  | 'nowy_tytul'
  | 'brak_wyczekiwania'
  | 'zasilek_dla_bezrobotnych'
  | 'rodzicielskie_swiadczenie_uzupelniajace'
  | 'krus'
  | 'wyczerpany_przed_ustaniem';

export interface PoUstaniu {
  /** Okres ubezpieczenia, który ustał przed albo w trakcie niezdolności. */
  okres: OkresUbezpieczenia & { do: ISODate };
  /** Pierwszy dzień zwolnienia po ustaniu tytułu. */
  od: ISODate;
  /** Niezdolność powstała w czasie ubezpieczenia i trwa po jego ustaniu; inaczej powstała po ustaniu (UZ art. 7). */
  trwaZUbezpieczenia: boolean;
  /** Tylko dla niezdolności powstałej po ustaniu (UZ art. 7). */
  art7?: 'spelniony' | 'za_pozno' | 'za_krotko';
  /** Ostatni dzień nieprzerwanej niezdolności (kolejne zwolnienia bez przerwy). */
  koniecNiezdolnosci: ISODate;
  wykluczenia: WykluczeniePoUstaniu[];
  /** Brak informacji o świadczeniach wykluczających (UZ art. 13 ust. 1). */
  wykluczeniaNieznane: boolean;
}

export interface AnalizaZwolnienia {
  z: Zwolnienie;
  /** Ubezpieczenie chorobowe w dniu powstania niezdolności (najpierw z tytułu zwolnienia). */
  okres?: OkresUbezpieczenia;
  wyczekiwanie?: Wyczekiwanie;
  /** Część zwolnienia po ustaniu tytułu ubezpieczenia (R-PU-*). */
  poUstaniu?: PoUstaniu;
  /** Kolejne dni zwolnienia pogrupowane wg rodzaju, chronologicznie. */
  zakresy: Zakres[];
  /** Niezdolność w ciąży stwierdzona kodem B. */
  ciaza: boolean;
  /** Okres zasiłkowy: 270 dni z kodem B, inaczej 182 (UZ art. 8 ust. 1). */
  limitOkresuZasilkowego: number;
  /** Dni okresu zasiłkowego wykorzystane łącznie z tym zwolnieniem. */
  wykorzystaneDni: number;
  /** Dni zasiłku za okres po ustaniu tytułu łącznie z tym zwolnieniem (limit 91 dni poza ciążą). */
  dniPoUstaniu: number;
  /** Okres zasiłkowy liczy się od nowa mimo przerwy ≤ 60 dni (UZ art. 9 ust. 2 zd. 2). */
  odNowaWCiazy: boolean;
}

/** Czy w danym dniu obowiązuje jeden okres zasiłkowy niezależnie od liczby tytułów (UZ art. 9 ust. 4; parametr niepotwierdzony, OK-8). */
export function jedenOkresZasilkowy(k: KontekstOceny, dzien: ISODate): boolean {
  return porownaj(dzien, k.param('dataJednegoOkresuZasilkowego')) >= 0;
}

/**
 * Przebieg wszystkich zwolnień dzień po dniu, chronologicznie: okres wyczekiwania, urlop bezpłatny
 * i wychowawczy, limit dni wynagrodzenia chorobowego w roku kalendarzowym (KP art. 92 § 1, § 4),
 * okres zasiłkowy (UZ art. 8–9) i zasiłek po ustaniu tytułu (UZ art. 7, art. 8 ust. 2, art. 13).
 */
export function analizaZwolnien(k: KontekstOceny): AnalizaZwolnienia[] {
  const w = k.wejscie;
  const limitWynagrodzenia = k.param(w.wiek50Wczesniej ? 'dniWynagrodzeniaChorobowego50' : 'dniWynagrodzeniaChorobowego');
  const wynagrodzenieWRoku = new Map<number, number>([[czesciDaty(w.dzis).rok, w.dniWynagrodzeniaChorobowegoWRoku ?? 0]]);
  const maksPrzerwa = k.param('przerwaLaczacaOkresZasilkowy');
  const zwolnienia = [...w.zwolnienia].sort((a, b) => porownaj(a.od, b.od));
  const gotowe: AnalizaZwolnienia[] = [];

  for (const z of zwolnienia) {
    const ciaza = niezdolnoscWCiazy(z);
    const limit = k.param(ciaza ? 'okresZasilkowyCiazaDni' : 'okresZasilkowyDni');
    const poprzedni = poprzedniWOkresie(z);
    const odNowaWCiazy = poprzedni !== undefined && ciaza && !poprzedni.ciaza && przerwa(poprzedni.z, z) > 0;
    let wykorzystane = poprzedni && !odNowaWCiazy ? poprzedni.wykorzystaneDni : 0;
    let dniPoUstaniu = poprzedni && !odNowaWCiazy ? poprzedni.dniPoUstaniu : 0;
    const limitPoUstaniu = ciaza ? Number.POSITIVE_INFINITY : k.param('okresZasilkowyPoUstaniuDni');

    const okres =
      okresWDniu(
        k.okresy.filter((o) => o.tytul === z.tytul),
        z.od,
      ) ?? okresWDniu(k.okresy, z.od);
    const wycz = okres ? wyczekiwanie(k, okres, z.od) : undefined;
    const poUstaniu = ustalPoUstaniu(z, okres, wycz, wykorzystane >= limit);
    const baza = { z, ciaza, limitOkresuZasilkowego: limit, odNowaWCiazy };
    if (!okres && !poUstaniu) {
      gotowe.push({ ...baza, zakresy: [], wykorzystaneDni: wykorzystane, dniPoUstaniu });
      continue;
    }

    const zakresy: Zakres[] = [];
    for (let d = z.od; porownaj(d, z.do) <= 0; d = dodajDni(d, 1)) {
      const rodzaj = rodzajDnia(d);
      if (WLICZANE.includes(rodzaj)) wykorzystane += 1;
      if (rodzaj === 'zasilek' && poUstaniu && porownaj(d, poUstaniu.od) >= 0) dniPoUstaniu += 1;
      dopisz(zakresy, d, rodzaj);
    }
    gotowe.push({
      ...baza,
      ...(okres ? { okres } : {}),
      ...(wycz ? { wyczekiwanie: wycz } : {}),
      ...(poUstaniu ? { poUstaniu } : {}),
      zakresy,
      wykorzystaneDni: wykorzystane,
      dniPoUstaniu,
    });

    function rodzajDnia(d: ISODate): RodzajDnia {
      if (wycz && porownaj(d, wycz.dzienNabycia) < 0) return 'bez_prawa';
      const poUstaniuDnia = poUstaniu !== undefined && porownaj(d, poUstaniu.od) >= 0;
      if (poUstaniuDnia && (poUstaniu.wykluczenia.length > 0 || (poUstaniu.art7 ?? 'spelniony') !== 'spelniony')) return 'bez_prawa';
      if (z.wTrakcieUrlopuBezplatnegoLubWychowawczego || wUrlopie(k, d)) return 'urlop';
      if (wykorzystane >= limit) return 'wyczerpany';
      if (poUstaniuDnia) return dniPoUstaniu >= limitPoUstaniu ? 'limit_po_ustaniu' : 'zasilek';
      if (!okres || !pracownica(okres.tytul)) return 'zasilek';
      const rok = czesciDaty(d).rok;
      const uzyte = wynagrodzenieWRoku.get(rok) ?? 0;
      if (uzyte >= limitWynagrodzenia) return 'zasilek';
      wynagrodzenieWRoku.set(rok, uzyte + 1);
      return 'wynagrodzenie';
    }
  }
  return gotowe;

  /**
   * Ostatnie wcześniejsze zwolnienie z przerwą ≤ 60 dni (do 2026 r. – z tego samego tytułu; od 2027 r. – z każdego).
   * Datę zmiany czyta tylko, gdy w zasięgu jest zwolnienie z innego tytułu, bo tylko wtedy wpływa na wynik.
   */
  function poprzedniWOkresie(z: Zwolnienie): AnalizaZwolnienia | undefined {
    const wczesniejsze = gotowe.filter((a) => porownaj(a.z.do, z.od) < 0 && przerwa(a.z, z) <= maksPrzerwa);
    const jedenOkres = wczesniejsze.some((a) => a.z.tytul !== z.tytul) && jedenOkresZasilkowy(k, z.od);
    const kandydat = gotowe.filter((a) => (jedenOkres || a.z.tytul === z.tytul) && porownaj(a.z.do, z.od) < 0).at(-1);
    return kandydat && przerwa(kandydat.z, z) <= maksPrzerwa ? kandydat : undefined;
  }

  /** Ostatni dzień nieprzerwanej niezdolności od zwolnienia `z` (kolejne zwolnienia dzień po dniu). */
  function koniecNiezdolnosci(z: Zwolnienie): ISODate {
    let koniec = z.do;
    for (const n of zwolnienia) {
      if (porownaj(n.od, z.od) > 0 && porownaj(n.od, dodajDni(koniec, 1)) <= 0 && porownaj(n.do, koniec) > 0) koniec = n.do;
    }
    return koniec;
  }

  function ustalPoUstaniu(
    z: Zwolnienie,
    okres: OkresUbezpieczenia | undefined,
    wycz: Wyczekiwanie | undefined,
    wyczerpanyPrzed: boolean,
  ): PoUstaniu | undefined {
    const koniec = koniecNiezdolnosci(z);
    if (okres) {
      if (okres.do === undefined || porownaj(z.do, okres.do) <= 0) return undefined;
      return {
        okres: { ...okres, do: okres.do },
        od: dodajDni(okres.do, 1),
        trwaZUbezpieczenia: true,
        koniecNiezdolnosci: koniec,
        ...wykluczenia(wycz !== undefined && porownaj(wycz.dzienNabycia, okres.do) > 0, wyczerpanyPrzed),
      };
    }
    const niepuste = k.okresy.filter((o) => o.do === undefined || porownaj(o.od, o.do) <= 0);
    const ustaly = ostatniZakonczonyPrzed(niepuste, z.od);
    if (!ustaly) return undefined;
    const art7 =
      porownaj(z.od, dodajDni(ustaly.do, k.param('dniNaNiezdolnoscPoUstaniu'))) > 0
        ? 'za_pozno'
        : dniWlacznie(z.od, koniec) < k.param('minimalnaNiezdolnoscPoUstaniu')
          ? 'za_krotko'
          : 'spelniony';
    const nabycie = wyczekiwanie(k, ustaly, ustaly.do).dzienNabycia;
    return {
      okres: ustaly,
      od: z.od,
      trwaZUbezpieczenia: false,
      art7,
      koniecNiezdolnosci: koniec,
      ...wykluczenia(porownaj(nabycie, ustaly.do) > 0, wyczerpanyPrzed),
    };
  }

  function wykluczenia(bezNabyciaPrawa: boolean, wyczerpanyPrzed: boolean): Pick<PoUstaniu, 'wykluczenia' | 'wykluczeniaNieznane'> {
    const s = w.swiadczeniaWykluczajace;
    const lista: WykluczeniePoUstaniu[] = [];
    if (s?.emeryturaLubRenta) lista.push('emerytura_lub_renta');
    if (s?.nowyTytulPoUstaniu) lista.push('nowy_tytul');
    if (bezNabyciaPrawa) lista.push('brak_wyczekiwania');
    if (s?.zasilekDlaBezrobotnychLubPrzedemerytalny) lista.push('zasilek_dla_bezrobotnych');
    if (s?.rodzicielskieSwiadczenieUzupelniajace) lista.push('rodzicielskie_swiadczenie_uzupelniajace');
    if (s?.krus) lista.push('krus');
    if (wyczerpanyPrzed) lista.push('wyczerpany_przed_ustaniem');
    return { wykluczenia: lista, wykluczeniaNieznane: s === undefined };
  }
}

/** Liczba dni między końcem poprzedniej a początkiem kolejnej niezdolności (0 = bezpośrednio po sobie). */
function przerwa(poprzednie: Zwolnienie, kolejne: Zwolnienie): number {
  return roznicaDni(poprzednie.do, kolejne.od) - 1;
}

function dopisz(zakresy: Zakres[], dzien: ISODate, rodzaj: RodzajDnia): void {
  const ostatni = zakresy[zakresy.length - 1];
  if (ostatni && ostatni.rodzaj === rodzaj && dodajDni(ostatni.do, 1) === dzien) ostatni.do = dzien;
  else zakresy.push({ rodzaj, od: dzien, do: dzien });
}
