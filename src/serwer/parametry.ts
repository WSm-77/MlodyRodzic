/**
 * Panel administracyjny: nadpisania parametrów prawnych. Domyślny zestaw to PARAMETRY_2026 z silnika; magazyn
 * przechowuje tylko zmienione wartości i datę zmiany.
 *
 * Gdzie: z ustawionym DATABASE_URL w bazie Postgres (Neon), w jednym wierszu tabeli `nadpisania_parametrow`
 * (tabela powstaje przy pierwszym użyciu). Bez DATABASE_URL w pliku data/parametry.json, czyli lokalnie.
 * Na hostingu bez trwałego dysku (np. Render) plik znika przy każdym deployu i restarcie, stąd baza.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { PARAMETRY_2026, type KluczParametru, type Parametr, type ParametryPrawne } from '@/silnik';

const PLIK = path.join(process.cwd(), 'data/parametry.json');

export interface Nadpisanie {
  wartosc: unknown;
  status: Parametr['status'];
  zmieniono: string;
}

export type Nadpisania = Partial<Record<KluczParametru, Nadpisanie>>;

interface Magazyn {
  wczytaj(): Promise<Nadpisania>;
  zapisz(n: Nadpisania): Promise<void>;
}

const magazynPlikowy: Magazyn = {
  async wczytaj() {
    try {
      return JSON.parse(await readFile(PLIK, 'utf8')) as Nadpisania;
    } catch {
      return {};
    }
  },
  async zapisz(n) {
    await mkdir(path.dirname(PLIK), { recursive: true });
    await writeFile(PLIK, JSON.stringify(n, null, 2) + '\n', 'utf8');
  },
};

function magazynPostgres(url: string): Magazyn {
  const pula = new pg.Pool({ connectionString: url, max: 3 });
  let tabela: Promise<unknown> | null = null;
  const przygotuj = () =>
    (tabela ??= pula
      .query(
        `create table if not exists nadpisania_parametrow (
          id smallint primary key default 1 check (id = 1),
          nadpisania jsonb not null,
          zmieniono timestamptz not null default now()
        )`,
      )
      .catch((e: unknown) => {
        tabela = null;
        throw e;
      }));
  return {
    async wczytaj() {
      await przygotuj();
      const { rows } = await pula.query<{ nadpisania: Nadpisania }>('select nadpisania from nadpisania_parametrow where id = 1');
      return rows[0]?.nadpisania ?? {};
    },
    async zapisz(n) {
      await przygotuj();
      await pula.query(
        `insert into nadpisania_parametrow (id, nadpisania) values (1, $1::jsonb)
         on conflict (id) do update set nadpisania = excluded.nadpisania, zmieniono = now()`,
        [JSON.stringify(n)],
      );
    },
  };
}

let magazyn: Magazyn | null = null;
const wybierzMagazyn = () => (magazyn ??= process.env.DATABASE_URL ? magazynPostgres(process.env.DATABASE_URL) : magazynPlikowy);

export const wczytajNadpisania = (): Promise<Nadpisania> => wybierzMagazyn().wczytaj();
export const zapiszNadpisania = (n: Nadpisania): Promise<void> => wybierzMagazyn().zapisz(n);

export function scal(n: Nadpisania): ParametryPrawne {
  const wynik = { ...PARAMETRY_2026 } as Record<KluczParametru, Parametr<unknown>>;
  for (const [klucz, z] of Object.entries(n) as [KluczParametru, Nadpisanie][]) {
    if (!(klucz in wynik) || !z) continue;
    wynik[klucz] = { ...wynik[klucz], wartosc: z.wartosc, status: z.status };
  }
  return wynik as unknown as ParametryPrawne;
}

/** Ta sama postać JSON co domyślna wartość (liczba, tablica liczb, data ISO, obiekt od–do). */
export function poprawnaWartosc(klucz: KluczParametru, wartosc: unknown): boolean {
  const wzor = PARAMETRY_2026[klucz].wartosc as unknown;
  if (typeof wzor === 'number') return typeof wartosc === 'number' && Number.isFinite(wartosc) && wartosc >= 0;
  if (typeof wzor === 'string') return typeof wartosc === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(wartosc);
  if (Array.isArray(wzor)) return Array.isArray(wartosc) && wartosc.length > 0 && wartosc.every((x) => typeof x === 'number' && x >= 0);
  if (wzor && typeof wzor === 'object')
    return !!wartosc && typeof wartosc === 'object' && Object.keys(wzor).every((k) => typeof (wartosc as Record<string, unknown>)[k] === 'number');
  return false;
}
