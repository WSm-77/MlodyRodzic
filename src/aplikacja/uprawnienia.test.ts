import { describe, expect, it } from 'vitest';
import { PARAMETRY_2026 } from '@/silnik';
import { persona } from './persony';
import { rozpatrz } from './rozpatrz';
import { PLAN_DOMYSLNY, sytuacjaPusta, type Sytuacja } from './sytuacja';
import { uprawnienia } from './uprawnienia';

const DZIS = '2026-11-22';
const zPersony = (id: string) => {
  const p = persona(id)!;
  return uprawnienia(p.sytuacja, rozpatrz(p.sytuacja, { ...PLAN_DOMYSLNY, ...p.plan }, PARAMETRY_2026, DZIS));
};
const zSytuacji = (s: Sytuacja) => uprawnienia(s, rozpatrz(s, PLAN_DOMYSLNY, PARAMETRY_2026, DZIS));

describe('Uprawnienia rodziny', () => {
  it('Anna: cztery zasiłki z kwotami i zasiłek chorobowy w ciąży bez kwoty', () => {
    const u = zPersony('anna');
    const zasilki = u.lista.filter((x) => x.okresy.length > 0);
    expect(zasilki.map((x) => `${x.rodzaj}/${x.kto}`)).toEqual(['macierzynski/matka', 'rodzicielski/matka', 'ojcowski/ojciec', 'rodzicielski/ojciec']);
    expect(zasilki.every((x) => x.status === 'przysluguje' && x.kwota! > 0)).toBe(true);
    const chorobowy = u.lista.find((x) => x.rodzaj === 'chorobowy_w_ciazy')!;
    expect(chorobowy.status).toBe('przysluguje');
    expect(chorobowy.kwota).toBeUndefined();
    expect(u.nieprzysluguje).toHaveLength(0);
  });

  it('każde uprawnienie ma powód i podstawę prawną', () => {
    for (const id of ['anna', 'kasia', 'ola', 'pawel', 'marta', 'zofia']) {
      for (const x of [...zPersony(id).lista, ...zPersony(id).nieprzysluguje]) {
        expect(x.powod.length, `${id} ${x.id}`).toBeGreaterThan(10);
        expect(x.podstawaPrawna.length, `${id} ${x.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('Paweł: zaległość w składkach wstrzymuje jego zasiłki, ale nie zasiłek mamy', () => {
    const u = zPersony('pawel');
    const jego = u.lista.filter((x) => x.kto === 'ojciec' && x.okresy.length > 0);
    expect(jego.length).toBeGreaterThan(0);
    expect(jego.every((x) => x.status === 'zalezy' && x.coZmieni)).toBe(true);
    expect(u.lista.find((x) => x.rodzaj === 'macierzynski')?.status).toBe('przysluguje');
  });

  it('Zofia: brak ubezpieczenia w dniu porodu – macierzyński w grupie „Nie przysługuje” z powodem', () => {
    const u = zPersony('zofia');
    const m = u.nieprzysluguje.find((x) => x.rodzaj === 'macierzynski')!;
    expect(m.kto).toBe('matka');
    expect(m.powod).toContain('nie masz ubezpieczenia');
    expect(u.lista.some((x) => x.rodzaj === 'macierzynski')).toBe(false);
  });

  it('drugi rodzic bez ubezpieczenia: jego rodzicielski i ojcowski nie przysługują, z tym co by to zmieniło', () => {
    const s = sytuacjaPusta('2027-02-01');
    const u = zSytuacji({ ...s, drugiRodzic: { ...s.drugiRodzic!, imie: 'Tomasz', ubezpieczony: false } });
    expect(u.nieprzysluguje.map((x) => x.rodzaj).sort()).toEqual(['ojcowski', 'rodzicielski']);
    expect(u.nieprzysluguje.every((x) => x.kto === 'ojciec' && x.coZmieni && x.powod.includes('Tomasz'))).toBe(true);
  });

  it('martwe urodzenie: nie wyliczamy, czego rodzina nie dostanie', () => {
    expect(zPersony('ewa').nieprzysluguje).toHaveLength(0);
  });

  it('ryzyka zasiłku trafiają jako plakietki do zasiłków tej osoby', () => {
    const u = zPersony('ola');
    const m = u.lista.find((x) => x.rodzaj === 'macierzynski')!;
    expect(m.status).toBe('zalezy');
    expect(m.ryzyka.map((r) => r.regula)).toContain('R-PZ-02');
  });

  it('w ciąży bez zwolnień: zasiłek chorobowy jako „zależy”, jeśli lekarz wystawi zwolnienie', () => {
    const u = zSytuacji(sytuacjaPusta('2027-02-01'));
    expect(u.lista.find((x) => x.rodzaj === 'chorobowy_w_ciazy')?.status).toBe('zalezy');
  });

  it('licznik przysługujących obejmuje tylko status „przysługuje”', () => {
    const u = zPersony('anna');
    expect(u.ilePrzysluguje).toBe(u.lista.filter((x) => x.status === 'przysluguje').length);
  });
});
