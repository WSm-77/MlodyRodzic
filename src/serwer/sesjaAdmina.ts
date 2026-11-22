/**
 * Sesja pracownika w panelu ustawień, oddzielna od (symulowanego) logowania rodzica przez mObywatel.
 * Hasło z ADMIN_HASLO (domyślnie „demo”). Po zalogowaniu ciasteczko httpOnly z podpisanym czasem wygaśnięcia.
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const CIASTECZKO_ADMINA = 'mr_admin';
export const CZAS_SESJI_S = 8 * 60 * 60;

const haslo = () => process.env.ADMIN_HASLO ?? 'demo';
const sekret = () => process.env.ADMIN_SEKRET ?? `mlodyrodzic:${haslo()}`;
const podpis = (tresc: string) => createHmac('sha256', sekret()).update(tresc).digest('base64url');
const rowne = (a: string, b: string) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

export const poprawneHaslo = (podane: string): boolean => rowne(podane, haslo());

export function utworzToken(teraz = Date.now()): string {
  const wygasa = String(teraz + CZAS_SESJI_S * 1000);
  return `${wygasa}.${podpis(wygasa)}`;
}

export function poprawnyToken(token: string | undefined, teraz = Date.now()): boolean {
  if (!token) return false;
  const [wygasa, p] = token.split('.');
  if (!wygasa || !p || !rowne(p, podpis(wygasa))) return false;
  return Number(wygasa) > teraz;
}

/** Czy bieżące żądanie pochodzi od zalogowanego pracownika. */
export async function czyAdmin(): Promise<boolean> {
  return poprawnyToken((await cookies()).get(CIASTECZKO_ADMINA)?.value);
}
