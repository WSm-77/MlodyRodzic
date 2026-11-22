/**
 * Wewnętrzna arytmetyka kwot. Wszystko w groszach i liczbach całkowitych; ułamki trzymamy jako
 * licznik/mianownik i zaokrąglamy do grosza dopiero na końcu (połówki w górę).
 * Brak własnych testów: sprawdzane przez szwy.
 */

import type { Grosze, Promile, PunktyBazowe, Ulamek } from '../typy';

function wymagajCalkowitej(x: number, nazwa: string): void {
  if (!Number.isSafeInteger(x)) throw new RangeError(`${nazwa} musi być bezpieczną liczbą całkowitą, jest ${x}`);
}

/** Zaokrągla licznik/mianownik do liczby całkowitej, połówki od zera (dla kwot dodatnich: w górę). */
export function zaokraglij(licznik: number, mianownik: number): number {
  wymagajCalkowitej(licznik, 'licznik');
  wymagajCalkowitej(mianownik, 'mianownik');
  if (mianownik <= 0) throw new RangeError('mianownik musi być dodatni');
  const znak = licznik < 0 ? -1 : 1;
  const a = Math.abs(licznik);
  const iloraz = Math.floor(a / mianownik);
  const reszta = a - iloraz * mianownik;
  return znak * (2 * reszta >= mianownik ? iloraz + 1 : iloraz);
}

/**
 * Kwota po odliczeniu składek: suma / liczba × (10000 − odliczenie) / 10000, zaokrąglona raz.
 * Np. średnia z 12 miesięcy: kwotaPoOdliczeniu(sumaBrutto, 12, 1371).
 */
export function kwotaPoOdliczeniu(suma: Grosze, liczba: number, odliczenie: PunktyBazowe): Grosze {
  return zaokraglij(suma * (10_000 - odliczenie), liczba * 10_000);
}

/**
 * Kwota zasiłku za 1 dzień: podstawa / dzielnik × stawka × (1 − wymiar pracy), zaokrąglona do grosza.
 * `wymiarPracy` dotyczy łączenia urlopu rodzicielskiego z pracą (UZ art. 31 ust. 4a).
 */
export function kwotaDzienna(podstawa: Grosze, stawka: Promile, dzielnik: number, wymiarPracy?: Ulamek): Grosze {
  const praca = wymiarPracy ?? { licznik: 0, mianownik: 1 };
  return zaokraglij(podstawa * stawka * (praca.mianownik - praca.licznik), dzielnik * 1000 * praca.mianownik);
}

/** Kwota za okres: kwota dzienna × liczba dni kalendarzowych. */
export function kwotaOkresu(dzienna: Grosze, dni: number): Grosze {
  return dzienna * dni;
}

/** Część kwoty w promilach (np. próg 1% płacy minimalnej), zaokrąglona do grosza. */
export function czescPromilowa(kwota: Grosze, promile: Promile): Grosze {
  return zaokraglij(kwota * promile, 1000);
}

/** Kwota do komunikatu: „1 234,56 zł” (grosze, spacja co trzy cyfry). */
export function kwotaTekst(gr: Grosze): string {
  const znak = gr < 0 ? '−' : '';
  const a = Math.abs(gr);
  const zlote = Math.floor(a / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${znak}${zlote},${String(a % 100).padStart(2, '0')} zł`;
}

/**
 * Procent do komunikatu z liczby całkowitej w częściach `mianownik` (domyślnie promile: 815 → „81,5%”;
 * punkty bazowe: procentTekst(1371, 10_000) → „13,71%”).
 */
export function procentTekst(wartosc: Promile | PunktyBazowe, mianownik = 1000): string {
  return `${String((wartosc * 100) / mianownik).replace('.', ',')}%`;
}
