import { redirect } from 'next/navigation';

/** Dawny formularz „Policz od razu”: zastąpiony Przewodnikiem krok po kroku. */
export default function Sytuacja() {
  redirect('/przewodnik/1');
}
