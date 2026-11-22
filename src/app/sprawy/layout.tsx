import Link from 'next/link';
import { IkonaWstecz, Znak } from '@/app/_komponenty/Ikony';

/** Sprawy przykładowe ZUS: osobne wejście (bez Sytuacji rodziny), więc bez nawigacji Planu. */
export default function UkladSpraw({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-tlo-wejscia text-slate-800">
      <header className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-semibold text-slate-700 hover:bg-slate-100">
          <IkonaWstecz className="h-5 w-5" />
          Start
        </Link>
        <span className="flex items-center gap-2">
          <Znak className="h-8 w-8 bg-gov-600 text-white" />
          <span className="font-extrabold tracking-tight text-gov-900">
            Młody<span className="text-coral-600">Rodzic</span>
          </span>
        </span>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">{children}</main>
    </div>
  );
}
