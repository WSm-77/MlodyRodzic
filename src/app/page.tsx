'use client';

import { oznaczWprowadzenie, useWprowadzenieObejrzane } from './_lib/stan';
import { Start } from './_wejscie/Start';
import { Wprowadzenie } from './_wejscie/Wprowadzenie';

/** Pierwsza wizyta: trzy ekrany wprowadzenia, potem (i przy każdej kolejnej) ekran startowy z trzema wejściami. */
export default function StronaStartowa() {
  const obejrzane = useWprowadzenieObejrzane();
  if (obejrzane === null) return <div className="min-h-dvh bg-tlo-wejscia" />;
  return obejrzane ? <Start /> : <Wprowadzenie onKoniec={oznaczWprowadzenie} />;
}
