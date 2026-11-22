'use client';

/**
 * Pulpit (makieta Stitch „Pulpit główny z kołyską i panelem spraw”, decyzje Q7–Q8): po lewej tytuł zdarzenia i scena
 * z ikoną matki i dziecka w sercu, po prawej suma, okres i kto wypłaca oraz trzy najbliższe sprawy z „Wnioski i terminy”;
 * niżej skróty do ekranów. Bez danych, których silnik nie liczy (przelewy, wypłacone kwoty, kwota miesięczna).
 */

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import { roznicaDni } from '@/silnik/wspolne/daty';
import { sciezkaRodzica, type PozycjaDokumentu } from '@/aplikacja/dokumenty';
import { czytelne, data, zl0 } from '@/aplikacja/format';
import { drugaRola, NAZWY_ZDARZEN, type Sytuacja } from '@/aplikacja/sytuacja';
import { imieRoli, uprawnienia } from '@/aplikacja/uprawnienia';
import {
  IkonaDokument,
  IkonaKalendarz,
  IkonaStrzalka,
  IkonaUwaga,
  IkonaZewnetrzny,
  IlustracjaMatkaDziecko,
} from '@/app/_komponenty/Ikony';
import { BrakSytuacji, Ladowanie } from '@/app/_komponenty/ui';
import { useRozpatrzenie } from '@/app/_lib/stan';

/** „1 pilna sprawa”, „3 pilne sprawy”, „5 pilnych spraw”. */
const ileSpraw = (n: number) =>
  n === 1 ? '1 pilna sprawa' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? `${n} pilne sprawy` : `${n} pilnych spraw`;

const MIESIACE = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const miesiacRok = (d: string) => `${MIESIACE[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
const dzienMiesiac = (d: string) => `${Number(d.slice(8, 10))} ${MIESIACE[Number(d.slice(5, 7)) - 1]}`;

const POLA_ZALOZEN: Record<string, string> = {
  poczatekUbezpieczenia: 'ubezpieczenie od co najmniej kilku lat',
  pelnyEtat: 'pełny etat',
  ponad20: 'firma zgłasza ponad 20 osób',
  'drugiRodzic.tytul': 'drugi rodzic na umowie o pracę',
};

function Kafel({ etykieta, wartosc, opis }: { etykieta: string; wartosc: ReactNode; opis?: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
      <p className="text-xs font-medium text-white/75">{etykieta}</p>
      <p className="mt-0.5 text-base leading-snug font-bold tabular-nums">{wartosc}</p>
      {opis && <p className="mt-0.5 text-xs text-white/75">{opis}</p>}
    </div>
  );
}

function Bohater({ suma, wariant, okres, wyplaca, przyblizona }: { suma: number | null; wariant: string; okres: { od: string; do: string } | null; wyplaca: { kto: string; opis: string } | null; przyblizona: boolean }) {
  return (
    <section aria-label="Podsumowanie planu" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gov-900 via-gov-800 to-gov-600 p-6 text-white shadow-[0_16px_40px_-20px_rgba(27,35,72,0.7)] sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-bold tracking-wider text-white/80 uppercase">Zasiłki dla rodziny łącznie</p>
        <div className="flex flex-wrap gap-1.5">
          {przyblizona && <span className="rounded-full bg-coral-200 px-2.5 py-1 text-xs font-bold text-gov-900">Wynik przybliżony</span>}
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold ring-1 ring-white/20">Wariant {wariant}</span>
        </div>
      </div>
      <div className="relative mt-3">
        {suma != null ? (
          <p className="text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">{zl0(suma)}</p>
        ) : (
          <p className="text-lg font-bold">Podaj wynagrodzenie, a policzymy kwotę</p>
        )}
        <p className="mt-1 text-xs text-white/70">brutto, przed podatkiem dochodowym</p>
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
        <Kafel etykieta="Okres zasiłków" wartosc={okres ? `${miesiacRok(okres.od)} – ${miesiacRok(okres.do)}` : '—'} opis={okres ? `${Math.round((roznicaDni(okres.od, okres.do) + 1) / 7)} tyg. dla rodziny` : undefined} />
        <Kafel etykieta="Kto wypłaca" wartosc={wyplaca?.kto ?? '—'} opis={wyplaca?.opis} />
      </div>
      <div className="relative mt-3 flex justify-end">
        <Link href="/plan/kalkulator" className="group inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-white hover:text-white/80">
          Szczegóły wyliczenia
          <IkonaStrzalka className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}

/** Scena z ikoną rodziny w centrum pulpitu i krótką informacją, ile dni do (albo od) zdarzenia. */
function Scena({ zdarzenie, dni }: { zdarzenie: string; dni: number }) {
  const nazwa = zdarzenie[0]!.toUpperCase() + zdarzenie.slice(1);
  const odliczanie =
    dni === 0 ? `${nazwa}: dziś` : dni === 1 ? `${nazwa}: jutro` : dni > 1 ? `${nazwa} za ${dni} dni` : dni === -1 ? `${nazwa}: wczoraj` : `${nazwa} ${-dni} dni temu`;
  return (
    <section aria-label="Twoja rodzina" className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-5 text-center shadow-sm sm:p-8 lg:min-h-48 lg:flex-1">
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(220,226,252,0.75)_0%,rgba(240,244,255,0.25)_55%,transparent_75%)]" />
      <div className="relative aspect-square w-full max-w-[200px] sm:max-w-md lg:aspect-auto lg:min-h-0 lg:max-w-none lg:flex-1">
        <IlustracjaMatkaDziecko className="serce-bije h-full w-full lg:absolute lg:inset-0" />
      </div>
      <p className="relative mx-auto mt-4 inline-flex items-center gap-2 shrink-0 rounded-full bg-gov-50 px-3.5 py-1.5 text-sm font-semibold text-gov-800 ring-1 ring-gov-100 sm:mt-6">
        <IkonaKalendarz className="h-4 w-4" />
        {odliczanie}
      </p>
    </section>
  );
}

function Zadanie({ p, s, dzis }: { p: PozycjaDokumentu; s: Sytuacja; dzis: string }) {
  const pilne = p.status === 'pilne';
  const dni = p.termin ? roznicaDni(dzis, p.termin) : null;
  const zostalo = dni == null ? null : dni <= 0 ? 'dziś' : dni === 1 ? 'jutro' : pilne ? `${dni} dni` : `do ${dzienMiesiac(p.termin!)}`;
  const akcja = p.formularz?.pdf
    ? { href: p.formularz.pdf, tekst: `Otwórz ${p.formularz.kod}`, zewn: true }
    : p.formularz?.link
      ? { href: p.formularz.link, tekst: p.formularz.etykieta ?? 'Przejdź', zewn: true }
      : { href: `/plan/wnioski#${p.id}`, tekst: 'Szczegóły', zewn: false };
  return (
    <article className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-3.5 transition-colors duration-200 hover:bg-slate-50">
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${pilne ? 'bg-coral-50 text-pilne' : 'bg-gov-50 text-gov-700'}`}>
          {pilne ? <IkonaUwaga className="h-5 w-5" /> : <IkonaDokument className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] leading-snug font-semibold text-slate-900">{p.tytul}</h3>
          <p className="mt-0.5 text-sm leading-snug text-slate-600">
            {p.kto !== s.rola && <span className="font-semibold text-slate-700">{imieRoli(s, p.kto)} · </span>}
            {p.adresat}
          </p>
        </div>
        {zostalo && (
          <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold tabular-nums ${pilne ? 'bg-coral-50 text-pilne' : 'bg-slate-100 text-slate-700'}`}>{zostalo}</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <IkonaKalendarz className="h-3.5 w-3.5" />
          {p.termin ? `Termin: ${data(p.termin)}` : p.terminOpis}
        </span>
        {akcja.zewn ? (
          <a href={akcja.href} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-gov-600 px-3.5 text-sm font-semibold text-white hover:bg-gov-700">
            {akcja.tekst}
            <IkonaZewnetrzny className="h-4 w-4" />
            <span className="sr-only">(otwiera się w nowej karcie)</span>
          </a>
        ) : (
          <Link href={akcja.href} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 text-sm font-semibold text-gov-700 hover:bg-gov-50">
            {akcja.tekst}
            <IkonaStrzalka className="h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

export default function Pulpit() {
  const { sytuacja: s, gotowe, wynik, dokumenty, dzis } = useRozpatrzenie();
  const u = useMemo(() => (s && wynik ? uprawnienia(s, wynik) : null), [s, wynik]);
  if (!gotowe) return <Ladowanie />;
  if (!s || !wynik || !u) return <BrakSytuacji />;

  const okresy = wynik.urlopy.okresy;
  const okres = okresy.length ? { od: okresy.reduce((a, o) => (o.od < a ? o.od : a), okresy[0]!.od), do: okresy.reduce((a, o) => (o.do > a ? o.do : a), okresy[0]!.do) } : null;
  const wnioskodawca = wynik.wnioskodawca ?? (okresy[0]?.rodzic !== 'inny' ? okresy[0]?.rodzic : undefined);
  const sc = wnioskodawca ? sciezkaRodzica(s, wnioskodawca) : null;
  const tytulWyplacajacego = wnioskodawca === s.rola ? s.tytul : s.drugiRodzic?.tytul;
  // Liczba osób u płatnika drugiego rodzica bywa nieznana: wtedy nie przesądzamy, kto wypłaca.
  const nieznany = wnioskodawca !== s.rola && sc?.kod === 'A' && s.drugiRodzic?.ponad20 === undefined;
  const platnik = tytulWyplacajacego === 'umowa_zlecenia' ? 'Zleceniodawca' : 'Pracodawca';
  const wyplaca =
    sc && wnioskodawca
      ? { kto: nieznany ? `${platnik} albo ZUS` : sc.wyplaca === 'ZUS' ? 'ZUS' : platnik, opis: nieznany ? `zależy od wielkości firmy (${imieRoli(s, wnioskodawca)})` : `zasiłek: ${imieRoli(s, wnioskodawca)}` }
      : null;

  const doZrobienia = dokumenty
    .filter((d) => d.status === 'pilne' || d.status === 'zaplanowane')
    .sort((a, b) => (a.termin ?? '9999').localeCompare(b.termin ?? '9999'));
  const ilePilnych = dokumenty.filter((d) => d.status === 'pilne').length;
  const uwaga = [...u.lista.filter((x) => x.status === 'zalezy' && x.coZmieni), ...u.nieprzysluguje.filter((x) => x.kto === s.rola)].slice(0, 2);
  const zalozenia = (s.zalozenia ?? []).map((z) => POLA_ZALOZEN[z]).filter(Boolean);
  const wariant = wynik.urlopy.wariant === '81_5' ? '81,5%' : '100% / 70%';
  const imiona = [imieRoli(s, s.rola), ...(s.drugiRodzic ? [imieRoli(s, drugaRola(s.rola))] : [])];
  const zdarzenie = s.zdarzenie === 'urodzenie' ? (s.etap === 'ciaza' ? 'termin porodu' : 'poród') : 'przyjęcie dziecka';

  const uwagaSekcja = uwaga.length > 0 && (
    <section aria-labelledby="uwaga" className="rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
      <h2 id="uwaga" className="flex items-center gap-2 text-[15px] font-bold text-pilne">
        <IkonaUwaga className="h-5 w-5" />
        Wymaga uwagi
      </h2>
      <ul className="mt-2 space-y-2">
        {uwaga.map((x) => (
          <li key={x.id} className="text-sm leading-relaxed text-slate-700">
            <strong className="text-slate-900">
              {x.nazwa} ({imieRoli(s, x.kto)}):
            </strong>{' '}
            {czytelne(x.coZmieni ?? x.powod)}
          </li>
        ))}
      </ul>
      <Link href="/plan/swiadczenia" className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-gov-700 hover:underline">
        Zobacz w Świadczeniach
        <IkonaStrzalka className="h-4 w-4" />
      </Link>
    </section>
  );

  return (
    <div className="mx-auto max-w-3xl lg:max-w-none">
      <div className="kolejno grid gap-6 lg:h-[calc(100dvh-9rem)] lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-4 lg:col-span-7 lg:min-h-0">
          <div className="mb-2">
            <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900 lg:text-4xl">{NAZWY_ZDARZEN[s.zdarzenie]}</h1>
            <p className="mt-1 text-[15px] text-slate-600 first-letter:uppercase">
              {zdarzenie}: <strong className="text-slate-800">{data(s.dataZdarzenia)}</strong> · {imiona.join(' & ')}
            </p>
          </div>

          <Scena zdarzenie={zdarzenie} dni={roznicaDni(dzis, s.dataZdarzenia)} />

          {s.przyblizona && (
            <section className="rounded-2xl border border-coral-200 bg-coral-50 p-4">
              <p className="text-[15px] font-bold text-gov-900">To szybkie wyliczenie</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                Część danych przyjęliśmy typowo{zalozenia.length ? `: ${zalozenia.join(', ')}` : ''}. Przewodnik zajmie ok. 5 minut i policzy dokładnie.
              </p>
              <Link href="/przewodnik/1" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gov-600 px-4 text-sm font-bold text-white hover:bg-gov-700">
                Uzupełnij w Przewodniku
                <IkonaStrzalka className="h-4 w-4" />
              </Link>
            </section>
          )}

          {uwagaSekcja}
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-5 lg:min-h-0">
          <div className="shrink-0"><Bohater suma={wynik.urlopy.suma} wariant={wariant} okres={okres} wyplaca={wyplaca} przyblizona={!!s.przyblizona} /></div>

          <section aria-labelledby="do-zrobienia" className="flex flex-col rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:min-h-0 lg:flex-1">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <h2 id="do-zrobienia" className="text-lg font-bold tracking-tight text-slate-900">
                Do zrobienia teraz
              </h2>
              {ilePilnych > 0 && <span className="rounded-full border border-coral-200 bg-coral-50 px-2.5 py-0.5 text-xs font-bold text-pilne">{ileSpraw(ilePilnych)}</span>}
            </div>
            {doZrobienia.length > 0 ? (
              <div className="kolejno relative -mx-1 mt-4 space-y-3 px-1 pb-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto [&>*:nth-child(n+4)]:hidden lg:[&>*:nth-child(n+4)]:block">{doZrobienia.map((p) => <Zadanie key={p.id} p={p} s={s} dzis={dzis} />)}</div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Nie ma teraz spraw z terminem. Pełną listę znajdziesz w Wnioskach.</p>
            )}
            <div className="mt-4 shrink-0 border-t border-slate-100 pt-3 text-center">
              <Link href="/plan/wnioski" className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-gov-700 hover:underline">
                Wszystkie wnioski i terminy ({dokumenty.length})
                <IkonaStrzalka className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
