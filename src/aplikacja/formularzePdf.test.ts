import { describe, expect, it } from 'vitest';
import { PARAMETRY_2026 } from '@/silnik';
import { czytajPola, wypelnijFormularz } from '@/serwer/pdf';
import { datyZTekstu, kwotaZTekstu, nalozOdczyt, odczytajFormularz, polaZ3, rozpoznajFormularz } from './formularzePdf';
import { rozpatrz } from './rozpatrz';
import { sprawa } from './sprawy';
import { PLAN_DOMYSLNY, sytuacjaPusta } from './sytuacja';

const DZIS = '2026-11-21';

describe('odczyt pól tekstowych', () => {
  it('kwoty w formacie polskim i daty w kilku zapisach', () => {
    expect(kwotaZTekstu('6 400,00')).toBe(640_000);
    expect(kwotaZTekstu('1399.80 zł')).toBe(139_980);
    expect(kwotaZTekstu('')).toBeNull();
    expect(datyZTekstu('01.08.2026 – 22.01.2027')).toEqual(['2026-08-01', '2027-01-22']);
    expect(datyZTekstu('27122025')).toEqual(['2025-12-27']);
    expect(datyZTekstu('od 2023-12-01')).toEqual(['2023-12-01']);
  });
});

describe('Z-3 sprawy przykładowej: wypełnienie oficjalnego PDF i odczyt z powrotem', () => {
  it.each(['T01', 'T02', 'T03', 'T09', 'T14'])('%s: miesiące wynagrodzeń wracają bez zmian', async (id) => {
    const sp = sprawa(id)!;
    const pdf = await wypelnijFormularz('Z-3_edytowalny.pdf', polaZ3(sp.sytuacja, sp.dzis), 'Z-3', id);
    const { pola, sprawa: znacznik } = await czytajPola(pdf);
    expect(znacznik).toBe(id);
    expect(rozpoznajFormularz(pola)).toBe('Z-3');
    const odczyt = odczytajFormularz(pola, sp.dzis)!;
    expect(odczyt.zmiany.miesiacePracownika).toEqual(sp.sytuacja.miesiacePracownika);
    expect(odczyt.zmiany.pelnyEtat).toBe(sp.sytuacja.pelnyEtat);
    expect(odczyt.zmiany.poczatekUbezpieczenia).toBe(sp.sytuacja.poczatekUbezpieczenia);
  });

  it.each(['T01', 'T02', 'T03'])('%s: Sytuacja z wczytanego Z-3 daje tę samą podstawę wymiaru co sprawa', async (id) => {
    const sp = sprawa(id)!;
    const { pola } = await czytajPola(await wypelnijFormularz('Z-3_edytowalny.pdf', polaZ3(sp.sytuacja, sp.dzis), 'Z-3'));
    const s = { ...nalozOdczyt(sytuacjaPusta(sp.dzis), odczytajFormularz(pola, sp.dzis)!), sprawaPrzykladowa: sp.sytuacja.sprawaPrzykladowa };
    expect(s.dataZdarzenia).toBe(sp.sytuacja.dataZdarzenia);
    expect(s.rola).toBe(sp.sytuacja.rola);
    const plan = { ...PLAN_DOMYSLNY, ...sp.plan };
    expect(rozpatrz(s, plan, PARAMETRY_2026, sp.dzis).podstawa?.podstawa).toBe(rozpatrz(sp.sytuacja, plan, PARAMETRY_2026, sp.dzis).podstawa?.podstawa);
  });

  it('pusty wzór do druku (skan) nie ma pól, więc nie zostaje rozpoznany', async () => {
    const { readFile } = await import('node:fs/promises');
    const { pola } = await czytajPola(await readFile('public/forms/Z-3_do-druku.pdf'));
    expect(rozpoznajFormularz(pola)).toBeNull();
  });
});

describe('ZAM wypełniony w aplikacji wraca jako Sytuacja', () => {
  it('dane wnioskodawcy, data porodu, wariant 81,5%', async () => {
    const { pola } = await czytajPola(
      await wypelnijFormularz(
        'ZAM_edytowalny.pdf',
        { 'Page1.Imie': 'Anna', 'Page1.Nazwisko': 'Nowak', 'Page1.PESEL': '93041512346', 'Page2.macierzynskiego': true, 'Page2.Okres': '10.11.2026 – 29.03.2027', 'Page2.informuje': true, 'Page2.ZaznaczX1a': true },
        'ZAM',
      ),
    );
    const o = odczytajFormularz(pola, DZIS)!;
    expect(o.formularz).toBe('ZAM');
    expect(o.zmiany.osoba?.nazwisko).toBe('Nowak');
    expect(o.zmiany.dataZdarzenia).toBe('2026-11-10');
    expect(o.zmiany.etap).toBe('poZdarzeniu');
    expect(o.plan?.wariant).toBe('81_5');
  });
});
