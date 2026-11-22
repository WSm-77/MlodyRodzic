import { Nawigacja } from '@/app/_komponenty/Nawigacja';

export default function UkladAplikacji({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-tlo-wejscia text-slate-800">
      <Nawigacja />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-24 sm:px-6 md:pb-10 lg:pt-8">{children}</main>
    </div>
  );
}
