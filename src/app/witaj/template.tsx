/**
 * Przejście między ekranami: szablon trasy remontuje się przy każdej nawigacji w tej grupie, więc treść
 * ekranu wsuwa się od dołu (animacja `wejscie-strony` w globals.css). Nawigacja i nagłówek zostają w miejscu.
 */
export default function Szablon({ children }: { children: React.ReactNode }) {
  return <div className="wejscie-strony">{children}</div>;
}
