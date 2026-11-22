import { notFound } from 'next/navigation';
import { SPRAWY, sprawa } from '@/aplikacja/sprawy';
import { SzczegolySprawy } from './SzczegolySprawy';

export const dynamicParams = false;

export function generateStaticParams() {
  return SPRAWY.map((s) => ({ id: s.id }));
}

export default async function StronaSprawy({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!sprawa(id)) notFound();
  return <SzczegolySprawy id={id} />;
}
