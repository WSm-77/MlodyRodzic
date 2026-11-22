'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { IkonaDalej, Znak } from '../_komponenty/Ikony';

type Krok = {
  foto: string;
  alt: string;
  /** Kolor tła kroku (pod zdjęciem, a na komputerze tło całego ekranu). */
  tlo: string;
  /** Gradient nad zdjęciem na telefonie, żeby tekst na dole był czytelny. */
  nakladka: string;
  tusz: string;
  tusz2: string;
  tytul: [string, string];
  opis: string;
  opaska: string;
};

const KROKI: [Krok, ...Krok[]] = [
  {
    foto: '/onboarding/krok1.jpg',
    alt: 'Rodzice z małym dzieckiem siedzą razem na podłodze',
    tlo: '#3B52C7',
    nakladka:
      'linear-gradient(180deg, rgba(23,37,84,.45) 0%, rgba(23,37,84,0) 20%, rgba(23,37,84,.15) 40%, rgba(23,37,84,.6) 58%, rgba(15,23,42,.94) 100%)',
    tusz: '#ffffff',
    tusz2: 'rgba(255,255,255,.9)',
    tytul: ['Wszystkie zasiłki', 'w jednym planie'],
    opis: 'Macierzyński, ojcowski i chorobowy w ciąży z ZUS – dla obojga rodziców, na jednej osi czasu.',
    opaska: 'KROK 1 Z 3 • PLAN RODZICA •',
  },
  {
    foto: '/onboarding/krok2.jpg',
    alt: 'Biurko w pokoju dziecka z laptopem i notesem',
    tlo: '#48CAE4',
    nakladka:
      'linear-gradient(180deg, rgba(72,202,228,.72) 0%, rgba(72,202,228,0) 22%, rgba(72,202,228,.2) 40%, rgba(72,202,228,.72) 58%, rgba(72,202,228,.95) 100%)',
    tusz: '#0b253a',
    tusz2: 'rgba(11,37,58,.86)',
    tytul: ['Precyzyjny', 'kalkulator zasiłków'],
    opis: 'Sprawdź kwoty co do grosza. Zaplanuj podział tygodni z drugim rodzicem.',
    opaska: 'KROK 2 Z 3 • KALKULATOR •',
  },
  {
    foto: '/onboarding/krok3.jpg',
    alt: 'Stópki niemowlęcia w dłoniach rodzica',
    tlo: '#F7949E',
    nakladka:
      'linear-gradient(180deg, rgba(247,148,158,.45) 0%, rgba(247,148,158,0) 22%, rgba(247,148,158,.2) 40%, rgba(247,148,158,.75) 58%, rgba(247,148,158,.96) 100%)',
    tusz: '#1E1B4B',
    tusz2: 'rgba(30,27,75,.86)',
    tytul: ['Wszystkie terminy', 'pod kontrolą'],
    opis: 'Pokażemy każdy dokument i termin, żeby żaden zasiłek Ci nie przepadł.',
    opaska: 'KROK 3 Z 3 • SPOKOJNY START •',
  },
];

/** Obracająca się opaska z napisem po okręgu i numerem kroku w środku. */
function Opaska({ tekst, numer, kolor }: { tekst: string; numer: number; kolor: string }) {
  const id = useId();
  return (
    <div className="relative h-[88px] w-[88px] shrink-0" aria-hidden style={{ color: kolor }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-obrot">
        <defs>
          <path id={id} d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1 -76 0" />
        </defs>
        <text fill="currentColor" fontSize="11" fontWeight="800" letterSpacing="1.5">
          <textPath href={`#${id}`} textLength="236" lengthAdjust="spacing">
            {tekst}
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-[24px] grid place-items-center rounded-full border border-current/30 text-sm font-extrabold tabular-nums">
        {numer}/3
      </span>
    </div>
  );
}

export function Wprowadzenie({ onKoniec }: { onKoniec: () => void }) {
  const [krok, setKrok] = useState(0);
  const k = KROKI[krok] ?? KROKI[0];
  const ostatni = krok === KROKI.length - 1;
  const dotyk = useRef<number | null>(null);
  const naglowek = useRef<HTMLHeadingElement>(null);
  const pierwszyRender = useRef(true);

  const dalej = useCallback(() => (ostatni ? onKoniec() : setKrok((n) => n + 1)), [ostatni, onKoniec]);
  const wstecz = useCallback(() => setKrok((n) => Math.max(0, n - 1)), []);

  useEffect(() => {
    const klawisz = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') dalej();
      if (e.key === 'ArrowLeft') wstecz();
    };
    window.addEventListener('keydown', klawisz);
    return () => window.removeEventListener('keydown', klawisz);
  }, [dalej, wstecz]);

  // Po zmianie kroku czytnik ekranu zaczyna od nowego nagłówka.
  useEffect(() => {
    if (pierwszyRender.current) {
      pierwszyRender.current = false;
      return;
    }
    naglowek.current?.focus({ preventScroll: true });
  }, [krok]);

  const zdjecia = (sizes: string) =>
    KROKI.map((x, i) => (
      <Image
        key={x.foto}
        src={x.foto}
        alt={i === krok ? x.alt : ''}
        aria-hidden={i !== krok}
        fill
        priority={i === 0}
        sizes={sizes}
        className={`object-cover transition-opacity duration-700 ease-out ${i === krok ? 'opacity-100' : 'opacity-0'}`}
      />
    ));

  return (
    <div
      className="relative isolate flex min-h-dvh flex-col overflow-hidden transition-[background-color,color] duration-500 ease-out"
      style={{ backgroundColor: k.tlo, color: k.tusz }}
      onTouchStart={(e) => (dotyk.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (dotyk.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? dotyk.current) - dotyk.current;
        dotyk.current = null;
        if (dx < -50) dalej();
        if (dx > 50) wstecz();
      }}
    >
      {/* Telefon: zdjęcie na całym ekranie, gradient od dołu. */}
      <div className="absolute inset-0 -z-10 lg:hidden">
        {zdjecia('100vw')}
        <div className="absolute inset-0 transition-[background] duration-500" style={{ background: k.nakladka }} />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5 lg:px-12 lg:pt-8">
        <span className="flex items-center gap-2.5">
          <Znak className="h-10 w-10 bg-white text-gov-600 shadow-[0_6px_16px_-6px_rgba(15,23,42,0.4)]" />
          <span className="sr-only lg:not-sr-only lg:text-lg lg:font-extrabold lg:tracking-tight">MłodyRodzic</span>
        </span>
        <button
          type="button"
          onClick={onKoniec}
          className="-mr-3 min-h-12 rounded-xl px-3 text-[15px] font-semibold underline-offset-4 hover:underline"
          style={{ color: k.tusz }}
        >
          Pomiń
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-center lg:gap-16 lg:px-12 lg:pb-12">
        <div className="mt-auto lg:mt-0">
          <p className="sr-only" aria-live="polite">
            Krok {krok + 1} z {KROKI.length}
          </p>
          <div key={krok} className="animate-wejscie">
            <h1
              ref={naglowek}
              tabIndex={-1}
              className="text-[2.25rem] leading-[1.08] font-black tracking-[-0.03em] text-balance outline-none lg:text-6xl"
            >
              {k.tytul[0]}
              <br />
              {k.tytul[1]}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed font-medium lg:mt-6 lg:text-xl" style={{ color: k.tusz2 }}>
              {k.opis}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 lg:mt-12 lg:justify-start lg:gap-10">
            <Opaska tekst={k.opaska} numer={krok + 1} kolor={k.tusz} />
            <button
              type="button"
              onClick={dalej}
              aria-label={ostatni ? undefined : 'Dalej'}
              className="inline-flex h-[72px] min-w-[72px] items-center justify-center gap-2 rounded-[26px] bg-white px-6 text-lg font-bold text-gov-900 shadow-[0_18px_40px_-12px_rgba(15,23,42,0.5)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-95"
            >
              {ostatni && <span>Zacznij</span>}
              <IkonaDalej className="h-7 w-7" />
            </button>
          </div>
        </div>

        {/* Komputer: zdjęcie w ramce obok tekstu. */}
        <div className="relative hidden aspect-[9/16] max-h-[78vh] overflow-hidden rounded-[32px] shadow-[0_32px_64px_-24px_rgba(15,23,42,0.55)] lg:block">
          {zdjecia('400px')}
        </div>
      </main>
    </div>
  );
}
