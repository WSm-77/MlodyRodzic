/**
 * Wewnętrzna arytmetyka liczb wymiernych na BigInt. Uzupełnianie miesięcy niepełnych
 * (zmienny / dni przepracowane × dni do przepracowania) daje ułamki grosza o różnych mianownikach;
 * trzymamy je dokładnie i zaokrąglamy do grosza dopiero na końcu (połówki w górę).
 */

import type { Grosze } from '../typy';

export interface Wymierna {
  l: bigint;
  m: bigint;
}

export const zero: Wymierna = { l: 0n, m: 1n };

export function calkowita(x: number): Wymierna {
  return { l: BigInt(x), m: 1n };
}

export function ulamek(licznik: number, mianownik: number): Wymierna {
  return { l: BigInt(licznik), m: BigInt(mianownik) };
}

export function dodaj(a: Wymierna, b: Wymierna): Wymierna {
  return { l: a.l * b.m + b.l * a.m, m: a.m * b.m };
}

export function razy(a: Wymierna, b: Wymierna): Wymierna {
  return { l: a.l * b.l, m: a.m * b.m };
}

export function suma(xs: Wymierna[]): Wymierna {
  return xs.reduce(dodaj, zero);
}

/** Zaokrąglenie do grosza, połówki w górę (kwoty są nieujemne). */
export function doGroszy(x: Wymierna): Grosze {
  const iloraz = x.l / x.m;
  const reszta = x.l - iloraz * x.m;
  return Number(2n * reszta >= x.m ? iloraz + 1n : iloraz);
}
