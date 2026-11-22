'use client';

/**
 * Świadczenia (makieta Stitch „Świadczenia, wariant 3”, decyzje Q9, Q17, Q23): zwarte karty Uprawnień z kwotą
 * i stawką, rozwinięcie z wyliczeniem i podstawą prawną, plakietki ryzyk, lista „Warto wiedzieć” i grupa
 * „Nie przysługuje”. Status pokazują chipy z tekstem, bez pasków po lewej.
 */

import Link from 'next/link';
import { useId, useMemo, useState, type ReactNode } from 'react';
import type { StatusReguly, WynikPodstawy, WynikReguly } from '@/silnik';
import { czytelne, dataKrotka, procent, tygodnie, zl, zl0 } from '@/aplikacja/format';
import { drugaRola, type PoleZalozone, type Rola, type Sytuacja } from '@/aplikacja/sytuacja';
import { imieRoli, uprawnienia, type StatusUprawnienia, type Uprawnienie } from '@/aplikacja/uprawnienia';
import { IkonaDalej, IkonaDokument, IkonaInfo, IkonaKalkulator, IkonaStrzalka, IkonaUwaga } from '@/app/_komponenty/Ikony';
import { BrakSytuacji, Ladowanie } from '@/app/_komponenty/ui';
import { useRozpatrzenie } from '@/app/_lib/stan';

const STATUS: Record<StatusUprawnienia, { tekst: string; css: string; kropka: string }> = {
  przysluguje: { tekst: 'Przysługuje', css: 'bg-emerald-50 text-emerald-800', kropka: 'bg-emerald-600' },
  zalezy: { tekst: 'Do sprawdzenia', css: 'bg-amber-50 text-amber-900', kropka: 'bg-amber-500' },
  nie_przysluguje: { tekst: 'Nie przysługuje', css: 'bg-coral-50 text-pilne', kropka: 'bg-pilne' },
};

const STATUS_REGULY: Record<StatusReguly, { tekst: string; css: string }> = {
  przysluguje: { tekst: 'Przysługuje', css: 'bg-emerald-50 text-emerald-800' },
  nie_przysluguje: { tekst: 'Nie przysługuje', css: 'bg-coral-50 text-pilne' },
  ryzyko: { tekst: 'Ryzyko', css: 'bg-amber-50 text-amber-900' },
  nieznane: { tekst: 'Brakuje danych', css: 'bg-slate-100 text-slate-700' },
  informacja: { tekst: 'Warto wiedzieć', css: 'bg-gov-50 text-gov-800' },
};

/** Krótkie nazwy ryzyk na plakietki kart. */
const PLAKIETKI: Record<string, string> = {
  'R-PZ-01': 'ZUS może sprawdzić umowę',
  'R-PZ-02': 'ZUS może sprawdzić podstawę',
  'R-PZ-03': 'Krótko prowadzona firma',
  'R-PZ-04': 'Zmiana etatu',
  'R-MA-03': 'Ubezpieczenie w dniu porodu',
};

const ZALOZENIA_PODSTAWY: Partial<Record<PoleZalozone, string>> = {
  poczatekUbezpieczenia: 'ubezpieczenie od co najmniej 12 miesięcy',
  pelnyEtat: 'pełny etat',
};

function Chip({ css, children }: { css: string; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${css}`}>{children}</span>;
}

function ChipStatusu({ u }: { u: Uprawnienie }) {
  const st = STATUS[u.status];
  const tekst = u.status === 'zalezy' && u.coZmieni ? 'Wstrzymany' : st.tekst;
  return (
    <Chip css={st.css}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${st.kropka}`} />
      {tekst}
    </Chip>
  );
}

function Podstawa({ przepisy }: { przepisy: string[] }) {
  if (przepisy.length === 0) return null;
  return (
    <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-600">
      <IkonaDokument className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{przepisy.join('; ')}</span>
    </p>
  );
}

/** Skąd pochodzi podstawa: z ZUS, wpisana przez rodzica, z wartościami przyjętymi domyślnie (założenie 3). */
function zrodloPodstawy(s: Sytuacja, ja: boolean): string {
  if (ja) {
    const zus = (s.miesiacePracownika?.length ?? 0) + (s.miesiaceNiepracownika?.length ?? 0);
    const zal = (s.zalozenia ?? []).map((z) => ZALOZENIA_PODSTAWY[z]).filter(Boolean);
    const glowne = zus > 0 ? `z ZUS (${zus} mies. z deklaracji płatnika)` : s.bruttoMiesiecznie != null ? 'kwota wpisana przez Ciebie' : 'brak kwoty';
    return zal.length ? `${glowne}; założone domyślnie: ${zal.join(', ')}` : glowne;
  }
  const d = s.drugiRodzic;
  const zal = [d?.poczatekUbezpieczenia ? null : 'ubezpieczenie od co najmniej 3 lat', d?.pelnyEtat === undefined ? 'pełny etat' : null].filter(Boolean);
  const glowne = s.zrodlo === 'zus' ? 'kwota z danych drugiego rodzica' : 'kwota wpisana przez Ciebie';
  return zal.length ? `${glowne}; założone domyślnie: ${zal.join(', ')}` : glowne;
}

function ChipPodstawy({ etykieta, podstawa, zrodlo }: { etykieta: string; podstawa: WynikPodstawy | null; zrodlo: string }) {
  const [otwarte, setOtwarte] = useState(false);
  const id = useId();
  return (
    <div className="min-w-0">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-gov-50 py-1 pr-1 pl-3 text-sm">
        <span className="font-medium text-slate-700">{etykieta}:</span>
        <span className="font-bold text-gov-800 tabular-nums">{podstawa ? zl(podstawa.podstawa) : 'brak'}</span>
        <button
          type="button"
          aria-expanded={otwarte}
          aria-controls={id}
          aria-label={`Skąd ta podstawa: ${etykieta}`}
          onClick={() => setOtwarte((v) => !v)}
          className={`grid h-8 w-8 place-items-center rounded-full ${otwarte ? 'bg-gov-600 text-white' : 'text-gov-700 hover:bg-gov-100'}`}
        >
          <IkonaInfo className="h-4 w-4" />
        </button>
      </div>
      {otwarte && (
        <div id={id} className="mt-2 max-w-xl space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
          <p className="font-semibold text-slate-800">Podstawa wymiaru zasiłku: {etykieta.toLowerCase()}</p>
          <p className="text-slate-600">Źródło: {zrodlo}.</p>
          {podstawa ? (
            <ol className="list-decimal space-y-1.5 pl-5 text-slate-700">
              {podstawa.kroki.map((k, i) => (
                <li key={i}>
                  {czytelne(k.opis)}
                  {k.kwota != null && <strong className="tabular-nums"> {zl(k.kwota)}</strong>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-slate-700">
              Bez wynagrodzenia nie liczymy kwot.{' '}
              <Link href="/przewodnik/4" className="font-semibold text-gov-700 underline underline-offset-2">
                Uzupełnij w Przewodniku
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Wyliczenie({ u }: { u: Uprawnienie }) {
  if (u.okresy.length === 0) return null;
  return (
    <div className="space-y-2 rounded-lg bg-gov-50/60 p-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <IkonaKalkulator className="h-4 w-4 text-gov-600" />
        Wyliczenie
      </p>
      {u.okresy.map((o) => (
        <div key={o.od} className="text-sm leading-relaxed text-slate-700">
          {u.okresy.length > 1 && (
            <p className="text-xs font-semibold text-slate-600">
              {dataKrotka(o.od)} – {dataKrotka(o.do)}
              {o.wymiarPracy ? `, praca ${o.wymiarPracy.licznik}/${o.wymiarPracy.mianownik} etatu` : ''}
            </p>
          )}
          {o.kwotaDzienna != null && u.podstawa != null ? (
            <p className="tabular-nums">
              {zl(u.podstawa)} × {procent(o.stawka)} ÷ 30{o.wymiarPracy ? ` × ${o.wymiarPracy.mianownik - o.wymiarPracy.licznik}/${o.wymiarPracy.mianownik}` : ''} = <strong>{zl(o.kwotaDzienna)} / dzień</strong>
              <br />× {o.dni} dni = <strong>{zl(o.kwota)}</strong>
              {o.podwyzszenie ? <> + dopłata {zl(o.podwyzszenie)}</> : null}
            </p>
          ) : (
            <p>Stawka {procent(o.stawka)} podstawy przez {o.dni} dni. Kwoty nie liczymy bez podstawy wymiaru.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function KartaUprawnienia({ u, s }: { u: Uprawnienie; s: Sytuacja }) {
  const kto = imieRoli(s, u.kto);
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">{kto}</p>
            <h3 className="text-[15px] leading-snug font-bold text-slate-900 sm:text-base">{u.nazwa}</h3>
            {u.okres && (
              <p className="mt-0.5 text-sm text-slate-600 tabular-nums">
                {dataKrotka(u.okres.od)} – {dataKrotka(u.okres.do)} ({tygodnie(u.dni)})
              </p>
            )}
          </div>
          <ChipStatusu u={u} />
        </div>

        {u.kwota !== undefined && (
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            {u.kwota != null ? (
              <p className="text-[1.75rem] leading-none font-bold tracking-tight text-slate-900 tabular-nums">{zl0(u.kwota)}</p>
            ) : (
              <Link href="/przewodnik/4" className="text-sm font-semibold text-gov-700 underline underline-offset-2">
                Podaj wynagrodzenie, żeby policzyć kwotę
              </Link>
            )}
            <span className="flex gap-1.5">
              {u.stawki.map((st) => (
                <span key={st} className="rounded-full bg-gov-50 px-2.5 py-1 text-xs font-bold text-gov-800">
                  {procent(st)}
                </span>
              ))}
            </span>
          </div>
        )}
        {u.kwota === undefined && u.status !== 'nie_przysluguje' && <p className="text-sm text-slate-600">Kwota zależy od długości zwolnienia, więc jej nie liczymy.</p>}

        {u.ryzyka.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Ryzyka">
            {u.ryzyka.map((r) => (
              <li key={r.regula}>
                <Chip css={STATUS_REGULY[r.status].css}>
                  <IkonaUwaga className="h-3.5 w-3.5" />
                  {PLAKIETKI[r.regula] ?? STATUS_REGULY[r.status].tekst}
                </Chip>
              </li>
            ))}
          </ul>
        )}

        {u.coZmieni && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-950">
            <strong>Co odblokuje wypłatę:</strong> {u.coZmieni}
          </p>
        )}
      </div>

      <details className="group border-t border-slate-100">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center gap-1 rounded-b-xl text-sm font-semibold text-gov-700 hover:bg-gov-50/60 [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Szczegóły</span>
          <span className="hidden group-open:inline">Zwiń szczegóły</span>
          <IkonaDalej className="h-4 w-4 rotate-90 transition-transform group-open:-rotate-90" />
        </summary>
        <div className="space-y-3 px-4 pb-4 sm:px-5">
          <p className="text-sm leading-relaxed text-slate-700">{czytelne(u.powod)}</p>
          <Wyliczenie u={u} />
          {u.szczegoly.map((t, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-700">
              {czytelne(t)}
            </p>
          ))}
          {u.ryzyka.map((r) => (
            <div key={r.regula} className="rounded-lg bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-950">
              {u.kto !== s.rola && <strong>{kto}: </strong>}
              {czytelne(r.komunikat)}
            </div>
          ))}
          <Podstawa przepisy={u.podstawaPrawna} />
        </div>
      </details>
    </article>
  );
}

function KartaNiePrzysluguje({ u, s }: { u: Uprawnienie; s: Sytuacja }) {
  return (
    <article className="space-y-2.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(30,41,59,0.06)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">{imieRoli(s, u.kto)}</p>
          <h3 className="text-[15px] leading-snug font-bold text-slate-900">{u.nazwa}</h3>
        </div>
        <ChipStatusu u={u} />
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{czytelne(u.powod)}</p>
      {u.coZmieni && (
        <p className="text-sm leading-relaxed text-slate-700">
          <strong className="text-slate-900">Co by to zmieniło:</strong> {u.coZmieni}
        </p>
      )}
      <Podstawa przepisy={u.podstawaPrawna} />
    </article>
  );
}

function WartoWiedziec({ pozycje, s }: { pozycje: { kto: Rola; wynik: WynikReguly }[]; s: Sytuacja }) {
  const WAGA: Record<StatusReguly, number> = { nie_przysluguje: 0, ryzyko: 1, nieznane: 2, przysluguje: 3, informacja: 4 };
  const lista = [...pozycje].sort((a, b) => WAGA[a.wynik.status] - WAGA[b.wynik.status]);
  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
      {lista.map(({ kto, wynik }, i) => (
        <li key={`${wynik.regula}-${kto}-${i}`} className="space-y-1.5 p-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <Chip css={STATUS_REGULY[wynik.status].css}>{STATUS_REGULY[wynik.status].tekst}</Chip>
            {kto !== s.rola && <span className="text-xs font-semibold text-slate-600">Dotyczy: {imieRoli(s, kto)}</span>}
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{czytelne(wynik.komunikat)}</p>
          <Podstawa przepisy={wynik.podstawaPrawna} />
        </li>
      ))}
    </ul>
  );
}

export default function Swiadczenia() {
  const { sytuacja: s, gotowe, wynik } = useRozpatrzenie();
  const u = useMemo(() => (s && wynik ? uprawnienia(s, wynik) : null), [s, wynik]);
  if (!gotowe) return <Ladowanie />;
  if (!s || !wynik || !u) return <BrakSytuacji />;
  const drugi = s.drugiRodzic ? drugaRola(s.rola) : null;
  const doSprawdzenia = u.lista.length - u.ilePrzysluguje;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900 lg:text-4xl">Twoje świadczenia</h1>
          <p className="mt-1 text-[15px] text-slate-600">
            {u.ilePrzysluguje} przysługuje{doSprawdzenia > 0 ? ` · ${doSprawdzenia} do sprawdzenia` : ''}
            {u.nieprzysluguje.length > 0 ? ` · ${u.nieprzysluguje.length} nie przysługuje` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <ChipPodstawy etykieta={s.osoba.imie ? `Podstawa: ${s.osoba.imie}` : 'Twoja podstawa'} podstawa={wynik.podstawa} zrodlo={zrodloPodstawy(s, true)} />
          {drugi && s.drugiRodzic?.ubezpieczony && <ChipPodstawy etykieta={`Podstawa: ${imieRoli(s, drugi)}`} podstawa={wynik.podstawaDrugiego} zrodlo={zrodloPodstawy(s, false)} />}
        </div>
        {s.przyblizona && (
          <p className="text-sm text-slate-600">
            Wynik przybliżony z Szybkiego wyliczenia.{' '}
            <Link href="/przewodnik/1" className="font-semibold text-gov-700 underline underline-offset-2">
              Policz dokładnie w Przewodniku
            </Link>
          </p>
        )}
      </div>

      <section aria-labelledby="przysluguja" className="space-y-3">
        <h2 id="przysluguja" className="sr-only">
          Świadczenia, które przysługują
        </h2>
        {u.lista.length > 0 ? (
          <div className="kolejno space-y-3">{u.lista.map((x) => <KartaUprawnienia key={x.id} u={x} s={s} />)}</div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">W tej sytuacji silnik nie znalazł świadczeń, które przysługują. Sprawdź grupę „Nie przysługuje” poniżej.</p>
        )}
      </section>

      {u.ogolne.length > 0 && (
        <section aria-labelledby="warto" className="space-y-3">
          <h2 id="warto" className="text-lg font-bold tracking-tight text-slate-900">
            Warto wiedzieć
          </h2>
          <WartoWiedziec pozycje={u.ogolne} s={s} />
        </section>
      )}

      {u.nieprzysluguje.length > 0 && (
        <section aria-labelledby="nie" className="space-y-3">
          <div>
            <h2 id="nie" className="text-lg font-bold tracking-tight text-slate-900">
              Nie przysługuje
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">Świadczenia typowe w takiej sytuacji, które odpadają z powodu Waszych danych, i co by to zmieniło.</p>
          </div>
          <div className="kolejno space-y-3">
            {u.nieprzysluguje.map((x) => (
              <KartaNiePrzysluguje key={x.id} u={x} s={s} />
            ))}
          </div>
        </section>
      )}

      <Link href="/plan/wnioski" className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-gov-600 px-5 text-base font-bold text-white hover:bg-gov-700">
        Zobacz wnioski i terminy
        <IkonaStrzalka className="h-5 w-5" />
      </Link>
    </div>
  );
}
