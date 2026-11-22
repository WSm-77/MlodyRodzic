'use client';

/**
 * Stan po stronie przeglądarki: Sytuacja rodziny i Plan rodzica w localStorage (decyzja #9), parametry z panelu
 * administracyjnego (GET /api/parametry) i data symulacji. Silnik liczy w kliencie.
 */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { PARAMETRY_2026, type ISODate, type ParametryPrawne } from '@/silnik';
import { dokumenty } from '@/aplikacja/dokumenty';
import { dzisISO } from '@/aplikacja/format';
import { rozpatrz } from '@/aplikacja/rozpatrz';
import { PLAN_DOMYSLNY, type PlanRodzica, type Sytuacja } from '@/aplikacja/sytuacja';

const K_SYTUACJA = 'mlodyrodzic.sytuacja';
const K_PLAN = 'mlodyrodzic.plan';
const K_DZIS = 'mlodyrodzic.dzis';
const K_SZKIC = 'mlodyrodzic.szkic';
const K_WYSLANE = 'mlodyrodzic.wyslane';
const ZDARZENIE = 'mlodyrodzic-zmiana';

function czytaj<T>(klucz: string): T | null {
  try {
    const v = localStorage.getItem(klucz);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function zapisz(klucz: string, wartosc: unknown) {
  try {
    if (wartosc == null) localStorage.removeItem(klucz);
    else localStorage.setItem(klucz, JSON.stringify(wartosc));
  } catch {
    /* tryb prywatny: stan zostaje tylko w pamięci strony */
  }
  window.dispatchEvent(new Event(ZDARZENIE));
}

/** Zapis Sytuacji kończy też szkic Przewodnika: następny Przewodnik zacznie od zapisanych danych. */
export const zapiszSytuacje = (s: Sytuacja | null) => {
  zapisz(K_SZKIC, null);
  zapisz(K_SYTUACJA, s);
};
export const zapiszPlan = (p: PlanRodzica | null) => zapisz(K_PLAN, p);
export const zapiszDzis = (d: ISODate | null) => zapisz(K_DZIS, d);
export const wyloguj = () => {
  zapiszSytuacje(null);
  zapiszPlan(null);
  zapiszDzis(null);
  zapisz(K_WYSLANE, null);
};

/** Sprawa przykładowa ZUS jako Sytuacja rodziny: z jej planem i dniem oceny (dzień wniosku w sprawie). */
export const wczytajSprawe = (sp: { sytuacja: Sytuacja; plan?: Partial<PlanRodzica>; dzis: ISODate }) => {
  zapiszSytuacje(sp.sytuacja);
  zapiszPlan({ ...PLAN_DOMYSLNY, ...sp.plan });
  zapiszDzis(sp.dzis);
  zapisz(K_WYSLANE, null);
};

/** Symulowana wysyłka wniosku (do pracodawcy, ZUS albo urzędu stanu cywilnego), po identyfikatorze pozycji z listy wniosków. */
export interface Wyslanie {
  kiedy: ISODate;
  nr: string;
  adresat: string;
}

export function useWyslane(): Record<string, Wyslanie> {
  const { wartosc } = useZapisany<Record<string, Wyslanie>>(K_WYSLANE);
  return wartosc ?? {};
}

export const zapiszWyslanie = (id: string, w: Wyslanie) => zapisz(K_WYSLANE, { ...czytaj<Record<string, Wyslanie>>(K_WYSLANE), [id]: w });
export const wyczyscWyslane = () => zapisz(K_WYSLANE, null);

function subskrybuj(cb: () => void) {
  window.addEventListener(ZDARZENIE, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(ZDARZENIE, cb);
    window.removeEventListener('storage', cb);
  };
}

/** Surowy tekst z localStorage jako migawka (stabilna między renderami), parsowany niżej. */
function useSurowy(klucz: string): string | null | undefined {
  return useSyncExternalStore(
    subskrybuj,
    () => {
      try {
        return localStorage.getItem(klucz);
      } catch {
        return null;
      }
    },
    () => undefined,
  );
}

function useZapisany<T>(klucz: string): { wartosc: T | null; gotowe: boolean } {
  const surowy = useSurowy(klucz);
  const wartosc = useMemo(() => (surowy ? (JSON.parse(surowy) as T) : null), [surowy]);
  return { wartosc, gotowe: surowy !== undefined };
}

export function useSytuacja() {
  const { wartosc, gotowe } = useZapisany<Sytuacja>(K_SYTUACJA);
  return { sytuacja: wartosc, gotowe };
}

export function useDzis(): ISODate {
  const { wartosc } = useZapisany<ISODate>(K_DZIS);
  return wartosc ?? dzisISO();
}

let pamiecParametrow: ParametryPrawne | null = null;

export function useParametry(): { parametry: ParametryPrawne; zmienione: boolean; odswiez: () => void } {
  const [parametry, setParametry] = useState<ParametryPrawne>(pamiecParametrow ?? PARAMETRY_2026);
  const [zmienione, setZmienione] = useState(false);
  const odswiez = useCallback(() => {
    fetch('/api/parametry', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { parametry: ParametryPrawne; nadpisania: Record<string, unknown> }) => {
        pamiecParametrow = d.parametry;
        setParametry(d.parametry);
        setZmienione(Object.keys(d.nadpisania).length > 0);
      })
      .catch(() => undefined);
  }, []);
  useEffect(odswiez, [odswiez]);
  return { parametry, zmienione, odswiez };
}

/** Wszystko, czego potrzebuje pulpit: sytuacja, plan, wynik silnika i dokumenty. */
export function useRozpatrzenie() {
  const { sytuacja, gotowe } = useSytuacja();
  const { wartosc: planZapisany } = useZapisany<PlanRodzica>(K_PLAN);
  const plan = useMemo(() => ({ ...PLAN_DOMYSLNY, ...planZapisany }), [planZapisany]);
  const { parametry, zmienione } = useParametry();
  const dzis = useDzis();
  const wynik = useMemo(() => (sytuacja ? rozpatrz(sytuacja, plan, parametry, dzis) : null), [sytuacja, plan, parametry, dzis]);
  const alternatywa = useMemo(
    () => (sytuacja ? rozpatrz(sytuacja, { ...plan, wariant: plan.wariant === '81_5' ? '100_70' : '81_5' }, parametry, dzis) : null),
    [sytuacja, plan, parametry, dzis],
  );
  const docs = useMemo(() => (sytuacja && wynik ? dokumenty(sytuacja, plan, wynik, dzis) : []), [sytuacja, plan, wynik, dzis]);
  const ustawPlan = useCallback((zmiana: Partial<PlanRodzica>) => zapiszPlan({ ...plan, ...zmiana }), [plan]);
  return { sytuacja, gotowe, plan, ustawPlan, parametry, parametryZmienione: zmienione, dzis, wynik, alternatywa, dokumenty: docs };
}

export { czytaj };

const K_WPROWADZENIE = 'mlodyrodzic.wprowadzenie';

/** Czy rodzic obejrzał już ekrany wprowadzające. `null` przed odczytem localStorage (render na serwerze). */
export function useWprowadzenieObejrzane(): boolean | null {
  const surowy = useSurowy(K_WPROWADZENIE);
  return surowy === undefined ? null : surowy !== null;
}

export const oznaczWprowadzenie = () => zapisz(K_WPROWADZENIE, true);

/** Szkic Sytuacji rodziny w trakcie Przewodnika: zapisywany na bieżąco, zatwierdzany na podsumowaniu. */
export function useSzkic() {
  const { wartosc, gotowe } = useZapisany<Sytuacja>(K_SZKIC);
  return { szkic: wartosc, gotowe };
}

export const zapiszSzkic = (s: Sytuacja | null) => zapisz(K_SZKIC, s);

/** Dopisuje zmianę do aktualnego szkicu (czyta ze schowka, więc kilka zmian pod rząd się nie nadpisuje). */
export const zmienSzkic = (z: Partial<Sytuacja>) => {
  const teraz = czytaj<Sytuacja>(K_SZKIC);
  if (teraz) zapiszSzkic({ ...teraz, ...z });
};
