'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

export type Ton = 'morski' | 'koral' | 'miod' | 'czerwien' | 'zielen' | 'szary';

const TONY: Record<Ton, string> = {
  morski: 'bg-gov-50 text-gov-800 border-gov-100',
  koral: 'bg-coral-50 text-pilne border-coral-100',
  miod: 'bg-amber-50 text-amber-900 border-amber-100',
  czerwien: 'bg-coral-50 text-pilne border-coral-200',
  zielen: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  szary: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function Znaczek({ ton = 'szary', children }: { ton?: Ton; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${TONY[ton]}`}>{children}</span>;
}

export function Ramka({ ton = 'morski', tytul, children }: { ton?: Ton; tytul?: ReactNode; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border p-4 text-sm ${TONY[ton]}`}>
      {tytul && <p className="mb-1 font-bold">{tytul}</p>}
      <div className="text-slate-800">{children}</div>
    </div>
  );
}

export function Naglowek2({ id, tytul, opis, prawo }: { id?: string; tytul: string; opis?: ReactNode; prawo?: ReactNode }) {
  return (
    <div id={id} className="mb-4 flex scroll-mt-20 flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{tytul}</h2>
        {opis && <p className="mt-0.5 text-sm text-slate-600">{opis}</p>}
      </div>
      {prawo}
    </div>
  );
}

export function Podstawa({ przepisy }: { przepisy: string[] }) {
  if (przepisy.length === 0) return null;
  return <p className="mt-1 text-xs text-slate-600">Podstawa prawna: {przepisy.join('; ')}</p>;
}

/** Bez Sytuacji rodziny ekrany aplikacji nie mają czego pokazać: wracamy na ekran startowy z trzema wejściami. */
export function BrakSytuacji() {
  const router = useRouter();
  useEffect(() => router.replace('/'), [router]);
  return <Ladowanie />;
}

export function Ladowanie() {
  return <p className="py-16 text-center text-sm text-slate-600">Wczytuję…</p>;
}
