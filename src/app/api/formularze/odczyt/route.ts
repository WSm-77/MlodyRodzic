/**
 * Odczyt edytowalnego formularza ZUS (ZAM, Z-3, Z-3a) przesłanego jako PDF: pola AcroForm → zmiany Sytuacji rodziny.
 * Pliku nie zapisujemy; odpowiedź trafia do szkicu Przewodnika w przeglądarce.
 */

import { odczytajFormularz } from '@/aplikacja/formularzePdf';
import { sprawa } from '@/aplikacja/sprawy';
import { czytajPola } from '@/serwer/pdf';

export const runtime = 'nodejs';

const MAKS_BAJTOW = 8 * 1024 * 1024;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const dane = await req.formData().catch(() => null);
  const plik = dane?.get('plik');
  const dzis = String(dane?.get('dzis') ?? '');
  if (!(plik instanceof File)) return Response.json({ blad: 'Wybierz plik PDF.' }, { status: 400 });
  if (plik.size > MAKS_BAJTOW) return Response.json({ blad: 'Plik jest większy niż 8 MB.' }, { status: 413 });
  if (!DATA.test(dzis)) return Response.json({ blad: 'Brak daty oceny.' }, { status: 400 });

  let pola, id;
  try {
    ({ pola, sprawa: id } = await czytajPola(new Uint8Array(await plik.arrayBuffer())));
  } catch {
    return Response.json({ blad: 'To nie jest poprawny plik PDF.' }, { status: 422 });
  }
  if (Object.keys(pola).length === 0)
    return Response.json(
      { blad: 'Ten PDF nie ma pól formularza – to skan albo wydruk. Odczytujemy tylko formularze ZUS wypełnione elektronicznie. Dane ze skanu wpisz w Przewodniku.' },
      { status: 422 },
    );
  // Z-3 pobrany z katalogu spraw niesie jej identyfikator: oceniamy go na dzień oceny sprawy.
  const sp = id ? sprawa(id) : undefined;
  const odczyt = odczytajFormularz(pola, sp?.dzis ?? dzis);
  if (!odczyt) return Response.json({ blad: 'Nie rozpoznaliśmy formularza. Obsługujemy ZAM, Z-3 i Z-3a w wersji edytowalnej z zus.pl.' }, { status: 422 });
  return Response.json({ ...odczyt, ...(sp ? { sprawa: sp.id } : {}) });
}
