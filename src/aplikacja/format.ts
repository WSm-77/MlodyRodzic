/** Formatowanie kwot, dat i stawek do wyświetlenia (pl-PL). */

import type { Grosze, ISODate, Promile } from '@/silnik';

const PLN = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });
const PLN0 = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 });

export const zl = (g: Grosze | null | undefined): string => (g == null ? '—' : PLN.format(g / 100));
export const zl0 = (g: Grosze | null | undefined): string => (g == null ? '—' : PLN0.format(g / 100));
export const procent = (p: Promile): string => `${(p / 10).toLocaleString('pl-PL')}%`;

const MIES = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
export const data = (d: ISODate | undefined): string => (d ? `${Number(d.slice(8, 10))} ${MIES[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}` : '—');
export const dataKrotka = (d: ISODate): string => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

export const tygodnie = (dni: number): string => {
  const t = Math.floor(dni / 7);
  const r = dni % 7;
  const tt = t === 1 ? 'tydzień' : t % 10 >= 2 && t % 10 <= 4 && (t % 100 < 10 || t % 100 >= 20) ? 'tygodnie' : 'tygodni';
  return r === 0 ? `${t} ${tt}` : `${t} ${tt} i ${r} ${r === 1 ? 'dzień' : 'dni'}`;
};

/** Dzisiejsza data lokalna w ISO. */
export const dzisISO = (): ISODate => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const NAZWY_URLOPOW: Record<string, string> = {
  macierzynski: 'Urlop macierzyński',
  naWarunkachMacierzynskiego: 'Urlop na warunkach macierzyńskiego',
  uzupelniajacyMacierzynski: 'Uzupełniający urlop macierzyński',
  rodzicielski: 'Urlop rodzicielski',
  ojcowski: 'Urlop ojcowski',
};

/** Daty ISO w tekstach z silnika („od 2026-09-01”) zamienia na czytelne („od 1 wrz 2026”). */
export const czytelne = (t: string): string => t.replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (iso) => data(iso));
