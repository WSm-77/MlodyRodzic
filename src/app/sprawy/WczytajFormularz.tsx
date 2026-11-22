'use client';

/**
 * Wczytanie edytowalnego formularza ZUS (ZAM, Z-3, Z-3a): POST /api/formularze/odczyt, podgląd odczytanych danych
 * i przejście do Przewodnika z wypełnionym szkicem Sytuacji rodziny.
 */

import { useRouter } from 'next/navigation';
import { useId, useRef, useState, type ChangeEvent } from 'react';
import { nalozOdczyt, type OdczytFormularza } from '@/aplikacja/formularzePdf';
import { dzisISO } from '@/aplikacja/format';
import { sprawa } from '@/aplikacja/sprawy';
import { PLAN_DOMYSLNY, sytuacjaPusta } from '@/aplikacja/sytuacja';
import { IkonaDokument, IkonaPtaszek, IkonaStrzalka, IkonaUwaga } from '@/app/_komponenty/Ikony';
import { zapiszDzis, zapiszPlan, zapiszSzkic } from '@/app/_lib/stan';

type Odpowiedz = OdczytFormularza & { sprawa?: string };

export function WczytajFormularz() {
  const router = useRouter();
  const id = useId();
  const pole = useRef<HTMLInputElement>(null);
  const [plik, setPlik] = useState<string | null>(null);
  const [czekam, setCzekam] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [odczyt, setOdczyt] = useState<Odpowiedz | null>(null);

  const wyslij = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setPlik(f.name);
    setBlad(null);
    setOdczyt(null);
    setCzekam(true);
    const dane = new FormData();
    dane.set('plik', f);
    dane.set('dzis', dzisISO());
    try {
      const r = await fetch('/api/formularze/odczyt', { method: 'POST', body: dane });
      const json = (await r.json()) as Odpowiedz & { blad?: string };
      if (!r.ok) setBlad(json.blad ?? 'Nie udało się odczytać pliku.');
      else setOdczyt(json);
    } catch {
      setBlad('Nie udało się wysłać pliku. Sprawdź połączenie i spróbuj ponownie.');
    } finally {
      setCzekam(false);
    }
  };

  const dalej = () => {
    if (!odczyt) return;
    const sp = odczyt.sprawa ? sprawa(odczyt.sprawa) : undefined;
    const dzis = sp?.dzis ?? dzisISO();
    // Formularz to nowy początek: bez typowych kwot z Szybkiego wyliczenia, których nikt nie podał.
    const pusta = sytuacjaPusta(dzis);
    const s = nalozOdczyt({ ...pusta, bruttoMiesiecznie: null, drugiRodzic: pusta.drugiRodzic && { ...pusta.drugiRodzic, bruttoMiesiecznie: null } }, odczyt);
    zapiszDzis(sp ? sp.dzis : null);
    zapiszPlan({ ...PLAN_DOMYSLNY, ...(sp?.plan ?? {}), ...odczyt.plan });
    zapiszSzkic(sp ? { ...s, sprawaPrzykladowa: sp.sytuacja.sprawaPrzykladowa } : s);
    router.push('/przewodnik/1');
  };

  return (
    <div className="space-y-3">
      <input ref={pole} id={id} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={wyslij} />
      <label
        htmlFor={id}
        className="flex min-h-20 cursor-pointer items-center gap-3.5 rounded-xl border-2 border-dashed border-gov-200 bg-white p-4 transition-colors hover:border-gov-600/50 hover:bg-gov-50/40 focus-within:outline-2 focus-within:outline-gov-600"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gov-100 bg-gov-50 text-gov-600">
          <IkonaDokument className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-gov-900">{czekam ? 'Odczytuję formularz…' : 'Wybierz plik PDF'}</span>
          <span className="block truncate text-sm text-slate-600">{plik ?? 'ZAM, Z-3 albo Z-3a wypełniony elektronicznie (do 8 MB)'}</span>
        </span>
      </label>

      <div aria-live="polite">
        {blad && (
          <p role="alert" className="flex gap-2 rounded-xl border border-coral-200 bg-coral-50 p-3 text-sm text-pilne">
            <IkonaUwaga className="mt-0.5 h-4 w-4 shrink-0" />
            {blad}
          </p>
        )}
        {odczyt && (
          <section className="space-y-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
            <p className="flex items-center gap-2 text-[15px] font-bold text-emerald-800">
              <IkonaPtaszek className="h-5 w-5" strokeWidth={3} />
              Odczytano formularz {odczyt.formularz}
              {odczyt.sprawa && <span className="font-semibold text-slate-600">· sprawa przykładowa {odczyt.sprawa}</span>}
            </p>
            <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[minmax(0,12rem)_1fr]">
              {odczyt.odczytane.map((o) => (
                <div key={o.etykieta} className="contents">
                  <dt className="font-semibold text-slate-600">{o.etykieta}</dt>
                  <dd className="text-slate-900">{o.wartosc}</dd>
                </div>
              ))}
            </dl>
            {odczyt.braki.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">Uzupełnisz w Przewodniku:</p>
                <ul className="mt-1 list-disc pl-5">
                  {odczyt.braki.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
            <button type="button" onClick={dalej} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gov-600 px-5 font-bold text-white hover:bg-gov-700 sm:w-auto">
              Sprawdź dane w Przewodniku
              <IkonaStrzalka className="h-4 w-4" />
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
