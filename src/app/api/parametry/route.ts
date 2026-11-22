/** Parametry prawne: odczyt dla wszystkich (silnik w przeglądarce), zmiana tylko w sesji pracownika (/admin/logowanie). */

import { PARAMETRY_2026, type KluczParametru } from '@/silnik';
import { czyAdmin } from '@/serwer/sesjaAdmina';
import { poprawnaWartosc, scal, wczytajNadpisania, zapiszNadpisania, type Nadpisania } from '@/serwer/parametry';

export const dynamic = 'force-dynamic';

export async function GET() {
  let nadpisania: Nadpisania = {};
  try {
    nadpisania = await wczytajNadpisania();
  } catch (e) {
    // Baza niedostępna: silnik liczy na parametrach domyślnych zamiast przerywać działanie aplikacji.
    console.error('Nie udało się wczytać nadpisań parametrów', e);
  }
  return Response.json({ parametry: scal(nadpisania), nadpisania, domyslne: PARAMETRY_2026 });
}

export async function PUT(req: Request) {
  if (!(await czyAdmin())) return Response.json({ blad: 'Sesja wygasła. Zaloguj się ponownie do panelu ustawień.' }, { status: 401 });
  const body = (await req.json()) as { nadpisania?: Nadpisania };
  const nowe: Nadpisania = {};
  for (const [klucz, z] of Object.entries(body.nadpisania ?? {}) as [KluczParametru, Nadpisania[KluczParametru]][]) {
    if (!(klucz in PARAMETRY_2026) || !z) return Response.json({ blad: `Nieznany parametr: ${klucz}` }, { status: 400 });
    if (!poprawnaWartosc(klucz, z.wartosc)) return Response.json({ blad: `Niepoprawna wartość parametru ${klucz}.` }, { status: 400 });
    if (z.status !== 'potwierdzony' && z.status !== 'do_potwierdzenia') return Response.json({ blad: `Niepoprawny status parametru ${klucz}.` }, { status: 400 });
    nowe[klucz] = { wartosc: z.wartosc, status: z.status, zmieniono: z.zmieniono ?? new Date().toISOString() };
  }
  try {
    await zapiszNadpisania(nowe);
  } catch (e) {
    console.error('Nie udało się zapisać nadpisań parametrów', e);
    return Response.json({ blad: 'Nie udało się zapisać parametrów. Spróbuj ponownie za chwilę.' }, { status: 500 });
  }
  return Response.json({ parametry: scal(nowe), nadpisania: nowe });
}
