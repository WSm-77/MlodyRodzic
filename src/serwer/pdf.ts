/**
 * Wypełnianie i odczyt edytowalnych formularzy ZUS (AcroForm) przez pdf-lib.
 * pdf-lib usuwa warstwę XFA; usuwamy też podpis uprawnień /Perms, który zmiana pliku i tak unieważnia.
 * Wygląd pól generujemy czcionką DejaVu, bo standardowa Helvetica nie ma polskich znaków.
 */

import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFCheckBox, PDFDocument, PDFName, PDFTextField } from 'pdf-lib';
import { krotkaNazwa, pelnaNazwaPola, type PolaFormularza } from '@/aplikacja/formularzePdf';

/** Wzór z public/forms/ wypełniony polami o krótkich nazwach („Page1.NIP”, „Page4.Miesiac[7]”). */
export async function wypelnijFormularz(plik: string, pola: PolaFormularza, tytul: string, sprawa?: string): Promise<Uint8Array> {
  const [wzor, czcionka] = await Promise.all([
    readFile(path.join(process.cwd(), 'public/forms', plik)),
    readFile(path.join(process.cwd(), 'src/serwer/czcionki/DejaVuSansCondensed.ttf')),
  ]);
  const pdf = await PDFDocument.load(wzor, { ignoreEncryption: true });
  pdf.catalog.delete(PDFName.of('Perms'));
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(czcionka, { subset: true });
  const form = pdf.getForm();

  for (const [krotka, wartosc] of Object.entries(pola)) {
    const pole = form.getFieldMaybe(pelnaNazwaPola(krotka));
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
  pdf.setTitle(tytul);
  // Znacznik sprawy przykładowej: po wczytaniu pliku liczymy ją z płacą minimalną z roku sprawy.
  if (sprawa) pdf.setKeywords(['MlodyRodzic', `${ZNACZNIK_SPRAWY}${sprawa}`]);
  return pdf.save();
}

const ZNACZNIK_SPRAWY = 'sprawa:';

/** Pola AcroForm z przesłanego PDF-u (krótkie nazwy). Puste pola: plik bez formularza, np. skan. */
export async function czytajPola(bajty: Uint8Array): Promise<{ pola: PolaFormularza; sprawa?: string }> {
  const pdf = await PDFDocument.load(bajty, { ignoreEncryption: true, updateMetadata: false });
  const pola: PolaFormularza = {};
  const sprawa = (pdf.getKeywords() ?? '').split(/[\s,;]+/).find((k) => k.startsWith(ZNACZNIK_SPRAWY))?.slice(ZNACZNIK_SPRAWY.length);
  for (const pole of pdf.getForm().getFields()) {
    const nazwa = krotkaNazwa(pole.getName());
    if (pole instanceof PDFCheckBox) pola[nazwa] = pole.isChecked();
    else if (pole instanceof PDFTextField) pola[nazwa] = pole.getText() ?? '';
  }
  return sprawa ? { pola, sprawa } : { pola };
}
