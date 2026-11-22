/**
 * Okresy zasiłku bez stawek i kwot: kto, kiedy i za jaki urlop. Macierzyński (na warunkach macierzyńskiego)
 * i uzupełniający wynikają z wymiarów (okres i podział przy przejęciu). Rodzicielski i ojcowski pochodzą
 * z planu rodziny, a bez planu dla danego urlopu silnik liczy maksimum: rodzicielski bezpośrednio po
 * macierzyńskim / uzupełniającym (rodzic wnioskujący — maksimum jednego rodzica, potem drugi rodzic —
 * jego część nieprzenoszalna), ojcowski od dnia porodu / przyjęcia. Plan jest sprawdzany względem wymiaru,
 * części, terminu i limitów łączenia z pracą (KP art. 182¹ᵃ–182¹ᶠ, art. 182³).
 */

import { dniWlacznie, dodajDni, najwczesniejsza, porownaj } from '../../wspolne/daty';
import { procentTekst } from '../../wspolne/kwoty';
import type { ISODate, PodstawaPrawna, RodzajUrlopu, RolaRodzica, Ulamek } from '../../typy';
import type { OkresPlanowany, Rodzic, WejscieUrlopow, WymiarUrlopu } from '../index';
import type { Kontekst } from '../kontekst';
import type { Wymiary } from '../wymiary';

export interface OkresBazowy {
  rodzaj: RodzajUrlopu;
  rodzic: RolaRodzica;
  od: ISODate;
  do: ISODate;
  dni: number;
  wymiarPracy?: Ulamek;
}

export interface Rozplanowanie {
  okresy: OkresBazowy[];
  /** Rodzic, który pobiera zasiłek za macierzyński i składa wniosek z UZ art. 30a; drugi rodzic ma 9 tyg. z art. 31 ust. 3f. */
  wnioskodawca: RolaRodzica | undefined;
}

const okresBazowy = (rodzaj: RodzajUrlopu, rodzic: RolaRodzica, od: ISODate, do_: ISODate, wymiarPracy?: Ulamek): OkresBazowy => ({
  rodzaj,
  rodzic,
  od,
  do: do_,
  dni: dniWlacznie(od, do_),
  ...(wymiarPracy && wymiarPracy.licznik > 0 ? { wymiarPracy } : {}),
});

/** Udział dnia urlopu w puli wymiaru: 1 − wymiar pracy (KP art. 182¹ᶠ). */
export const zuzycieDnia = (w?: Ulamek): number => (w ? (w.mianownik - w.licznik) / w.mianownik : 1);

export function rozplanuj(wejscie: WejscieUrlopow, wymiary: Wymiary, dataZdarzenia: ISODate, k: Kontekst): Rozplanowanie {
  const rodzic = (rola: RolaRodzica): Rodzic | undefined => wejscie.rodzice.find((r) => r.rola === rola);
  const ubezpieczony = (rola: RolaRodzica): boolean => rodzic(rola)?.ubezpieczony === true;
  const nieubezpieczeni = new Set<RolaRodzica>();
  const tylkoUbezpieczeni = (o: OkresBazowy): boolean => {
    if (ubezpieczony(o.rodzic)) return true;
    nieubezpieczeni.add(o.rodzic);
    return false;
  };
  const plan = wejscie.plan ?? [];
  const zPlanu = (rodzaj: RodzajUrlopu) => plan.filter((o) => o.rodzaj === rodzaj);

  const glowny: WymiarUrlopu | undefined = wymiary.macierzynski ?? wymiary.naWarunkachMacierzynskiego;
  const pierwszyUbezpieczony = ubezpieczony('matka') ? 'matka' : wejscie.rodzice.find((r) => r.ubezpieczony && r.rola !== 'inny')?.rola;
  const wnioskodawca: RolaRodzica | undefined =
    glowny?.rodzaj === 'naWarunkachMacierzynskiego' ? (zPlanu('naWarunkachMacierzynskiego')[0]?.rodzic ?? pierwszyUbezpieczony) : pierwszyUbezpieczony;
  const wlascicielGlownego: RolaRodzica = glowny?.rodzaj === 'macierzynski' ? 'matka' : (wnioskodawca ?? 'matka');

  const okresy: OkresBazowy[] = [];
  if (glowny?.przysluguje && glowny.okres) {
    const czesci = glowny.podzial ?? [{ rodzic: wlascicielGlownego, ...glowny.okres }];
    okresy.push(...czesci.map((c) => okresBazowy(glowny.rodzaj, c.rodzic, c.od, c.do)).filter(tylkoUbezpieczeni));
  }

  const uzupelniajacy = wymiary.uzupelniajacyMacierzynski;
  if (uzupelniajacy?.przysluguje && uzupelniajacy.okres) {
    const ostatni = glowny?.podzial?.at(-1)?.rodzic ?? wlascicielGlownego;
    const kto = zPlanu('uzupelniajacyMacierzynski')[0]?.rodzic ?? ostatni;
    okresy.push(...[okresBazowy('uzupelniajacyMacierzynski', kto, uzupelniajacy.okres.od, uzupelniajacy.okres.do)].filter(tylkoUbezpieczeni));
  }

  const koniecPoprzedniego = uzupelniajacy?.okres?.do ?? glowny?.okres?.do ?? dodajDni(dataZdarzenia, -1);
  // Bez planu rodzicielski zaczyna osoba, która kończy macierzyński (np. ojciec po zgonie matki); inny członek rodziny go nie ma.
  const ostatni = okresy.at(-1)?.rodzic;
  const pierwszy = ostatni !== undefined && ostatni !== 'inny' ? ostatni : wnioskodawca;
  okresy.push(...rodzicielski(zPlanu('rodzicielski'), wymiary.rodzicielski, wejscie, pierwszy, koniecPoprzedniego, k).filter(tylkoUbezpieczeni));
  okresy.push(...ojcowski(zPlanu('ojcowski'), wymiary.ojcowski, dataZdarzenia, k).filter(tylkoUbezpieczeni));

  for (const rola of nieubezpieczeni) {
    k.ostrzezenia.push({
      kod: 'RODZIC_NIEUBEZPIECZONY',
      komunikat: `Osoba w roli „${rola}” nie podlega ubezpieczeniu chorobowemu albo brak jej danych: zasiłek macierzyński jej nie przysługuje, pomijam jej okresy.`,
      podstawaPrawna: ['UZ art. 29 ust. 1'],
    });
  }
  return { okresy, wnioskodawca };
}

function ostrzezNiePrzysluguje(rodzaj: RodzajUrlopu, podstawaPrawna: PodstawaPrawna[], k: Kontekst): void {
  k.ostrzezenia.push({
    kod: 'URLOP_NIE_PRZYSLUGUJE',
    komunikat: `Plan obejmuje urlop (${rodzaj}), który w tej sytuacji nie przysługuje. Pomijam te okresy.`,
    podstawaPrawna,
  });
}

function rodzicielski(
  plan: OkresPlanowany[],
  wymiar: WymiarUrlopu | undefined,
  wejscie: WejscieUrlopow,
  pierwszy: RolaRodzica | undefined,
  koniecPoprzedniego: ISODate,
  k: Kontekst,
): OkresBazowy[] {
  if (!wymiar?.przysluguje) {
    if (plan.length > 0) ostrzezNiePrzysluguje('rodzicielski', wymiar?.podstawaPrawna ?? [], k);
    return [];
  }
  if (wymiar.terminWykorzystania)
    k.ostrzezenia.push({
      kod: 'TERMIN_RODZICIELSKIEGO',
      komunikat: `Urlop rodzicielski można wykorzystać jednorazowo albo najwyżej w ${wymiar.maksCzesci ?? ''} częściach (łącznie dla obojga rodziców), najpóźniej do ${wymiar.terminWykorzystania}.`,
      podstawaPrawna: ['KP art. 182¹ᶜ', 'KP art. 182¹ᵈ § 2'],
      termin: wymiar.terminWykorzystania,
    });

  if (plan.length === 0) return maksimumRodzicielskiego(wymiar, wejscie, pierwszy, koniecPoprzedniego);

  sprawdzPlanRodzicielskiego(plan, wymiar, wejscie, k);
  return plan
    .map((o) => okresBazowy('rodzicielski', o.rodzic, o.od, o.do, o.wymiarPracy))
    .sort((a, b) => porownaj(a.od, b.od));
}

function maksimumRodzicielskiego(
  wymiar: WymiarUrlopu,
  wejscie: WejscieUrlopow,
  pierwszy: RolaRodzica | undefined,
  koniecPoprzedniego: ISODate,
): OkresBazowy[] {
  if (pierwszy === undefined) return [];
  const okresy: OkresBazowy[] = [];
  let od = dodajDni(koniecPoprzedniego, 1);
  const dodaj = (rodzic: RolaRodzica, tygodnie: number) => {
    let do_ = dodajDni(od, tygodnie * 7 - 1);
    if (wymiar.terminWykorzystania) {
      if (porownaj(od, wymiar.terminWykorzystania) > 0) return;
      do_ = najwczesniejsza(do_, wymiar.terminWykorzystania);
    }
    okresy.push(okresBazowy('rodzicielski', rodzic, od, do_));
    od = dodajDni(do_, 1);
  };
  dodaj(pierwszy, wymiar.maksDlaJednegoRodzicaTygodnie ?? wymiar.tygodnie);
  const drugi = wejscie.rodzice.find((r) => r.ubezpieczony && r.rola !== pierwszy && r.rola !== 'inny');
  if (drugi && wymiar.tygodnieNieprzenoszalne) dodaj(drugi.rola, wymiar.tygodnieNieprzenoszalne);
  return okresy;
}

function sprawdzPlanRodzicielskiego(plan: OkresPlanowany[], wymiar: WymiarUrlopu, wejscie: WejscieUrlopow, k: Kontekst): void {
  const maksPracy = k.param('maksWymiarPracyPrzyLaczeniu');
  const zuzycieRodzica = new Map<RolaRodzica, number>();
  let zuzycie = 0;
  let kalendarzowe = 0;
  for (const o of plan) {
    const dni = dniWlacznie(o.od, o.do);
    const u = dni * zuzycieDnia(o.wymiarPracy);
    zuzycie += u;
    kalendarzowe += dni;
    zuzycieRodzica.set(o.rodzic, (zuzycieRodzica.get(o.rodzic) ?? 0) + u);
    if (o.wymiarPracy && o.wymiarPracy.licznik > 0) {
      if (o.wymiarPracy.licznik * 1000 > maksPracy * o.wymiarPracy.mianownik)
        k.ostrzezenia.push({
          kod: 'LACZENIE_PONAD_LIMIT_ETATU',
          komunikat: `Urlop rodzicielski można łączyć z pracą w wymiarze najwyżej ${procentTekst(maksPracy)} etatu.`,
          podstawaPrawna: ['KP art. 182¹ᵉ § 1'],
        });
      if (wejscie.rodzice.find((r) => r.rola === o.rodzic)?.pracownik !== true)
        k.ostrzezenia.push({
          kod: 'LACZENIE_TYLKO_PRACOWNIK',
          komunikat: 'Łączenie urlopu rodzicielskiego z pracą z proporcjonalnym zmniejszeniem zasiłku dotyczy pracownika u pracodawcy udzielającego urlopu. Wynik jest orientacyjny.',
          podstawaPrawna: ['KP art. 182¹ᵉ § 1', 'UZ art. 31 ust. 4a'],
        });
    }
    if (wymiar.terminWykorzystania && porownaj(o.do, wymiar.terminWykorzystania) > 0)
      k.ostrzezenia.push({
        kod: 'RODZICIELSKI_PO_TERMINIE',
        komunikat: `Okres urlopu rodzicielskiego od ${o.od} do ${o.do} wykracza poza termin wykorzystania (${wymiar.terminWykorzystania}).`,
        podstawaPrawna: ['KP art. 182¹ᶜ'],
        termin: wymiar.terminWykorzystania,
      });
  }
  const eps = 1e-9;
  if (zuzycie > wymiar.dni + eps)
    k.ostrzezenia.push({
      kod: 'RODZICIELSKI_PONAD_WYMIAR',
      komunikat: `Plan wykorzystuje więcej niż ${wymiar.tygodnie} tygodni urlopu rodzicielskiego przysługujących łącznie obojgu rodzicom.`,
      podstawaPrawna: ['KP art. 182¹ᵃ § 3', 'KP art. 182¹ᶠ'],
    });
  if (kalendarzowe > 2 * wymiar.dni)
    k.ostrzezenia.push({
      kod: 'LACZENIE_PONAD_LIMIT_TYGODNI',
      komunikat: `Przy łączeniu z pracą urlop rodzicielski może trwać najwyżej ${2 * wymiar.tygodnie} tygodni.`,
      podstawaPrawna: ['KP art. 182¹ᶠ § 1–1¹'],
    });
  const maksRodzica = (wymiar.maksDlaJednegoRodzicaTygodnie ?? wymiar.tygodnie) * 7;
  for (const [rola, u] of zuzycieRodzica)
    if (u > maksRodzica + eps)
      k.ostrzezenia.push({
        kod: 'RODZICIELSKI_PONAD_LIMIT_RODZICA',
        komunikat: `Jeden rodzic (${rola}) może wykorzystać najwyżej ${maksRodzica / 7} tygodni urlopu rodzicielskiego; ${wymiar.tygodnieNieprzenoszalne ?? 0} tygodni należy wyłącznie do drugiego rodzica.`,
        podstawaPrawna: ['KP art. 182¹ᵃ § 4'],
      });
  if (wymiar.maksCzesci !== undefined && plan.length > wymiar.maksCzesci)
    k.ostrzezenia.push({
      kod: 'RODZICIELSKI_ZA_DUZO_CZESCI',
      komunikat: `Plan dzieli urlop rodzicielski na ${plan.length} części, a obojgu rodzicom łącznie przysługuje najwyżej ${wymiar.maksCzesci}.`,
      podstawaPrawna: ['KP art. 182¹ᶜ', 'KP art. 182¹ᵈ § 2'],
    });
}

function ojcowski(plan: OkresPlanowany[], wymiar: WymiarUrlopu | undefined, dataZdarzenia: ISODate, k: Kontekst): OkresBazowy[] {
  if (!wymiar?.przysluguje) {
    if (plan.length > 0) ostrzezNiePrzysluguje('ojcowski', wymiar?.podstawaPrawna ?? [], k);
    return [];
  }
  if (plan.length === 0) return [okresBazowy('ojcowski', 'ojciec', dataZdarzenia, dodajDni(dataZdarzenia, wymiar.dni - 1))];

  const okresy = plan.map((o) => okresBazowy('ojcowski', o.rodzic, o.od, o.do)).sort((a, b) => porownaj(a.od, b.od));
  const minimum = k.param('minimalnaCzescOjcowskiegoTygodnie') * 7;
  const naruszenia: string[] = [];
  if (okresy.some((o) => o.rodzic !== 'ojciec')) naruszenia.push('przysługuje tylko ojcu dziecka');
  if (wymiar.maksCzesci !== undefined && okresy.length > wymiar.maksCzesci) naruszenia.push(`można go podzielić najwyżej na ${wymiar.maksCzesci} części`);
  if (okresy.some((o) => o.dni < minimum)) naruszenia.push(`każda część musi trwać co najmniej ${minimum / 7} tydzień`);
  if (okresy.reduce((s, o) => s + o.dni, 0) > wymiar.dni) naruszenia.push(`trwa łącznie najwyżej ${wymiar.tygodnie} tygodnie`);
  if (wymiar.terminWykorzystania && okresy.some((o) => porownaj(o.do, wymiar.terminWykorzystania!) > 0))
    naruszenia.push(`trzeba go wykorzystać do ${wymiar.terminWykorzystania}`);
  if (naruszenia.length > 0)
    k.ostrzezenia.push({
      kod: 'OJCOWSKI_NIEZGODNY_Z_PRZEPISAMI',
      komunikat: `Plan urlopu ojcowskiego jest niezgodny z przepisami: urlop ${naruszenia.join(', ')}.`,
      podstawaPrawna: ['KP art. 182³ § 1–1¹'],
      ...(wymiar.terminWykorzystania ? { termin: wymiar.terminWykorzystania } : {}),
    });
  return okresy;
}
