/** Logowanie i wylogowanie pracownika w panelu ustawień (POST z hasłem, DELETE). */

import { cookies } from 'next/headers';
import { CIASTECZKO_ADMINA, CZAS_SESJI_S, poprawneHaslo, utworzToken } from '@/serwer/sesjaAdmina';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { haslo } = (await req.json().catch(() => ({}))) as { haslo?: unknown };
  if (typeof haslo !== 'string' || !poprawneHaslo(haslo)) return Response.json({ blad: 'Nieprawidłowe hasło.' }, { status: 401 });
  (await cookies()).set(CIASTECZKO_ADMINA, utworzToken(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CZAS_SESJI_S,
  });
  return Response.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).delete(CIASTECZKO_ADMINA);
  return Response.json({ ok: true });
}
