'use client';

/**
 * Wypełnienie i symulowana wysyłka wniosku z listy „Wnioski i terminy”: wniosek urlopowy do pracodawcy
 * (treść według RWn, Dz.U. 2025 poz. 322), ZAM z danymi Planu albo wniosek o odpis aktu urodzenia.
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { PDF, type PozycjaDokumentu } from '@/aplikacja/dokumenty';
import { czytelne, data } from '@/aplikacja/format';
import type { Rozpatrzenie } from '@/aplikacja/rozpatrz';
import type { PlanRodzica, Sytuacja } from '@/aplikacja/sytuacja';
import { imieRoli } from '@/aplikacja/uprawnienia';
import { formularzWniosku, type WzorWniosku } from '@/aplikacja/wnioski';
import { dataPL, polaZam } from '@/aplikacja/zam';
import { IkonaDokument, IkonaPtaszek, IkonaWstecz, IkonaZewnetrzny } from '@/app/_komponenty/Ikony';
import { BrakSytuacji, Ladowanie } from '@/app/_komponenty/ui';
import { useRozpatrzenie, useWyslane, zapiszWyslanie } from '@/app/_lib/stan';

const przycisk = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-bold';
const glowny = `${przycisk} bg-gov-600 text-white hover:bg-gov-700 disabled:opacity-60`;
const drugorzedny = `${przycisk} border border-gov-200 bg-white text-gov-700 hover:bg-gov-50`;
const pole = 'mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-slate-900 focus:border-gov-600';

/** Symulowana wysyłka: numer potwierdzenia i zapis w przeglądarce (lista wniosków pokaże „Wysłano”). */
function Wysylka({ id, adresat, etykieta, prefiks, dzis, uwaga }: { id: string; adresat: string; etykieta: string; prefiks: string; dzis: string; uwaga: string }) {
  const wyslane = useWyslane()[id];
  const [czekam, setCzekam] = useState(false);
  const wyslij = () => {
    setCzekam(true);
    setTimeout(() => {
      zapiszWyslanie(id, { kiedy: dzis, nr: `${prefiks}-${dzis.replaceAll('-', '')}-${String(Math.floor(1000 + Math.random() * 9000))}`, adresat });
      setCzekam(false);
    }, 1200);
  };
  return (
    <div aria-live="polite" className="bez-druku">
      {wyslane ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="flex items-center gap-2 text-[15px] font-bold">
            <IkonaPtaszek className="h-5 w-5" strokeWidth={3} />
            Wysłano {data(wyslane.kiedy)}
          </p>
          <p className="mt-1">
            Adresat: {wyslane.adresat}. Numer potwierdzenia: <strong className="font-mono">{wyslane.nr}</strong>
          </p>
          <p className="mt-1 text-emerald-800">{uwaga}</p>
        </div>
      ) : (
        <button type="button" onClick={wyslij} disabled={czekam} className={glowny}>
          {czekam ? 'Wysyłam…' : etykieta}
        </button>
      )}
    </div>
  );
}

function WniosekUrlopowy({ wzor, p, dzis }: { wzor: WzorWniosku; p: PozycjaDokumentu; dzis: string }) {
  const [w, setW] = useState<Record<string, string>>(() => Object.fromEntries(wzor.pola.map((x) => [x.klucz, x.wartosc])));
  const adresat = w.pracodawca || 'pracodawca';
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form className="bez-druku space-y-3" onSubmit={(e) => e.preventDefault()} aria-label="Dane wniosku">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">Dane wniosku</h2>
        {wzor.pola.map((x) => (
          <label key={x.klucz} className="block text-sm font-semibold text-slate-700">
            {x.etykieta}
            <input type={x.typ === 'data' ? 'date' : 'text'} value={w[x.klucz] ?? ''} onChange={(e) => setW((v) => ({ ...v, [x.klucz]: e.target.value }))} className={pole} />
          </label>
        ))}
        <p className="text-xs leading-relaxed text-slate-600">Daty urlopu pochodzą z Twojego Planu. Jeśli je zmienisz tutaj, zmień je też w Kalkulatorze, żeby kwoty się zgadzały.</p>
      </form>

      <div className="space-y-4">
        <article className="druk-cel rounded-xl border border-slate-200 bg-white p-6 text-[15px] leading-7 text-slate-900 shadow-[0_1px_3px_rgba(30,41,59,0.06)] sm:p-8">
          <p className="text-right">
            {w.miejscowosc || '…'}, {w.data ? dataPL(w.data) : '…'}
          </p>
          <p className="mt-4 font-semibold">{w.imieNazwisko || '(imię i nazwisko)'}</p>
          <p className="text-sm text-slate-600">pracownik</p>
          <p className="mt-4 ml-auto w-fit text-right">
            <span className="block text-sm text-slate-600">Pracodawca</span>
            <span className="font-semibold">{w.pracodawca || '(nazwa pracodawcy)'}</span>
          </p>
          <h2 className="mt-6 text-center text-lg font-bold">{wzor.tytul}</h2>
          <div className="mt-4 space-y-3">
            {wzor.tresc(w).map((a) => (
              <p key={a}>{a}</p>
            ))}
            {wzor.oswiadczenia.map((o) => (
              <p key={o}>{o}</p>
            ))}
          </div>
          {wzor.zalaczniki.length > 0 && (
            <div className="mt-5">
              <p className="font-semibold">Załączniki:</p>
              <ol className="list-decimal pl-6">
                {wzor.zalaczniki.map((z) => (
                  <li key={z}>{z}</li>
                ))}
              </ol>
            </div>
          )}
          <p className="mt-10 ml-auto w-56 border-t border-slate-400 pt-1 text-center text-sm text-slate-600">podpis pracownika</p>
          <p className="mt-6 text-xs text-slate-500">Podstawa: {wzor.podstawa.join('; ')}. Treść wniosku według rozporządzenia MRPiPS z 11 marca 2025 r. (Dz.U. 2025 poz. 322).</p>
        </article>
        <div className="bez-druku flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => window.print()} className={drugorzedny}>
            <IkonaDokument className="h-4 w-4" />
            Drukuj albo zapisz PDF
          </button>
          <Wysylka id={p.id} adresat={adresat} etykieta="Wyślij do pracodawcy" prefiks="WN" dzis={dzis} uwaga="Pracodawca potwierdzi przyjęcie wniosku. Załączniki dostarcz osobno, jeśli nie ma ich w aktach osobowych." />
        </div>
      </div>
    </div>
  );
}

function WniosekZam({ s, plan, wynik, dzis, p, wlasny }: { s: Sytuacja; plan: PlanRodzica; wynik: Rozpatrzenie; dzis: string; p: PozycjaDokumentu; wlasny: boolean }) {
  const [blad, setBlad] = useState<string | null>(null);
  if (!wlasny)
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p>
          Ten wniosek składa {imieRoli(s, p.kto)}. Nie mamy danych drugiego rodzica do wypełnienia formularza, więc pobierz pusty wzór ZUS.
        </p>
        <a href={PDF.ZAM} target="_blank" rel="noreferrer" className={drugorzedny}>
          Pusty wzór ZAM (PDF)
          <IkonaZewnetrzny className="h-4 w-4" />
        </a>
      </div>
    );
  const pola = polaZam(s, plan, wynik, dzis);
  const sekcje = [...new Set(pola.map((x) => x.sekcja))];
  const doZus = p.adresat.startsWith('ZUS');
  const pobierz = async () => {
    setBlad(null);
    const r = await fetch('/api/wnioski/zam', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pola: Object.fromEntries(pola.map((x) => [x.nazwa, x.wartosc])) }),
    }).catch(() => null);
    if (!r?.ok) return setBlad('Nie udało się przygotować PDF-u. Spróbuj ponownie.');
    const url = URL.createObjectURL(await r.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: 'ZAM-wypelniony.pdf' });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Wypełniliśmy oficjalny wzór ZUS danymi z Twojego Planu. Pola oznaczone „uzupełnij” wpiszesz w PDF-ie.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {sekcje.map((sek) => (
          <section key={sek} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
            <h2 className="text-[15px] font-bold text-slate-900">{sek}</h2>
            <dl className="mt-2 space-y-1.5 text-sm">
              {pola
                .filter((x) => x.sekcja === sek && x.wartosc !== false)
                .map((x) => (
                  <div key={x.nazwa} className="flex justify-between gap-3">
                    <dt className="text-slate-600">{x.etykieta}</dt>
                    <dd className="text-right font-semibold text-slate-900">
                      {x.wartosc === true ? '✓' : x.wartosc ? String(x.wartosc) : <span className="font-normal text-amber-800">uzupełnij</span>}
                    </dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
      </div>
      {blad && (
        <p role="alert" className="text-sm font-semibold text-pilne">
          {blad}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={pobierz} className={drugorzedny}>
          <IkonaDokument className="h-4 w-4" />
          Pobierz wypełniony ZAM (PDF)
        </button>
        <Wysylka
          id={p.id}
          adresat={p.adresat}
          etykieta={doZus ? 'Wyślij do ZUS przez eZUS' : 'Przekaż płatnikowi'}
          prefiks={doZus ? 'ZUS' : 'WN'}
          dzis={dzis}
          uwaga={doZus ? 'Status sprawy sprawdzisz w eZUS. ZUS może poprosić o brakujące dokumenty.' : 'Płatnik ustali prawo do zasiłku albo przekaże wniosek do ZUS.'}
        />
      </div>
    </div>
  );
}

const RODZAJE_ODPISU = [
  { v: 'skrocony', e: 'Odpis skrócony', o: 'Wystarczy pracodawcy i ZUS do zasiłku' },
  { v: 'zupelny', e: 'Odpis zupełny', o: 'Pełna treść aktu z adnotacjami' },
  { v: 'wielojezyczny', e: 'Odpis wielojęzyczny', o: 'Do urzędów w innych krajach UE' },
] as const;
const FORMY = [
  { v: 'elektroniczna', e: 'Elektronicznie – do skrzynki na gov.pl' },
  { v: 'odbior', e: 'Papierowo – odbiór w urzędzie stanu cywilnego' },
  { v: 'poczta', e: 'Papierowo – pocztą na adres zamieszkania' },
] as const;

function WniosekOdpis({ s, dzis, p }: { s: Sytuacja; dzis: string; p: PozycjaDokumentu }) {
  const dziecko = s.dzieci[0];
  const [w, setW] = useState({
    rodzaj: 'skrocony',
    forma: 'elektroniczna',
    imie: dziecko?.imie ?? '',
    nazwisko: s.osoba.nazwisko,
    dataUrodzenia: s.dataZdarzenia,
    miejsce: dziecko?.miejsceUrodzenia ?? '',
    wnioskodawca: [s.osoba.imie, s.osoba.nazwisko].filter(Boolean).join(' '),
    pesel: s.osoba.pesel,
  });
  const ustaw = (k: keyof typeof w) => (e: { target: { value: string } }) => setW((v) => ({ ...v, [k]: e.target.value }));
  const radio = (nazwa: 'rodzaj' | 'forma', opcje: readonly { v: string; e: string; o?: string }[], legenda: string) => (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-700">{legenda}</legend>
      {opcje.map((o) => (
        <label key={o.v} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${w[nazwa] === o.v ? 'border-gov-600 bg-gov-50' : 'border-slate-200 bg-white'}`}>
          <input type="radio" name={nazwa} value={o.v} checked={w[nazwa] === o.v} onChange={ustaw(nazwa)} className="h-4 w-4 accent-gov-600" />
          <span>
            <span className="block font-semibold text-slate-900">{o.e}</span>
            {o.o && <span className="block text-slate-600">{o.o}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
  const tekstowe: [keyof typeof w, string, string][] = [
    ['imie', 'Imię dziecka', 'text'],
    ['nazwisko', 'Nazwisko dziecka', 'text'],
    ['dataUrodzenia', 'Data urodzenia', 'date'],
    ['miejsce', 'Miejsce urodzenia', 'text'],
    ['wnioskodawca', 'Wnioskodawca (rodzic)', 'text'],
    ['pesel', 'PESEL wnioskodawcy', 'text'],
  ];
  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-5 md:grid-cols-2">
        {radio('rodzaj', RODZAJE_ODPISU, 'Rodzaj odpisu')}
        {radio('forma', FORMY, 'Jak chcesz go otrzymać')}
      </div>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold text-slate-700">Dane aktu urodzenia</legend>
        {tekstowe.map(([k, e, typ]) => (
          <label key={k} className="block text-sm font-semibold text-slate-700">
            {e}
            <input type={typ} value={w[k]} onChange={ustaw(k)} className={pole} inputMode={k === 'pesel' ? 'numeric' : undefined} />
          </label>
        ))}
      </fieldset>
      <p className="rounded-xl bg-gov-50 p-3 text-sm leading-relaxed text-slate-700">
        Pierwszy odpis skrócony aktu urodzenia urząd wydaje bezpłatnie po zgłoszeniu urodzenia. Za kolejne odpisy płacisz opłatę skarbową: 22 zł za skrócony, 33 zł za zupełny i wielojęzyczny. Gdy zasiłek wypłaca ZUS, odpis nie jest
        potrzebny – ZUS pobierze dane dziecka z rejestru.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Wysylka
          id={p.id}
          adresat="Urząd stanu cywilnego (wniosek przez gov.pl)"
          etykieta="Złóż wniosek o odpis"
          prefiks="USC"
          dzis={dzis}
          uwaga={w.forma === 'elektroniczna' ? 'Odpis trafi do Twojej skrzynki na gov.pl. Powiadomimy Cię, gdy będzie gotowy.' : 'Urząd powiadomi Cię, gdy odpis będzie gotowy do odbioru albo wysłany.'}
        />
        <a href="https://www.gov.pl/web/gov/odpis-aktu-stanu-cywilnego-informacje-ogolne" target="_blank" rel="noreferrer" className={drugorzedny}>
          Usługa w gov.pl
          <IkonaZewnetrzny className="h-4 w-4" />
          <span className="sr-only">(otwiera się w nowej karcie)</span>
        </a>
      </div>
    </form>
  );
}

function Uklad({ p, s, children }: { p: PozycjaDokumentu; s: Sytuacja; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/plan/wnioski" className="bez-druku -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-gov-700 hover:bg-gov-50">
        <IkonaWstecz className="h-4 w-4" />
        Wnioski i terminy
      </Link>
      <div className="bez-druku">
        <h1 className="text-[1.5rem] leading-tight font-extrabold tracking-tight text-slate-900 lg:text-3xl">{czytelne(p.tytul)}</h1>
        <p className="mt-1 text-[15px] text-slate-600">
          <strong className="font-semibold text-slate-800">{imieRoli(s, p.kto)}</strong> · {p.adresat}
          {p.termin ? ` · termin: ${data(p.termin)}` : ''}
        </p>
      </div>
      {children}
    </div>
  );
}

export default function Wniosek() {
  const { id } = useParams<{ id: string }>();
  const { sytuacja: s, gotowe, wynik, plan, dokumenty, dzis } = useRozpatrzenie();
  if (!gotowe) return <Ladowanie />;
  if (!s || !wynik) return <BrakSytuacji />;
  const p = dokumenty.find((x) => x.id === decodeURIComponent(id));
  const f = p ? formularzWniosku(p, s, plan, wynik, dzis) : null;
  if (!p || !f)
    return (
      <div className="mx-auto max-w-2xl space-y-3 py-10 text-center">
        <p className="text-[15px] text-slate-700">Tego wniosku nie wypełnisz w aplikacji albo nie ma go już w Twoim Planie.</p>
        <Link href="/plan/wnioski" className={drugorzedny}>
          Wróć do wniosków
        </Link>
      </div>
    );
  return (
    <Uklad p={p} s={s}>
      {f.rodzaj === 'urlopowy' && <WniosekUrlopowy wzor={f.wzor} p={p} dzis={dzis} />}
      {f.rodzaj === 'zam' && <WniosekZam s={s} plan={plan} wynik={wynik} dzis={dzis} p={p} wlasny={f.wlasny} />}
      {f.rodzaj === 'odpis' && <WniosekOdpis s={s} dzis={dzis} p={p} />}
    </Uklad>
  );
}
