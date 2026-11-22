'use client';

import { useRouter } from 'next/navigation';
import { oznaczWprowadzenie } from '../_lib/stan';
import { Wprowadzenie } from '../_wejscie/Wprowadzenie';

/** Ponowne obejrzenie wprowadzenia („Jak to działa?” na ekranie startowym). */
export default function Witaj() {
  const router = useRouter();
  return (
    <Wprowadzenie
      onKoniec={() => {
        oznaczWprowadzenie();
        router.push('/');
      }}
    />
  );
}
