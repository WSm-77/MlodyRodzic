import { describe, expect, it } from 'vitest';
import { PARAMETRY_2026 } from '@/silnik';
import { rozpatrz } from './rozpatrz';
import { SPRAWY, porownajSprawe } from './sprawy';
import { PLAN_DOMYSLNY } from './sytuacja';

// Katalog spraw przykładowych liczony tym samym mostem co Plan rodzica (a nie bezpośrednio szwami silnika):
// każde porównanie z rozstrzygnięciem ZUS na ekranie /sprawy musi wyjść zgodne.
describe('sprawy przykładowe w katalogu zgadzają się z rozstrzygnięciem ZUS', () => {
  it.each(SPRAWY.map((s) => [s.id, s] as const))('%s', (_, sp) => {
    const r = rozpatrz(sp.sytuacja, { ...PLAN_DOMYSLNY, ...sp.plan }, PARAMETRY_2026, sp.dzis);
    const wiersze = porownajSprawe(sp, r);
    expect(wiersze.length).toBeGreaterThan(0);
    expect(wiersze.filter((w) => !w.zgodne)).toEqual([]);
  });
});
