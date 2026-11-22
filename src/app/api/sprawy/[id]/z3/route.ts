/** Zaświadczenie Z-3 sprawy przykładowej wypełnione na oficjalnym wzorze ZUS (do sprawdzenia wczytywania PDF). */

import { polaZ3 } from '@/aplikacja/formularzePdf';
import { sprawa } from '@/aplikacja/sprawy';
import { wypelnijFormularz } from '@/serwer/pdf';

export const runtime = 'nodejs';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sp = sprawa(id);
  if (!sp?.sytuacja.miesiacePracownika?.length) return Response.json({ blad: 'Ta sprawa nie ma danych płacowych pracownika (Z-3).' }, { status: 404 });
  const pdf = await wypelnijFormularz('Z-3_edytowalny.pdf', polaZ3(sp.sytuacja, sp.dzis), `Z-3 – sprawa przykładowa ${sp.id} (MlodyRodzic)`, sp.id);
  return new Response(Buffer.from(pdf), {
    headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="Z-3_sprawa_${sp.id}.pdf"` },
  });
}
