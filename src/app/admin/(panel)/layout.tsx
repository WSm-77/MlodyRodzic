import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Znak } from '@/app/_komponenty/Ikony';
import { czyAdmin } from '@/serwer/sesjaAdmina';
import { Wyloguj } from './Wyloguj';

/** Panel ustawień dla pracowników: własny nagłówek, bez nawigacji i danych rodzica. Bez sesji – ekran logowania pracownika. */
export default async function UkladPanelu({ children }: { children: React.ReactNode }) {
  if (!(await czyAdmin())) redirect('/admin/logowanie');
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <Znak className="h-8 w-8 bg-slate-800 text-white" />
            <span className="font-extrabold tracking-tight text-slate-900">
              Młody<span className="text-coral-600">Rodzic</span>
            </span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white">Panel ustawień</span>
          </Link>
          <Wyloguj />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-10 sm:px-6 lg:pt-8">{children}</main>
    </div>
  );
}
