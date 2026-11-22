/** Symulacja pobrania danych z systemów ZUS po zalogowaniu mObywatelem (persona demo). */

import { persona } from '@/aplikacja/persony';

export async function GET(_req: Request, ctx: { params: Promise<{ persona: string }> }) {
  const { persona: id } = await ctx.params;
  const p = persona(id);
  if (!p) return Response.json({ blad: 'Nie znaleziono konta w eZUS.' }, { status: 404 });
  // Udajemy opóźnienie usług ZUS, żeby demo pokazało ekran pobierania.
  await new Promise((r) => setTimeout(r, 600));
  return Response.json(p);
}
