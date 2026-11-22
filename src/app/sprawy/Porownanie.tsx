'use client';

/** Wynik silnika dla sprawy przykładowej zestawiony z rozstrzygnięciem ZUS (parametry z panelu ustawień). */

import { useMemo } from 'react';
import { rozpatrz } from '@/aplikacja/rozpatrz';
import { porownajSprawe, type SprawaPrzykladowa, type WierszPorownania } from '@/aplikacja/sprawy';
import { PLAN_DOMYSLNY } from '@/aplikacja/sytuacja';
import { useParametry } from '@/app/_lib/stan';

export function usePorownanie(sp: SprawaPrzykladowa): WierszPorownania[] {
  const { parametry } = useParametry();
  return useMemo(() => porownajSprawe(sp, rozpatrz(sp.sytuacja, { ...PLAN_DOMYSLNY, ...sp.plan }, parametry, sp.dzis)), [sp, parametry]);
}

export function ZnakZgodnosci({ wiersze }: { wiersze: WierszPorownania[] }) {
  const zgodne = wiersze.filter((w) => w.zgodne).length;
  const wszystkie = zgodne === wiersze.length;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
        wszystkie ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-coral-200 bg-coral-50 text-pilne'
      }`}
    >
      {wszystkie ? 'Zgodne z ZUS' : 'Rozbieżność'} {zgodne}/{wiersze.length}
    </span>
  );
}
