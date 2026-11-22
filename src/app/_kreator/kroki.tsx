'use client';

/**
 * Sześć kroków Przewodnika (decyzja Q12): Zdarzenie, Dziecko, Ubezpieczenie, Wynagrodzenie, Ciąża i zdrowie, Drugi rodzic.
 * Każdy krok czyta i zmienia szkic Sytuacji rodziny; nie pytamy o PESEL, adres ani rachunek (Q13).
 */

import type { Grosze, ISODate, PrzyczynaUstania, TytulUbezpieczenia, Zwolnienie } from '@/silnik';
import { czesciDaty, dodajDni, porownaj } from '@/silnik/wspolne/daty';
import { zl } from '@/aplikacja/format';
import { drugaRola, jestPracownikiem, prowadziFirme, wgRoli, type DrugiRodzic, type RodzajZdarzenia, type Rola, type Sytuacja } from '@/aplikacja/sytuacja';
import {
  IkonaBudynek,
  IkonaDokument,
  IkonaDziecko,
  IkonaKosz,
  IkonaLegitymacja,
  IkonaLudzie,
  IkonaPlus,
  IkonaPortfel,
  IkonaSerce,
  IkonaSklep,
} from '../_komponenty/Ikony';
import { Chipy, ChipyTakNie, CzyDotyczy, Grupa, Karta, KartyWyboru, Pole, Przelacznik, Tytul, Wejscie, WejscieKwoty, type Opcja } from './pola';

export interface PropsKroku {
  s: Sytuacja;
  ustaw: (z: Partial<Sytuacja>) => void;
  dzis: ISODate;
}

export const NAZWY_KROKOW = ['Zdarzenie', 'Dziecko', 'Ubezpieczenie', 'Wynagrodzenie', 'Ciąża i zdrowie', 'Drugi rodzic'] as const;

const ik = 'h-[22px] w-[22px]';

export const OPCJE_ZDARZEN: Opcja<RodzajZdarzenia>[] = [
  { v: 'urodzenie', tytul: 'Poród', ikona: <IkonaDziecko className={ik} /> },
  { v: 'przysposobienie', tytul: 'Przysposobienie', ikona: <IkonaSerce className={ik} /> },
  { v: 'rodzinaZastepczaNiezawodowa', tytul: 'Rodzina zastępcza', ikona: <IkonaLudzie className={ik} /> },
];

export const OPCJE_TYTULOW: Opcja<TytulUbezpieczenia>[] = [
  { v: 'umowa_o_prace', tytul: 'Umowa o pracę', ikona: <IkonaLegitymacja className={ik} /> },
  { v: 'umowa_zlecenia', tytul: 'Umowa zlecenia', ikona: <IkonaDokument className={ik} /> },
  { v: 'dzialalnosc', tytul: 'Działalność gosp.', ikona: <IkonaSklep className={ik} /> },
  { v: 'osoba_wspolpracujaca', tytul: 'Osoba współpracująca', ikona: <IkonaLudzie className={ik} /> },
];

export const OPCJE_ROLI: { v: Rola; etykieta: string }[] = [
  { v: 'matka', etykieta: 'Mamą' },
  { v: 'ojciec', etykieta: 'Tatą' },
];

const PRZYCZYNY: { v: PrzyczynaUstania; e: string }[] = [
  { v: 'koniec_umowy_terminowej', e: 'koniec umowy na czas określony' },
  { v: 'wypowiedzenie_lub_porozumienie', e: 'wypowiedzenie albo porozumienie stron' },
  { v: 'upadlosc_pracodawcy', e: 'upadłość pracodawcy' },
  { v: 'likwidacja_pracodawcy', e: 'likwidacja pracodawcy' },
  { v: 'smierc_pracodawcy', e: 'śmierć pracodawcy' },
  { v: 'naruszenie_prawa_prawomocny_wyrok', e: 'rozwiązanie z naruszeniem prawa (prawomocny wyrok)' },
  { v: 'zamkniecie_lub_zawieszenie_dzialalnosci', e: 'zamknięcie albo zawieszenie działalności' },
  { v: 'wyrejestrowanie_dobrowolnego', e: 'wyrejestrowanie z dobrowolnego chorobowego' },
];

const selectCss =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[15px] font-medium text-slate-900 shadow-[0_1px_2px_rgba(30,41,59,0.04)] focus:border-gov-600 focus:shadow-[0_0_0_1px_var(--color-gov-600)] focus:outline-none';

/** Staż ubezpieczenia w dniu zdarzenia, np. „3 lata i 2 mies.”; `null`, gdy zaczyna się później. */
export function staz(od: ISODate, do_: ISODate): string | null {
  if (porownaj(od, do_) > 0) return null;
  const a = czesciDaty(od);
  const b = czesciDaty(do_);
  let mies = (b.rok - a.rok) * 12 + (b.miesiac - a.miesiac) - (b.dzien < a.dzien ? 1 : 0);
  if (mies < 1) return 'krócej niż miesiąc';
  const lata = Math.floor(mies / 12);
  mies %= 12;
  const l = lata === 1 ? 'rok' : lata % 10 >= 2 && lata % 10 <= 4 && (lata % 100 < 10 || lata % 100 >= 20) ? 'lata' : 'lat';
  return [lata > 0 ? `${lata} ${l}` : '', mies > 0 ? `${mies} mies.` : ''].filter(Boolean).join(' i ');
}

const etykietaDaty = (s: Sytuacja) =>
  s.zdarzenie !== 'urodzenie' ? 'Data przyjęcia dziecka' : s.etap === 'ciaza' ? 'Przewidywana data porodu' : 'Data porodu';

/* ---------------------------------------------------------------- 1. Zdarzenie */

export function KrokZdarzenie({ s, ustaw, dzis }: PropsKroku) {
  const urodzenie = s.zdarzenie === 'urodzenie';
  return (
    <>
      <Tytul opis="Od tego zależy, jakie urlopy i zasiłki wchodzą w grę i od kiedy liczymy terminy.">Co się wydarzy?</Tytul>
      <Karta className="space-y-6">
        <Grupa etykieta="Jestem" info="Formy w aplikacji („ubezpieczona”, „ubezpieczony”) i część pytań zależą od tego, czy jesteś mamą, czy tatą.">
          <Chipy nazwa="rola" wartosc={s.rola} opcje={OPCJE_ROLI} onChange={(rola) => ustaw({ rola })} />
        </Grupa>
        <Pole etykieta="Jak masz na imię?" opis="Opcjonalnie. Tylko po to, żeby plan mówił o Was po imieniu.">
          {(id) => <Wejscie id={id} autoComplete="given-name" value={s.osoba.imie} onChange={(e) => ustaw({ osoba: { ...s.osoba, imie: e.target.value } })} />}
        </Pole>
      </Karta>
      <Karta className="space-y-6">
        <Grupa etykieta="Rodzaj zdarzenia">
          <KartyWyboru
            nazwa="zdarzenie"
            wartosc={s.zdarzenie}
            opcje={OPCJE_ZDARZEN}
            onChange={(zdarzenie) => ustaw({ zdarzenie, etap: zdarzenie === 'urodzenie' ? s.etap : 'poZdarzeniu' })}
          />
        </Grupa>
        {urodzenie && (
          <Grupa etykieta="Na jakim jesteście etapie?">
            <Chipy
              nazwa="etap"
              wartosc={s.etap}
              opcje={[
                { v: 'ciaza', etykieta: 'Czekamy na poród' },
                { v: 'poZdarzeniu', etykieta: 'Dziecko już jest' },
              ]}
              onChange={(etap) => ustaw({ etap, dataZdarzenia: etap === 'ciaza' && porownaj(s.dataZdarzenia, dzis) < 0 ? dodajDni(dzis, 120) : s.dataZdarzenia })}
            />
          </Grupa>
        )}
        <Pole
          etykieta={etykietaDaty(s)}
          info={
            urodzenie
              ? 'Od dnia porodu liczymy urlop macierzyński i terminy wniosków. Przed porodem przyjmujemy datę z karty ciąży; po porodzie zmienisz ją na faktyczną.'
              : 'Przy przysposobieniu i rodzinie zastępczej urlop liczymy od dnia przyjęcia dziecka na wychowanie.'
          }
        >
          {(id) => <Wejscie id={id} type="date" required value={s.dataZdarzenia} onChange={(e) => e.target.value && ustaw({ dataZdarzenia: e.target.value })} />}
        </Pole>
      </Karta>
    </>
  );
}

/* ---------------------------------------------------------------- 2. Dziecko */

export function KrokDziecko({ s, ustaw }: PropsKroku) {
  const urodzenie = s.zdarzenie === 'urodzenie';
  const wczesniak = s.tygodnieCiazyPrzyPorodzie !== undefined || !!s.pobytDzieckaWSzpitalu;
  const liczba = String(Math.min(s.dzieci.length, 4)) as '1' | '2' | '3' | '4';
  return (
    <>
      <Tytul opis="Liczba dzieci i ich sytuacja wydłużają urlop macierzyński i rodzicielski.">{urodzenie ? 'Ile dzieci się urodzi?' : 'Ile dzieci przyjmujecie?'}</Tytul>
      <Karta className="space-y-6">
        <Grupa etykieta={urodzenie ? 'Liczba dzieci przy jednym porodzie' : 'Liczba dzieci przyjętych jednocześnie'}>
          <Chipy
            nazwa="dzieci"
            wartosc={liczba}
            opcje={[
              { v: '1', etykieta: '1' },
              { v: '2', etykieta: '2' },
              { v: '3', etykieta: '3' },
              { v: '4', etykieta: '4+' },
            ]}
            onChange={(v) => ustaw({ dzieci: Array.from({ length: Number(v) }, (_, i) => s.dzieci[i] ?? { imie: '' }) })}
          />
        </Grupa>
        {!urodzenie && (
          <Pole etykieta="Data urodzenia dziecka" info="Przy przysposobieniu i rodzinie zastępczej długość urlopu zależy od wieku dziecka w dniu przyjęcia.">
            {(id) => (
              <Wejscie
                id={id}
                type="date"
               
                value={s.dzieci[0]?.dataUrodzenia ?? ''}
                onChange={(e) => ustaw({ dzieci: s.dzieci.map((d) => ({ ...d, dataUrodzenia: e.target.value || undefined })) })}
              />
            )}
          </Pole>
        )}
      </Karta>
      <CzyDotyczy zajawka="„Za życiem”, martwe urodzenie, wcześniak w szpitalu" otwarte={s.zaZyciem || s.martweUrodzenie || wczesniak}>
        <Przelacznik
          etykieta="Zaświadczenie „Za życiem”"
          opis="Ciężkie i nieodwracalne upośledzenie albo nieuleczalna choroba. Urlop rodzicielski jest dłuższy."
          wlaczony={s.zaZyciem}
          onChange={(zaZyciem) => ustaw({ zaZyciem })}
        />
        {urodzenie && (
          <Przelacznik
            etykieta="Martwe urodzenie albo śmierć dziecka"
            opis="Urlop macierzyński trwa wtedy krócej. Pokażemy też, gdzie szukać wsparcia."
            wlaczony={s.martweUrodzenie}
            onChange={(martweUrodzenie) => ustaw({ martweUrodzenie })}
          />
        )}
        {urodzenie && s.etap === 'poZdarzeniu' && (
          <Przelacznik
            etykieta="Wcześniak albo dziecko w szpitalu po porodzie"
            opis="Daje uzupełniający urlop macierzyński."
            wlaczony={wczesniak}
            onChange={(v) =>
              ustaw(
                v
                  ? { tygodnieCiazyPrzyPorodzie: 32, pobytDzieckaWSzpitalu: { od: s.dataZdarzenia, do: s.dataZdarzenia } }
                  : { tygodnieCiazyPrzyPorodzie: undefined, masaUrodzeniowaG: undefined, pobytDzieckaWSzpitalu: undefined },
              )
            }
          />
        )}
        {wczesniak && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Pole etykieta="Ukończone tygodnie ciąży">
              {(id) => (
                <Wejscie id={id} type="number" min={20} max={42} inputMode="numeric" value={s.tygodnieCiazyPrzyPorodzie ?? ''} onChange={(e) => ustaw({ tygodnieCiazyPrzyPorodzie: e.target.value ? Number(e.target.value) : undefined })} />
              )}
            </Pole>
            <Pole etykieta="Masa urodzeniowa">
              {(id) => (
                <Wejscie id={id} type="number" min={300} max={6000} inputMode="numeric" dopisek="g" value={s.masaUrodzeniowaG ?? ''} onChange={(e) => ustaw({ masaUrodzeniowaG: e.target.value ? Number(e.target.value) : undefined })} />
              )}
            </Pole>
            <Pole etykieta="W szpitalu do">
              {(id) => (
                <Wejscie id={id} type="date" value={s.pobytDzieckaWSzpitalu?.do ?? ''} onChange={(e) => e.target.value && ustaw({ pobytDzieckaWSzpitalu: { od: s.dataZdarzenia, do: e.target.value } })} />
              )}
            </Pole>
          </div>
        )}
      </CzyDotyczy>
    </>
  );
}

/* ---------------------------------------------------------------- 3. Ubezpieczenie */

function PytaniePonad20({ wartosc, onChange, tytul, nazwa }: { wartosc: boolean | null; onChange: (v: boolean) => void; tytul: TytulUbezpieczenia; nazwa: string }) {
  const kto = tytul === 'umowa_zlecenia' ? 'zleceniodawca' : 'pracodawca';
  return (
    <Grupa
      etykieta={tytul === 'umowa_zlecenia' ? 'Czy zleceniodawca zgłasza ponad 20 osób?' : 'Czy firma zgłasza ponad 20 osób?'}
      opis="Chodzi o osoby zgłoszone do ubezpieczenia chorobowego. Zapytasz w kadrach albo w biurze rachunkowym."
      info={`Ponad 20 osób: ${kto} sam ustala prawo do zasiłku i wypłaca go z pensją. Do 20 osób: ${kto} przekazuje wniosek do ZUS, a pieniądze wypłaca ZUS.`}
    >
      <ChipyTakNie nazwa={nazwa} wartosc={wartosc} onChange={onChange} />
      {wartosc != null && (
        <p className="mt-2 text-sm font-semibold text-gov-700">Zasiłek wypłaci {wartosc ? kto : 'ZUS'}</p>
      )}
    </Grupa>
  );
}

export function KrokUbezpieczenie({ s, ustaw }: PropsKroku) {
  const pracownik = jestPracownikiem(s.tytul);
  const firma = prowadziFirme(s.tytul);
  const st = staz(s.poczatekUbezpieczenia, s.dataZdarzenia);
  const matka = s.rola === 'matka';
  const naZdarzenie = s.zdarzenie === 'urodzenie' ? 'porodem' : 'przyjęciem dziecka';
  return (
    <>
      <Tytul opis="Forma zatrudnienia decyduje, kto wypłaca zasiłek i od czego go liczymy.">Jak jesteś {wgRoli(s.rola, 'ubezpieczona', 'ubezpieczony')}?</Tytul>
      <Karta className="space-y-6">
        <Grupa etykieta="Forma zatrudnienia" info="Liczy się tytuł, z którego masz ubezpieczenie chorobowe. Przy umowie zlecenia i działalności chorobowe jest dobrowolne: musisz je opłacać.">
          <KartyWyboru
            nazwa="tytul"
            uklad="siatka"
            wartosc={s.tytul}
            opcje={OPCJE_TYTULOW}
            onChange={(tytul) => ustaw({ tytul, ...(jestPracownikiem(tytul) ? {} : { pelnyEtat: true, umowaTerminowa: undefined, zmianaWymiaruCzasuPracy: undefined }) })}
          />
        </Grupa>
        <Pole
          etykieta="Od kiedy masz ubezpieczenie chorobowe?"
          info="Data rozpoczęcia obecnej umowy albo zgłoszenia do dobrowolnego chorobowego. Wpływa na to, z ilu miesięcy liczymy podstawę zasiłku."
        >
          {(id) => (
            <Wejscie
              id={id}
              type="date"
             
              dopisek={st ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{st}</span> : undefined}
              value={s.poczatekUbezpieczenia}
              onChange={(e) => e.target.value && ustaw({ poczatekUbezpieczenia: e.target.value, okresyUbezpieczenia: undefined })}
            />
          )}
        </Pole>
        {!firma && (
          <Pole etykieta={pracownik ? 'Pracodawca' : 'Zleceniodawca'} opis="Opcjonalnie. Pokażemy nazwę przy wnioskach, które składasz u niego.">
            {(id) => (
              <Wejscie id={id} ikona={<IkonaBudynek className="h-5 w-5" />} autoComplete="organization" value={s.platnik.nazwa} onChange={(e) => ustaw({ platnik: { ...s.platnik, nazwa: e.target.value } })} />
            )}
          </Pole>
        )}
      </Karta>
      {!firma && (
        <Karta>
          <PytaniePonad20 nazwa="ponad20" tytul={s.tytul} wartosc={s.platnik.ponad20} onChange={(ponad20) => ustaw({ platnik: { ...s.platnik, ponad20 } })} />
        </Karta>
      )}
      {pracownik && (
        <Karta className="space-y-5">
          <Przelacznik etykieta="Pełny etat" wlaczony={s.pelnyEtat} onChange={(pelnyEtat) => ustaw({ pelnyEtat })} />
          <Przelacznik
            etykieta="Umowa na czas określony"
            opis="Zaznacz, jeśli umowa kończy się w trakcie ciąży albo urlopu."
            wlaczony={!!s.umowaTerminowa}
            onChange={(v) => ustaw({ umowaTerminowa: v ? { rodzaj: 'czas_okreslony', naZastepstwo: false, planowanyKoniec: s.dataZdarzenia } : undefined })}
          />
          {s.umowaTerminowa && (
            <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 sm:items-end">
              <Pole etykieta="Umowa kończy się">
                {(id) => (
                  <Wejscie id={id} type="date" value={s.umowaTerminowa!.planowanyKoniec} onChange={(e) => e.target.value && ustaw({ umowaTerminowa: { ...s.umowaTerminowa!, planowanyKoniec: e.target.value } })} />
                )}
              </Pole>
              <Przelacznik etykieta="Na zastępstwo" wlaczony={s.umowaTerminowa.naZastepstwo} onChange={(naZastepstwo) => ustaw({ umowaTerminowa: { ...s.umowaTerminowa!, naZastepstwo } })} />
            </div>
          )}
        </Karta>
      )}
      <CzyDotyczy
        zajawka={['ubezpieczenie ustało przed ' + naZdarzenie, pracownik ? 'zmiana etatu' : '', matka && !firma ? 'umowa zawarta w ciąży' : ''].filter(Boolean).join(', ')}
        otwarte={!!s.ustanie || !!s.zmianaWymiaruCzasuPracy || !!s.sygnalyRyzyka?.umowaZawartaWCiazy}
      >
        <Przelacznik
          etykieta={`Ubezpieczenie ustało albo ustanie przed ${naZdarzenie}`}
          opis="Koniec umowy, likwidacja firmy, wyrejestrowanie z chorobowego."
          wlaczony={!!s.ustanie}
          onChange={(v) => ustaw({ ustanie: v ? { data: s.dataZdarzenia, przyczyna: 'koniec_umowy_terminowej' } : undefined, okresyUbezpieczenia: undefined })}
        />
        {s.ustanie && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Pole etykieta="Ostatni dzień ubezpieczenia">
              {(id) => <Wejscie id={id} type="date" value={s.ustanie!.data} onChange={(e) => e.target.value && ustaw({ ustanie: { ...s.ustanie!, data: e.target.value }, okresyUbezpieczenia: undefined })} />}
            </Pole>
            <Pole etykieta="Przyczyna">
              {(id) => (
                <select id={id} className={selectCss} value={s.ustanie!.przyczyna} onChange={(e) => ustaw({ ustanie: { ...s.ustanie!, przyczyna: e.target.value as PrzyczynaUstania }, okresyUbezpieczenia: undefined, zapewnionoInneZatrudnienie: s.zapewnionoInneZatrudnienie ?? false })}>
                  {PRZYCZYNY.map((p) => (
                    <option key={p.v} value={p.v}>
                      {p.e}
                    </option>
                  ))}
                </select>
              )}
            </Pole>
            {['upadlosc_pracodawcy', 'likwidacja_pracodawcy', 'smierc_pracodawcy'].includes(s.ustanie.przyczyna) && (
              <div className="sm:col-span-2">
                <Przelacznik
                  etykieta="Pracodawca zapewnił mi inne zatrudnienie"
                  opis="Bez innego zatrudnienia do dnia porodu przysługuje zasiłek w wysokości zasiłku macierzyńskiego."
                  wlaczony={!!s.zapewnionoInneZatrudnienie}
                  onChange={(v) => ustaw({ zapewnionoInneZatrudnienie: v })}
                />
              </div>
            )}
          </div>
        )}
        {pracownik && (
          <Przelacznik
            etykieta="Zmiana wymiaru etatu w ostatnich 12 miesiącach"
            opis="Podstawę liczy się wtedy inaczej. Pokażemy to jako sprawę do sprawdzenia."
            wlaczony={!!s.zmianaWymiaruCzasuPracy}
            onChange={(v) => ustaw({ zmianaWymiaruCzasuPracy: v || undefined })}
          />
        )}
        {matka && !firma && (
          <Przelacznik
            etykieta="Umowę zawarto, gdy byłam już w ciąży"
            opis="ZUS częściej sprawdza takie umowy. Powiemy, jak się przygotować."
            wlaczony={!!s.sygnalyRyzyka?.umowaZawartaWCiazy}
            onChange={(v) => ustaw({ sygnalyRyzyka: { ...s.sygnalyRyzyka, umowaZawartaWCiazy: v } })}
          />
        )}
      </CzyDotyczy>
    </>
  );
}

/* ---------------------------------------------------------------- 4. Wynagrodzenie */

type Zaleglosc = 'nie' | 'tak' | 'nie_wiem';
const stanZaleglosci = (z: Grosze | null | undefined): Zaleglosc => (z == null ? 'nie_wiem' : z > 0 ? 'tak' : 'nie');

function PytanieZaleglosc({ wartosc, onChange, nazwa, etykieta }: { wartosc: Grosze | null | undefined; onChange: (z: Grosze | null) => void; nazwa: string; etykieta: string }) {
  const stan = stanZaleglosci(wartosc);
  return (
    <div className="space-y-4">
      <Grupa
        etykieta={etykieta}
        opis="Sprawdzisz w eZUS: Płatnik → Stan rozliczeń."
        info="Przy działalności zasiłek przysługuje dopiero po spłacie zaległości w składkach, jeśli przekracza ona próg ustawowy. Zaległość zapisujemy na dzień porodu albo przyjęcia dziecka."
      >
        <Chipy
          nazwa={nazwa}
          wartosc={stan}
          opcje={[
            { v: 'nie', etykieta: 'Nie' },
            { v: 'tak', etykieta: 'Tak' },
            { v: 'nie_wiem', etykieta: 'Nie wiem' },
          ]}
          onChange={(v) => onChange(v === 'nie' ? 0 : v === 'tak' ? (wartosc && wartosc > 0 ? wartosc : 10_000) : null)}
        />
      </Grupa>
      {stan === 'tak' && (
        <Pole etykieta="Kwota zaległości">
          {(id) => <WejscieKwoty id={id} wartosc={wartosc ?? null} onChange={(g) => onChange(g ?? 0)} ikona={<IkonaPortfel className="h-5 w-5" />} />}
        </Pole>
      )}
    </div>
  );
}

export function etykietaKwoty(tytul: TytulUbezpieczenia): { etykieta: string; opis: string } {
  return prowadziFirme(tytul)
    ? { etykieta: 'Zadeklarowana podstawa składek', opis: 'Miesięcznie, średnio z ostatnich 12 miesięcy. To kwota z deklaracji ZUS, nie przychód.' }
    : { etykieta: 'Średnie wynagrodzenie brutto', opis: 'Miesięcznie, średnio z ostatnich 12 miesięcy kalendarzowych.' };
}

export function KrokWynagrodzenie({ s, ustaw }: PropsKroku) {
  const firma = prowadziFirme(s.tytul);
  const zZus = s.miesiacePracownika?.length ?? s.miesiaceNiepracownika?.length ?? 0;
  const sredniaZus = s.miesiacePracownika?.length
    ? Math.round(s.miesiacePracownika.reduce((a, m) => a + m.brutto, 0) / s.miesiacePracownika.length)
    : s.miesiaceNiepracownika?.length
      ? Math.round(s.miesiaceNiepracownika.reduce((a, m) => a + m.podstawaSkladkiChorobowej, 0) / s.miesiaceNiepracownika.length)
      : null;
  const { etykieta, opis } = etykietaKwoty(s.tytul);
  return (
    <>
      <Tytul opis="Z tej kwoty liczymy podstawę zasiłku: odejmujemy składki społeczne i bierzemy średnią z 12 miesięcy.">
        {firma ? 'Jaką podstawę składek deklarujesz?' : 'Ile zarabiasz?'}
      </Tytul>
      <Karta className="space-y-4">
        {zZus > 0 && sredniaZus != null ? (
          <div className="space-y-3">
            <p className="text-[15px] font-semibold text-slate-800">Dane z ZUS</p>
            <p className="text-sm leading-relaxed text-slate-700">
              Mamy {zZus} {zZus === 1 ? 'miesiąc' : zZus < 5 ? 'miesiące' : 'miesięcy'} z deklaracji płatnika, średnio <strong className="tabular-nums">{zl(sredniaZus)}</strong> brutto. Liczymy z nich podstawę miesiąc po miesiącu.
            </p>
            <button
              type="button"
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-gov-700 hover:border-gov-200 hover:bg-gov-50"
              onClick={() => ustaw({ miesiacePracownika: undefined, miesiaceNiepracownika: undefined, bruttoMiesiecznie: sredniaZus })}
            >
              Wpisz inną kwotę
            </button>
          </div>
        ) : (
          <Pole etykieta={etykieta} opis={opis} info="Bez kwoty pokażemy, co Ci przysługuje i jakie wnioski złożyć, ale nie policzymy zasiłku.">
            {(id) => <WejscieKwoty id={id} wartosc={s.bruttoMiesiecznie} onChange={(bruttoMiesiecznie) => ustaw({ bruttoMiesiecznie })} ikona={<IkonaPortfel className="h-5 w-5" />} placeholder="np. 6 800" />}
          </Pole>
        )}
      </Karta>
      {firma && (
        <Karta>
          <PytanieZaleglosc nazwa="zaleglosc" etykieta="Czy masz zaległość w składkach?" wartosc={s.zadluzenie} onChange={(zadluzenie) => ustaw({ zadluzenie })} />
        </Karta>
      )}
      {firma && s.rola === 'matka' && (
        <CzyDotyczy zajawka="podwyższona podstawa składek w ciąży" otwarte={!!s.sygnalyRyzyka?.podwyzkaPodstawyWCiazy}>
          <Przelacznik
            etykieta="Podwyższyłam podstawę składek w czasie ciąży"
            opis="ZUS może to sprawdzić. Powiemy, co przygotować."
            wlaczony={!!s.sygnalyRyzyka?.podwyzkaPodstawyWCiazy}
            onChange={(v) => ustaw({ sygnalyRyzyka: { ...s.sygnalyRyzyka, podwyzkaPodstawyWCiazy: v } })}
          />
        </CzyDotyczy>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- 5. Ciąża i zdrowie */

export function KrokCiaza({ s, ustaw, dzis }: PropsKroku) {
  const dotyczy = s.zdarzenie === 'urodzenie' && s.rola === 'matka';
  if (!dotyczy)
    return (
      <>
        <Tytul>Ciąża i zdrowie</Tytul>
        <Karta>
          <p className="text-[15px] leading-relaxed text-slate-700">
            {s.zdarzenie !== 'urodzenie'
              ? 'Ten krok dotyczy zwolnień lekarskich w ciąży, więc przy przysposobieniu i rodzinie zastępczej go pomijamy.'
              : 'Ten krok dotyczy zwolnień lekarskich mamy w ciąży. Możesz przejść dalej.'}
          </p>
        </Karta>
      </>
    );
  const zmien = (i: number, z: Partial<Zwolnienie>) => ustaw({ zwolnienia: s.zwolnienia.map((x, j) => (j === i ? { ...x, ...z } : x)) });
  return (
    <>
      <Tytul opis="Zwolnienie z kodem B (ciąża) daje zasiłek chorobowy w wysokości 100% podstawy. Pokażemy, czy coś trzeba złożyć.">Zwolnienia lekarskie w ciąży</Tytul>
      <Karta className="space-y-4">
        {s.zwolnienia.length === 0 && <p className="text-[15px] text-slate-700">Nie dodano żadnego zwolnienia. Jeśli nie byłaś na zwolnieniu, przejdź dalej.</p>}
        {s.zwolnienia.map((z, i) => (
          <div key={i} className="space-y-4 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-slate-800">Zwolnienie {i + 1}</p>
              <button
                type="button"
                aria-label={`Usuń zwolnienie ${i + 1}`}
                className="-mr-2 grid h-10 w-10 place-items-center rounded-full text-slate-500 hover:bg-coral-50 hover:text-pilne"
                onClick={() => ustaw({ zwolnienia: s.zwolnienia.filter((_, j) => j !== i) })}
              >
                <IkonaKosz className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Pole etykieta="Od">{(id) => <Wejscie id={id} type="date" value={z.od} onChange={(e) => e.target.value && zmien(i, { od: e.target.value })} />}</Pole>
              <Pole etykieta="Do">{(id) => <Wejscie id={id} type="date" value={z.do} onChange={(e) => e.target.value && zmien(i, { do: e.target.value })} />}</Pole>
            </div>
            <Przelacznik etykieta="Kod B na zwolnieniu (ciąża)" wlaczony={z.kodB} onChange={(kodB) => zmien(i, { kodB })} />
          </div>
        ))}
        <button
          type="button"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gov-200 text-[15px] font-semibold text-gov-700 hover:bg-gov-50"
          onClick={() => {
            const od = s.zwolnienia.at(-1) ? dodajDni(s.zwolnienia.at(-1)!.do, 1) : dodajDni(dzis, -14);
            ustaw({ zwolnienia: [...s.zwolnienia, { od, do: dodajDni(od, 13), kodB: true, tytul: s.tytul }] });
          }}
        >
          <IkonaPlus className="h-5 w-5" />
          Dodaj zwolnienie
        </button>
      </Karta>
    </>
  );
}

/* ---------------------------------------------------------------- 6. Drugi rodzic */

const NOWY_DRUGI: DrugiRodzic = { imie: '', nazwisko: '', ubezpieczony: true, tytul: 'umowa_o_prace', bruttoMiesiecznie: null, pelnyEtat: true };

export function KrokDrugiRodzic({ s, ustaw }: PropsKroku) {
  const d = s.drugiRodzic;
  const rola = drugaRola(s.rola);
  const ona = rola === 'matka';
  const zaimek = d?.imie || (ona ? 'ona' : 'on');
  const ustawD = (z: Partial<DrugiRodzic>) => ustaw({ drugiRodzic: { ...(d ?? NOWY_DRUGI), ...z } });
  const pracownik = d ? jestPracownikiem(d.tytul) : false;
  const firma = d ? prowadziFirme(d.tytul) : false;
  const st = d ? staz(d.poczatekUbezpieczenia ?? s.poczatekUbezpieczenia, s.dataZdarzenia) : null;
  const { etykieta, opis } = etykietaKwoty(d?.tytul ?? 'umowa_o_prace');
  return (
    <>
      <Tytul opis="Drugi rodzic ma własne 9 tygodni urlopu rodzicielskiego, których nie da się przenieść. Jego dane pozwolą je zaplanować i policzyć.">
        {ona ? 'Mama dziecka' : 'Tata dziecka'}
      </Tytul>
      <Karta className="space-y-6">
        <Grupa etykieta="Czy dzielicie opiekę nad dzieckiem?">
          <ChipyTakNie nazwa="drugi" wartosc={!!d} onChange={(v) => ustaw({ drugiRodzic: v ? (d ?? NOWY_DRUGI) : null })} />
        </Grupa>
        {d && (
          <>
            <Pole etykieta="Jak ma na imię?" opis="Opcjonalnie.">
              {(id) => <Wejscie id={id} value={d.imie} onChange={(e) => ustawD({ imie: e.target.value })} />}
            </Pole>
            <Grupa etykieta={`Czy ${zaimek} ma ubezpieczenie chorobowe?`} info="Bez ubezpieczenia chorobowego drugi rodzic nie dostanie zasiłku, a jego 9 tygodni urlopu rodzicielskiego przepada.">
              <ChipyTakNie nazwa="drugi-ubezpieczony" wartosc={d.ubezpieczony} onChange={(ubezpieczony) => ustawD({ ubezpieczony })} />
            </Grupa>
          </>
        )}
      </Karta>
      {d?.ubezpieczony && (
        <>
          <Karta className="space-y-6">
            <Grupa etykieta={`Jak ${ona ? 'jest ubezpieczona' : 'jest ubezpieczony'}?`}>
              <KartyWyboru
                nazwa="drugi-tytul"
                uklad="siatka"
                wartosc={d.tytul}
                opcje={OPCJE_TYTULOW}
                onChange={(tytul) => ustawD({ tytul, ...(jestPracownikiem(tytul) ? {} : { pelnyEtat: true }), ...(prowadziFirme(tytul) ? { ponad20: undefined } : { zadluzenie: undefined }) })}
              />
            </Grupa>
            <Pole etykieta="Od kiedy ma ubezpieczenie chorobowe?" opis="Jeśli nie wiesz dokładnie, wpisz przybliżoną datę.">
              {(id) => (
                <Wejscie
                  id={id}
                  type="date"
                 
                  dopisek={st ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{st}</span> : undefined}
                  value={d.poczatekUbezpieczenia ?? ''}
                  onChange={(e) => ustawD({ poczatekUbezpieczenia: e.target.value || undefined })}
                />
              )}
            </Pole>
            {pracownik && <Przelacznik etykieta="Pełny etat" wlaczony={d.pelnyEtat ?? true} onChange={(pelnyEtat) => ustawD({ pelnyEtat })} />}
            <Pole etykieta={etykieta} opis={opis}>
              {(id) => <WejscieKwoty id={id} wartosc={d.bruttoMiesiecznie} onChange={(bruttoMiesiecznie) => ustawD({ bruttoMiesiecznie })} ikona={<IkonaPortfel className="h-5 w-5" />} placeholder="np. 7 000" />}
            </Pole>
          </Karta>
          <Karta>
            {firma ? (
              <PytanieZaleglosc nazwa="drugi-zaleglosc" etykieta={`Czy ${zaimek} ma zaległość w składkach?`} wartosc={d.zadluzenie} onChange={(zadluzenie) => ustawD({ zadluzenie })} />
            ) : (
              <PytaniePonad20 nazwa="drugi-ponad20" tytul={d.tytul} wartosc={d.ponad20 ?? null} onChange={(ponad20) => ustawD({ ponad20 })} />
            )}
          </Karta>
        </>
      )}
    </>
  );
}

export const KROKI_PRZEWODNIKA = [KrokZdarzenie, KrokDziecko, KrokUbezpieczenie, KrokWynagrodzenie, KrokCiaza, KrokDrugiRodzic] as const;
