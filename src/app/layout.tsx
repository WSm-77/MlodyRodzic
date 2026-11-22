import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const tekst = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-tekst', display: 'swap' });

export const metadata: Metadata = {
  title: 'MłodyRodzic – Zasiłkowy Przewodnik Przyszłego Rodzica',
  description: 'Ile dostaniesz i co złożyć: zasiłki z ZUS w ciąży i po przyjęciu dziecka, plan urlopów obojga rodziców, dokumenty i terminy.',
};

export const viewport: Viewport = { themeColor: '#3B4D9E' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={tekst.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
