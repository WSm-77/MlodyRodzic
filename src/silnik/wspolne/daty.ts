/**
 * Wewnętrzna arytmetyka dat ISO (`RRRR-MM-DD`) i miesięcy (`RRRR-MM`), wyłącznie w UTC.
 * Bez zegara systemowego: „dziś” zawsze przychodzi z wejścia.
 * Brak własnych testów: sprawdzane przez szwy.
 */

import type { ISODate, Miesiac } from '../typy';

const MS_DNIA = 86_400_000;
const WZOR_DATY = /^(\d{4})-(\d{2})-(\d{2})$/;
const WZOR_MIESIACA = /^(\d{4})-(\d{2})$/;

function naMs(data: ISODate): number {
  const m = WZOR_DATY.exec(data);
  if (!m) throw new RangeError(`Niepoprawna data ISO: ${data}`);
  const [r, mi, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(r, mi - 1, d);
  if (zMs(ms) !== data) throw new RangeError(`Nieistniejąca data: ${data}`);
  return ms;
}

function zMs(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

function dwieCyfry(n: number): string {
  return String(n).padStart(2, '0');
}

/** Rozkłada datę na rok, miesiąc (1–12) i dzień. */
export function czesciDaty(data: ISODate): { rok: number; miesiac: number; dzien: number } {
  const d = new Date(naMs(data));
  return { rok: d.getUTCFullYear(), miesiac: d.getUTCMonth() + 1, dzien: d.getUTCDate() };
}

export function dodajDni(data: ISODate, dni: number): ISODate {
  return zMs(naMs(data) + dni * MS_DNIA);
}

/** Różnica w dniach: `do − od` (0 dla tego samego dnia). */
export function roznicaDni(od: ISODate, do_: ISODate): number {
  return Math.round((naMs(do_) - naMs(od)) / MS_DNIA);
}

/** Liczba dni okresu z oboma końcami włącznie (od 2026-03-01 do 2026-03-01 = 1). */
export function dniWlacznie(od: ISODate, do_: ISODate): number {
  return roznicaDni(od, do_) + 1;
}

/** Ostatni dzień okresu `dni` dni zaczynającego się w `od` (dzień `od` = dzień 1). */
export function koniecOkresu(od: ISODate, dni: number): ISODate {
  return dodajDni(od, dni - 1);
}

/** Porównanie dat: liczba ujemna, 0 albo dodatnia. */
export function porownaj(a: ISODate, b: ISODate): number {
  return naMs(a) - naMs(b);
}

export function najwczesniejsza(...daty: ISODate[]): ISODate {
  return daty.reduce((a, b) => (porownaj(a, b) <= 0 ? a : b));
}

export function najpozniejsza(...daty: ISODate[]): ISODate {
  return daty.reduce((a, b) => (porownaj(a, b) >= 0 ? a : b));
}

export function dniWMiesiacu(miesiac: Miesiac): number {
  const { rok, mi } = rozbijMiesiac(miesiac);
  return new Date(Date.UTC(rok, mi, 0)).getUTCDate();
}

/** Dodaje miesiące kalendarzowe; dzień przycinany do końca miesiąca (31.01 + 1 mies. = 28/29.02). */
export function dodajMiesiace(data: ISODate, miesiace: number): ISODate {
  const { rok, miesiac, dzien } = czesciDaty(data);
  const docelowy = dodajMiesiaceDoMiesiaca(`${rok}-${dwieCyfry(miesiac)}`, miesiace);
  const dzienDocelowy = Math.min(dzien, dniWMiesiacu(docelowy));
  return `${docelowy}-${dwieCyfry(dzienDocelowy)}`;
}

/** Dodaje lata kalendarzowe (29.02 + 1 rok = 28.02). */
export function dodajLata(data: ISODate, lata: number): ISODate {
  return dodajMiesiace(data, lata * 12);
}

/** 31 grudnia roku, w którym przypada data. */
export function koniecRoku(data: ISODate): ISODate {
  return `${czesciDaty(data).rok}-12-31`;
}

function rozbijMiesiac(miesiac: Miesiac): { rok: number; mi: number } {
  const m = WZOR_MIESIACA.exec(miesiac);
  if (!m) throw new RangeError(`Niepoprawny miesiąc ISO: ${miesiac}`);
  const mi = Number(m[2]);
  if (mi < 1 || mi > 12) throw new RangeError(`Niepoprawny miesiąc ISO: ${miesiac}`);
  return { rok: Number(m[1]), mi };
}

/** Miesiąc kalendarzowy daty: `2026-03-15` → `2026-03`. */
export function miesiacDaty(data: ISODate): Miesiac {
  naMs(data);
  return data.slice(0, 7);
}

/** Pierwszy dzień miesiąca: `2026-03` → `2026-03-01`. */
export function pierwszyDzienMiesiaca(miesiac: Miesiac): ISODate {
  rozbijMiesiac(miesiac);
  return `${miesiac}-01`;
}

/** Ostatni dzień miesiąca: `2026-02` → `2026-02-28`. */
export function ostatniDzienMiesiaca(miesiac: Miesiac): ISODate {
  return `${miesiac}-${dwieCyfry(dniWMiesiacu(miesiac))}`;
}

export function dodajMiesiaceDoMiesiaca(miesiac: Miesiac, ile: number): Miesiac {
  const { rok, mi } = rozbijMiesiac(miesiac);
  const indeks = rok * 12 + (mi - 1) + ile;
  return `${Math.floor(indeks / 12)}-${dwieCyfry((indeks % 12) + 1)}`;
}

/** Porównanie miesięcy: liczba ujemna, 0 albo dodatnia. */
export function porownajMiesiace(a: Miesiac, b: Miesiac): number {
  const x = rozbijMiesiac(a);
  const y = rozbijMiesiac(b);
  return x.rok * 12 + x.mi - (y.rok * 12 + y.mi);
}
