import Link from 'next/link';
import { IkonaStrzalka, Znak } from './_komponenty/Ikony';

export default function NieZnaleziono() {
  return (
    <main className="grid min-h-dvh place-items-center bg-tlo-wejscia px-4 text-slate-800">
      <div className="max-w-md text-center">
        <Znak className="mx-auto h-12 w-12 bg-gov-600 text-white" />
        <p className="mt-6 text-sm font-bold tracking-wider text-gov-700 uppercase">Błąd 404</p>
        <h1 className="mt-1 text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance text-slate-900">Nie ma takiej strony</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Adres mógł się zmienić. Twoje dane zostały w przeglądarce, więc możesz wrócić do planu.</p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href="/plan" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gov-600 px-5 font-bold text-white hover:bg-gov-700">
            Mój plan
            <IkonaStrzalka className="h-5 w-5" />
          </Link>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 font-semibold text-gov-700 hover:bg-gov-50">
            Ekran startowy
          </Link>
        </div>
      </div>
    </main>
  );
}
