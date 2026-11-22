/** Zwraca wypełniony wzór ZAM jako PDF do pobrania. */

import { wypelnijZam } from '@/serwer/wypelnijZam';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { pola } = (await req.json()) as { pola?: Record<string, string | boolean> };
  if (!pola || typeof pola !== 'object') return Response.json({ blad: 'Brak pól formularza.' }, { status: 400 });
  const pdf = await wypelnijZam(pola);
  return new Response(Buffer.from(pdf), {
    headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="ZAM-wypelniony.pdf"' },
  });
}
