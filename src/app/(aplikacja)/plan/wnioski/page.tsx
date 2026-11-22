'use client';

/**
 * Wnioski i terminy (decyzje Q4, Q10, Q22): oś czasu wg wzoru rodzica. Najbliższa sprawa jako pełna karta,
 * kolejne w kolorach statusu; tytuł z lewej, termin z prawej, jedno zdanie opisu i link do oficjalnego
 * formularza (lokalny PDF z ZUS) albo strony, na której sprawę się załatwia. Załączniki pod każdym wnioskiem.
 */

import { useState, useId } from 'react';
import { sciezkaRodzica, type PozycjaDokumentu, type StatusTerminu } from '@/aplikacja/dokumenty';
import { czytelne } from '@/aplikacja/format';
import type { Sytuacja } from '@/aplikacja/sytuacja';
import { imieRoli } from '@/aplikacja/uprawnienia';
import { IkonaDalej, IkonaInfo, IkonaZewnetrzny } from '@/app/_komponenty/Ikony';
import { BrakSytuacji, Ladowanie } from '@/app/_komponenty/ui';
import { useRozpatrzenie } from '@/app/_lib/stan';

const MIESIACE = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
function krotko(d: string, dzis: string): string {
  const t = `${Number(d.slice(8, 10))} ${MIESIACE[Number(d.slice(5, 7)) - 1]}`;
  return d.slice(0, 4) === dzis.slice(0, 4) ? t : `${t} ${d.slice(0, 4)}`;
}

const KOLEJNOSC: Record<StatusTerminu, number> = { pilne: 0, zaplanowane: 1, bez_terminu: 2, minal: 3 };

const TLO: Record<StatusTerminu, string> = {
  pilne: 'bg-coral-50',
  zaplanowane: 'bg-gov-50',
  bez_terminu: 'bg-emerald-50',
  minal: 'bg-slate-100',
};

const OPIS_SCIEZKI = { A: 'Zasiłek wypłaca pracodawca', B: 'Zasiłek wypłaca ZUS, wniosek składasz u pracodawcy', C: 'Wniosek składasz w ZUS i ZUS wypłaca zasiłek' } as const;

function Pozycja({ p, s, dzis, pierwsza }: { p: PozycjaDokumentu; s: Sytuacja; dzis: string; pierwsza: boolean }) {
  const pelna = pierwsza && (p.status === 'pilne' || p.status === 'zaplanowane');
  const termin = p.status === 'bez_terminu' || !p.termin ? 'bez terminu' : p.status === 'minal' ? `minął ${krotko(p.termin, dzis)}` : `do ${krotko(p.termin, dzis)}`;
  const tekst = pelna ? 'text-white' : 'text-gov-900';
  const tekst2 = pelna ? 'text-white/90' : 'text-slate-700';
  const link = pelna ? 'text-white decoration-white/60 hover:decoration-white' : 'text-gov-700 decoration-gov-200 hover:decoration-gov-600';
  const linki = [
    ...(p.formularz?.pdf ? [{ href: p.formularz.pdf, tekst: `Wypełnij formularz ${p.formularz.kod} (PDF)` }] : []),
    ...(p.formularz?.link ? [{ href: p.formularz.link, tekst: p.formularz.etykieta ?? 'Więcej informacji' }] : []),
  ];
  const szczegoly = p.zalaczniki.length + (p.uwaga ? 1 : 0) + (p.podstawaPrawna.length ? 1 : 0);
  return (
    <li id={p.id} className="relative scroll-mt-24 pb-3">
      {pelna && <span aria-hidden className="puls absolute top-4 -left-[29px] h-[18px] w-[18px] rounded-full bg-coral-500/60" />}
      <span
        aria-hidden
        className={`absolute top-4 rounded-full ${
          pelna ? '-left-[29px] h-[18px] w-[18px] border-2 border-[#d4625c] bg-[radial-gradient(circle,#c2453f_0_4px,#fff_5px)]' : '-left-[26px] h-3 w-3 border-2 border-[#d4625c] bg-tlo-wejscia'
        } ${p.status === 'minal' ? 'border-slate-400' : ''}`}
      />
      <article
        className={`rounded-[18px] px-4 py-3.5 sm:px-5 ${pelna ? 'bg-gradient-to-br from-[#c2453f] to-pilne shadow-[0_12px_24px_-12px_rgba(167,55,51,0.6)]' : TLO[p.status]}`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className={`text-[15px] leading-snug font-bold ${tekst}`}>{czytelne(p.tytul)}</h3>
          <p className={`shrink-0 text-[13px] font-bold whitespace-nowrap tabular-nums ${tekst}`}>
            {p.status === 'pilne' && !pelna && <span className="sr-only">Pilne, </span>}
            {termin}
          </p>
        </div>
        <p className={`mt-1.5 text-sm leading-relaxed ${tekst2}`}>
          <strong className="font-semibold">{imieRoli(s, p.kto)}</strong> · {p.adresat}. {p.terminOpis.charAt(0).toUpperCase() + p.terminOpis.slice(1)}.
        </p>
        {linki.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {linki.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className={`inline-flex min-h-9 items-center gap-1 text-sm font-bold underline decoration-2 underline-offset-[3px] ${link}`}>
                {l.tekst}
                <IkonaZewnetrzny className="h-3.5 w-3.5" />
                <span className="sr-only">(otwiera się w nowej karcie)</span>
              </a>
            ))}
          </div>
        )}
        {szczegoly > 0 && (
          <details className="group mt-1">
            <summary className={`inline-flex min-h-9 cursor-pointer list-none items-center gap-1 text-sm font-semibold [&::-webkit-details-marker]:hidden ${pelna ? 'text-white/90' : 'text-slate-700'}`}>
              {p.zalaczniki.length ? `Co przygotować (${p.zalaczniki.length})` : 'Szczegóły'}
              <IkonaDalej className="h-4 w-4 transition-transform group-open:rotate-90" />
            </summary>
            <div className={`mt-1 space-y-2 rounded-xl p-3 text-sm leading-relaxed ${pelna ? 'bg-white/12 text-white' : 'bg-white/80 text-slate-700'}`}>
              {p.zalaczniki.length > 0 && (
                <ul className="list-disc space-y-1 pl-5">
                  {p.zalaczniki.map((z) => (
                    <li key={z}>{czytelne(z)}</li>
                  ))}
                </ul>
              )}
              {p.uwaga && <p>{czytelne(p.uwaga)}</p>}
              {p.podstawaPrawna.length > 0 && <p className={`text-xs ${pelna ? 'text-white/85' : 'text-slate-600'}`}>Podstawa prawna: {p.podstawaPrawna.join('; ')}</p>}
            </div>
          </details>
        )}
      </article>
    </li>
  );
}

function Baner({ s }: { s: Sytuacja }) {
  const [otwarte, setOtwarte] = useState(false);
  const id = useId();
  const sc = sciezkaRodzica(s, s.rola);
  if (!sc) return null;
  return (
    <div className="rounded-xl border border-gov-100 bg-gov-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-semibold text-gov-900">{OPIS_SCIEZKI[sc.kod]}</p>
        <button
          type="button"
          aria-expanded={otwarte}
          aria-controls={id}
          onClick={() => setOtwarte((v) => !v)}
          className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-gov-700 hover:bg-gov-100"
        >
          Co to znaczy
          <IkonaInfo className="h-4 w-4" />
        </button>
      </div>
      {otwarte && (
        <p id={id} className="mt-1 text-sm leading-relaxed text-slate-700">
          {sc.opis}
        </p>
      )}
    </div>
  );
}

export default function WnioskiITerminy() {
  const { sytuacja: s, gotowe, wynik, dokumenty, dzis } = useRozpatrzenie();
  if (!gotowe) return <Ladowanie />;
  if (!s || !wynik) return <BrakSytuacji />;

  const lista = [...dokumenty].sort((a, b) => KOLEJNOSC[a.status] - KOLEJNOSC[b.status] || (a.termin ?? '').localeCompare(b.termin ?? ''));
  const aktywne = lista.filter((p) => p.status !== 'minal');
  const minione = lista.filter((p) => p.status === 'minal');
  const pilne = lista.filter((p) => p.status === 'pilne').length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900 lg:text-4xl">Wnioski i terminy</h1>
        <p className="mt-1 text-[15px] text-slate-600">
          {lista.length} {lista.length === 1 ? 'sprawa' : lista.length < 5 ? 'sprawy' : 'spraw'}
          {pilne > 0 ? ` · ${pilne} ${pilne === 1 ? 'pilna' : pilne < 5 ? 'pilne' : 'pilnych'}` : ''}
        </p>
      </div>
      <Baner s={s} />

      {aktywne.length > 0 ? (
        <ol className="kolejno relative pl-8 before:absolute before:top-5 before:bottom-8 before:left-[11px] before:w-0.5 before:bg-[#e8a5a1]">
          {aktywne.map((p, i) => (
            <Pozycja key={p.id} p={p} s={s} dzis={dzis} pierwsza={i === 0} />
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">Nie ma spraw do załatwienia.</p>
      )}

      {minione.length > 0 && (
        <section aria-labelledby="minione" className="space-y-3">
          <h2 id="minione" className="text-lg font-bold tracking-tight text-slate-900">
            Po terminie
          </h2>
          <p className="text-sm text-slate-600">Te terminy już minęły. Część spraw da się jeszcze załatwić: sprawdź opis.</p>
          <ol className="kolejno relative pl-8 before:absolute before:top-5 before:bottom-8 before:left-[11px] before:w-0.5 before:bg-slate-300">
            {minione.map((p) => (
              <Pozycja key={p.id} p={p} s={s} dzis={dzis} pierwsza={false} />
            ))}
          </ol>
        </section>
      )}

      <p className="text-xs leading-relaxed text-slate-600">
        Formularze ZUS otwierają się jako edytowalne PDF-y pobrane ze strony ZUS. Wniosek o urlop u pracodawcy nie ma urzędowego wzoru: link prowadzi do rozporządzenia, które określa jego treść.
      </p>
    </div>
  );
}
