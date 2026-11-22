'use client';

/**
 * Symulowane logowanie przez mObywatel: wybór konta demo, potwierdzenie kodem, pobieranie danych z „eZUS”.
 * Po pobraniu Sytuacja rodziny zapisuje się bez liczby osób zgłoszonych przez płatnika (eZUS jej nie pokazuje,
 * decyzja Q19b): przyjmujemy „Nie” i prosimy o uzupełnienie na ekranie danych z ZUS.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Persona } from '@/aplikacja/persony';
import { PERSONY } from '@/aplikacja/persony';
import { NAZWY_TYTULOW, PLAN_DOMYSLNY, prowadziFirme } from '@/aplikacja/sytuacja';
import { IkonaDalej, IkonaDokument, IkonaPtaszek, IkonaStrzalka, IkonaTarcza, IkonaWstecz, Znak } from '@/app/_komponenty/Ikony';
import { wyczyscWyslane, zapiszDzis, zapiszPlan, zapiszSytuacje } from '@/app/_lib/stan';

type Krok = 'wybor' | 'potwierdzenie' | 'pobieranie';

const ETAPY_POBIERANIA = [
  'Okresy ubezpieczenia chorobowego i tytuł ubezpieczenia',
  'Płatnik składek: nazwa i NIP',
  'Wynagrodzenia i podstawy składek z ostatnich 12 miesięcy',
  'Zaświadczenia lekarskie e-ZLA',
  'Stan rozliczeń składek',
];

/**
 * Karuzela kont demo w układzie shadcn „Spacing”: węższa niż strona, kilka kart naraz (1 / 2 / 3 zależnie od szerokości),
 * strzałki poprzednie/następne po bokach. Na telefonie przewijanie palcem; Tab dochodzi do kart.
 */
function Karuzela({ onWybierz }: { onWybierz: (p: (typeof PERSONY)[number]) => void }) {
  const pas = useRef<HTMLUListElement>(null);
  const [poczatek, setPoczatek] = useState(true);
  const [koniec, setKoniec] = useState(false);

  const odswiez = useCallback(() => {
    const el = pas.current;
    if (!el) return;
    setPoczatek(el.scrollLeft <= 1);
    setKoniec(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    odswiez();
    window.addEventListener('resize', odswiez);
    return () => window.removeEventListener('resize', odswiez);
  }, [odswiez]);

  const przesun = (kierunek: -1 | 1) => {
    const el = pas.current;
    const karta = el?.firstElementChild as HTMLElement | undefined;
    if (!el || !karta) return;
    el.scrollBy({ left: kierunek * karta.getBoundingClientRect().width, behavior: 'smooth' });
  };

  const strzalka =
    'absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-gov-700 shadow-[0_1px_3px_rgba(30,41,59,0.08)] transition-[transform,opacity,background-color] duration-150 hover:bg-gov-50 active:scale-95 disabled:pointer-events-none disabled:opacity-40 sm:grid';

  return (
    <div className="relative mt-5 sm:px-14" role="region" aria-roledescription="karuzela" aria-label="Konta">
      <ul
        ref={pas}
        onScroll={odswiez}
        className="-ml-3 flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PERSONY.map((p, i) => (
          <li key={p.id} aria-roledescription="slajd" aria-label={`${i + 1} z ${PERSONY.length}`} className="min-w-0 shrink-0 basis-[88%] snap-start pl-3 sm:basis-1/2 lg:basis-1/3">
            <button
              type="button"
              className="group flex h-full w-full flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_1px_3px_rgba(30,41,59,0.06)] transition-[border-color,box-shadow] duration-200 hover:border-gov-200 hover:shadow-[0_12px_28px_-16px_rgba(30,41,59,0.35)]"
              aria-label={`Zaloguj jako ${p.sytuacja.osoba.imie} ${p.sytuacja.osoba.nazwisko}`}
              onClick={() => onWybierz(p)}
            >
              <span className="flex items-center gap-3.5">
                <span aria-hidden className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-base font-bold ${p.sytuacja.rola === 'matka' ? 'bg-gov-50 text-gov-700' : 'bg-coral-50 text-coral-600'}`}>
                  {p.sytuacja.osoba.imie[0]}
                  {p.sytuacja.osoba.nazwisko[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-snug font-bold text-slate-900">
                    {p.sytuacja.osoba.imie} {p.sytuacja.osoba.nazwisko}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-gov-700">
                    {NAZWY_TYTULOW[p.sytuacja.tytul]} · {p.sytuacja.rola === 'matka' ? 'mama' : 'tata'}
                  </span>
                </span>
              </span>
              <span className="block flex-1 text-sm leading-relaxed text-slate-600">{p.opis}</span>
              <span className="flex min-h-11 items-center justify-between rounded-xl bg-gov-600 px-4 text-sm font-bold text-white transition-colors group-hover:bg-gov-700">
                Zaloguj
                <IkonaStrzalka className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={`${strzalka} left-0`} aria-label="Poprzednie konto" disabled={poczatek} onClick={() => przesun(-1)}>
        <IkonaDalej className="h-5 w-5 rotate-180" />
      </button>
      <button type="button" className={`${strzalka} right-0`} aria-label="Następne konto" disabled={koniec} onClick={() => przesun(1)}>
        <IkonaDalej className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function Logowanie() {
  const router = useRouter();
  const [krok, setKrok] = useState<Krok>('wybor');
  const [wybrana, setWybrana] = useState<(typeof PERSONY)[number] | null>(null);
  const [kod] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [postep, setPostep] = useState(0);
  const [blad, setBlad] = useState<string | null>(null);

  useEffect(() => {
    if (krok !== 'potwierdzenie') return;
    const t = setTimeout(() => setKrok('pobieranie'), 1800);
    return () => clearTimeout(t);
  }, [krok]);

  useEffect(() => {
    if (krok !== 'pobieranie' || !wybrana) return;
    let anuluj = false;
    const licznik = setInterval(() => setPostep((p) => Math.min(p + 1, ETAPY_POBIERANIA.length - 1)), 220);
    fetch(`/api/zus/${wybrana.id}`)
      .then((r) => (r.ok ? (r.json() as Promise<Persona>) : Promise.reject(new Error('Brak konta'))))
      .then((p) => {
        if (anuluj) return;
        setPostep(ETAPY_POBIERANIA.length);
        const s = p.sytuacja;
        zapiszSytuacje(prowadziFirme(s.tytul) ? s : { ...s, platnik: { ...s.platnik, ponad20: false }, zalozenia: ['ponad20'] });
        zapiszPlan({ ...PLAN_DOMYSLNY, ...p.plan });
        zapiszDzis(null);
        wyczyscWyslane();
        setTimeout(() => router.push('/ezus?pobrano=1'), 500);
      })
      .catch(() => setBlad('Nie udało się pobrać danych z eZUS. Spróbuj ponownie.'));
    return () => {
      anuluj = true;
      clearInterval(licznik);
    };
  }, [krok, wybrana, router]);

  return (
    <div className="min-h-dvh bg-tlo-wejscia text-slate-800">
      <header className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-semibold text-slate-700 hover:bg-slate-100">
          <IkonaWstecz className="h-5 w-5" />
          Wstecz
        </Link>
        <span className="flex items-center gap-2">
          <Znak className="h-8 w-8 bg-gov-600 text-white" />
          <span className="font-extrabold tracking-tight text-gov-900">
            Młody<span className="text-coral-600">Rodzic</span>
          </span>
        </span>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-12 sm:px-6">
        {krok === 'wybor' && (
          <>
            <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900 lg:text-4xl">Zaloguj przez mObywatel</h1>
            <Karuzela
              onWybierz={(p) => {
                setWybrana(p);
                setKrok('potwierdzenie');
              }}
            />
            <Link
              href="/admin/logowanie"
              className="mt-2 flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-left transition-colors hover:border-gov-200 hover:bg-white sm:mx-14"
            >
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                <IkonaTarcza className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-slate-900">Logowanie dla pracowników</span>
                <span className="block text-sm text-slate-600">Panel ustawień parametrów obliczeń</span>
              </span>
              <IkonaStrzalka className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
            <Link
              href="/sprawy"
              className="mt-2 flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-left transition-colors hover:border-gov-200 hover:bg-white sm:mx-14"
            >
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                <IkonaDokument className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-slate-900">Sprawy przykładowe ZUS</span>
                <span className="block text-sm text-slate-600">Wybierz sprawę albo wczytaj formularz PDF</span>
              </span>
              <IkonaStrzalka className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          </>
        )}

        {krok === 'potwierdzenie' && wybrana && (
          <section className="wejscie-strony mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
            <h1 className="text-xl font-bold text-slate-900">Potwierdź logowanie w aplikacji mObywatel</h1>
            <p className="mt-2 text-sm text-slate-600">Na telefonie pojawiło się powiadomienie. Sprawdź, czy kod jest taki sam:</p>
            <p className="my-6 font-mono text-5xl font-bold tracking-[0.3em] text-gov-900 tabular-nums">{kod}</p>
            <p className="text-sm text-slate-600" aria-live="polite">
              Czekam na potwierdzenie…
            </p>
          </section>
        )}

        {krok === 'pobieranie' && wybrana && (
          <section className="wejscie-strony mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
            <h1 className="text-xl font-bold text-slate-900">Pobieram Twoje dane z ZUS</h1>
            <p className="mt-1 text-sm text-slate-600">
              Za zgodą: {wybrana.sytuacja.osoba.imie} {wybrana.sytuacja.osoba.nazwisko}
            </p>
            <ul className="mt-5 space-y-2.5 text-sm" aria-live="polite">
              {ETAPY_POBIERANIA.map((e, i) => (
                <li key={e} className="flex items-center gap-2.5">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors duration-300 ${i < postep ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>
                    {i < postep && <IkonaPtaszek className="pojawienie h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className={i < postep ? 'text-slate-900' : 'text-slate-600'}>{e}</span>
                </li>
              ))}
            </ul>
            {blad && (
              <p role="alert" className="mt-4 text-sm font-semibold text-pilne">
                {blad}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
