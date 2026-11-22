'use client';

/**
 * Przewodnik krok po kroku (makieta Stitch „Przewodnik – krok 3”): 6 kroków i podsumowanie poza licznikiem.
 * Szkic zapisuje się na bieżąco w przeglądarce; Sytuacja rodziny powstaje dopiero na podsumowaniu.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import type { ISODate } from '@/silnik';
import { dodajDni } from '@/silnik/wspolne/daty';
import { data, zl } from '@/aplikacja/format';
import { drugaRola, jestPracownikiem, NAZWY_TYTULOW, PLAN_DOMYSLNY, prowadziFirme, sytuacjaPusta, type Sytuacja } from '@/aplikacja/sytuacja';
import { IkonaChmura, IkonaOlowek, IkonaPtaszek, IkonaStrzalka, IkonaWstecz, IkonaKlodka } from '../_komponenty/Ikony';
import { useDzis, useSytuacja, useSzkic, zapiszPlan, zapiszSytuacje, zapiszSzkic, zmienSzkic } from '../_lib/stan';
import { KROKI_PRZEWODNIKA, NAZWY_KROKOW, OPCJE_ZDARZEN, staz } from './kroki';
import { Karta, Tytul } from './pola';

const LICZBA = NAZWY_KROKOW.length;
export const PODSUMOWANIE = LICZBA + 1;
const adres = (k: number) => (k > LICZBA ? '/przewodnik/podsumowanie' : `/przewodnik/${k}`);

/** Szkic na start: zapisana Sytuacja albo typowa rodzina bez kwot (kwoty wpisuje rodzic). */
function szkicStartowy(sytuacja: Sytuacja | null, dzis: ISODate): Sytuacja {
  if (sytuacja) return sytuacja;
  const p = sytuacjaPusta(dzis);
  return { ...p, dataZdarzenia: dodajDni(dzis, 120), bruttoMiesiecznie: null, drugiRodzic: p.drugiRodzic && { ...p.drugiRodzic, bruttoMiesiecznie: null } };
}

function Postep({ krok }: { krok: number }) {
  const gotowe = Math.min(krok - 1, LICZBA);
  return (
    <div>
      <ol className="grid grid-cols-6 gap-1.5" aria-label="Postęp">
        {NAZWY_KROKOW.map((n, i) => {
          const nr = i + 1;
          const stan = nr < krok ? 'zrobiony' : nr === krok ? 'biezacy' : 'przed';
          return (
            <li
              key={n}
              aria-current={stan === 'biezacy' ? 'step' : undefined}
              className={`h-2 rounded-full transition-colors duration-500 ${stan === 'zrobiony' ? 'bg-gov-600' : stan === 'biezacy' ? 'bg-gov-100 ring-2 ring-gov-600 ring-offset-1' : 'bg-slate-200'}`}
            >
              <span className="sr-only">
                Krok {nr}: {n}
                {stan === 'zrobiony' ? ', gotowy' : stan === 'biezacy' ? ', bieżący' : ''}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-1.5 flex items-center justify-between text-xs font-semibold">
        <span className="flex items-center gap-1 text-gov-700">
          <IkonaPtaszek className="h-3.5 w-3.5" strokeWidth={2.5} />
          {gotowe} z {LICZBA} gotowe
        </span>
        <span className="text-slate-600">{krok > LICZBA ? 'Podsumowanie' : NAZWY_KROKOW[krok - 1]}</span>
      </div>
    </div>
  );
}

/** Lista kroków obok formularza na komputerze (DESIGN.md: „contextual step summaries on the side”). */
function ListaKrokow({ krok }: { krok: number }) {
  const pozycje = [...NAZWY_KROKOW, 'Podsumowanie'];
  return (
    <nav aria-label="Kroki Przewodnika" className="sticky top-28 hidden lg:block">
      <ol className="space-y-1">
        {pozycje.map((n, i) => {
          const nr = i + 1;
          const zrobiony = nr < krok;
          const biezacy = nr === krok;
          const tresc = (
            <>
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums ${
                  zrobiony ? 'bg-gov-600 text-white' : biezacy ? 'bg-white text-gov-700 ring-2 ring-gov-600' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {zrobiony ? <IkonaPtaszek className="h-3.5 w-3.5" strokeWidth={3} /> : nr > LICZBA ? '✓' : nr}
              </span>
              <span className={biezacy ? 'font-bold text-gov-900' : zrobiony ? 'font-semibold text-slate-700' : 'text-slate-500'}>{n}</span>
            </>
          );
          return (
            <li key={n}>
              {zrobiony ? (
                <Link href={adres(nr)} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm hover:bg-white">
                  {tresc}
                </Link>
              ) : (
                <span aria-current={biezacy ? 'step' : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm ${biezacy ? 'bg-white shadow-[0_1px_3px_rgba(30,41,59,0.08)]' : ''}`}>
                  {tresc}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Wiersz({ etykieta, children }: { etykieta: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3 py-2.5 text-[15px]">
      <dt className="text-slate-600">{etykieta}</dt>
      <dd className="font-semibold text-slate-900">{children}</dd>
    </div>
  );
}

function Sekcja({ nr, children }: { nr: number; children: ReactNode }) {
  return (
    <Karta>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-gov-900">{NAZWY_KROKOW[nr - 1]}</h2>
        <Link href={adres(nr)} className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-gov-700 hover:bg-gov-50">
          <IkonaOlowek className="h-4 w-4" />
          Zmień
        </Link>
      </div>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </Karta>
  );
}

const tak = (v: boolean | null | undefined) => (v == null ? 'nie podano' : v ? 'tak' : 'nie');

function Podsumowanie({ s }: { s: Sytuacja }) {
  const urodzenie = s.zdarzenie === 'urodzenie';
  const firma = prowadziFirme(s.tytul);
  const d = s.drugiRodzic;
  const rodzic2 = drugaRola(s.rola) === 'matka' ? 'Mama' : 'Tata';
  const zZus = (s.miesiacePracownika?.length ?? 0) + (s.miesiaceNiepracownika?.length ?? 0);
  const rzadkie = [s.zaZyciem && '„Za życiem”', s.martweUrodzenie && 'martwe urodzenie', (s.tygodnieCiazyPrzyPorodzie !== undefined || s.pobytDzieckaWSzpitalu) && 'wcześniak / szpital'].filter(Boolean);
  return (
    <>
      <Tytul opis="Sprawdź odpowiedzi. Po zapisaniu pokażemy, co Wam przysługuje, ile to wynosi i jakie wnioski złożyć.">Podsumowanie</Tytul>
      <Sekcja nr={1}>
        <Wiersz etykieta="Jestem">{s.rola === 'matka' ? 'mamą' : 'tatą'}{s.osoba.imie ? `, ${s.osoba.imie}` : ''}</Wiersz>
        <Wiersz etykieta="Zdarzenie">{OPCJE_ZDARZEN.find((o) => o.v === s.zdarzenie)?.tytul}{urodzenie ? (s.etap === 'ciaza' ? ' (przed porodem)' : ' (po porodzie)') : ''}</Wiersz>
        <Wiersz etykieta={urodzenie ? (s.etap === 'ciaza' ? 'Przewidywana data' : 'Data porodu') : 'Data przyjęcia'}>{data(s.dataZdarzenia)}</Wiersz>
      </Sekcja>
      <Sekcja nr={2}>
        <Wiersz etykieta="Liczba dzieci">{s.dzieci.length}</Wiersz>
        {!urodzenie && <Wiersz etykieta="Data urodzenia">{data(s.dzieci[0]?.dataUrodzenia)}</Wiersz>}
        {rzadkie.length > 0 && <Wiersz etykieta="Szczególne">{rzadkie.join(', ')}</Wiersz>}
      </Sekcja>
      <Sekcja nr={3}>
        <Wiersz etykieta="Forma">{NAZWY_TYTULOW[s.tytul]}</Wiersz>
        <Wiersz etykieta="Ubezpieczenie od">
          {data(s.poczatekUbezpieczenia)}
          {staz(s.poczatekUbezpieczenia, s.dataZdarzenia) && <span className="font-normal text-slate-600"> ({staz(s.poczatekUbezpieczenia, s.dataZdarzenia)})</span>}
        </Wiersz>
        {!firma && <Wiersz etykieta="Ponad 20 osób w firmie">{tak(s.platnik.ponad20)}</Wiersz>}
        {jestPracownikiem(s.tytul) && <Wiersz etykieta="Etat">{s.pelnyEtat ? 'pełny' : 'niepełny'}{s.umowaTerminowa ? `, umowa do ${data(s.umowaTerminowa.planowanyKoniec)}` : ''}</Wiersz>}
        {s.ustanie && <Wiersz etykieta="Ubezpieczenie ustaje">{data(s.ustanie.data)}</Wiersz>}
      </Sekcja>
      <Sekcja nr={4}>
        <Wiersz etykieta={firma ? 'Podstawa składek' : 'Brutto miesięcznie'}>{zZus > 0 ? `z ZUS, ${zZus} mies.` : s.bruttoMiesiecznie == null ? 'nie podano' : zl(s.bruttoMiesiecznie)}</Wiersz>
        {firma && <Wiersz etykieta="Zaległość w składkach">{s.zadluzenie == null ? 'nie wiadomo' : s.zadluzenie > 0 ? zl(s.zadluzenie) : 'brak'}</Wiersz>}
      </Sekcja>
      {urodzenie && s.rola === 'matka' && (
        <Sekcja nr={5}>
          <Wiersz etykieta="Zwolnienia w ciąży">{s.zwolnienia.length === 0 ? 'brak' : s.zwolnienia.map((z) => `${data(z.od)} – ${data(z.do)}`).join('; ')}</Wiersz>
        </Sekcja>
      )}
      <Sekcja nr={6}>
        {!d ? (
          <Wiersz etykieta="Drugi rodzic">nie dzielimy opieki</Wiersz>
        ) : (
          <>
            <Wiersz etykieta={rodzic2}>{d.imie || 'bez imienia'}</Wiersz>
            <Wiersz etykieta="Ubezpieczenie chorobowe">{d.ubezpieczony ? NAZWY_TYTULOW[d.tytul] : 'brak'}</Wiersz>
            {d.ubezpieczony && (
              <>
                <Wiersz etykieta="Ubezpieczenie od">{d.poczatekUbezpieczenia ? data(d.poczatekUbezpieczenia) : 'ponad 3 lata (założone)'}</Wiersz>
                <Wiersz etykieta={prowadziFirme(d.tytul) ? 'Podstawa składek' : 'Brutto miesięcznie'}>{d.bruttoMiesiecznie == null ? 'nie podano' : zl(d.bruttoMiesiecznie)}</Wiersz>
                {prowadziFirme(d.tytul) ? (
                  <Wiersz etykieta="Zaległość w składkach">{d.zadluzenie == null ? 'nie wiadomo' : d.zadluzenie > 0 ? zl(d.zadluzenie) : 'brak'}</Wiersz>
                ) : (
                  <Wiersz etykieta="Ponad 20 osób w firmie">{tak(d.ponad20)}</Wiersz>
                )}
              </>
            )}
          </>
        )}
      </Sekcja>
      <p className="flex items-center gap-2 px-1 text-sm text-slate-600">
        <IkonaKlodka className="h-4 w-4 shrink-0 text-gov-600" />
        Dane zostają w tej przeglądarce. Nie wysyłamy ich nigdzie.
      </p>
    </>
  );
}

export function Przewodnik({ krok }: { krok: number }) {
  const router = useRouter();
  const dzis = useDzis();
  const { sytuacja, gotowe: gotowaSytuacja } = useSytuacja();
  const { szkic, gotowe: gotowySzkic } = useSzkic();
  const naglowek = useRef<HTMLDivElement>(null);

  // Szkic zakładamy raz na wejście; po zatwierdzeniu (szkic znika) nie odtwarzamy go przed przejściem do planu.
  const zalozony = useRef(false);
  useEffect(() => {
    if (zalozony.current || !gotowaSytuacja || !gotowySzkic) return;
    zalozony.current = true;
    if (!szkic) zapiszSzkic(szkicStartowy(sytuacja, dzis));
  }, [gotowaSytuacja, gotowySzkic, szkic, sytuacja, dzis]);

  // Nowy krok: przewiń na górę i przenieś fokus na treść (czytnik ekranu zaczyna od tytułu kroku).
  useEffect(() => {
    window.scrollTo({ top: 0 });
    naglowek.current?.querySelector('h1')?.focus({ preventScroll: true });
  }, [krok]);

  const s = szkic;
  const ustaw = zmienSzkic;
  const podsumowanie = krok > LICZBA;
  const wyjscie = sytuacja ? '/plan' : '/';
  const wstecz = krok === 1 ? wyjscie : adres(krok - 1);
  const Krok = podsumowanie ? null : KROKI_PRZEWODNIKA[krok - 1];

  const zatwierdz = () => {
    if (!s) return;
    const nowa = !sytuacja;
    zapiszSytuacje({ ...s, przyblizona: false, zalozenia: [] });
    if (nowa) zapiszPlan(PLAN_DOMYSLNY);
    router.push('/plan');
  };

  return (
    <div className="min-h-dvh bg-tlo-wejscia text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-tlo-wejscia/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 pt-2 pb-3 sm:px-6">
          <div className="flex h-11 items-center justify-between gap-2">
            <Link href={wstecz} className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900">
              <IkonaWstecz className="h-5 w-5" />
              Wstecz
            </Link>
            <span className="text-xs font-bold tracking-wider text-slate-600 uppercase">{podsumowanie ? 'Podsumowanie' : `Krok ${krok} z ${LICZBA}`}</span>
            <Link href={wyjscie} className="-mr-2 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-gov-700 hover:bg-gov-50">
              {sytuacja ? 'Wyjdź do planu' : 'Wyjdź'}
            </Link>
          </div>
          <div className="lg:hidden">
            <Postep krok={krok} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:pt-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,42rem)_minmax(0,1fr)]">
        <ListaKrokow krok={krok} />
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          {!s ? (
            <p className="py-16 text-center text-sm text-slate-600">Wczytuję…</p>
          ) : (
            <div ref={naglowek} key={krok} className="animate-wejscie space-y-4 pt-5 pb-8 lg:pt-0">
              {Krok ? <Krok s={s} ustaw={ustaw} dzis={dzis} /> : <Podsumowanie s={s} />}
            </div>
          )}

          <div className="sticky bottom-0 -mx-4 mt-auto border-t border-slate-200/70 bg-tlo-wejscia/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:mx-0 sm:px-0">
            {!podsumowanie && (
              <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600">
                <IkonaChmura className="h-4 w-4 text-gov-600" />
                Zapisujemy na bieżąco
              </p>
            )}
            {podsumowanie ? (
              <button
                type="button"
                onClick={zatwierdz}
                disabled={!s}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gov-600 text-base font-bold text-white shadow-[0_8px_20px_-8px_rgba(59,77,158,0.6)] transition-colors hover:bg-gov-700 disabled:opacity-50"
              >
                Zapisz i pokaż, co mi przysługuje
                <IkonaStrzalka className="h-5 w-5" />
              </button>
            ) : (
              <Link
                href={adres(krok + 1)}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gov-600 text-base font-bold text-white shadow-[0_8px_20px_-8px_rgba(59,77,158,0.6)] transition-colors hover:bg-gov-700"
              >
                {krok === LICZBA ? 'Przejdź do podsumowania' : 'Dalej'}
                <IkonaStrzalka className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
