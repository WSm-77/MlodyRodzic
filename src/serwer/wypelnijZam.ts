/**
 * Wypełnia oficjalny wzór ZAM (public/forms/ZAM_edytowalny.pdf) wartościami pól AcroForm.
 * pdf-lib usuwa warstwę XFA; usuwamy też podpis uprawnień /Perms, który zmiana pliku i tak unieważnia.
 * Wygląd pól generujemy czcionką DejaVu, bo standardowa Helvetica nie ma polskich znaków.
 */

import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFCheckBox, PDFDocument, PDFName, PDFTextField } from 'pdf-lib';
import { pelnaNazwa } from '@/aplikacja/zam';

export async function wypelnijZam(pola: Record<string, string | boolean>): Promise<Uint8Array> {
  const [wzor, czcionka] = await Promise.all([
    readFile(path.join(process.cwd(), 'public/forms/ZAM_edytowalny.pdf')),
    readFile(path.join(process.cwd(), 'src/serwer/czcionki/DejaVuSansCondensed.ttf')),
  ]);
  const pdf = await PDFDocument.load(wzor, { ignoreEncryption: true });
  pdf.catalog.delete(PDFName.of('Perms'));
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(czcionka, { subset: true });
  const form = pdf.getForm();

  for (const [krotka, wartosc] of Object.entries(pola)) {
    const pole = form.getFieldMaybe(pelnaNazwa(krotka));
    if (!pole) continue;
    if (pole instanceof PDFCheckBox) {
      if (wartosc === true) pole.check();
      else pole.uncheck();
    } else if (pole instanceof PDFTextField && typeof wartosc === 'string') {
      const maks = pole.getMaxLength();
      pole.setText(maks ? wartosc.replace(/[\s-]/g, '').slice(0, maks) : wartosc);
    }
  }
  form.updateFieldAppearances(font);
  pdf.setTitle('ZAM – wniosek o zasiłek macierzyński (MlodyRodzic)');
  return pdf.save();
}
