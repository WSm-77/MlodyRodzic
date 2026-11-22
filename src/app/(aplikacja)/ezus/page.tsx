'use client';

/**
 * Dane z ZUS (makieta Stitch „Pobrano dane z ZUS”, decyzje Q19 i Q19b): tylko to, co ubezpieczony widzi w eZUS.
 * Liczby osób zgłoszonych przez płatnika eZUS nie pokazuje, więc pytamy o nią z oznaczeniem „uzupełnij”.
 * Symulacje z treści zadania: podgląd e-ZLA, zaświadczenie o stanie rozliczeń z tytułu składek, pytanie do ZUS.
 * Konto jest demo: ZUS nie udostępnia danych aplikacjom, w prawdziwej usłudze źródłem byłoby zaświadczenie z eZUS.
 */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type ReactNode } from 'react';
import { dataPrawa, okresyUbezpieczenia } from '@/aplikacja/rozpatrz';
import { data, zl } from '@/aplikacja/format';
import { NAZWY_TYTULOW, prowadziFirme, type Sytuacja } from '@/aplikacja/sytuacja';
import { IkonaBudynek, IkonaChmura, IkonaDalej, IkonaDokument, IkonaInfo, IkonaLegitymacja, IkonaOlowek, IkonaPortfel, IkonaStrzalka, IkonaTarcza } from '@/app/_komponenty/Ikony';
import { BrakSytuacji, Ladowanie } from '@/app/_komponenty/ui';
import { ChipyTakNie } from '@/app/_kreator/pola';
import { useDzis, useParametry, useSytuacja, zapiszSytuacje } from '@/app/_lib/stan';

const MIES = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const miesiac = (m: string) => `${MIES[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

function Sekcja({ ikona, tytul, skrot, children, dodatek }: { ikona: ReactNode; tytul: string; skrot?: string; children: ReactNode; dodatek?: ReactNode }) {
  return (
    <details className="group rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(30,41,59,0.06)]">
      <summary className="flex min-h-[72px] cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gov-50 text-gov-700">{ikona}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-slate-900">{tytul}</span>
            <span className="rounded bg-gov-50 px-1.5 py-0.5 text-[11px] font-bold text-gov-700">ZUS</span>
          </span>
          {skrot && <span className="block truncate text-sm text-slate-600">{skrot}</span>}
        </span>
        <IkonaDalej className="h-5 w-5 shrink-0 rotate-90 text-slate-500 transition-transform group-open:-rotate-90" />
      </summary>
      <dl className="divide-y divide-slate-100 border-t border-slate-100 px-4 text-sm">{children}</dl>
      {dodatek && <div className="border-t border-slate-100 px-4 py-3">{dodatek}</div>}
    </details>
  );
}

function Wiersz({ etykieta, children }: { etykieta: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-slate-600">{etykieta}</dt>
      <dd className="text-right font-semibold text-slate-900 tabular-nums">{children}</dd>
    </div>
  );
}

function PytaniePonad20({ s }: { s: Sytuacja }) {
  const doUzupelnienia = (s.zalozenia ?? []).includes('ponad20');
  const kto = s.tytul === 'umowa_zlecenia' ? 'zleceniodawca' : 'pracodawca';
  return (
    <section className="rounded-xl border border-coral-200 bg-white p-4 shadow-[0_1px_3px_rgba(30,41,59,0.06)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-bold text-slate-900">Czy {s.platnik.nazwa || `Twój ${kto}`} zgłasza ponad 20 osób?</h2>
        {doUzupelnienia && <span className="shrink-0 rounded-full bg-coral-50 px-2.5 py-1 text-xs font-bold text-pilne">uzupełnij</span>}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        ZUS nie pokazuje tej informacji w Twoim koncie. Zapytaj w kadrach. Od odpowiedzi zależy, kto wypłaci zasiłek{doUzupelnienia ? '; do tego czasu przyjmujemy „Nie”' : ''}.
      </p>
      <div className="mt-3">
        <ChipyTakNie
          nazwa="ponad20"
          wartosc={s.platnik.ponad20}
          onChange={(ponad20) => zapiszSytuacje({ ...s, platnik: { ...s.platnik, ponad20 }, zalozenia: (s.zalozenia ?? []).filter((z) => z !== 'ponad20') })}
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-gov-700">Zasiłek wypłaci {s.platnik.ponad20 ? kto : 'ZUS'}</p>
    </section>
  );
}

function Zwolnienie({ z, nr, firma }: { z: Sytuacja['zwolnienia'][number]; nr: number; firma: boolean }) {
  const dni = Math.round((Date.parse(z.do) - Date.parse(z.od)) / 86_400_000) + 1;
  return (
    <div className="py-3">
      <dt className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-semibold text-slate-900 tabular-nums">
          {data(z.od)} – {data(z.do)} <span className="font-normal text-slate-600">({dni} dni)</span>
        </span>
        <span className="font-mono text-xs text-slate-500">
          ZLA/{z.od.replaceAll('-', '')}/{1000 + nr}
        </span>
      </dt>
      <dd className="mt-1.5 flex flex-wrap gap-1.5 text-xs font-bold">
        {z.kodB ? <span className="rounded-full bg-gov-50 px-2 py-0.5 text-gov-700">kod B – ciąża</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">bez kodu B</span>}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{NAZWY_TYTULOW[z.tytul]}</span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">przekazane {firma ? 'do ZUS' : 'do płatnika i ZUS'}</span>
      </dd>
      {z.kodB && <dd className="mt-1.5 text-xs leading-relaxed text-slate-600">Kod B: zasiłek chorobowy w ciąży wynosi 100% podstawy, a okres zasiłkowy do 270 dni.</dd>}
    </div>
  );
}

/** Symulacja zaświadczenia o stanie rozliczeń z tytułu składek (w eZUS wniosek ZAS-W, wydanie do 7 dni). */
function Zaswiadczenie({ s, prog, miesiaceNaSplate }: { s: Sytuacja; prog: number; miesiaceNaSplate: number }) {
  const dzis = useDzis();
  const [wystawione, setWystawione] = useState(false);
  const zaleglosc = s.zadluzenie ?? 0;
  return (
    <div className="space-y-3">
      {zaleglosc > prog && (
        <p className="rounded-lg bg-coral-50 px-3 py-2.5 text-sm leading-relaxed text-slate-800">
          Zaległość przekracza próg, więc ZUS wstrzyma zasiłek do jej spłaty. Spłać całość w ciągu {miesiaceNaSplate} miesięcy od dnia powstania prawa ({data(dataPrawa(s))}), inaczej prawo do zasiłku się przedawni.
        </p>
      )}
      {!wystawione ? (
        <button
          type="button"
          onClick={() => setWystawione(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-gov-700 hover:bg-gov-50"
        >
          <IkonaDokument className="h-[18px] w-[18px]" />
          Wystaw zaświadczenie
        </button>
      ) : (
        <div className="druk-cel rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-4 font-serif text-slate-900">
          <h3 className="text-lg font-bold">Zaświadczenie o stanie rozliczeń z tytułu składek</h3>
          <p className="mt-3 text-sm leading-relaxed">
            Zakład Ubezpieczeń Społecznych zaświadcza, że {s.osoba.imie} {s.osoba.nazwisko} (PESEL {s.osoba.pesel || '—'}), płatnik składek {s.platnik.nazwa || '—'} (NIP{' '}
            {s.platnik.nip || '—'}), na dzień {data(dzis)}{' '}
            {zaleglosc > 0 ? (
              <>
                posiada zaległość z tytułu składek na ubezpieczenia społeczne w kwocie <strong>{zl(zaleglosc)}</strong>.
              </>
            ) : (
              <>nie posiada zaległości z tytułu składek.</>
            )}
          </p>
          <p className="mt-3 text-sm">
            Wydano: {data(dzis)} · nr ZUS/ZAS-W/{(s.osoba.pesel || '0000').slice(-4)}/{dzis.replaceAll('-', '')}
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="bez-druku mt-3 inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3 font-sans text-sm font-semibold text-gov-700 hover:bg-gov-50"
          >
            Drukuj
          </button>
        </div>
      )}
    </div>
  );
}

interface Wiadomosc {
  od: 'ty' | 'zus';
  tekst: string;
  kiedy: string;
}

/** Symulacja wiadomości do ZUS przez eZUS (w prawdziwym koncie: „Napisz do ZUS”, odpowiedź konsultanta). */
function ZapytajZus() {
  const [pytanie, setPytanie] = useState('');
  const [watek, setWatek] = useState<Wiadomosc[]>([]);
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(30,41,59,0.06)] sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gov-50 text-gov-700">
          <IkonaChmura className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-slate-900">Zapytaj ZUS o swoją sprawę</h2>
          <p className="text-sm text-slate-600">Wiadomość trafi do konsultanta ZUS.</p>
        </div>
      </div>
      {watek.length > 0 && (
        <ul aria-live="polite" className="mt-4 space-y-2">
          {watek.map((w, i) => (
            <li key={i} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${w.od === 'ty' ? 'ml-auto bg-gov-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
              {w.tekst}
              <span className="mt-1 block text-[11px] opacity-70">
                {w.od === 'zus' ? 'ZUS · ' : ''}
                {w.kiedy}
              </span>
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const tekst = pytanie.trim();
          if (!tekst) return;
          const teraz = new Date().toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
          const nr = Math.floor(Math.random() * 90_000 + 10_000);
          setWatek((w) => [
            ...w,
            { od: 'ty', tekst, kiedy: teraz },
            { od: 'zus', tekst: `Dziękujemy za wiadomość. Nadaliśmy jej numer SPR-${nr}. Konsultant odpowie w eZUS w ciągu 14 dni. Pilne sprawy: Centrum Obsługi Telefonicznej, 22 560 16 00.`, kiedy: teraz },
          ]);
          setPytanie('');
        }}
      >
        <label htmlFor="pytanie-zus" className="sr-only">
          Treść pytania do ZUS
        </label>
        <input
          id="pytanie-zus"
          value={pytanie}
          onChange={(e) => setPytanie(e.target.value)}
          placeholder="np. Czy moja zaległość została już zaksięgowana?"
          className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-gov-500 focus:ring-2 focus:ring-gov-200 focus:outline-none"
        />
        <button type="submit" className="min-h-12 rounded-xl bg-gov-600 px-5 font-bold text-white hover:bg-gov-700">
          Wyślij
        </button>
      </form>
    </section>
  );
}

function DaneZus() {
  const { sytuacja: s, gotowe } = useSytuacja();
  const { parametry } = useParametry();
  const pobrano = useSearchParams().get('pobrano') === '1';
  if (!gotowe) return <Ladowanie />;
  if (!s) return <BrakSytuacji />;

  if (s.zrodlo !== 'zus')
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900">Dane z ZUS</h1>
        <p className="text-[15px] leading-relaxed text-slate-700">Twoje dane wpisano ręcznie, więc nie mamy danych z ZUS. Możesz je zmienić w Przewodniku.</p>
        <Link href="/przewodnik/1" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gov-600 px-5 font-bold text-white hover:bg-gov-700">
          Otwórz Przewodnik
          <IkonaStrzalka className="h-5 w-5" />
        </Link>
      </div>
    );

  const firma = prowadziFirme(s.tytul);
  const okresy = okresyUbezpieczenia(s);
  const mp = s.miesiacePracownika ?? [];
  const mn = s.miesiaceNiepracownika ?? [];
  const kwoty = mp.length ? mp.map((m) => ({ m: m.miesiac, k: m.brutto })) : mn.map((m) => ({ m: m.miesiac, k: m.podstawaSkladkiChorobowej }));
  const srednia = kwoty.length ? Math.round(kwoty.reduce((a, x) => a + x.k, 0) / kwoty.length) : null;
  const a = s.osoba.adres;
  const adres = a.ulica ? `ul. ${a.ulica} ${a.nrDomu}${a.nrLokalu ? `/${a.nrLokalu}` : ''}, ${a.kod} ${a.poczta}` : '—';
  const prog = Math.round((parametry.placaMinimalna.wartosc * parametry.progZadluzenia.wartosc) / 1000);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gov-50 text-gov-700">
          <IkonaTarcza className="h-8 w-8" />
        </span>
        <h1 className="mt-3 text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance text-slate-900">{pobrano ? 'Pobraliśmy Twoje dane z ZUS' : 'Dane pobrane z ZUS'}</h1>
        <p className="mt-1 text-[15px] text-slate-600">
          {s.osoba.imie} {s.osoba.nazwisko}
          {s.osoba.pesel && <> · PESEL •••••••{s.osoba.pesel.slice(-4)}</>}
        </p>
      </section>

      <div className="space-y-2.5">
        <Sekcja ikona={<IkonaLegitymacja className="h-5 w-5" />} tytul="Dane osobowe" skrot={a.poczta}>
          <Wiersz etykieta="Imię i nazwisko">
            {s.osoba.imie} {s.osoba.nazwisko}
          </Wiersz>
          <Wiersz etykieta="Adres">{adres}</Wiersz>
        </Sekcja>

        <Sekcja ikona={<IkonaTarcza className="h-5 w-5" />} tytul="Ubezpieczenie" skrot={`${NAZWY_TYTULOW[s.tytul]} od ${data(okresy[0]?.od)}`}>
          {okresy.map((o) => (
            <Wiersz key={o.od} etykieta={NAZWY_TYTULOW[o.tytul]}>
              {data(o.od)} – {o.do ? data(o.do) : 'trwa'}
              {o.przyczynaUstania === 'decyzja_zus_o_niepodleganiu' && <span className="block text-xs font-semibold text-pilne">decyzja ZUS o niepodleganiu</span>}
            </Wiersz>
          ))}
          <Wiersz etykieta="Ubezpieczenie chorobowe">{firma || s.tytul === 'umowa_zlecenia' ? 'dobrowolne' : 'obowiązkowe'}</Wiersz>
        </Sekcja>

        {!firma && (
          <Sekcja ikona={<IkonaBudynek className="h-5 w-5" />} tytul={s.tytul === 'umowa_zlecenia' ? 'Zleceniodawca' : 'Pracodawca'} skrot={s.platnik.nazwa || '—'}>
            <Wiersz etykieta="Nazwa płatnika">{s.platnik.nazwa || '—'}</Wiersz>
            <Wiersz etykieta="NIP">{s.platnik.nip || '—'}</Wiersz>
          </Sekcja>
        )}

        <Sekcja
          ikona={<IkonaPortfel className="h-5 w-5" />}
          tytul={mn.length || firma ? 'Podstawa składek' : 'Wynagrodzenia'}
          skrot={srednia != null ? `${kwoty.length} mies. · średnio ${zl(srednia)}` : 'brak danych miesięcznych'}
        >
          {kwoty.map((x) => (
            <Wiersz key={x.m} etykieta={miesiac(x.m)}>
              {zl(x.k)}
            </Wiersz>
          ))}
        </Sekcja>

        <Sekcja ikona={<IkonaDokument className="h-5 w-5" />} tytul="Zwolnienia lekarskie" skrot={s.zwolnienia.length ? `${s.zwolnienia.length} e-ZLA${s.zwolnienia.some((z) => z.kodB) ? ', z kodem B (ciąża)' : ''}` : 'brak e-ZLA'}>
          {s.zwolnienia.length === 0 ? (
            <Wiersz etykieta="e-ZLA">brak w ostatnich 12 miesiącach</Wiersz>
          ) : (
            s.zwolnienia.map((z, i) => <Zwolnienie key={z.od} z={z} nr={i} firma={firma} />)
          )}
        </Sekcja>

        {(firma || s.zadluzenie != null) && (
          <Sekcja
            ikona={<IkonaInfo className="h-5 w-5" />}
            tytul="Stan rozliczeń"
            skrot={s.zadluzenie == null ? 'brak danych' : s.zadluzenie > 0 ? `zaległość ${zl(s.zadluzenie)}` : 'bez zaległości'}
            dodatek={<Zaswiadczenie s={s} prog={prog} miesiaceNaSplate={parametry.miesiaceNaSplateZadluzenia.wartosc} />}
          >
            <Wiersz etykieta="Zaległość w składkach">{s.zadluzenie == null ? 'brak danych' : zl(s.zadluzenie)}</Wiersz>
            <Wiersz etykieta="Próg wstrzymania zasiłku">{zl(prog)}</Wiersz>
          </Sekcja>
        )}
      </div>

      {!firma && <PytaniePonad20 s={s} />}

      <ZapytajZus />

      {s.drugiRodzic && (
        <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-700">
          Dane drugiego rodzica nie pochodzą z Twojego konta: popraw je w Przewodniku (krok 6).
        </p>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Link href="/plan" className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-gov-600 text-base font-bold text-white hover:bg-gov-700">
          Pokaż mój plan
          <IkonaStrzalka className="h-5 w-5" />
        </Link>
        <Link href="/przewodnik/1" className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-base font-semibold text-gov-700 hover:bg-gov-50">
          <IkonaOlowek className="h-5 w-5" />
          Popraw dane
        </Link>
      </div>
    </div>
  );
}

export default function StronaDanychZus() {
  return (
    <Suspense fallback={<Ladowanie />}>
      <DaneZus />
    </Suspense>
  );
}
