import Link from 'next/link';
import type { ReactNode } from 'react';
import { IkonaDokument, IkonaKalkulator, IkonaKlodka, IkonaLegitymacja, IkonaLista, IkonaSerce, IkonaStrzalka, Znak } from '../_komponenty/Ikony';

/** Dokąd prowadzą trzy wejścia. */
export const TRASY_WEJSC = {
  mobywatel: '/logowanie',
  przewodnik: '/przewodnik/1',
  szybko: '/szybko',
} as const;

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <Znak className="h-10 w-10 bg-gov-600 text-white shadow-[0_4px_12px_-2px_rgba(59,77,158,0.35)]" />
      <div className="flex flex-col">
        <span className="text-xl leading-none font-extrabold tracking-tight text-gov-800">
          Młody<span className="text-coral-600">Rodzic</span>
        </span>
        <span className="mt-1 text-xs font-medium tracking-wide text-slate-600 uppercase">Portal wsparcia i ZUS</span>
      </div>
    </div>
  );
}

/** Ilustracja rodziny z wózkiem (z makiety Stitch „Ekran startowy”). */
function Ilustracja() {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white/70 px-3 py-2 lg:py-6">
      <svg viewBox="0 0 320 140" fill="none" className="h-24 w-full max-w-[260px] lg:h-40 lg:max-w-[360px]" aria-hidden>
        <ellipse cx="160" cy="115" fill="#EEF2FB" rx="140" ry="18" />
        <circle cx="105" cy="48" fill="#F47068" r="14" />
        <path d="M85 96C85 76 94 68 105 68C116 68 125 76 125 96" fill="#3B4D9E" />
        <path d="M96 46C96 38 104 36 109 38C116 40 120 46 116 53C113 52 110 50 107 50C101 50 97 49 96 46Z" fill="#2F3E80" />
        <ellipse cx="160" cy="80" fill="#FFE4E2" rx="26" ry="22" stroke="#F47068" strokeWidth="2.5" />
        <circle cx="160" cy="74" fill="#FFA59E" r="10" />
        <circle cx="157" cy="73" fill="#3B4D9E" r="1.5" />
        <circle cx="163" cy="73" fill="#3B4D9E" r="1.5" />
        <path d="M158 78C159 79 161 79 162 78" stroke="#3B4D9E" strokeLinecap="round" strokeWidth="1.2" />
        <path d="M142 86C147 80 173 80 178 86C175 96 145 96 142 86Z" fill="#F47068" />
        <circle cx="215" cy="46" fill="#F47068" r="15" />
        <path d="M195 96C195 74 204 66 215 66C226 66 235 74 235 96" fill="#4B63B6" />
        <path d="M205 38C208 34 219 33 226 37C224 44 219 46 214 46C208 46 205 42 205 38Z" fill="#232E62" />
        <path d="M160 38C157 32 150 33 150 38C150 44 160 50 160 50C160 50 170 44 170 38C170 33 163 32 160 38Z" fill="#F47068" opacity="0.85" />
        <circle cx="146" cy="106" fill="white" r="7" stroke="#3B4D9E" strokeWidth="2" />
        <circle cx="174" cy="106" fill="white" r="7" stroke="#3B4D9E" strokeWidth="2" />
        <line stroke="#3B4D9E" strokeWidth="2" x1="153" x2="167" y1="106" y2="106" />
      </svg>
    </div>
  );
}

function KartaWejscia({
  href,
  ikona,
  tytul,
  opis,
  plakietka,
  wyrozniona = false,
  akcent = 'gov',
}: {
  href: string;
  ikona: ReactNode;
  tytul: string;
  opis: string;
  plakietka?: string;
  wyrozniona?: boolean;
  akcent?: 'gov' | 'coral';
}) {
  const karta = wyrozniona
    ? 'border-gov-700/60 bg-gov-600 text-white shadow-[0_8px_20px_-6px_rgba(59,77,158,0.45)] hover:bg-gov-700'
    : 'border-slate-200 bg-white text-slate-800 shadow-[0_1px_2px_rgba(30,41,59,0.05)] hover:border-gov-200 hover:bg-gov-50/40';
  const kafelek = wyrozniona
    ? 'border-white/20 bg-white/15 text-white'
    : akcent === 'coral'
      ? 'border-coral-100 bg-coral-50 text-coral-600'
      : 'border-gov-100 bg-gov-50 text-gov-600';
  const strzalka = wyrozniona
    ? 'bg-white/15 text-white'
    : `bg-slate-100 text-slate-600 ${akcent === 'coral' ? 'group-hover:text-coral-600' : 'group-hover:text-gov-600'}`;

  return (
    <Link
      href={href}
      className={`group relative flex min-h-[80px] items-center gap-3.5 overflow-hidden rounded-xl border p-4 transition-[background-color,border-color,transform] duration-200 ease-out active:scale-[0.98] ${karta}`}
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${kafelek}`}>{ikona}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-base leading-snug font-bold tracking-tight ${wyrozniona ? 'text-white' : 'text-gov-900'}`}>{tytul}</span>
          {plakietka && (
            <span className="rounded-full bg-coral-500 px-2 py-0.5 text-xs font-bold tracking-wide text-gov-900 uppercase">{plakietka}</span>
          )}
        </span>
        <span className={`mt-0.5 block text-sm leading-snug ${wyrozniona ? 'text-gov-100' : 'text-slate-600'}`}>{opis}</span>
      </span>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-[color,transform] duration-200 group-hover:translate-x-0.5 ${strzalka}`}>
        <IkonaStrzalka className="h-4 w-4" />
      </span>
    </Link>
  );
}

export function Start() {
  return (
    <div className="wejscie-strony relative isolate flex min-h-dvh flex-col overflow-x-hidden bg-tlo-wejscia text-slate-800">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 -z-10 h-64 w-64 rounded-full bg-gov-100/60 blur-3xl lg:h-[28rem] lg:w-[28rem]" />
      <div aria-hidden className="pointer-events-none absolute top-40 -left-20 -z-10 h-52 w-52 rounded-full bg-coral-100/50 blur-2xl lg:top-auto lg:bottom-10" />

      <main className="mx-auto grid w-full max-w-md flex-1 content-start gap-x-16 px-4 pt-5 sm:px-5 lg:max-w-6xl lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:content-center lg:px-12 lg:pt-10">
        <div className="lg:py-8">
          <header className="pb-3">
            <Logo />
          </header>
          <div className="my-2 lg:my-8">
            <Ilustracja />
          </div>
          <section className="mt-1 mb-5">
            <h1 className="text-[1.625rem] leading-tight font-extrabold tracking-tight text-balance text-gov-900 lg:text-5xl lg:leading-[1.1]">
              Ile dostaniesz i co złożyć –{' '}
              <span className="text-gov-600 underline decoration-coral-200 decoration-4 underline-offset-4 lg:decoration-[6px] lg:underline-offset-8">
                w&nbsp;kilka minut
              </span>
            </h1>
            <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-slate-600 lg:text-lg">
              Zasiłki z ZUS w ciąży i po przyjęciu dziecka – także przy adopcji i rodzinie zastępczej.
            </p>
          </section>
        </div>

        <div className="lg:py-8">
          <section aria-label="Wybierz sposób rozpoczęcia" className="kolejno space-y-3 lg:space-y-4">
            <KartaWejscia
              href={TRASY_WEJSC.mobywatel}
              wyrozniona
              plakietka="Szybkie"
              ikona={<IkonaLegitymacja className="h-6 w-6" />}
              tytul="Zaloguj przez mObywatel"
              opis="Pobierzemy dane z ZUS"
            />
            <KartaWejscia
              href={TRASY_WEJSC.przewodnik}
              ikona={<IkonaLista className="h-6 w-6" />}
              tytul="Przewodnik krok po kroku"
              opis="6 krótkich kroków, ok. 5 minut"
            />
            <KartaWejscia
              href={TRASY_WEJSC.szybko}
              akcent="coral"
              ikona={<IkonaKalkulator className="h-6 w-6" />}
              tytul="Szybkie wyliczenie"
              opis="4 pytania, wynik przybliżony"
            />
          </section>
          <p className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-slate-100/80 px-3 py-2.5 text-[13px] font-medium text-slate-600">
            <IkonaKlodka className="h-3.5 w-3.5 text-gov-600" />
            Twoje dane zostają w tej przeglądarce
          </p>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-x-6 px-4 pt-6 pb-5 text-sm font-semibold">
        <Link href="/wsparcie" className="inline-flex min-h-12 items-center gap-1.5 text-gov-600 hover:text-gov-800">
          <IkonaSerce className="h-4 w-4" />
          Wsparcie dla rodziców
        </Link>
        <Link href="/sprawy" className="inline-flex min-h-12 items-center gap-1.5 text-gov-600 hover:text-gov-800">
          <IkonaDokument className="h-4 w-4" />
          Sprawy przykładowe ZUS
        </Link>
        <Link href="/witaj" className="inline-flex min-h-12 items-center text-slate-600 hover:text-gov-800">
          Jak to działa?
        </Link>
      </footer>
    </div>
  );
}
