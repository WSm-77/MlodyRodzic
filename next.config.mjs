/** @type {import('next').NextConfig} */
const nextConfig = {
  // Osobny katalog dla serwera demo (`npm run demo`), żeby `next dev` i `next build` nie nadpisywały mu plików.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Wskaźnik Next.js Dev Tools nachodzi w trybie dev na dolną nawigację mobilną.
  devIndicators: false,
  // Typy sprawdza `npm run typecheck` (TypeScript 7, bez API JS, którego używa next build).
  typescript: { ignoreBuildErrors: true },
  // pdf-lib czyta wzory formularzy z public/forms w Route Handlerze.
  outputFileTracingIncludes: {
    '/api/wnioski/zam': ['./public/forms/ZAM_edytowalny.pdf', './src/serwer/czcionki/*.ttf'],
    '/api/sprawy/[id]/z3': ['./public/forms/Z-3_edytowalny.pdf', './src/serwer/czcionki/*.ttf'],
  },
};

export default nextConfig;
