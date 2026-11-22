/** Wypełnia oficjalny wzór ZAM (public/forms/ZAM_edytowalny.pdf) wartościami pól AcroForm. */

import { wypelnijFormularz } from './pdf';

export const wypelnijZam = (pola: Record<string, string | boolean>): Promise<Uint8Array> =>
  wypelnijFormularz('ZAM_edytowalny.pdf', pola, 'ZAM – wniosek o zasiłek macierzyński (MlodyRodzic)');
