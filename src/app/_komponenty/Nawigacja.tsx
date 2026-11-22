'use client';

/**
 * Nawigacja aplikacji (makieta Stitch „Pulpit A”): nagłówek z marką i menu konta, na telefonie dolny pasek
 * z pięcioma ekranami. Ekran wniosków ma w menu krótką nazwę „Wnioski” (decyzja Q4).
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { useSytuacja, wyloguj } from '../_lib/stan';
import { IkonaFolder, IkonaKalkulator, IkonaMonety, IkonaOlowek, IkonaOsoba, IkonaPulpit, IkonaSerce, IkonaTarcza, IkonaWyjscie, Znak } from './Ikony';

type Ik = ComponentType<SVGProps<SVGSVGElement>>;

export const EKRANY: { href: string; etykieta: string; ikona: Ik; dokladnie?: boolean }[] = [
  { href: '/plan', etykieta: 'Pulpit', ikona: IkonaPulpit, dokladnie: true },
  { href: '/plan/kalkulator', etykieta: 'Kalkulator', ikona: IkonaKalkulator },
  { href: '/plan/swiadczenia', etykieta: 'Świadczenia', ikona: IkonaMonety },
  { href: '/plan/wnioski', etykieta: 'Wnioski', ikona: IkonaFolder },
  { href: '/wsparcie', etykieta: 'Wsparcie', ikona: IkonaSerce },
];

const aktywny = (sciezka: string, e: (typeof EKRANY)[number]) => (e.dokladnie ? sciezka === e.href : sciezka.startsWith(e.href));

function MenuKonta() {
  const { sytuacja } = useSytuacja();
  const [otwarte, setOtwarte] = useState(false);
  const pudelko = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!otwarte) return;
    const zamknij = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !pudelko.current?.contains(e.target as Node)) setOtwarte(false);
    };
    document.addEventListener('mousedown', zamknij);
    document.addEventListener('keydown', zamknij);
    return () => {
      document.removeEventListener('mousedown', zamknij);
      document.removeEventListener('keydown', zamknij);
    };
  }, [otwarte]);

  if (!sytuacja) return null;
  const zus = sytuacja.zrodlo === 'zus';
  const imie = [sytuacja.osoba.imie, sytuacja.osoba.nazwisko].filter(Boolean).join(' ');
  const pozycja = 'flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-semibold text-slate-700 hover:bg-gov-50 hover:text-gov-800';
  return (
    <div ref={pudelko} className="relative">
      <button
        type="button"
        aria-expanded={otwarte}
        aria-haspopup="menu"
        aria-label="Twoje dane"
        onClick={() => setOtwarte((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-gov-700 hover:border-gov-200 hover:bg-gov-50"
      >
        <IkonaOsoba className="h-5 w-5" />
      </button>
      {otwarte && (
        <div role="menu" className="menu-otwarcie absolute top-12 right-0 z-50 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(30,41,59,0.25)]">
          <div className="px-3 pt-2 pb-1.5">
            {imie && <p className="truncate text-sm font-bold text-slate-900">{imie}</p>}
            <p className="text-xs font-semibold text-slate-500">
              {zus ? 'Dane z ZUS' : sytuacja.przyblizona ? 'Szybkie wyliczenie (przybliżone)' : 'Dane wpisane przez Ciebie'}
            </p>
          </div>
          {zus && (
            <Link role="menuitem" href="/ezus" className={pozycja} onClick={() => setOtwarte(false)}>
              <IkonaTarcza className="h-[18px] w-[18px] text-gov-600" />
              Dane pobrane z ZUS
            </Link>
          )}
          <Link role="menuitem" href="/przewodnik/1" className={pozycja} onClick={() => setOtwarte(false)}>
            <IkonaOlowek className="h-[18px] w-[18px] text-gov-600" />
            {sytuacja.przyblizona ? 'Uzupełnij w Przewodniku' : 'Zmień dane'}
          </Link>
        </div>
      )}
    </div>
  );
}

/** Zawsze widoczne wyjście z konta: po zalogowaniu mObywatel „Wyloguj”, przy danych wpisanych ręcznie „Wyczyść dane”. */
function Wyloguj() {
  const { sytuacja } = useSytuacja();
  const router = useRouter();
  if (!sytuacja) return null;
  const zus = sytuacja.zrodlo === 'zus';
  return (
    <button
      type="button"
      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-slate-600 hover:bg-coral-50 hover:text-pilne"
      onClick={() => {
        if (!zus && !window.confirm('Usunąć dane wpisane w Przewodniku? Tej operacji nie można cofnąć.')) return;
        wyloguj();
        router.push('/');
      }}
    >
      <IkonaWyjscie className="h-[18px] w-[18px]" />
      {zus ? 'Wyloguj' : 'Wyczyść dane'}
    </button>
  );
}

export function Nawigacja() {
  const sciezka = usePathname();
  return (
    <>
      <header className="bez-druku sticky top-0 z-40 border-b border-slate-200/70 bg-tlo-wejscia/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/plan" className="flex items-center gap-2.5 rounded-xl">
            <Znak className="h-9 w-9 bg-gov-600 text-white shadow-[0_4px_12px_-4px_rgba(59,77,158,0.5)]" />
            <span className="text-lg font-extrabold tracking-tight text-gov-900">
              Młody<span className="text-coral-600">Rodzic</span>
            </span>
          </Link>
          <nav aria-label="Ekrany" className="hidden flex-1 items-center gap-1 md:flex">
            {EKRANY.map((e) => {
              const a = aktywny(sciezka, e);
              return (
                <Link
                  key={e.href}
                  href={e.href}
                  aria-current={a ? 'page' : undefined}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${a ? 'bg-gov-50 text-gov-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <e.ikona className="h-[18px] w-[18px]" />
                  {e.etykieta}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <MenuKonta />
            <Wyloguj />
          </div>
        </div>
      </header>

      <nav
        aria-label="Ekrany"
        className="bez-druku fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,28,50,0.05)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5">
          {EKRANY.map((e) => {
            const a = aktywny(sciezka, e);
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-current={a ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] leading-none transition-transform active:scale-95 ${a ? 'font-bold text-gov-700' : 'font-medium text-slate-600'}`}
              >
                <span className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${a ? 'bg-gov-100' : ''}`}>
                  <e.ikona className="h-5 w-5" />
                </span>
                {e.etykieta}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
