import type { ReactNode, SVGProps } from 'react';

/** Ikony liniowe w jednym stylu (siatka 24 px, kreska 2 px, zaokrąglone końce). */
function Ikona({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const IkonaLegitymacja = (p: P) => (
  <Ikona {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="11" r="2" />
    <path d="M6.2 16a3 3 0 0 1 5.6 0M15 10h3M15 14h3" />
  </Ikona>
);

export const IkonaLista = (p: P) => (
  <Ikona {...p}>
    <path d="m3 7 2 2 4-4M3 17l2 2 4-4M13 6h8M13 12h8M13 18h8" />
  </Ikona>
);

export const IkonaKalkulator = (p: P) => (
  <Ikona {...p}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 6h8M16 14v4M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01" />
  </Ikona>
);

export const IkonaStrzalka = (p: P) => (
  <Ikona {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Ikona>
);

export const IkonaDalej = (p: P) => (
  <Ikona {...p}>
    <path d="m9 18 6-6-6-6" />
  </Ikona>
);

export const IkonaKlodka = (p: P) => (
  <Ikona {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Ikona>
);

export const IkonaSerce = (p: P) => (
  <Ikona {...p}>
    <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
  </Ikona>
);

export const IkonaWstecz = (p: P) => (
  <Ikona {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Ikona>
);

export const IkonaInfo = (p: P) => (
  <Ikona {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4.5M12 8h.01" />
  </Ikona>
);

export const IkonaPtaszek = (p: P) => (
  <Ikona {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Ikona>
);

export const IkonaKalendarz = (p: P) => (
  <Ikona {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Ikona>
);

export const IkonaBudynek = (p: P) => (
  <Ikona {...p}>
    <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M3 21h18M8 7h4M8 11h4M8 15h4" />
  </Ikona>
);

export const IkonaPortfel = (p: P) => (
  <Ikona {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18M16 14.5h2" />
  </Ikona>
);

export const IkonaDokument = (p: P) => (
  <Ikona {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Ikona>
);

export const IkonaSklep = (p: P) => (
  <Ikona {...p}>
    <path d="M4 10v10h16V10M3 6l1.5-3h15L21 6v1.5a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 7.5ZM10 20v-5h4v5" />
  </Ikona>
);

export const IkonaLudzie = (p: P) => (
  <Ikona {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
  </Ikona>
);

export const IkonaZegar = (p: P) => (
  <Ikona {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Ikona>
);

export const IkonaChmura = (p: P) => (
  <Ikona {...p}>
    <path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.25 4.25 0 0 1-.5 8.5Z" />
    <path d="m9.5 13.5 2 2 3.5-3.5" />
  </Ikona>
);

export const IkonaDziecko = (p: P) => (
  <Ikona {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 0 0 5 0M12 3a2 2 0 0 0 2 2" />
  </Ikona>
);

export const IkonaPlus = (p: P) => (
  <Ikona {...p}>
    <path d="M12 5v14M5 12h14" />
  </Ikona>
);

export const IkonaKosz = (p: P) => (
  <Ikona {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Ikona>
);

export const IkonaOlowek = (p: P) => (
  <Ikona {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16Z" />
    <path d="m13.5 6.5 4 4" />
  </Ikona>
);

export const IkonaZamknij = (p: P) => (
  <Ikona {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Ikona>
);

export const IkonaPulpit = (p: P) => (
  <Ikona {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Ikona>
);

export const IkonaMonety = (p: P) => (
  <Ikona {...p}>
    <ellipse cx="9" cy="7" rx="6" ry="3" />
    <path d="M3 7v4c0 1.66 2.69 3 6 3s6-1.34 6-3V7M3 11v4c0 1.66 2.69 3 6 3 1.2 0 2.32-.18 3.26-.48" />
    <path d="M15 13.5c.6-.2 1.3-.3 2-.3 2.76 0 5 1.2 5 2.65v2.5c0 1.47-2.24 2.65-5 2.65s-5-1.18-5-2.65v-2.5" />
  </Ikona>
);

export const IkonaFolder = (p: P) => (
  <Ikona {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </Ikona>
);

export const IkonaOsoba = (p: P) => (
  <Ikona {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Ikona>
);

export const IkonaWyjscie = (p: P) => (
  <Ikona {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
  </Ikona>
);

export const IkonaZewnetrzny = (p: P) => (
  <Ikona {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </Ikona>
);

export const IkonaUwaga = (p: P) => (
  <Ikona {...p}>
    <path d="M12 3 2 20h20Z" />
    <path d="M12 10v4M12 17h.01" />
  </Ikona>
);

export const IkonaTarcza = (p: P) => (
  <Ikona {...p}>
    <path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6Z" />
    <path d="m9 12 2 2 4-4" />
  </Ikona>
);

/** Znak MłodyRodzic: monogram „M” na kafelku. */
export function Znak({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-xl text-lg leading-none font-black ${className}`}>
      M
    </span>
  );
}

/**
 * Ikona „Sylwetka Matki i Dziecka – Serce” (Stitch, projekt „Ikona Aplikacji MłodyRodzic”): matka i dziecko
 * tworzą jedno serce. Wersja bez tła i ramki, żeby leżała bezpośrednio na scenie pulpitu.
 */
export function IlustracjaMatkaDziecko({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="40 40 432 432" fill="none" aria-hidden className={className}>
      <defs>
        <filter id="md-cien" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#1e293b" floodOpacity="0.12" />
        </filter>
        <linearGradient id="md-matka" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4c63bf" />
          <stop offset="100%" stopColor="#2a3875" />
        </linearGradient>
        <linearGradient id="md-dziecko" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <linearGradient id="md-kocyk" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#fca5a5" />
        </linearGradient>
      </defs>
      <g filter="url(#md-cien)">
        <path d="M 256 448 C 170 380 70 300 70 190 C 70 110 135 60 215 60 C 245 60 256 75 256 75 C 256 75 267 60 297 60 C 377 60 442 110 442 190 C 442 300 342 380 256 448 Z" fill="#edf2fe" />
        <circle cx="180" cy="130" r="38" fill="url(#md-matka)" />
        <ellipse cx="195" cy="138" rx="22" ry="24" fill="#ffedd5" />
        <path d="M 180 174 C 140 190 90 230 90 285 C 90 350 150 405 256 448 C 230 400 205 340 205 285 C 205 235 215 200 220 185 Z" fill="url(#md-matka)" />
        <path d="M 155 240 C 140 300 170 365 240 375 C 290 382 335 345 345 305 C 345 305 320 325 280 325 C 235 325 205 285 195 240 Z" fill="#3b4d9e" />
        <path d="M 256 448 C 330 410 422 340 422 260 C 422 190 370 140 305 140 C 265 140 240 165 235 180 C 270 195 340 230 340 290 C 340 345 295 400 256 448 Z" fill="url(#md-dziecko)" />
        <circle cx="285" cy="210" r="32" fill="#e11d48" />
        <circle cx="275" cy="212" r="23" fill="#ffedd5" />
        <path d="M 285 186 C 292 182 296 186 295 192" stroke="#be123c" strokeWidth="4" strokeLinecap="round" />
        <path d="M 245 245 C 255 235 290 245 305 275 C 315 295 300 325 275 325 C 250 325 235 295 245 245 Z" fill="url(#md-kocyk)" />
        <path d="M 230 265 C 225 255 212 250 205 258 C 195 268 200 280 230 305 C 260 280 265 268 255 258 C 248 250 235 255 230 265 Z" fill="#ffffff" opacity="0.9" />
      </g>
    </svg>
  );
}
