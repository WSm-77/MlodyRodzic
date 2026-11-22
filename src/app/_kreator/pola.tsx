'use client';

/**
 * Pola Przewodnika i Szybkiego wyliczenia (makiety Stitch „Przewodnik – krok 3” i „Szybkie wyliczenie”):
 * karty wyboru, chipy, przełącznik, pola z ikoną, objaśnienie ⓘ i sekcja „Czy dotyczy Cię…?”.
 * Wybór jednokrotny to natywne radio (klawiatura i czytnik ekranu działają bez dodatkowego kodu).
 */

import { useId, useState, type ReactNode } from 'react';
import type { Grosze } from '@/silnik';
import { IkonaDalej, IkonaInfo, IkonaPtaszek } from '../_komponenty/Ikony';

/** Karta formularza: zaokrąglenie 12 px, delikatny cień (decyzja Q18). */
export function Karta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(30,41,59,0.06)] sm:p-5 ${className}`}>{children}</section>;
}

/** Przycisk ⓘ i rozwijane objaśnienie pod etykietą. */
function useObjasnienie(info?: ReactNode) {
  const [otwarte, setOtwarte] = useState(false);
  const id = useId();
  const przycisk = info ? (
    <button
      type="button"
      aria-expanded={otwarte}
      aria-controls={id}
      aria-label={otwarte ? 'Ukryj wyjaśnienie' : 'Pokaż wyjaśnienie'}
      onClick={() => setOtwarte((v) => !v)}
      className={`-my-2 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors ${otwarte ? 'bg-gov-50 text-gov-700' : 'text-slate-500 hover:bg-slate-100 hover:text-gov-700'}`}
    >
      <IkonaInfo className="h-[18px] w-[18px]" />
    </button>
  ) : null;
  const tresc =
    info && otwarte ? (
      <div id={id} className="mt-2 rounded-lg bg-gov-50 px-3 py-2.5 text-sm leading-relaxed text-gov-900">
        {info}
      </div>
    ) : null;
  return { przycisk, tresc };
}

const etykietaCss = 'text-[15px] font-semibold text-slate-800';
const opisCss = 'mt-0.5 block text-sm leading-snug text-slate-600';

/** Pytanie z wyborem (fieldset + legend). */
export function Grupa({ etykieta, opis, info, children }: { etykieta: ReactNode; opis?: ReactNode; info?: ReactNode; children: ReactNode }) {
  const { przycisk, tresc } = useObjasnienie(info);
  return (
    <fieldset className="min-w-0">
      <legend className="w-full">
        <span className="flex items-center justify-between gap-2">
          <span className={etykietaCss}>{etykieta}</span>
          {przycisk}
        </span>
      </legend>
      {opis && <p className={opisCss}>{opis}</p>}
      {tresc}
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

/** Pole z etykietą; `children` dostaje identyfikator do połączenia z etykietą. */
export function Pole({
  etykieta,
  opis,
  info,
  children,
}: {
  etykieta: ReactNode;
  opis?: ReactNode;
  info?: ReactNode;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  const { przycisk, tresc } = useObjasnienie(info);
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className={etykietaCss}>
          {etykieta}
        </label>
        {przycisk}
      </div>
      {tresc}
      <div className="mt-2">{children(id)}</div>
      {opis && <p className={`${opisCss} mt-1.5`}>{opis}</p>}
    </div>
  );
}

export interface Opcja<T extends string> {
  v: T;
  tytul: string;
  opis?: string;
  ikona?: ReactNode;
}

function Znacznik({ wybrany }: { wybrany: boolean }) {
  return wybrany ? (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gov-600 text-white">
      <IkonaPtaszek className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-300" />
  );
}

/** Karty jednokrotnego wyboru: siatka 2×2 (makieta kroku 3) albo lista (Szybkie wyliczenie). */
export function KartyWyboru<T extends string>({
  nazwa,
  wartosc,
  opcje,
  onChange,
  uklad = 'lista',
}: {
  nazwa: string;
  wartosc: T | null;
  opcje: Opcja<T>[];
  onChange: (v: T) => void;
  uklad?: 'siatka' | 'lista';
}) {
  return (
    <div className={uklad === 'siatka' ? 'grid grid-cols-2 gap-2.5' : 'grid gap-2.5'}>
      {opcje.map((o) => {
        const wybrany = o.v === wartosc;
        return (
          <label
            key={o.v}
            className={`relative flex cursor-pointer rounded-xl border bg-white transition-[border-color,background-color,box-shadow] duration-150 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-coral-500 ${
              wybrany ? 'border-gov-600 bg-gov-50/70 shadow-[inset_0_0_0_1px_var(--color-gov-600)]' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
            } ${uklad === 'siatka' ? 'min-h-[104px] flex-col justify-between p-3.5' : 'min-h-16 items-center gap-3 p-3.5'}`}
          >
            <input type="radio" name={nazwa} value={o.v} checked={wybrany} onChange={() => onChange(o.v)} className="sr-only" />
            {uklad === 'siatka' ? (
              <>
                <span className="flex items-start justify-between">
                  <span className={wybrany ? 'text-gov-600' : 'text-slate-500'}>{o.ikona}</span>
                  <Znacznik wybrany={wybrany} />
                </span>
                <span className="mt-3 block">
                  <span className={`block text-[15px] leading-snug font-semibold ${wybrany ? 'text-gov-900' : 'text-slate-800'}`}>{o.tytul}</span>
                  {o.opis && <span className={`mt-0.5 block text-[13px] leading-snug ${wybrany ? 'text-gov-700' : 'text-slate-600'}`}>{o.opis}</span>}
                </span>
              </>
            ) : (
              <>
                {o.ikona && (
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${wybrany ? 'bg-gov-100 text-gov-700' : 'bg-slate-100 text-slate-600'}`}>{o.ikona}</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className={`block text-[15px] leading-snug font-semibold ${wybrany ? 'text-gov-900' : 'text-slate-800'}`}>{o.tytul}</span>
                  {o.opis && <span className="mt-0.5 block text-[13px] leading-snug text-slate-600">{o.opis}</span>}
                </span>
                <Znacznik wybrany={wybrany} />
              </>
            )}
          </label>
        );
      })}
    </div>
  );
}

/** Chipy jednokrotnego wyboru w równych kolumnach (Tak / Nie, mama / tata). */
export function Chipy<T extends string>({
  nazwa,
  wartosc,
  opcje,
  onChange,
}: {
  nazwa: string;
  wartosc: T | null;
  opcje: { v: T; etykieta: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${opcje.length}, minmax(0, 1fr))` }}>
      {opcje.map((o) => {
        const wybrany = o.v === wartosc;
        return (
          <label
            key={o.v}
            className={`flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 text-center text-[15px] font-semibold transition-colors duration-150 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-coral-500 ${
              wybrany ? 'bg-gov-600 text-white shadow-[0_2px_6px_-2px_rgba(59,77,158,0.5)]' : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <input type="radio" name={nazwa} value={o.v} checked={wybrany} onChange={() => onChange(o.v)} className="sr-only" />
            {wybrany && <IkonaPtaszek className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
            {o.etykieta}
          </label>
        );
      })}
    </div>
  );
}

export const TAK_NIE = [
  { v: 'tak', etykieta: 'Tak' },
  { v: 'nie', etykieta: 'Nie' },
] as const satisfies readonly { v: 'tak' | 'nie'; etykieta: string }[];

export function ChipyTakNie({ nazwa, wartosc, onChange }: { nazwa: string; wartosc: boolean | null; onChange: (v: boolean) => void }) {
  return <Chipy nazwa={nazwa} wartosc={wartosc == null ? null : wartosc ? 'tak' : 'nie'} opcje={[...TAK_NIE]} onChange={(v) => onChange(v === 'tak')} />;
}

/** Przełącznik tak/nie z etykietą po lewej (makieta: „Umowa na czas określony”). */
export function Przelacznik({ etykieta, opis, wlaczony, onChange }: { etykieta: string; opis?: string; wlaczony: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className={`${etykietaCss} cursor-pointer`}>
          {etykieta}
        </label>
        {opis && <p className={opisCss}>{opis}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={wlaczony}
        onClick={() => onChange(!wlaczony)}
        className={`relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full transition-colors duration-200 ${wlaczony ? 'bg-gov-600' : 'bg-slate-300'}`}
      >
        <span className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${wlaczony ? 'translate-x-[24px]' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

const polePudelko =
  'flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3.5 shadow-[0_1px_2px_rgba(30,41,59,0.04)] transition-[border-color,box-shadow] focus-within:border-gov-600 focus-within:shadow-[0_0_0_1px_var(--color-gov-600)]';

/** Pole tekstowe z ikoną na początku i dopiskiem na końcu (np. „zł”). */
export function Wejscie({
  id,
  ikona,
  dopisek,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; ikona?: ReactNode; dopisek?: ReactNode }) {
  return (
    <div className={polePudelko}>
      {ikona && <span className="mr-2.5 shrink-0 text-slate-500">{ikona}</span>}
      <input id={id} className="h-full w-full min-w-0 bg-transparent text-[15px] font-medium text-slate-900 tabular-nums placeholder:font-normal placeholder:text-slate-400 focus:outline-none" {...props} />
      {dopisek && <span className="ml-2 shrink-0 text-sm font-semibold text-slate-500">{dopisek}</span>}
    </div>
  );
}

const doTekstu = (g: Grosze | null) => (g == null ? '' : (g / 100).toLocaleString('pl-PL', { maximumFractionDigits: 2 }).replace(/ /g, ' '));
const doGroszy = (t: string): Grosze | null => {
  const czysty = t.replace(/[\s ]/g, '').replace(',', '.');
  if (czysty === '') return null;
  const n = Number(czysty);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};

/** Kwota w złotych; na zewnątrz grosze. Tekst trzymany lokalnie, żeby nie przeskakiwał podczas pisania. */
export function WejscieKwoty({ id, wartosc, onChange, ikona, placeholder }: { id: string; wartosc: Grosze | null; onChange: (g: Grosze | null) => void; ikona?: ReactNode; placeholder?: string }) {
  const [tekst, setTekst] = useState(() => doTekstu(wartosc));
  const [poprzednia, setPoprzednia] = useState(wartosc);
  if (wartosc !== poprzednia) {
    setPoprzednia(wartosc);
    if (doGroszy(tekst) !== wartosc) setTekst(doTekstu(wartosc));
  }
  return (
    <Wejscie
      id={id}
      ikona={ikona}
      dopisek="zł"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      value={tekst}
      onChange={(e) => {
        setTekst(e.target.value);
        const g = doGroszy(e.target.value);
        setPoprzednia(g);
        onChange(g);
      }}
      onBlur={() => setTekst(doTekstu(doGroszy(tekst)))}
    />
  );
}

/** Rzadkie przypadki schowane za pytaniem „Czy dotyczy Cię…?” (decyzja Q12). */
export function CzyDotyczy({ tytul = 'Czy dotyczy Cię…?', zajawka, otwarte, children }: { tytul?: string; zajawka: string; otwarte?: boolean; children: ReactNode }) {
  return (
    <details open={otwarte} className="group rounded-xl border border-slate-200 bg-slate-50/70 open:bg-white">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-gov-800">{tytul}</span>
          <span className="block text-[13px] leading-snug text-slate-600">{zajawka}</span>
        </span>
        <IkonaDalej className="h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-90" />
      </summary>
      <div className="space-y-5 border-t border-slate-200 px-4 pt-4 pb-5">{children}</div>
    </details>
  );
}

/** Nagłówek ekranu kreatora. */
export function Tytul({ children, opis }: { children: ReactNode; opis?: ReactNode }) {
  return (
    <div>
      <h1 tabIndex={-1} className="text-[1.625rem] leading-tight font-bold tracking-[-0.015em] text-balance text-slate-900 outline-none lg:text-[2rem]">{children}</h1>
      {opis && <p className="mt-1.5 max-w-prose text-[15px] leading-relaxed text-slate-600">{opis}</p>}
    </div>
  );
}
