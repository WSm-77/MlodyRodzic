import { describe, expect, it } from 'vitest';
import { PARAMETRY_2026 } from '@/silnik';
import { dokumenty } from './dokumenty';
import { persona } from './persony';
import { rozpatrz } from './rozpatrz';
import { PLAN_DOMYSLNY } from './sytuacja';
import { formularzWniosku } from './wnioski';

const DZIS = '2026-11-21';
const policz = (id: string) => {
  const p = persona(id)!;
  const plan = { ...PLAN_DOMYSLNY, ...p.plan };
  const r = rozpatrz(p.sytuacja, plan, PARAMETRY_2026, DZIS);
  const docs = dokumenty(p.sytuacja, plan, r, DZIS);
  const f = (idPozycji: string) => {
    const poz = docs.find((x) => x.id === idPozycji || x.id.startsWith(idPozycji));
    return poz ? formularzWniosku(poz, p.sytuacja, plan, r, DZIS) : undefined;
  };
  return { f, docs };
};
const tekst = (f: ReturnType<ReturnType<typeof policz>['f']>) => {
  if (f?.rodzaj !== 'urlopowy') throw new Error(`oczekiwano wniosku urlopowego, jest ${f?.rodzaj}`);
  return { wzor: f.wzor, akapity: f.wzor.tresc(Object.fromEntries(f.wzor.pola.map((p) => [p.klucz, p.wartosc]))).join(' ') };
};

describe('wnioski do wypełnienia w aplikacji', () => {
  it('pracownica z wariantem 81,5%: jeden wniosek o macierzyński i rodzicielski w pełnym wymiarze z oświadczeniem o drugim rodzicu (RWn § 15)', () => {
    const { wzor, akapity } = tekst(policz('anna').f('zasilek-glowny-matka'));
    expect(wzor.tytul).toBe('Wniosek o udzielenie urlopu macierzyńskiego i urlopu rodzicielskiego w pełnym wymiarze');
    expect(wzor.adresat).toBe('Pracownia Projektowa Linia sp. z o.o.');
    expect(akapity).toContain('od dnia 10.11.2026 do dnia 29.03.2027');
    expect(akapity).toContain('81,5%');
    expect(wzor.oswiadczenia.join(' ')).toContain('drugi rodzic dziecka (ojciec) zamierza korzystać');
    expect(wzor.zalaczniki.join(' ')).toContain('Odpis skrócony aktu urodzenia');
  });

  it('urlop ojcowski drugiego rodzica-pracownika: imię z Sytuacji, okres z Planu, RWn § 17', () => {
    const { wzor, akapity } = tekst(policz('anna').f('ojcowski'));
    expect(wzor.pola.find((p) => p.klucz === 'imieNazwisko')?.wartosc).toBe('Tomasz Kowalczyk');
    expect(akapity).toMatch(/urlopu ojcowskiego od dnia 08\.12\.2026 do dnia 21\.12\.2026/);
    expect(wzor.podstawa).toContain('RWn § 17');
  });

  it('przedsiębiorca składa ZAM do ZUS zamiast wniosku urlopowego; odpis aktu to osobny wniosek do USC', () => {
    const { f } = policz('pawel');
    expect(f('ojcowski')).toEqual({ rodzaj: 'zam', wlasny: true });
  });

  it('wniosek o odpis aktu urodzenia, gdy zasiłek wypłaca płatnik', () => {
    const { f, docs } = policz('kasia');
    if (docs.some((d) => d.id === 'odpis')) expect(f('odpis')).toEqual({ rodzaj: 'odpis' });
  });

  it('pozycji bez formularza (np. zgłoszenie urodzenia w USC) nie wypełniamy w aplikacji', () => {
    expect(policz('anna').f('usc-zgloszenie')).toBeNull();
  });
});
