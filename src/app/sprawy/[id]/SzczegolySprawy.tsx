'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { czytelne } from '@/aplikacja/format';
import { sprawa } from '@/aplikacja/sprawy';
import { IkonaDokument, IkonaPtaszek, IkonaStrzalka, IkonaUwaga, IkonaWstecz } from '@/app/_komponenty/Ikony';
import { wczytajSprawe } from '@/app/_lib/stan';
import { usePorownanie, ZnakZgodnosci } from '../Porownanie';

export function SzczegolySprawy({ id }: { id: string }) {
  const sp = sprawa(id)!;
  const router = useRouter();
  const wiersze = usePorownanie(sp);
  const z3 = (sp.sytuacja.miesiacePracownika?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <Link href="/sprawy" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-gov-700 hover:bg-gov-50">
        <IkonaWstecz className="h-4 w-4" />
        Wszystkie sprawy
      </Link>
      <div>
        <p className="font-mono text-sm font-bold text-gov-700">Sprawa {sp.id}</p>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900 lg:text-4xl">{sp.tytul}</h1>
        <p className="mt-1 text-sm text-slate-600">{sp.rodzaj}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="fakty" className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
          <h2 id="fakty" className="text-[15px] font-bold text-slate-900">
            Dane ze sprawy
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
            {sp.fakty.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="decyzja" className={`rounded-xl border p-4 ${sp.decyzja.wynik === 'odmowa' ? 'border-slate-200 bg-slate-100' : 'border-gov-100 bg-gov-50'}`}>
          <h2 id="decyzja" className="text-[15px] font-bold text-slate-900">
            Rozstrzygnięcie ZUS: {sp.decyzja.wynik}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-800">{sp.decyzja.opis}</p>
        </section>
      </div>

      <section aria-labelledby="porownanie" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="porownanie" className="text-lg font-bold tracking-tight text-slate-900">
            ZUS a MłodyRodzic
          </h2>
          <ZnakZgodnosci wiersze={wiersze} />
        </div>
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
          {wiersze.map((w) => (
            <li key={w.etykieta + w.oczekiwane} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
              <p className="text-sm font-bold text-slate-900">{w.etykieta}</p>
              <div className="text-sm">
                <p className="text-xs font-semibold text-slate-600">{w.zrodlo === 'decyzja' ? 'Decyzja ZUS' : 'Wyliczenie z danych Z-3'}</p>
                <p className="text-slate-900 tabular-nums">{w.oczekiwane}</p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-semibold text-slate-600">MłodyRodzic</p>
                <p className="text-slate-900 tabular-nums">{w.wyliczone}</p>
                {w.uzasadnienie && <p className="mt-1 text-xs leading-relaxed text-slate-600">{czytelne(w.uzasadnienie)}</p>}
              </div>
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${w.zgodne ? 'bg-emerald-600 text-white' : 'bg-coral-100 text-pilne'}`}
                role="img"
                aria-label={w.zgodne ? 'zgodne' : 'niezgodne'}
              >
                {w.zgodne ? <IkonaPtaszek className="h-4 w-4" strokeWidth={3} /> : <IkonaUwaga className="h-4 w-4" />}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            wczytajSprawe(sp);
            router.push('/plan');
          }}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gov-600 px-5 font-bold text-white hover:bg-gov-700"
        >
          Otwórz Plan rodzica tej sprawy
          <IkonaStrzalka className="h-4 w-4" />
        </button>
        {z3 && (
          <a
            href={`/api/sprawy/${sp.id}/z3`}
            download
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gov-200 bg-white px-5 font-bold text-gov-700 hover:bg-gov-50"
          >
            <IkonaDokument className="h-4 w-4" />
            Pobierz Z-3 tej sprawy (PDF)
          </a>
        )}
      </div>
      {z3 && (
        <p className="text-xs leading-relaxed text-slate-600">
          Z-3 to oficjalny edytowalny wzór ZUS wypełniony danymi płacowymi sprawy. Wczytaj go na liście spraw (sekcja „Wczytaj formularz PDF”), żeby sprawdzić odczyt dokumentu.
        </p>
      )}
    </div>
  );
}
