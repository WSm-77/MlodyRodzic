'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IkonaKlodka, IkonaWstecz, Znak } from '@/app/_komponenty/Ikony';

/** Logowanie pracownika do panelu ustawień. Niezależne od logowania rodzica przez mObywatel (/logowanie). */
export default function LogowanieAdmina() {
  const router = useRouter();
  const [haslo, setHaslo] = useState('');
  const [blad, setBlad] = useState<string | null>(null);
  const [trwa, setTrwa] = useState(false);

  const zaloguj = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrwa(true);
    setBlad(null);
    const r = await fetch('/api/admin/sesja', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ haslo }) }).catch(() => null);
    setTrwa(false);
    if (!r?.ok) return setBlad(r ? 'Nieprawidłowe hasło.' : 'Brak połączenia z serwerem.');
    router.replace('/admin');
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-800">
      <header className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-semibold text-slate-700 hover:bg-slate-100">
          <IkonaWstecz className="h-5 w-5" />
          Do aplikacji dla rodziców
        </Link>
        <span className="flex items-center gap-2">
          <Znak className="h-8 w-8 bg-slate-800 text-white" />
          <span className="font-extrabold tracking-tight text-slate-900">
            Młody<span className="text-coral-600">Rodzic</span>
          </span>
        </span>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6 pb-12 sm:px-6">
        <form onSubmit={zaloguj} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
          <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-700">
            <IkonaKlodka className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Panel ustawień dla pracowników</h1>
          <p className="mt-1 text-sm text-slate-600">
            Zmiana parametrów prawnych (stawki, wymiary urlopów, kwoty), z których liczy aplikacja. Rodzice logują się{' '}
            <Link href="/logowanie" className="font-semibold text-gov-700 underline underline-offset-2">
              przez mObywatel
            </Link>
            .
          </p>
          <label className="mt-5 block">
            <span className="etykieta">Hasło pracownika</span>
            <input
              type="password"
              className="pole"
              autoComplete="current-password"
              autoFocus
              required
              value={haslo}
              onChange={(e) => setHaslo(e.target.value)}
              aria-invalid={blad ? true : undefined}
              aria-describedby={blad ? 'blad-hasla' : undefined}
            />
          </label>
          {blad && (
            <p id="blad-hasla" role="alert" className="mt-2 text-sm font-semibold text-pilne">
              {blad}
            </p>
          )}
          <button type="submit" className="przycisk mt-5 w-full justify-center" disabled={trwa}>
            {trwa ? 'Loguję…' : 'Zaloguj'}
          </button>
        </form>
      </main>
    </div>
  );
}
