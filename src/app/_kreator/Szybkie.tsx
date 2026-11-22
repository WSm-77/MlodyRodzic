'use client';

/**
 * Szybkie wyliczenie (makieta Stitch, decyzje Q15–Q16): jeden ekran, cztery pytania i przełącznik mama/tata.
 * Czego nie pytamy, przyjmujemy domyślnie i zapisujemy w `zalozenia`; wynik jest przybliżony do czasu Przewodnika.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import type { Grosze, TytulUbezpieczenia } from '@/silnik';
import { dodajDni, porownaj } from '@/silnik/wspolne/daty';
import { PLAN_DOMYSLNY, sytuacjaPusta, wgRoli, type PoleZalozone, type RodzajZdarzenia, type Rola, type Sytuacja } from '@/aplikacja/sytuacja';
import { IkonaKlodka, IkonaPortfel, IkonaStrzalka, IkonaWstecz, IkonaZegar } from '../_komponenty/Ikony';
import { useDzis, useSytuacja, zapiszPlan, zapiszSytuacje } from '../_lib/stan';
import { etykietaKwoty, OPCJE_ROLI, OPCJE_TYTULOW } from './kroki';
import { Chipy, ChipyTakNie, Grupa, Karta, KartyWyboru, Pole, Wejscie, WejscieKwoty } from './pola';

function Numer({ nr, children }: { nr: number; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.01em] text-slate-900">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gov-100 text-sm font-bold text-gov-800" aria-hidden>
        {nr}
      </span>
      {children}
    </h2>
  );
}

interface Odpowiedzi {
  rola: Rola;
  zdarzenie: RodzajZdarzenia;
  data: string;
  tytul: TytulUbezpieczenia;
  brutto: Grosze | null;
  drugiUbezpieczony: boolean | null;
  bruttoDrugiego: Grosze | null;
}

const TYTULY_SZYBKIE = OPCJE_TYTULOW.filter((o) => o.v !== 'osoba_wspolpracujaca').map((o) =>
  o.v === 'dzialalnosc' ? { ...o, tytul: 'Działalność gospodarcza' } : o,
);

function zSytuacji(s: Sytuacja | null, dzis: string): Odpowiedzi {
  if (!s) return { rola: 'matka', zdarzenie: 'urodzenie', data: dodajDni(dzis, 120), tytul: 'umowa_o_prace', brutto: null, drugiUbezpieczony: null, bruttoDrugiego: null };
  return {
    rola: s.rola,
    zdarzenie: s.zdarzenie,
    data: s.dataZdarzenia,
    tytul: s.tytul === 'osoba_wspolpracujaca' ? 'dzialalnosc' : s.tytul,
    brutto: s.bruttoMiesiecznie,
    drugiUbezpieczony: s.drugiRodzic ? s.drugiRodzic.ubezpieczony : false,
    bruttoDrugiego: s.drugiRodzic?.bruttoMiesiecznie ?? null,
  };
}

/** Sytuacja rodziny z czterech odpowiedzi; reszta to typowe wartości oznaczone jako założenia. */
export function sytuacjaSzybka(o: Odpowiedzi, dzis: string): Sytuacja {
  const baza = sytuacjaPusta(dzis);
  const zalozenia: PoleZalozone[] = ['poczatekUbezpieczenia', 'pelnyEtat', ...(o.tytul === 'dzialalnosc' ? [] : (['ponad20'] as const))];
  if (o.drugiUbezpieczony) zalozenia.push('drugiRodzic.tytul', 'drugiRodzic.poczatekUbezpieczenia', 'drugiRodzic.pelnyEtat', 'drugiRodzic.ponad20');
  return {
    ...baza,
    przyblizona: true,
    zalozenia,
    rola: o.rola,
    zdarzenie: o.zdarzenie,
    etap: o.zdarzenie === 'urodzenie' && porownaj(o.data, dzis) > 0 ? 'ciaza' : 'poZdarzeniu',
    dataZdarzenia: o.data,
    tytul: o.tytul,
    bruttoMiesiecznie: o.brutto,
    drugiRodzic: { imie: '', nazwisko: '', ubezpieczony: !!o.drugiUbezpieczony, tytul: 'umowa_o_prace', bruttoMiesiecznie: o.drugiUbezpieczony ? o.bruttoDrugiego : null },
  };
}

export function Szybkie() {
  const router = useRouter();
  const dzis = useDzis();
  const { sytuacja, gotowe } = useSytuacja();
  const [o, setO] = useState<Odpowiedzi | null>(null);
  const [proba, setProba] = useState(false);
  if (gotowe && !o) setO(zSytuacji(sytuacja, dzis));

  const ustaw = (z: Partial<Odpowiedzi>) => setO((x) => (x ? { ...x, ...z } : x));
  const braki = o
    ? [
        o.brutto == null && 'brutto',
        o.drugiUbezpieczony == null && 'drugi',
        o.drugiUbezpieczony && o.bruttoDrugiego == null && 'bruttoDrugiego',
      ].filter((x): x is string => !!x)
    : [];

  const policz = (e: FormEvent) => {
    e.preventDefault();
    if (!o) return;
    setProba(true);
    if (braki.length > 0) {
      document.getElementById(`pytanie-${braki[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    zapiszSytuacje(sytuacjaSzybka(o, dzis));
    zapiszPlan(PLAN_DOMYSLNY);
    router.push('/plan');
  };

  const blad = (k: string, tekst: string) =>
    proba && braki.includes(k) ? (
      <p role="alert" className="mt-2 text-sm font-semibold text-pilne">
        {tekst}
      </p>
    ) : null;

  const urodzenie = o?.zdarzenie === 'urodzenie';
  const kwota = etykietaKwoty(o?.tytul ?? 'umowa_o_prace');

  return (
    <div className="min-h-dvh bg-tlo-wejscia text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-tlo-wejscia/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-2 px-4 sm:px-6">
          <Link href={sytuacja ? '/plan' : '/'} aria-label="Wstecz" className="-ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-slate-100">
            <IkonaWstecz className="h-5 w-5" />
          </Link>
          <h1 className="min-w-0 truncate text-lg font-bold text-slate-900">Szybkie wyliczenie</h1>
          <span className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-gov-50 px-2.5 py-1 text-xs font-semibold text-gov-700">
            <IkonaZegar className="h-3.5 w-3.5" />
            ok. 1 minuta
          </span>
        </div>
      </header>

      {!o ? (
        <p className="py-16 text-center text-sm text-slate-600">Wczytuję…</p>
      ) : (
        <form onSubmit={policz} noValidate className="mx-auto flex max-w-2xl flex-col px-4 sm:px-6">
          <div className="space-y-4 pt-5 pb-8">
            <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
              <IkonaKlodka className="mt-0.5 h-4 w-4 shrink-0 text-gov-600" />
              Wynik będzie przybliżony: resztę danych przyjmiemy typowo. Dokładnie policzy go Przewodnik krok po kroku.
            </p>

            <Karta>
              <Grupa etykieta="Jestem">
                <Chipy nazwa="rola" wartosc={o.rola} opcje={OPCJE_ROLI} onChange={(rola) => ustaw({ rola })} />
              </Grupa>
            </Karta>

            <Karta className="space-y-5">
              <Numer nr={1}>Co się wydarzy?</Numer>
              <Chipy
                nazwa="zdarzenie"
                wartosc={o.zdarzenie}
                opcje={[
                  { v: 'urodzenie', etykieta: 'Poród' },
                  { v: 'przysposobienie', etykieta: 'Adopcja' },
                  { v: 'rodzinaZastepczaNiezawodowa', etykieta: 'Rodzina zastępcza' },
                ]}
                onChange={(zdarzenie) => ustaw({ zdarzenie })}
              />
              <Pole etykieta={urodzenie ? 'Termin porodu (planowany albo faktyczny)' : 'Data przyjęcia dziecka'}>
                {(id) => <Wejscie id={id} type="date" required value={o.data} onChange={(e) => e.target.value && ustaw({ data: e.target.value })} />}
              </Pole>
            </Karta>

            <Karta className="space-y-5">
              <Numer nr={2}>Jak jesteś {wgRoli(o.rola, 'ubezpieczona', 'ubezpieczony')}?</Numer>
              <fieldset>
                <legend className="sr-only">Forma zatrudnienia</legend>
                <KartyWyboru nazwa="tytul" wartosc={o.tytul} opcje={TYTULY_SZYBKIE} onChange={(tytul) => ustaw({ tytul })} />
              </fieldset>
            </Karta>

            <Karta className="space-y-5">
              <div id="pytanie-brutto">
                <Numer nr={3}>{kwota.etykieta}</Numer>
              </div>
              <Pole etykieta={<span className="sr-only">{kwota.etykieta}</span>} opis={kwota.opis}>
                {(id) => <WejscieKwoty id={id} wartosc={o.brutto} onChange={(brutto) => ustaw({ brutto })} ikona={<IkonaPortfel className="h-5 w-5" />} placeholder="np. 6 800" />}
              </Pole>
              {blad('brutto', 'Wpisz kwotę, żeby policzyć zasiłek.')}
            </Karta>

            <Karta className="space-y-5">
              <div id="pytanie-drugi">
                <Numer nr={4}>Czy drugi rodzic ma ubezpieczenie chorobowe?</Numer>
                <p className="mt-1.5 text-sm leading-snug text-slate-600">Wtedy może wziąć swoje 9 tygodni urlopu rodzicielskiego, których nie da się przenieść.</p>
              </div>
              <Grupa etykieta={<span className="sr-only">Ubezpieczenie drugiego rodzica</span>}>
                <ChipyTakNie nazwa="drugi" wartosc={o.drugiUbezpieczony} onChange={(drugiUbezpieczony) => ustaw({ drugiUbezpieczony })} />
              </Grupa>
              {blad('drugi', 'Wybierz Tak albo Nie.')}
              {o.drugiUbezpieczony && (
                <div id="pytanie-bruttoDrugiego">
                  <Pole etykieta={`Ile zarabia ${o.rola === 'matka' ? 'tata' : 'mama'} brutto?`} opis="Miesięcznie, średnio z ostatnich 12 miesięcy.">
                    {(id) => <WejscieKwoty id={id} wartosc={o.bruttoDrugiego} onChange={(bruttoDrugiego) => ustaw({ bruttoDrugiego })} ikona={<IkonaPortfel className="h-5 w-5" />} placeholder="np. 7 000" />}
                  </Pole>
                  {blad('bruttoDrugiego', 'Wpisz kwotę drugiego rodzica, żeby policzyć jego zasiłek.')}
                </div>
              )}
            </Karta>
          </div>

          <div className="sticky bottom-0 -mx-4 mt-auto border-t border-slate-200/70 bg-tlo-wejscia/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:mx-0 sm:px-0">
            <button
              type="submit"
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gov-600 text-base font-bold text-white shadow-[0_8px_20px_-8px_rgba(59,77,158,0.6)] transition-colors hover:bg-gov-700"
            >
              Policz
              <IkonaStrzalka className="h-5 w-5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
