'use client';

/**
 * Kalkulator (makieta Stitch „Kalkulator”, decyzje Q3 i Q11): decyzje rodziny (wariant stawki, podział urlopu
 * rodzicielskiego, urlop ojcowski, praca w czasie urlopu) i ich skutek: suma, oś czasu i podpowiedzi.
 * Bez kwoty miesięcznej. Podpowiedzi optymalizacji pokazujemy tylko tutaj.
 */

import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import type { Grosze, OkresZasilku } from '@/silnik';
import { dodajDni, porownaj, roznicaDni } from '@/silnik/wspolne/daty';
import { czytelne, dataKrotka, NAZWY_URLOPOW, zl0 } from '@/aplikacja/format';
import { drugaRola, type PlanRodzica, type Rola, type Sytuacja } from '@/aplikacja/sytuacja';
import { imieRoli } from '@/aplikacja/uprawnienia';
import { IkonaDalej, IkonaInfo, IkonaPtaszek, IkonaUwaga } from '@/app/_komponenty/Ikony';
import { BrakSytuacji, Ladowanie } from '@/app/_komponenty/ui';
import { Chipy, Przelacznik } from '@/app/_kreator/pola';
import { useRozpatrzenie } from '@/app/_lib/stan';

const KOLOR: Record<Rola, { pasek: string; kropka: string; jasny: string }> = {
  matka: { pasek: 'bg-gov-600', kropka: 'bg-gov-600', jasny: 'bg-gov-200' },
  ojciec: { pasek: 'bg-coral-500', kropka: 'bg-coral-500', jasny: 'bg-coral-200' },
};

const WYMIARY_PRACY = [
  { v: '1/4', etykieta: '¼ etatu' },
  { v: '1/3', etykieta: '⅓ etatu' },
  { v: '1/2', etykieta: '½ etatu' },
] as const;

function Sekcja({ tytul, info, children }: { tytul: string; info?: ReactNode; children: ReactNode }) {
  const [otwarte, setOtwarte] = useState(false);
  const id = useId();
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(30,41,59,0.06)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">{tytul}</h2>
        {info && (
          <button
            type="button"
            aria-expanded={otwarte}
            aria-controls={id}
            aria-label={`Wyjaśnienie: ${tytul}`}
            onClick={() => setOtwarte((v) => !v)}
            className={`-my-1 grid h-9 w-9 place-items-center rounded-full ${otwarte ? 'bg-gov-50 text-gov-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <IkonaInfo className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
      {info && otwarte && (
        <p id={id} className="mb-3 rounded-lg bg-gov-50 px-3 py-2.5 text-sm leading-relaxed text-gov-900">
          {info}
        </p>
      )}
      {children}
    </section>
  );
}

function Wariant({ wybrany, tytul, opis, suma, onClick }: { wybrany: boolean; tytul: string; opis: string; suma: Grosze | null; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={wybrany}
      onClick={onClick}
      className={`flex min-h-[96px] flex-col justify-between rounded-xl p-3.5 text-left transition-colors ${wybrany ? 'bg-gov-100 text-gov-900 shadow-[inset_0_0_0_2px_var(--color-gov-600)]' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-[15px] leading-snug font-semibold">{tytul}</span>
        {wybrany && (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gov-600 text-white">
            <IkonaPtaszek className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="mt-2 block">
        <span className="block text-lg font-bold tabular-nums">{zl0(suma)}</span>
        <span className="block text-xs leading-snug text-slate-600">{opis}</span>
      </span>
    </button>
  );
}

/** Suwak podziału urlopu rodzicielskiego: dwukolorowe wypełnienie, natywny input range pod spodem. */
function Podzial({ s, ustawPlan, p, wnioskodawca, drugi, imie }: { s: Sytuacja; ustawPlan: (z: Partial<PlanRodzica>) => void; p: NonNullable<ReturnType<typeof useRozpatrzenie>['wynik']>['podzial'] & {}; wnioskodawca: Rola; drugi: Rola | null; imie: (r: Rola) => string }) {
  const tygDrugiego = p.tygodnieDrugiego;
  const tygPierwszego = Math.min(p.tygodnieLacznie - tygDrugiego, p.maksDlaJednego);
  const przepada = p.tygodnieLacznie - tygPierwszego - tygDrugiego;
  const procentPierwszego = (tygPierwszego / p.tygodnieLacznie) * 100;
  const procentDrugiego = (tygDrugiego / p.tygodnieLacznie) * 100;
  if (!drugi)
    return (
      <p className="text-sm leading-relaxed text-slate-700">
        {s.drugiRodzic ? 'Drugi rodzic nie ma ubezpieczenia chorobowego' : 'Bez drugiego rodzica'}, więc {imie(wnioskodawca)} może wykorzystać {tygPierwszego} tyg. Pozostałe {p.nieprzenoszalne} tyg. należą tylko do drugiego rodzica i przepadają.
      </p>
    );
  return (
    <div>
      <div className="relative h-10">
        <div className="absolute inset-x-0 top-1/2 flex h-3 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200">
          <div className={`transition-[width] duration-500 ease-out ${KOLOR[wnioskodawca].pasek}`} style={{ width: `${procentPierwszego}%` }} />
          <div className="flex-1" />
          <div className={`transition-[width] duration-500 ease-out ${KOLOR[drugi].pasek}`} style={{ width: `${procentDrugiego}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={p.tygodnieLacznie}
          value={tygDrugiego}
          onChange={(e) => ustawPlan({ tygodnieDrugiegoRodzica: Math.min(Number(e.target.value), p.maksDlaJednego) })}
          aria-label={`Tygodnie urlopu rodzicielskiego: ${imie(drugi)}`}
          aria-valuetext={`${imie(wnioskodawca)} ${tygPierwszego} tygodni, ${imie(drugi)} ${tygDrugiego} tygodni`}
          className="suwak-podzialu absolute inset-0 w-full cursor-pointer [direction:rtl]"
        />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-sm font-semibold">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${KOLOR[wnioskodawca].kropka}`} />
          {imie(wnioskodawca)} {tygPierwszego} tyg.
        </span>
        <span className="flex items-center gap-1.5">
          {imie(drugi)} {tygDrugiego} tyg.
          <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${KOLOR[drugi].kropka}`} />
        </span>
      </div>
      <p className={`mt-3 flex items-start gap-1.5 text-sm leading-relaxed ${przepada > 0 ? 'font-semibold text-pilne' : 'text-slate-600'}`}>
        {przepada > 0 ? <IkonaUwaga className="mt-0.5 h-4 w-4 shrink-0" /> : <IkonaInfo className="mt-0.5 h-4 w-4 shrink-0 text-gov-600" />}
        {przepada > 0
          ? `${przepada} tyg. przepada: każdy rodzic ma ${p.nieprzenoszalne} tygodni tylko dla siebie, a jeden może wziąć najwyżej ${p.maksDlaJednego}.`
          : `${p.nieprzenoszalne} tygodni tylko dla drugiego rodzica. Jeden rodzic może wziąć najwyżej ${p.maksDlaJednego} z ${p.tygodnieLacznie}.`}
      </p>
    </div>
  );
}

/** Oś czasu okresów zasiłku: wiersz na okres, paski w jednej skali dat. */
function OsCzasu({ okresy, imie }: { okresy: OkresZasilku[]; imie: (r: Rola) => string }) {
  if (okresy.length === 0) return <p className="text-sm text-slate-600">Brak okresów zasiłku w tym planie.</p>;
  const start = okresy.reduce((a, o) => (porownaj(o.od, a) < 0 ? o.od : a), okresy[0]!.od);
  const koniec = okresy.reduce((a, o) => (porownaj(o.do, a) > 0 ? o.do : a), okresy[0]!.do);
  const razem = roznicaDni(start, koniec) + 1;
  const poz = (d: string) => (roznicaDni(start, d) / razem) * 100;
  const posortowane = [...okresy].sort((a, b) => a.od.localeCompare(b.od));
  const role = [...new Set(okresy.map((o) => o.rodzic))].filter((r): r is Rola => r !== 'inny');
  return (
    <div>
      <ul className="space-y-3">
        {posortowane.map((o) => {
          const r = o.rodzic === 'inny' ? null : o.rodzic;
          return (
            <li key={`${o.rodzaj}-${o.rodzic}-${o.od}`}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold text-slate-800">
                  {NAZWY_URLOPOW[o.rodzaj]?.replace('Urlop ', '').replace(/^./, (c) => c.toUpperCase())} ({r ? imie(r) : 'członek rodziny'})
                  {o.wymiarPracy ? `, praca ${o.wymiarPracy.licznik}/${o.wymiarPracy.mianownik}` : ''}
                </span>
                <span className="shrink-0 text-xs text-slate-600 tabular-nums">
                  {dataKrotka(o.od)} – {dataKrotka(o.do)}
                </span>
              </div>
              <div className="relative mt-1.5 h-2.5 rounded-full bg-slate-100">
                <div
                  className={`pasek-rosnie absolute inset-y-0 rounded-full ${r ? (o.wymiarPracy ? KOLOR[r].jasny : KOLOR[r].pasek) : 'bg-slate-400'}`}
                  style={{ left: `${poz(o.od)}%`, width: `${Math.max(1.5, (roznicaDni(o.od, o.do) + 1) / razem * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium text-slate-600">
        {role.map((r) => (
          <span key={r} className="flex items-center gap-1.5">
            <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${KOLOR[r].kropka}`} />
            {imie(r)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Kalkulator() {
  const { sytuacja: s, gotowe, plan, ustawPlan, wynik, alternatywa } = useRozpatrzenie();
  const [pracaOtwarta, setPracaOtwarta] = useState(false);
  if (!gotowe) return <Ladowanie />;
  if (!s || !wynik) return <BrakSytuacji />;

  const imie = (r: Rola) => imieRoli(s, r).replace(/^./, (c) => c.toUpperCase());
  const okresy = wynik.urlopy.okresy;
  const sumy: Record<PlanRodzica['wariant'], Grosze | null> =
    plan.wariant === '81_5' ? { '81_5': wynik.urlopy.suma, '100_70': alternatywa?.urlopy.suma ?? null } : { '100_70': wynik.urlopy.suma, '81_5': alternatywa?.urlopy.suma ?? null };
  const p = wynik.podzial;
  const wnioskodawca = wynik.wnioskodawca;
  const drugaOsoba = wnioskodawca ? drugaRola(wnioskodawca) : null;
  const drugiUbezpieczony = !!drugaOsoba && (drugaOsoba === s.rola || !!s.drugiRodzic?.ubezpieczony);
  const drugi = drugiUbezpieczony ? drugaOsoba : null;
  const tygDrugiego = p?.tygodnieDrugiego ?? 0;
  const tygPierwszego = p ? Math.min(p.tygodnieLacznie - tygDrugiego, p.maksDlaJednego) : 0;
  const wariantNiedostepny = plan.wariant === '81_5' && wynik.urlopy.wariant !== '81_5';
  const oj = wynik.urlopy.wymiary.ojcowski;
  const ojciecUbezpieczony = s.rola === 'ojciec' || (s.drugiRodzic?.ubezpieczony ?? false);
  const kandydaciPracy: Rola[] = [wnioskodawca, drugi].filter((r): r is Rola => !!r && (r === wnioskodawca ? tygPierwszego > 0 : tygDrugiego > 0));
  const maxPuli = plan.praca ? (plan.praca.rodzic === wnioskodawca ? tygPierwszego : tygDrugiego) : 0;
  const sumaRoli = (r: Rola) => {
    const o = okresy.filter((x) => x.rodzic === r);
    return o.some((x) => x.kwota == null) ? null : o.reduce((a, x) => a + (x.kwota ?? 0) + (x.podwyzszenie ?? 0), 0);
  };
  const role = [...new Set(okresy.map((o) => o.rodzic))].filter((r): r is Rola => r !== 'inny');
  const startOjcowskiego = dodajDni(s.dataZdarzenia, plan.ojcowskiPoDniach);

  const ostrzezenia = wynik.urlopy.ostrzezenia.length > 0 && (
    <Sekcja tytul="Na co uważać">
      <ul className="space-y-2.5">
        {wynik.urlopy.ostrzezenia.map((o, i) => (
          <li key={`${o.kod}-${i}`} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
            <IkonaUwaga className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>{czytelne(o.komunikat)}</span>
          </li>
        ))}
      </ul>
    </Sekcja>
  );

  return (
    <div className="mx-auto max-w-3xl lg:max-w-none">
      <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900 lg:text-4xl">Kalkulator</h1>
      <p className="mt-1 text-[15px] text-slate-600">Zmieniaj decyzje rodziny: kwoty, okresy i terminy przeliczają się od razu.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="space-y-4 lg:col-start-1 lg:row-start-1">
          <Sekcja
            tytul="Wariant stawki"
            info="100% / 70%: pełna podstawa za urlop macierzyński, potem 70% za rodzicielski. 81,5%: równa stawka przez cały czas, jeśli wniosek złożysz do 21 dni po porodzie."
          >
            <div role="radiogroup" aria-label="Wariant stawki" className="grid grid-cols-2 gap-2.5">
              <Wariant wybrany={plan.wariant === '100_70'} tytul="100% potem 70%" opis="bez dodatkowego wniosku" suma={sumy['100_70']} onClick={() => ustawPlan({ wariant: '100_70' })} />
              <Wariant wybrany={plan.wariant === '81_5'} tytul="81,5% cały czas" opis="wniosek do 21 dni po porodzie" suma={sumy['81_5']} onClick={() => ustawPlan({ wariant: '81_5' })} />
            </div>
            {sumy['100_70'] != null && sumy['81_5'] != null && sumy['100_70'] !== sumy['81_5'] && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Przy tym planie wariant {sumy['100_70'] > sumy['81_5'] ? '100% / 70%' : '81,5%'} daje o <strong className="text-slate-900">{zl0(Math.abs(sumy['100_70'] - sumy['81_5']))}</strong> więcej.
                {sumy['100_70'] > sumy['81_5'] ? ' Opłaca się, gdy rodzina nie wykorzysta całego urlopu rodzicielskiego.' : ' Daje też równe kwoty przez cały urlop.'}
              </p>
            )}
            {wariantNiedostepny && <p className="mt-3 text-sm font-semibold text-pilne">Termin na wniosek o 81,5% minął, więc liczymy wariant 100% / 70%.</p>}
          </Sekcja>

          {p && wnioskodawca && (
            <Sekcja tytul="Podział urlopu rodzicielskiego" info={`Urlop rodzicielski to ${p.tygodnieLacznie} tygodni dla obojga rodziców. Każdy ma ${p.nieprzenoszalne} tygodni, których nie da się przenieść.`}>
              <Podzial s={s} ustawPlan={ustawPlan} p={p} wnioskodawca={wnioskodawca} drugi={drugi} imie={imie} />
            </Sekcja>
          )}

          {oj?.przysluguje && ojciecUbezpieczony && (
            <Sekcja tytul="Urlop ojcowski">
              <Przelacznik etykieta={`${imie('ojciec')} bierze ${oj.tygodnie} tygodnie`} wlaczony={plan.ojcowski} onChange={(ojcowski) => ustawPlan({ ojcowski })} />
              {plan.ojcowski && (
                <label className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-slate-700">Od kiedy</span>
                  <span className="flex items-center gap-2">
                    <input
                      type="date"
                      min={s.dataZdarzenia}
                      max={oj.terminWykorzystania}
                      value={startOjcowskiego}
                      onChange={(e) => e.target.value && ustawPlan({ ojcowskiPoDniach: Math.max(0, roznicaDni(s.dataZdarzenia, e.target.value)) })}
                      className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-[15px] font-medium tabular-nums focus:border-gov-600 focus:outline-none"
                    />
                  </span>
                  <span className="w-full text-xs text-slate-600">
                    {plan.ojcowskiPoDniach === 0 ? 'od dnia ' : `${plan.ojcowskiPoDniach + 1}. dzień po `}
                    {s.zdarzenie === 'urodzenie' ? 'porodu' : 'przyjęcia dziecka'}
                    {oj.terminWykorzystania ? `; wykorzystaj do ${dataKrotka(oj.terminWykorzystania)}` : ''}
                  </span>
                </label>
              )}
            </Sekcja>
          )}

          {p && kandydaciPracy.length > 0 && (
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
              <button
                type="button"
                aria-expanded={pracaOtwarta}
                onClick={() => setPracaOtwarta((v) => !v)}
                className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl px-4 text-left sm:px-5"
              >
                <span>
                  <span className="block text-base font-bold text-slate-900">Praca w czasie urlopu</span>
                  <span className="block text-sm text-slate-600">{plan.praca ? `${imie(plan.praca.rodzic)}: ${plan.praca.licznik}/${plan.praca.mianownik} etatu przez ${Math.min(plan.praca.tygodniePuli, maxPuli)} tyg.` : 'Nikt nie pracuje'}</span>
                </span>
                <IkonaDalej className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${pracaOtwarta ? '-rotate-90' : 'rotate-90'}`} />
              </button>
              {pracaOtwarta && (
                <div className="space-y-4 border-t border-slate-100 px-4 pt-4 pb-5 sm:px-5">
                  <p className="text-sm leading-relaxed text-slate-600">
                    Pracownik może łączyć urlop rodzicielski z pracą na najwyżej ½ etatu. Zasiłek maleje proporcjonalnie, a urlop się wydłuża (przy ½ etatu tydzień puli to 2 tygodnie kalendarzowe).
                  </p>
                  <Chipy
                    nazwa="praca-kto"
                    wartosc={plan.praca?.rodzic ?? 'nikt'}
                    opcje={[{ v: 'nikt', etykieta: 'Nikt' }, ...kandydaciPracy.map((r) => ({ v: r, etykieta: imie(r) }))]}
                    onChange={(v) =>
                      ustawPlan({ praca: v === 'nikt' ? null : { rodzic: v as Rola, licznik: plan.praca?.licznik ?? 1, mianownik: plan.praca?.mianownik ?? 2, tygodniePuli: plan.praca?.tygodniePuli ?? 8 } })
                    }
                  />
                  {plan.praca && (
                    <>
                      <Chipy
                        nazwa="praca-wymiar"
                        wartosc={`${plan.praca.licznik}/${plan.praca.mianownik}` as (typeof WYMIARY_PRACY)[number]['v']}
                        opcje={[...WYMIARY_PRACY]}
                        onChange={(v) => {
                          const [l, m] = v.split('/').map(Number) as [number, number];
                          ustawPlan({ praca: { ...plan.praca!, licznik: l, mianownik: m } });
                        }}
                      />
                      <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                        Ile tygodni puli łączysz z pracą
                        <input
                          type="number"
                          min={1}
                          max={maxPuli}
                          value={Math.min(plan.praca.tygodniePuli, maxPuli)}
                          onChange={(e) => ustawPlan({ praca: { ...plan.praca!, tygodniePuli: Math.max(1, Math.min(maxPuli, Number(e.target.value))) } })}
                          className="h-11 w-24 rounded-xl border border-slate-200 px-3 text-right text-[15px] tabular-nums focus:border-gov-600 focus:outline-none"
                        />
                      </label>
                    </>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="order-first space-y-4 lg:order-none lg:col-start-2 lg:row-start-1">
          <section aria-label="Szacowana suma" className="rounded-3xl bg-gradient-to-br from-gov-900 via-gov-800 to-gov-600 p-5 sm:p-6 text-white shadow-[0_16px_40px_-20px_rgba(27,35,72,0.7)]">
            <p className="text-xs font-bold tracking-wider text-white/80 uppercase">Szacowana suma zasiłków</p>
            <p className="mt-2 text-4xl font-extrabold sm:text-5xl tracking-tight tabular-nums">{wynik.urlopy.suma != null ? zl0(wynik.urlopy.suma) : 'Brak kwoty'}</p>
            {wynik.urlopy.suma == null && (
              <Link href="/przewodnik/4" className="mt-1 inline-block text-sm font-semibold text-white underline underline-offset-2">
                Podaj wynagrodzenie, żeby policzyć
              </Link>
            )}
            {role.length > 1 && (
              <ul className="kolejno mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                {role.map((r) => (
                  <li key={r} className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
                    <p className="text-xs font-medium text-white/75">{imie(r)}</p>
                    <p className="text-base font-bold tabular-nums">{zl0(sumaRoli(r))}</p>
                  </li>
                ))}
              </ul>
            )}
            {wynik.urlopy.wyrownanie?.kwota ? <p className="mt-3 text-xs text-white/80">W tym wyrównanie do 100% za urlop macierzyński: {zl0(wynik.urlopy.wyrownanie.kwota)}</p> : null}
            {s.przyblizona && <p className="mt-3 rounded-lg bg-coral-200 px-3 py-2 text-xs font-semibold text-gov-900">Wynik przybliżony z Szybkiego wyliczenia</p>}
          </section>
          <div className="hidden lg:block">
            <Sekcja tytul="Oś czasu">
              <OsCzasu okresy={okresy} imie={imie} />
            </Sekcja>
          </div>
          {ostrzezenia && <div className="hidden lg:block">{ostrzezenia}</div>}
        </div>

        <div className="space-y-4 lg:hidden">
          <Sekcja tytul="Oś czasu">
            <OsCzasu okresy={okresy} imie={imie} />
          </Sekcja>
          {ostrzezenia}
        </div>
      </div>

      <details className="group mt-4 rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 text-base font-bold text-slate-900 sm:px-5 [&::-webkit-details-marker]:hidden">
          Jak liczymy wymiar urlopów
          <IkonaDalej className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-90" />
        </summary>
        <ol className="list-decimal space-y-2 border-t border-slate-100 px-4 pt-4 pb-5 pl-9 text-sm leading-relaxed text-slate-700 sm:px-5 sm:pl-10">
          {wynik.urlopy.kroki.map((k, i) => (
            <li key={i}>
              {czytelne(k.opis)}
              {k.podstawaPrawna.length > 0 && <span className="block text-xs text-slate-600">{k.podstawaPrawna.join('; ')}</span>}
            </li>
          ))}
        </ol>
      </details>

    </div>
  );
}
