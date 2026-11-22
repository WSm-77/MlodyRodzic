'use client';

import { useState } from 'react';
import { NAZWY_SYTUACJI, ORGANIZACJE, ZRODLA_OFICJALNE, type SytuacjaSzczegolna } from '@/aplikacja/wsparcie';
import { Ramka, Znaczek } from '@/app/_komponenty/ui';

const KOMUNIKATY: Record<SytuacjaSzczegolna, string> = {
  smierc_dziecka:
    'Po śmierci dziecka zasiłek macierzyński przysługuje przez 8 tygodni od porodu, ale nie krócej niż 7 dni od dnia zgonu. Przysługuje też zasiłek pogrzebowy (wniosek Z-12 w ZUS, 12 miesięcy od pogrzebu).',
  poronienie:
    'Martwe urodzenie (bez względu na czas trwania ciąży) daje prawo do 8 tygodni zasiłku macierzyńskiego w wysokości 100% i do zasiłku pogrzebowego. Potrzebny jest odpis aktu z adnotacją albo zaświadczenie lekarza lub położnej.',
  wczesniactwo:
    'Przy porodzie przed 37. tygodniem albo pobycie dziecka w szpitalu przysługuje uzupełniający urlop macierzyński: do 15 tygodni (przed 28. tygodniem lub masa do 1000 g), do 8 tygodni (28.–37. tydzień) albo do 3 tygodni (po 37. tygodniu).',
  choroba_dziecka:
    'Z zaświadczeniem „Za życiem” urlop rodzicielski wydłuża się do 65 tygodni (67 przy ciąży mnogiej). Hospicja perinatalne pomagają już w czasie ciąży z wadą letalną.',
};

export default function Wsparcie() {
  const [filtr, setFiltr] = useState<SytuacjaSzczegolna | null>(null);
  const lista = filtr ? ORGANIZACJE.filter((o) => o.sytuacje.includes(filtr)) : ORGANIZACJE;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight lg:text-4xl text-slate-900">Wsparcie w trudnych sytuacjach</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Organizacje o charakterze wyłącznie charytatywnym (fundacje non-profit i bezpłatne telefony), sprawdzone 21.11.2026. Pomagają bezpłatnie.
        </p>
      </div>
      <Ramka ton="koral" tytul="Potrzebujesz rozmowy teraz?">
        Centrum Wsparcia dla Osób Dorosłych w Kryzysie Psychicznym: <strong>800 70 2222</strong> (całą dobę, bezpłatnie). Po stracie dziecka: Telefon Wsparcia Fundacji Nagle Sami{' '}
        <strong>800 108 108</strong> (pn–pt 14–20). W nagłym zagrożeniu życia: <strong>112</strong>.
      </Ramka>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFiltr(null)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${filtr === null ? 'bg-gov-600 text-white' : 'bg-white text-slate-600'}`}>
          Wszystkie
        </button>
        {(Object.keys(NAZWY_SYTUACJI) as SytuacjaSzczegolna[]).map((k) => (
          <button key={k} onClick={() => setFiltr(k)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${filtr === k ? 'bg-gov-600 text-white' : 'bg-white text-slate-600'}`}>
            {NAZWY_SYTUACJI[k]}
          </button>
        ))}
      </div>
      {filtr && <Ramka ton="morski" tytul="Twoje prawa w tej sytuacji">{KOMUNIKATY[filtr]}</Ramka>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lista.map((o) => (
          <div key={o.nazwa} className="karta flex flex-col">
            <p className="font-bold">{o.nazwa}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {o.sytuacje.map((x) => (
                <Znaczek key={x}>{NAZWY_SYTUACJI[x]}</Znaczek>
              ))}
            </div>
            <p className="mt-2 flex-1 text-sm text-slate-600">{o.pomoc}</p>
            {o.telefon && <p className="mt-2 text-sm font-semibold">tel. {o.telefon}</p>}
            {o.uwaga && <p className="mt-1 text-xs text-slate-600">{o.uwaga}</p>}
            <a className="link mt-2 text-sm" href={o.strona} target="_blank" rel="noreferrer">
              {o.strona.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗
            </a>
          </div>
        ))}
      </div>
      <section className="karta">
        <h2 className="font-bold">Oficjalne informacje o uprawnieniach rodziców</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {ZRODLA_OFICJALNE.map((z) => (
            <li key={z.url}>
              <a className="link" href={z.url} target="_blank" rel="noreferrer">{z.nazwa}</a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
