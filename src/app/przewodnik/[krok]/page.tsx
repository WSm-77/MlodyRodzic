import { Przewodnik, PODSUMOWANIE } from '@/app/_kreator/Przewodnik';

export const dynamicParams = false;

export function generateStaticParams() {
  return ['1', '2', '3', '4', '5', '6', 'podsumowanie'].map((krok) => ({ krok }));
}

export default async function StronaPrzewodnika({ params }: { params: Promise<{ krok: string }> }) {
  const { krok } = await params;
  return <Przewodnik krok={krok === 'podsumowanie' ? PODSUMOWANIE : Number(krok)} />;
}
