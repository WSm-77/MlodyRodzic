'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PARAMETRY_2026, type KluczParametru, type Parametr, type ParametryPrawne } from '@/silnik';
import { Ramka, Znaczek } from '@/app/_komponenty/ui';

interface Nadpisanie {
  wartosc: unknown;
  status: Parametr['status'];
  zmieniono?: string;
}

const GRUPY: { tytul: string; od: KluczParametru; do?: KluczParametru }[] = [
  { tytul: 'Podstawa wymiaru i zadłużenie', od: 'odliczenieSkladek' },
  { tytul: 'Zasiłek chorobowy w ciąży', od: 'okresWyczekiwaniaObowiazkowe' },
  { tytul: 'Urlopy i zasiłek macierzyński', od: 'tygodnieMacierzynskiego' },
];

const KLUCZE = Object.keys(PARAMETRY_2026) as KluczParametru[];

function jednostka(k: string): string {
  if (/^stawka/.test(k) || k === 'progZadluzenia' || k === 'maksWymiarPracyPrzyLaczeniu') return 'promile (1000 = 100%)';
  if (k === 'odliczenieSkladek') return 'punkty bazowe (10000 = 100%)';
  if (/placa|Podstaw|Wynagrodzenie|kwota/i.test(k)) return 'grosze';
  if (/^tygodnie|Tygodnie/.test(k)) return 'tygodnie';
  if (/^dni|Dni$|okres.*Dni|przerwa/.test(k)) return 'dni';
  if (/[Mm]iesiac/.test(k)) return 'miesiące';
  if (/wiek|rok/i.test(k)) return 'lata';
  return '';
}

const tekst = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));

export default function Admin() {
  const router = useRouter();
  const [nadpisania, setNadpisania] = useState<Partial<Record<KluczParametru, Nadpisanie>>>({});
  const [edycja, setEdycja] = useState<Partial<Record<KluczParametru, string>>>({});
  const [komunikat, setKomunikat] = useState<{ ton: 'zielen' | 'czerwien'; t: string } | null>(null);
  const [szukaj, setSzukaj] = useState('');

  useEffect(() => {
    fetch('/api/parametry', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { nadpisania: typeof nadpisania }) => setNadpisania(d.nadpisania))
      .catch(() => setKomunikat({ ton: 'czerwien', t: 'Nie udało się wczytać parametrów.' }));
  }, []);

  const biezace = useMemo(() => {
    const p = { ...PARAMETRY_2026 } as Record<KluczParametru, Parametr<unknown>>;
    for (const [k, n] of Object.entries(nadpisania) as [KluczParametru, Nadpisanie][]) p[k] = { ...p[k], wartosc: n.wartosc, status: n.status };
    return p as unknown as ParametryPrawne;
  }, [nadpisania]);

  const grupaKlucza = (k: KluczParametru) => {
    const i = KLUCZE.indexOf(k);
    let g = 0;
    GRUPY.forEach((x, j) => {
      if (i >= KLUCZE.indexOf(x.od)) g = j;
    });
    return g;
  };

  const zapisz = async (nowe: typeof nadpisania) => {
    const r = await fetch('/api/parametry', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nadpisania: nowe }),
    });
    if (r.status === 401) return router.replace('/admin/logowanie');
    const d = (await r.json()) as { blad?: string; nadpisania?: typeof nadpisania };
    if (!r.ok) return setKomunikat({ ton: 'czerwien', t: d.blad ?? 'Błąd zapisu.' });
    setNadpisania(d.nadpisania ?? {});
    setEdycja({});
    setKomunikat({ ton: 'zielen', t: 'Zapisano. Kalkulator używa nowych wartości od następnego przeliczenia.' });
  };

  const zatwierdz = (k: KluczParametru) => {
    const surowe = edycja[k];
    if (surowe === undefined) return;
    let wartosc: unknown;
    try {
      wartosc = typeof PARAMETRY_2026[k].wartosc === 'string' ? surowe : JSON.parse(surowe);
    } catch {
      return setKomunikat({ ton: 'czerwien', t: `Niepoprawna wartość parametru ${k}.` });
    }
    void zapisz({ ...nadpisania, [k]: { wartosc, status: nadpisania[k]?.status ?? PARAMETRY_2026[k].status, zmieniono: new Date().toISOString() } });
  };

  const fraza = szukaj.toLowerCase();
  const widoczne = KLUCZE.filter((k) => !fraza || k.toLowerCase().includes(fraza) || PARAMETRY_2026[k].zrodlo.toLowerCase().includes(fraza));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight lg:text-4xl text-slate-900">Parametry prawne</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Stawki, wymiary urlopów, kwoty i terminy, z których korzysta silnik reguł. Zmiana działa od razu dla wszystkich użytkowników – bez zmiany kodu. Wartości domyślne pochodzą z
            ustawy zasiłkowej i Kodeksu pracy (stan 2026).
          </p>
        </div>
      </div>
      {komunikat && <Ramka ton={komunikat.ton}>{komunikat.t}</Ramka>}
      <div className="flex flex-wrap items-center gap-3">
        <input className="pole max-w-sm" placeholder="Szukaj parametru albo przepisu…" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} />
        <span className="text-sm text-slate-600">Zmienionych: {Object.keys(nadpisania).length}</span>
        {Object.keys(nadpisania).length > 0 && (
          <button className="przycisk-jasny py-1.5" onClick={() => zapisz({})}>
            Przywróć wszystkie domyślne
          </button>
        )}
      </div>
      {GRUPY.map((g, gi) => {
        const klucze = widoczne.filter((k) => grupaKlucza(k) === gi);
        if (klucze.length === 0) return null;
        return (
          <section key={g.tytul} className="karta overflow-x-auto p-0">
            <h2 className="px-5 pt-4 font-bold">{g.tytul}</h2>
            <table className="mt-2 w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-600 uppercase">
                <tr>
                  <th className="px-5 py-2">Parametr</th>
                  <th className="px-3 py-2">Wartość</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Źródło</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {klucze.map((k) => {
                  const p = biezace[k] as Parametr<unknown>;
                  const n = nadpisania[k];
                  const edytowana = edycja[k];
                  return (
                    <tr key={k} className={`border-t border-slate-200 ${n ? 'bg-amber-50' : ''}`}>
                      <td className="px-5 py-2">
                        <span className="font-mono text-xs font-semibold">{k}</span>
                        <span className="block text-xs text-slate-600">{jednostka(k)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="pole w-44 font-mono text-xs"
                          value={edytowana ?? tekst(p.wartosc)}
                          onChange={(e) => setEdycja({ ...edycja, [k]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && zatwierdz(k)}
                        />
                        {n && <span className="mt-0.5 block text-xs text-slate-600">domyślnie: {tekst(PARAMETRY_2026[k].wartosc)}</span>}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          title="Kliknij, aby zmienić status"
                          onClick={() => zapisz({ ...nadpisania, [k]: { wartosc: p.wartosc, status: p.status === 'potwierdzony' ? 'do_potwierdzenia' : 'potwierdzony', zmieniono: new Date().toISOString() } })}
                        >
                          <Znaczek ton={p.status === 'potwierdzony' ? 'zielen' : 'miod'}>{p.status === 'potwierdzony' ? 'potwierdzony' : 'do potwierdzenia'}</Znaczek>
                        </button>
                      </td>
                      <td className="max-w-xs px-3 py-2 text-xs text-slate-600">{PARAMETRY_2026[k].zrodlo}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {edytowana !== undefined && (
                          <button className="przycisk py-1" onClick={() => zatwierdz(k)}>
                            Zapisz
                          </button>
                        )}
                        {n && edytowana === undefined && (
                          <button
                            className="text-xs font-semibold text-pilne"
                            onClick={() => {
                              const { [k]: _, ...reszta } = nadpisania;
                              void zapisz(reszta);
                            }}
                          >
                            przywróć
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
