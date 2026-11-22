import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { PARAMETRY_2026 } from '@/silnik';
import { wypelnijZam } from '@/serwer/wypelnijZam';
import { poprawnaWartosc, scal } from '@/serwer/parametry';
import { dokumenty, sciezka } from './dokumenty';
import { persona, PERSONY } from './persony';
import { rozpatrz } from './rozpatrz';
import { PLAN_DOMYSLNY, sytuacjaPusta, type PlanRodzica } from './sytuacja';
import { pelnaNazwaPola as pelnaNazwa } from './formularzePdf';
import { polaZam } from './zam';

const DZIS = '2026-11-21';
const policz = (id: string, plan: Partial<PlanRodzica> = {}) => {
  const p = persona(id)!;
  const pl = { ...PLAN_DOMYSLNY, ...p.plan, ...plan };
  const r = rozpatrz(p.sytuacja, pl, PARAMETRY_2026, DZIS);
  return { s: p.sytuacja, plan: pl, r, docs: dokumenty(p.sytuacja, pl, r, DZIS) };
};
const okres = (r: ReturnType<typeof policz>['r'], rodzaj: string, rodzic?: string) => r.urlopy.okresy.filter((o) => o.rodzaj === rodzaj && (!rodzic || o.rodzic === rodzic));

describe('persony demo przez trzy szwy silnika', () => {
  it.each(PERSONY.map((p) => p.id))('%s: liczy się bez wyjątków i daje podstawę wymiaru', (id) => {
    const { r } = policz(id);
    expect(r.podstawa?.podstawa).toBeGreaterThan(0);
    expect(r.ryzyka.wyniki.length).toBeGreaterThan(0);
  });

  it('Anna: 81,5% przez 52 tygodnie, tata 9 tygodni nieprzenoszalnych i ojcowski', () => {
    const { r } = policz('anna');
    expect(r.urlopy.wariant).toBe('81_5');
    expect(okres(r, 'macierzynski', 'matka')[0]).toMatchObject({ dni: 140, stawka: 815 });
    expect(okres(r, 'rodzicielski', 'matka')[0]).toMatchObject({ dni: 224, stawka: 815 });
    expect(okres(r, 'rodzicielski', 'ojciec')[0]).toMatchObject({ dni: 63, stawka: 700 });
    expect(okres(r, 'ojcowski')).toHaveLength(1);
  });

  it('suwak podziału przenosi tygodnie rodzicielskiego do drugiego rodzica', () => {
    const { r } = policz('anna', { tygodnieDrugiegoRodzica: 20 });
    expect(okres(r, 'rodzicielski', 'ojciec').reduce((a, o) => a + o.dni, 0)).toBe(140);
    expect(okres(r, 'rodzicielski', 'matka')[0]?.dni).toBe(21 * 7);
    expect(r.urlopy.ostrzezenia.map((o) => o.kod)).not.toContain('RODZICIELSKI_PONAD_LIMIT_RODZICA');
  });

  it('łączenie z pracą na ½ etatu wydłuża urlop dwukrotnie i obniża zasiłek o połowę', () => {
    const { r } = policz('anna', { wariant: '100_70', praca: { rodzic: 'ojciec', licznik: 1, mianownik: 2, tygodniePuli: 4 } });
    const zPraca = okres(r, 'rodzicielski', 'ojciec').find((o) => o.wymiarPracy);
    const bez = okres(r, 'rodzicielski', 'ojciec').find((o) => !o.wymiarPracy);
    expect(zPraca?.dni).toBe(56);
    expect(bez?.dni).toBe(35);
    expect(zPraca!.kwotaDzienna! * 2).toBeCloseTo(bez!.kwotaDzienna!, -1);
    expect(r.urlopy.ostrzezenia.map((o) => o.kod)).not.toContain('RODZICIELSKI_PONAD_WYMIAR');
  });

  it('rezygnacja z ojcowskiego usuwa okres i zmniejsza sumę', () => {
    const z = policz('anna').r.urlopy.suma!;
    const bez = policz('anna', { ojcowski: false }).r;
    expect(okres(bez, 'ojcowski')).toHaveLength(0);
    expect(bez.urlopy.suma).toBeLessThan(z);
  });

  it('Katarzyna: bliźnięta i „Za życiem” dają 67 tygodni rodzicielskiego i 31 tygodni macierzyńskiego', () => {
    const { r } = policz('kasia');
    expect(r.podzial?.tygodnieLacznie).toBe(67);
    expect(okres(r, 'macierzynski')[0]?.dni).toBe(31 * 7);
    expect(r.ryzyka.wyniki.find((w) => w.regula === 'R-KP-02')?.status).toBe('przysluguje');
  });

  it('Aleksandra i Paweł: zaległość w składkach wstrzymuje zasiłek i daje pozycję „spłać zaległość”', () => {
    for (const id of ['ola', 'pawel']) {
      const { r, docs } = policz(id);
      expect(r.ryzyka.wyniki.find((w) => w.regula === 'R-DL-01')?.status).toBe('nie_przysluguje');
      expect(docs.some((d) => d.id.startsWith('splata'))).toBe(true);
    }
  });

  it('Marta: przysposobienie daje urlop na warunkach macierzyńskiego i ścieżkę A (płatnik ponad 20)', () => {
    const { r, docs } = policz('marta');
    expect(okres(r, 'naWarunkachMacierzynskiego', 'matka')).toHaveLength(1);
    expect(docs.find((d) => d.id === 'zasilek-glowny-matka')?.formularz?.kod).toBe('ZAM');
  });

  it('Ewa: martwe urodzenie – 8 tygodni po 100%, bez rodzicielskiego, z zasiłkiem pogrzebowym', () => {
    const { r, docs } = policz('ewa');
    expect(r.urlopy.okresy).toHaveLength(1);
    expect(r.urlopy.okresy[0]).toMatchObject({ rodzaj: 'macierzynski', dni: 56, stawka: 1000 });
    expect(docs.some((d) => d.id === 'pogrzebowy')).toBe(true);
  });

  it('Zofia: decyzja o niepodleganiu – brak zasiłku matki, rodzicielski może wziąć ojciec', () => {
    const { r, docs } = policz('zofia');
    expect(r.ryzyka.wyniki.find((w) => w.regula === 'R-MA-03')?.status).toBe('nie_przysluguje');
    expect(r.urlopy.okresy.every((o) => o.rodzic === 'ojciec')).toBe(true);
    expect(docs.some((d) => d.id === 'odwolanie')).toBe(true);
  });

  it('formularz „Policz od razu” z wartościami domyślnymi daje pełny plan', () => {
    const r = rozpatrz(sytuacjaPusta('2027-02-01'), PLAN_DOMYSLNY, PARAMETRY_2026, DZIS);
    expect(r.urlopy.suma).toBeGreaterThan(0);
    expect(r.urlopy.okresy.map((o) => o.rodzaj)).toEqual(expect.arrayContaining(['macierzynski', 'rodzicielski', 'ojcowski']));
  });
});

describe('drugi rodzic z Przewodnika', () => {
  const zDrugim = (zmiana: Partial<NonNullable<ReturnType<typeof sytuacjaPusta>['drugiRodzic']>>) => {
    const s = sytuacjaPusta('2027-02-01');
    return { ...s, drugiRodzic: { ...s.drugiRodzic!, ...zmiana } };
  };

  it('początek ubezpieczenia drugiego rodzica wyznacza jego okres odniesienia i ryzyko braku ubezpieczenia', () => {
    const krotko = rozpatrz(zDrugim({ poczatekUbezpieczenia: '2026-11-15' }), PLAN_DOMYSLNY, PARAMETRY_2026, DZIS);
    expect(krotko.podstawaDrugiego?.kroki[0]?.opis).toContain('2 pełnych miesięcy');
    const pozniej = rozpatrz(zDrugim({ poczatekUbezpieczenia: '2027-03-01' }), PLAN_DOMYSLNY, PARAMETRY_2026, DZIS);
    expect(pozniej.ryzykaDrugiego?.wyniki.find((w) => w.swiadczenie === 'zasilek_macierzynski')?.status).toBe('ryzyko');
  });

  it('zaległość drugiego rodzica z działalnością wstrzymuje jego zasiłek (ryzyka drugiego rodzica)', () => {
    const r = rozpatrz(zDrugim({ tytul: 'dzialalnosc', zadluzenie: 50_000 }), PLAN_DOMYSLNY, PARAMETRY_2026, DZIS);
    expect(r.ryzykaDrugiego?.wyniki.find((w) => w.regula === 'R-DL-01')?.status).toBe('nie_przysluguje');
    expect(r.ryzyka.wyniki.find((w) => w.regula === 'R-DL-01')?.status).not.toBe('nie_przysluguje');
  });

  it('bez drugiego rodzica nie ma jego ryzyk', () => {
    const r = rozpatrz({ ...sytuacjaPusta('2027-02-01'), drugiRodzic: null }, PLAN_DOMYSLNY, PARAMETRY_2026, DZIS);
    expect(r.ryzykaDrugiego).toBeNull();
  });

  it('pracodawca drugiego rodzica do 20 osób: jego wnioski idą przez pracodawcę do ZUS (ścieżka B)', () => {
    const s = zDrugim({ ponad20: false, imie: 'Tomasz' });
    const r = rozpatrz(s, PLAN_DOMYSLNY, PARAMETRY_2026, DZIS);
    const docs = dokumenty(s, PLAN_DOMYSLNY, r, DZIS);
    const ojca = docs.filter((d) => d.kto === 'ojciec' && d.adresat.startsWith('Pracodawca'));
    expect(ojca.length).toBeGreaterThan(0);
    expect(ojca.every((d) => d.adresat.includes('przekaże do ZUS'))).toBe(true);
  });
});

describe('ścieżka dokumentów', () => {
  it('działalność zawsze do ZUS, płatnik do 20 osób przez płatnika do ZUS, ponad 20 płatnik wypłaca', () => {
    expect(sciezka('dzialalnosc', null).kod).toBe('C');
    expect(sciezka('umowa_o_prace', false).kod).toBe('B');
    expect(sciezka('umowa_o_prace', true)).toMatchObject({ kod: 'A', wyplaca: 'płatnik' });
  });

  it('Anna (ścieżka B): termin 81,5% to 21 dni po porodzie i jest pilny; nie żądamy odpisu aktu', () => {
    const { docs } = policz('anna');
    const glowny = docs.find((d) => d.id === 'zasilek-glowny-matka')!;
    expect(glowny.termin).toBe('2026-12-01');
    expect(glowny.status).toBe('pilne');
    expect(docs.some((d) => d.id === 'odpis')).toBe(false);
  });

  it('wniosek o rodzicielski pracownika: 21 dni przed rozpoczęciem', () => {
    const { r, docs } = policz('anna', { wariant: '100_70' });
    const o = okres(r, 'rodzicielski', 'matka')[0]!;
    const d = docs.find((x) => x.id.startsWith('rodzicielski-') && x.kto === o.rodzic)!;
    expect(d.termin).toBe('2027-03-09');
  });
});

describe('wniosek ZAM', () => {
  it('pola z planu: urlop macierzyński z okresem, deklaracja 81,5% i data w formacie ddmmrrrr', async () => {
    const { s, plan, r } = policz('anna');
    const pola = polaZam(s, plan, r, DZIS);
    const w = Object.fromEntries(pola.map((p) => [p.nazwa, p.wartosc]));
    expect(w['Page2.macierzynskiego']).toBe(true);
    expect(w['Page2.informuje']).toBe(true);
    expect(w['Page2.Okres']).toBe('10.11.2026 – 29.03.2027');
    expect(w['Page5.Data']).toBe('21112026');

    const pdf = await PDFDocument.load(await wypelnijZam(w));
    const form = pdf.getForm();
    expect(form.getTextField(pelnaNazwa('Page1.Nazwisko')).getText()).toBe('Kowalczyk');
    expect(form.getCheckBox(pelnaNazwa('Page2.macierzynskiego')).isChecked()).toBe(true);
    expect(form.getTextField(pelnaNazwa('Page1.Poczta')).getText()).toBe('Kraków');
  });
});

describe('panel administracyjny', () => {
  it('nadpisanie stawki 81,5% zmienia kwoty kalkulatora', () => {
    const p = scal({ stawkaJednolita: { wartosc: 900, status: 'potwierdzony', zmieniono: '' } });
    const s = persona('anna')!.sytuacja;
    const r = rozpatrz(s, { ...PLAN_DOMYSLNY, wariant: '81_5' }, p, DZIS);
    expect(r.urlopy.okresy.find((o) => o.rodzaj === 'macierzynski')?.stawka).toBe(900);
  });

  it('waliduje postać wartości', () => {
    expect(poprawnaWartosc('stawkaJednolita', 800)).toBe(true);
    expect(poprawnaWartosc('stawkaJednolita', '800')).toBe(false);
    expect(poprawnaWartosc('tygodnieMacierzynskiego', [20, 31, 33, 35, 37])).toBe(true);
    expect(poprawnaWartosc('dataJednegoOkresuZasilkowego', '2027-01-01')).toBe(true);
  });
});
