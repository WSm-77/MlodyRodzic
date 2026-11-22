'use client';

/**
 * Sprawy przykładowe ZUS: wybór sprawy z katalogu (porównanie z decyzją ZUS) albo wczytanie edytowalnego
 * formularza PDF. Treść zadania: „Strona powinna mieć możliwość uploadu/wyboru wybranych wniosków”.
 */

import Link from 'next/link';
import { SPRAWY, type SprawaPrzykladowa } from '@/aplikacja/sprawy';
import { IkonaStrzalka } from '@/app/_komponenty/Ikony';
import { usePorownanie, ZnakZgodnosci } from './Porownanie';
import { WczytajFormularz } from './WczytajFormularz';

function KartaSprawy({ sp }: { sp: SprawaPrzykladowa }) {
  const wiersze = usePorownanie(sp);
  return (
    <li>
      <Link
        href={`/sprawy/${sp.id}`}
        className="group flex min-h-20 items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(30,41,59,0.05)] transition-colors hover:border-gov-200 hover:bg-gov-50/40"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gov-100 bg-gov-50 font-mono text-sm font-bold text-gov-700">{sp.id}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] leading-snug font-bold text-gov-900">{sp.tytul}</span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                sp.decyzja.wynik === 'odmowa' ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-gov-100 bg-gov-50 text-gov-800'
              }`}
            >
              ZUS: {sp.decyzja.wynik}
            </span>
            <ZnakZgodnosci wiersze={wiersze} />
          </span>
        </span>
        <IkonaStrzalka className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gov-600" />
      </Link>
    </li>
  );
}

export default function SprawyPrzykladowe() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900 lg:text-4xl">Sprawy przykładowe ZUS</h1>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-slate-600">
          Wybierz sprawę z zestawów ZUS. Policzymy ją tym samym silnikiem co Plan rodzica i zestawimy wynik z rozstrzygnięciem ZUS. Możesz też otworzyć cały Plan dla tej sprawy.
        </p>
      </div>

      <section aria-labelledby="katalog" className="space-y-3">
        <h2 id="katalog" className="text-lg font-bold tracking-tight text-slate-900">
          Wybierz sprawę
        </h2>
        <ul className="kolejno grid gap-3 md:grid-cols-2">
          {SPRAWY.map((sp) => (
            <KartaSprawy key={sp.id} sp={sp} />
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-slate-600">
          Katalog zawiera tylko liczby i daty ze spraw, bez dokumentów i danych osobowych. Decyzje ZUS nie podają kwot zasiłku: kwoty oczekiwane wyliczyliśmy z danych płacowych z zaświadczeń Z-3. Sprawy T05, T06, T10 i T13
          sprawdzają testy silnika, bo nie da się ich odtworzyć w Sytuacji rodziny (przejęcie urlopu, przerwa w ubezpieczeniu, brak rozstrzygnięcia).
        </p>
      </section>

      <section aria-labelledby="wczytaj" className="space-y-3">
        <div>
          <h2 id="wczytaj" className="text-lg font-bold tracking-tight text-slate-900">
            Wczytaj formularz PDF
          </h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-slate-600">
            Odczytamy dane z edytowalnego ZAM, Z-3 albo Z-3a i przeniesiemy je do Przewodnika. Skany ze zestawów ZUS nie mają pól ani tekstu, więc ich nie odczytamy – pobierz wypełniony Z-3 przy wybranej sprawie i wczytaj
            go tutaj.
          </p>
        </div>
        <WczytajFormularz />
      </section>
    </div>
  );
}
