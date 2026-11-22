'use client';

import { useRouter } from 'next/navigation';
import { IkonaWyjscie } from '@/app/_komponenty/Ikony';

export function Wyloguj() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      onClick={async () => {
        await fetch('/api/admin/sesja', { method: 'DELETE' });
        router.replace('/admin/logowanie');
        router.refresh();
      }}
    >
      <IkonaWyjscie className="h-5 w-5" />
      Wyloguj
    </button>
  );
}
