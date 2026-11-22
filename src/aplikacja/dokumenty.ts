/**
 * Dokumenty, adresaci i terminy według macierzy z docs/research/sciezka-dokumentow.md (issue #5):
 * kto wypłaca (płatnik albo ZUS), co złożyć, gdzie i do kiedy. Terminy liczone od okresów z silnika.
 */

import type { ISODate, OkresZasilku, TytulUbezpieczenia } from '@/silnik';
import { dodajDni, dodajMiesiace, porownaj, roznicaDni } from '@/silnik/wspolne/daty';
import { data as dataTekst } from './format';
import type { Rozpatrzenie } from './rozpatrz';
import { drugaRola, jestPracownikiem, type PlanRodzica, type Rola, type Sytuacja } from './sytuacja';

export type KodSciezki = 'A' | 'B' | 'C';

export interface Sciezka {
  kod: KodSciezki;
  wyplaca: 'płatnik' | 'ZUS';
  opis: string;
}

export type StatusTerminu = 'minal' | 'pilne' | 'zaplanowane' | 'bez_terminu';

export interface PozycjaDokumentu {
  id: string;
  kto: Rola;
  tytul: string;
  /** Gdzie złożyć. */
  adresat: string;
  /** Co przygotować albo dołączyć. */
  zalaczniki: string[];
  termin?: ISODate;
  terminOpis: string;
  status: StatusTerminu;
  podstawaPrawna: string[];
  /** Oficjalny formularz (lokalny PDF z ZUS) albo strona, gdzie załatwić sprawę; `etykieta` opisuje link. */
  formularz?: { kod: string; pdf?: string; link?: string; etykieta?: string };
  uwaga?: string;
}

export const PDF = {
  ZAM: '/forms/ZAM_edytowalny.pdf',
  'ZAS-53': '/forms/ZAS-53_edytowalny.pdf',
  'Z-3': '/forms/Z-3_do-druku.pdf',
  'Z-3a': '/forms/Z-3a_do-druku.pdf',
  'ZAS-12': '/forms/ZAS-12_do-druku.pdf',
} as const;

const ZUS_CHOROBOWY = 'https://www.zus.pl/wzory-formularzy/zasilki/zasilek-chorobowy';
const ZAM = { kod: 'ZAM', pdf: PDF.ZAM, link: 'https://www.zus.pl/wzory-formularzy/zasilki/zasilek-macierzynski', etykieta: 'Strona formularza w ZUS' };
/** Wniosek o urlop pracownika nie ma urzędowego wzoru: jego treść określa rozporządzenie (Dz.U. 2025 poz. 322). */
const WNIOSEK_URLOPOWY = { kod: 'Wniosek urlopowy', link: 'https://eli.gov.pl/eli/DU/2025/322/ogl', etykieta: 'Co musi zawierać (przepis)' };

export function sciezka(tytul: TytulUbezpieczenia, ponad20: boolean | null, poUstaniu = false): Sciezka {
  if (tytul === 'dzialalnosc' || tytul === 'osoba_wspolpracujaca' || poUstaniu)
    return { kod: 'C', wyplaca: 'ZUS', opis: 'Wniosek składasz bezpośrednio w ZUS (eZUS, placówka albo poczta). ZUS ustala prawo i wypłaca zasiłek.' };
  const zaswiadczenie = tytul === 'umowa_o_prace' ? 'Z-3' : 'Z-3a';
  if (ponad20 === false)
    return {
      kod: 'B',
      wyplaca: 'ZUS',
      opis: `Wniosek składasz u płatnika składek. Płatnik zatrudnia do 20 osób, więc w ciągu 7 dni przekazuje go do ZUS razem z zaświadczeniem ${zaswiadczenie}, a zasiłek wypłaca ZUS.`,
    };
  if (ponad20 === true)
    return { kod: 'A', wyplaca: 'płatnik', opis: 'Płatnik składek zgłasza do ubezpieczenia ponad 20 osób, więc sam ustala prawo i wypłaca zasiłek razem z wynagrodzeniem.' };
  return {
    kod: 'A',
    wyplaca: 'płatnik',
    opis: `Wniosek składasz u płatnika składek. Jeśli zgłasza on do 20 osób, przekaże wniosek do ZUS z ${zaswiadczenie} w ciągu 7 dni i zasiłek wypłaci ZUS.`,
  };
}

export function statusTerminu(termin: ISODate | undefined, dzis: ISODate): StatusTerminu {
  if (!termin) return 'bez_terminu';
  if (porownaj(termin, dzis) < 0) return 'minal';
  if (roznicaDni(dzis, termin) <= 14) return 'pilne';
  return 'zaplanowane';
}

const POUSTANIOWE = new Set(['upadlosc_pracodawcy', 'likwidacja_pracodawcy', 'smierc_pracodawcy', 'naruszenie_prawa_prawomocny_wyrok']);

interface DaneRodzica {
  rola: Rola;
  tytul: TytulUbezpieczenia;
  adresat: string;
  sciezka: Sciezka;
}

function daneRodzicow(s: Sytuacja): Map<Rola, DaneRodzica> {
  const m = new Map<Rola, DaneRodzica>();
  const poUstaniu = s.ustanie ? POUSTANIOWE.has(s.ustanie.przyczyna) : false;
  const sc = sciezka(s.tytul, s.platnik.ponad20, poUstaniu);
  const kogo = s.tytul === 'umowa_zlecenia' ? 'Zleceniodawca' : 'Pracodawca';
  m.set(s.rola, {
    rola: s.rola,
    tytul: s.tytul,
    sciezka: sc,
    adresat: sc.kod === 'C' ? 'ZUS: eZUS, placówka albo poczta' : `${kogo}: ${s.platnik.nazwa || 'Twój płatnik składek'}${sc.kod === 'B' ? ' (przekaże do ZUS)' : ''}`,
  });
  const d = s.drugiRodzic;
  if (d?.ubezpieczony) {
    const scd = sciezka(d.tytul, d.ponad20 ?? null);
    m.set(drugaRola(s.rola), {
      rola: drugaRola(s.rola),
      tytul: d.tytul,
      sciezka: scd,
      adresat:
        scd.kod === 'C'
          ? 'ZUS: eZUS, placówka albo poczta'
          : `${d.tytul === 'umowa_zlecenia' ? 'Zleceniodawca' : 'Pracodawca'} (${d.imie || 'drugi rodzic'})${scd.kod === 'B' ? ' – przekaże do ZUS' : ''}`,
    });
  }
  return m;
}

/** Kto wypłaca zasiłki danego rodzica (ścieżka A, B albo C); `null`, gdy rodzic nie ma ubezpieczenia. */
export const sciezkaRodzica = (s: Sytuacja, r: Rola): Sciezka | null => daneRodzicow(s).get(r)?.sciezka ?? null;

const imieRoli = (s: Sytuacja, r: Rola) => (r === s.rola ? s.osoba.imie || 'Ty' : s.drugiRodzic?.imie || (r === 'matka' ? 'mama' : 'tata'));

export function dokumenty(s: Sytuacja, plan: PlanRodzica, r: Rozpatrzenie, dzis: ISODate): PozycjaDokumentu[] {
  const lista: PozycjaDokumentu[] = [];
  const rodzice = daneRodzicow(s);
  const ja = rodzice.get(s.rola)!;
  const urodzenie = s.zdarzenie === 'urodzenie';
  const data = s.dataZdarzenia;
  const dodaj = (p: Omit<PozycjaDokumentu, 'status'>) => lista.push({ ...p, status: statusTerminu(p.termin, dzis) });
  const okresy = r.urlopy.okresy;
  const zaZyciemZal = s.zaZyciem ? ['Oświadczenie o zaświadczeniu „Za życiem” (pracownik do wniosku o urlop: kopia zaświadczenia)'] : [];

  // --- Ciąża: zasiłek chorobowy (e-ZLA z kodem B) ---
  if (urodzenie && s.rola === 'matka' && (s.etap === 'ciaza' || s.zwolnienia.length > 0)) {
    for (const z of s.zwolnienia) {
      const przedawnienie = dodajMiesiace(z.do, 6);
      if (ja.sciezka.kod === 'C')
        dodaj({
          id: `zas53-${z.od}`,
          kto: s.rola,
          tytul: `Wniosek o zasiłek chorobowy za zwolnienie ${dataTekst(z.od)} – ${dataTekst(z.do)}${z.kodB ? ' (kod B, 100%)' : ''}`,
          adresat: 'ZUS: eZUS albo placówka',
          zalaczniki: ['e-ZLA trafia do ZUS automatycznie', 'Bez zaświadczenia Z-3b (zlikwidowane 24.10.2026)'],
          termin: przedawnienie,
          terminOpis: 'najpóźniej 6 miesięcy od końca zwolnienia (przedawnienie)',
          podstawaPrawna: ['UZ art. 61b ust. 2 pkt 2', 'UZ art. 67'],
          formularz: { kod: 'ZAS-53', pdf: PDF['ZAS-53'], link: ZUS_CHOROBOWY, etykieta: 'Strona formularza w ZUS' },
        });
      else
        dodaj({
          id: `ezla-${z.od}`,
          kto: s.rola,
          tytul: `Zwolnienie ${dataTekst(z.od)} – ${dataTekst(z.do)}${z.kodB ? ' z kodem B (100%)' : ''}: nic nie musisz składać`,
          adresat: ja.adresat,
          zalaczniki: [
            'Lekarz wysyła e-ZLA do ZUS i na profil płatnika w eZUS',
            ja.sciezka.kod === 'B' ? `Płatnik przekazuje do ZUS zaświadczenie ${ja.tytul === 'umowa_o_prace' ? 'Z-3' : 'Z-3a'} w ciągu 7 dni` : 'Płatnik wypłaca świadczenie razem z wynagrodzeniem',
          ],
          terminOpis: 'zawiadom pracodawcę o nieobecności zgodnie z regulaminem pracy',
          podstawaPrawna: ['UZ art. 61b ust. 2 pkt 1', 'UZ art. 61b ust. 5'],
          ...(ja.sciezka.kod === 'B' ? { formularz: { kod: ja.tytul === 'umowa_o_prace' ? 'Z-3' : 'Z-3a', pdf: ja.tytul === 'umowa_o_prace' ? PDF['Z-3'] : PDF['Z-3a'] } } : {}),
        });
    }
    if (s.etap === 'ciaza' && jestPracownikiem(s.tytul))
      dodaj({
        id: 'macierzynski-przed-porodem',
        kto: s.rola,
        tytul: 'Opcjonalnie: wniosek o część urlopu macierzyńskiego przed porodem (do 6 tygodni)',
        adresat: ja.adresat,
        zalaczniki: ['Zaświadczenie lekarskie o przewidywanej dacie porodu'],
        termin: dodajDni(data, -42 - 14),
        terminOpis: 'co najmniej 14 dni przed planowanym rozpoczęciem (najwcześniej 6 tygodni przed porodem)',
        podstawaPrawna: ['KP art. 180 § 2', 'RWn § 2'],
      });
  }

  // --- Zasiłek w wysokości zasiłku macierzyńskiego po upadłości, likwidacji albo śmierci pracodawcy ---
  if (r.zwm)
    dodaj({
      id: 'zasilek-do-porodu',
      kto: s.rola,
      tytul: 'Wniosek o zasiłek w wysokości zasiłku macierzyńskiego (do dnia porodu)',
      adresat: 'ZUS: eZUS, placówka albo poczta',
      zalaczniki: [
        'Zaświadczenie płatnika Z-3 od byłego pracodawcy (albo syndyka lub likwidatora)',
        'Świadectwo pracy albo inny dokument z przyczyną rozwiązania umowy',
        'Zaświadczenie lekarskie potwierdzające ciążę',
      ],
      terminOpis: 'jak najszybciej po rozwiązaniu umowy; prawo przedawnia się 6 miesięcy po okresie, za który przysługuje',
      podstawaPrawna: r.zwm.podstawaPrawna,
      formularz: { kod: 'ZUS', link: 'https://www.zus.pl/wzory-formularzy/zasilki', etykieta: 'Formularze zasiłkowe ZUS' },
    });

  // --- Zgłoszenie urodzenia i odpis aktu ---
  if (urodzenie) {
    dodaj({
      id: 'usc-zgloszenie',
      kto: s.rola,
      tytul: s.martweUrodzenie ? 'Zgłoszenie martwego urodzenia w USC' : 'Zgłoszenie urodzenia dziecka w USC (albo przez mObywatel / gov.pl)',
      adresat: 'Urząd stanu cywilnego',
      zalaczniki: ['Karta urodzenia trafia do USC ze szpitala'],
      termin: dodajDni(data, s.martweUrodzenie ? 3 : 21),
      terminOpis: s.martweUrodzenie ? '3 dni od sporządzenia karty martwego urodzenia' : '21 dni od dnia urodzenia',
      podstawaPrawna: ['Prawo o aktach stanu cywilnego art. 61'],
      formularz: { kod: 'USC', link: 'https://www.gov.pl/web/gov/zglos-urodzenie-dziecka', etykieta: 'Zgłoś w gov.pl' },
    });
    if (ja.sciezka.kod === 'A' || s.martweUrodzenie)
      dodaj({
        id: 'odpis',
        kto: s.rola,
        tytul: s.martweUrodzenie ? 'Odpis skrócony aktu urodzenia z adnotacją „urodziło się martwe”' : 'Odpis skrócony aktu urodzenia dla płatnika',
        adresat: 'Urząd stanu cywilnego (wniosek online)',
        zalaczniki: s.martweUrodzenie ? ['Gdy aktu nie sporządzono: zaświadczenie lekarza albo położnej o martwym urodzeniu'] : ['Płatnik wypłacający zasiłek potrzebuje odpisu; gdy płaci ZUS, wystarczą dane dziecka'],
        terminOpis: 'po sporządzeniu aktu urodzenia, razem z wnioskiem o zasiłek',
        podstawaPrawna: ['RDok § 13'],
        formularz: { kod: 'Odpis', link: 'https://www.gov.pl/web/gov/odpis-aktu-stanu-cywilnego-informacje-ogolne', etykieta: 'Odpis w gov.pl' },
      });
  }

  // --- Zasiłek za urlop macierzyński / na warunkach macierzyńskiego ---
  const glowne = okresy.filter((o) => o.rodzaj === 'macierzynski' || o.rodzaj === 'naWarunkachMacierzynskiego');
  const ostrz815 = r.urlopy.ostrzezenia.find((o) => o.kod === 'TERMIN_WNIOSKU_815');
  const termin815 = ostrz815?.termin ?? dodajDni(data, 21);
  for (const rola of new Set(glowne.map((o) => o.rodzic))) {
    if (rola === 'inny') continue;
    const d = rodzice.get(rola);
    if (!d) continue;
    const od = glowne.find((o) => o.rodzic === rola)!.od;
    const pracownik = jestPracownikiem(d.tytul);
    const naWarunkach = glowne[0]?.rodzaj === 'naWarunkachMacierzynskiego';
    const zal = [
      ...(naWarunkach
        ? ['Zaświadczenie sądu o wszczęciu postępowania o przysposobienie (albo orzeczenie, umowa ze starostą przy rodzinie zastępczej)', 'Oświadczenie o dacie przyjęcia dziecka']
        : s.martweUrodzenie
          ? []
          : [d.sciezka.kod === 'A' ? 'Odpis skrócony aktu urodzenia' : 'Dane dziecka zamiast odpisu aktu (ZUS pobierze akt z rejestru)']),
      ...(plan.wariant === '81_5' ? ['Wniosek o urlop macierzyński i rodzicielski w pełnym wymiarze (wariant 81,5%)'] : []),
      ...zaZyciemZal,
    ];
    const termin = naWarunkach ? (pracownik ? dodajDni(data, 7) : termin815) : plan.wariant === '81_5' ? termin815 : porownaj(od, dzis) > 0 ? od : undefined;
    dodaj({
      id: `zasilek-glowny-${rola}`,
      kto: rola,
      tytul: pracownik
        ? `Wniosek o urlop ${naWarunkach ? 'na warunkach urlopu macierzyńskiego' : 'macierzyński'} i zasiłek macierzyński`
        : `Wniosek ZAM o zasiłek macierzyński za okres ${naWarunkach ? 'urlopu na warunkach macierzyńskiego' : 'urlopu macierzyńskiego'}`,
      adresat: d.adresat,
      zalaczniki: zal,
      ...(termin ? { termin } : {}),
      terminOpis: naWarunkach && pracownik
        ? 'w ciągu 7 dni od przyjęcia dziecka (urlop zaczyna się najpóźniej 21. dnia)'
        : plan.wariant === '81_5'
          ? '81,5%: wniosek o pełny wymiar najpóźniej 21 dni po porodzie (przyjęciu dziecka)'
          : 'najlepiej od razu po porodzie; przedawnienie 6 miesięcy po końcu okresu',
      podstawaPrawna: naWarunkach ? ['KP art. 183 § 6', 'RDok § 16', 'UZ art. 30a'] : ['RDok § 13', 'UZ art. 30a', 'RWn § 2'],
      formularz: ZAM,
      ...(pracownik ? { uwaga: 'Pracownik składa wniosek urlopowy i o zasiłek razem, jednym pismem do pracodawcy. ZAM może wypełnić płatnik.' } : {}),
    });
  }

  // --- Uzupełniający urlop macierzyński ---
  const uzup = okresy.find((o) => o.rodzaj === 'uzupelniajacyMacierzynski');
  if (uzup && uzup.rodzic !== 'inny') {
    const d = rodzice.get(uzup.rodzic);
    const koniecMacierzynskiego = dodajDni(uzup.od, -1);
    if (d)
      dodaj({
        id: 'uzupelniajacy',
        kto: uzup.rodzic,
        tytul: 'Wniosek o uzupełniający urlop macierzyński (wcześniak, dziecko w szpitalu)',
        adresat: d.adresat,
        zalaczniki: ['Zaświadczenie ze szpitala (pobyt, tydzień ciąży albo masa urodzeniowa)', 'Oświadczenie, że drugi rodzic nie skorzysta z tego urlopu'],
        termin: jestPracownikiem(d.tytul) ? dodajDni(koniecMacierzynskiego, -21) : koniecMacierzynskiego,
        terminOpis: jestPracownikiem(d.tytul) ? 'co najmniej 21 dni przed końcem urlopu macierzyńskiego' : 'przed końcem zasiłku za urlop macierzyński',
        podstawaPrawna: ['KP art. 180² § 4–5', 'RDok § 26'],
        formularz: ZAM,
      });
  }

  // --- Urlop rodzicielski (każda część) ---
  const rodzicielskie = okresy.filter((o) => o.rodzaj === 'rodzicielski');
  rodzicielskie.forEach((o: OkresZasilku, i) => {
    if (o.rodzic === 'inny') return;
    const d = rodzice.get(o.rodzic);
    if (!d) return;
    const pracownik = jestPracownikiem(d.tytul);
    const objetyPelnymWymiarem = plan.wariant === '81_5' && i === 0 && glowne.some((g) => g.rodzic === o.rodzic && porownaj(dodajDni(g.do, 1), o.od) === 0);
    if (objetyPelnymWymiarem) return;
    const praca = o.wymiarPracy ? ` łączona z pracą (${o.wymiarPracy.licznik}/${o.wymiarPracy.mianownik} etatu)` : '';
    dodaj({
      id: `rodzicielski-${i}`,
      kto: o.rodzic,
      tytul: `${pracownik ? 'Wniosek o urlop rodzicielski' : 'Wniosek ZAM o zasiłek za okres urlopu rodzicielskiego'}: ${imieRoli(s, o.rodzic)}, ${dataTekst(o.od)} – ${dataTekst(o.do)}${praca}`,
      adresat: d.adresat,
      zalaczniki: [
        'Oświadczenie o drugim rodzicu (czy i kiedy korzysta z urlopu)',
        ...(pracownik ? ['Odpis aktu urodzenia, jeśli nie ma go w aktach osobowych'] : ['Oświadczenie o wcześniejszych częściach i płatnikach']),
        ...(o.wymiarPracy && pracownik ? ['Wniosek o podjęcie pracy w czasie urlopu (do ½ etatu)'] : []),
        ...zaZyciemZal,
      ],
      termin: pracownik ? dodajDni(o.od, -21) : dodajDni(o.od, -1),
      terminOpis: pracownik ? 'co najmniej 21 dni przed rozpoczęciem tej części' : 'przed rozpoczęciem tej części',
      podstawaPrawna: pracownik ? ['KP art. 182¹ᵈ § 1', 'RWn § 15', ...(o.wymiarPracy ? ['KP art. 182¹ᵉ § 2'] : [])] : ['RDok § 29–30'],
      formularz: pracownik ? WNIOSEK_URLOPOWY : ZAM,
    });
  });

  // --- Urlop ojcowski ---
  const oj = okresy.find((o) => o.rodzaj === 'ojcowski');
  const dOjca = rodzice.get('ojciec');
  if (oj && dOjca) {
    const pracownik = jestPracownikiem(dOjca.tytul);
    dodaj({
      id: 'ojcowski',
      kto: 'ojciec',
      tytul: `${pracownik ? 'Wniosek o urlop ojcowski' : 'Wniosek ZAM o zasiłek za okres urlopu ojcowskiego'}: ${dataTekst(oj.od)} – ${dataTekst(oj.do)}`,
      adresat: dOjca.adresat,
      zalaczniki: [urodzenie ? 'Odpis skrócony aktu urodzenia (gdy płaci ZUS: dane dziecka)' : 'Postanowienie sądu o przysposobieniu', 'Oświadczenie, czy korzystałeś już z urlopu ojcowskiego'],
      termin: pracownik ? dodajDni(oj.od, -7) : oj.od,
      terminOpis: pracownik ? 'co najmniej 7 dni przed rozpoczęciem' : 'przed rozpoczęciem urlopu',
      podstawaPrawna: pracownik ? ['KP art. 182³ § 2', 'RWn § 17'] : ['RDok § 33'],
      formularz: pracownik ? WNIOSEK_URLOPOWY : ZAM,
    });
  }

  // --- Sytuacje szczególne i ryzyka ---
  if (s.martweUrodzenie)
    dodaj({
      id: 'pogrzebowy',
      kto: s.rola,
      tytul: 'Wniosek o zasiłek pogrzebowy (Z-12)',
      adresat: 'Zawsze ZUS, niezależnie od tytułu ubezpieczenia',
      zalaczniki: ['Rachunki za pogrzeb', 'Odpis aktu z adnotacją albo karta zgonu / zaświadczenie o martwym urodzeniu'],
      termin: dodajMiesiace(data, 12),
      terminOpis: '12 miesięcy od dnia pogrzebu (tu liczone od porodu, orientacyjnie)',
      podstawaPrawna: ['Poradnik ZUS 2026 s. 35'],
      formularz: { kod: 'Z-12', link: 'https://www.zus.pl/wzory-formularzy/zasilki/zasilek-pogrzebowy', etykieta: 'Formularz w ZUS' },
    });

  // Zaległość drugiego rodzica (działalność) też wstrzymuje jego zasiłek.
  for (const w of r.ryzykaDrugiego?.wyniki ?? [])
    if (w.regula.startsWith('R-DL') && w.status === 'nie_przysluguje')
      dodaj({
        id: `splata-${w.regula}-${drugaRola(s.rola)}`,
        kto: drugaRola(s.rola),
        tytul: `Spłata zaległości w składkach (${imieRoli(s, drugaRola(s.rola))}), żeby odblokować zasiłek`,
        adresat: 'ZUS: rachunek składkowy (eZUS pokaże kwotę)',
        zalaczniki: ['Zaświadczenie o niezaleganiu albo stan rozliczeń z eZUS'],
        ...(w.termin ? { termin: w.termin } : {}),
        terminOpis: 'po tym terminie prawo do zasiłku za ten okres przepada',
        podstawaPrawna: w.podstawaPrawna,
        formularz: { kod: 'eZUS', link: 'https://www.zus.pl/ezus/logowanie', etykieta: 'Zaloguj do eZUS' },
      });

  for (const w of r.ryzyka.wyniki) {
    if (w.regula.startsWith('R-DL') && w.status === 'nie_przysluguje')
      dodaj({
        id: `splata-${w.regula}`,
        kto: s.rola,
        tytul: 'Spłać zaległość w składkach, żeby odblokować zasiłek',
        adresat: 'ZUS: rachunek składkowy (eZUS pokaże kwotę)',
        zalaczniki: ['Zaświadczenie o niezaleganiu albo stan rozliczeń z eZUS'],
        ...(w.termin ? { termin: w.termin } : {}),
        terminOpis: 'po tym terminie prawo do zasiłku za ten okres przepada',
        podstawaPrawna: w.podstawaPrawna,
        formularz: { kod: 'eZUS', link: 'https://www.zus.pl/ezus/logowanie', etykieta: 'Zaloguj do eZUS' },
      });
    if (w.regula === 'R-MA-03' && w.status === 'nie_przysluguje')
      dodaj({
        id: 'odwolanie',
        kto: s.rola,
        tytul: 'Odwołanie od decyzji ZUS do sądu okręgowego (wnosisz za pośrednictwem ZUS)',
        adresat: 'ZUS: oddział, który wydał decyzję',
        zalaczniki: ['Decyzja ZUS', 'Dowody wykonywania pracy (umowa, listy obecności, korespondencja)'],
        terminOpis: '1 miesiąc od doręczenia decyzji',
        podstawaPrawna: ['ustawa o systemie ubezpieczeń społecznych art. 83 ust. 2'],
      });
  }

  const kolejnosc: Record<StatusTerminu, number> = { minal: 1, pilne: 0, zaplanowane: 2, bez_terminu: 3 };
  return lista.sort((a, b) => kolejnosc[a.status] - kolejnosc[b.status] || porownaj(a.termin ?? '9999-12-31', b.termin ?? '9999-12-31'));
}
