// The look of everything that is NOT footage. Take these values from the application being shown
// (its CSS variables, fonts, border and shadow style) so the video reads as part of the product.
export const C = {
  bg: '#f0f3ff',        // gov-50: tło sceny
  dot: '#e0e7ff',       // gov-100: kropki
  panel: '#ffffff',
  bar: '#fbfbfe',       // tlo-wejscia
  ink: '#1e293b',       // slate-800
  muted: '#475569',     // slate-600
  line: '#e2e8f0',      // slate-200
  accent: '#3b4d9e',    // gov-600
  onAccent: '#ffffff',
  coral: '#e0534b',     // coral-600 (druga część logo)
  deep: '#1b2348',      // gov-900
};
export const DISPLAY = 'Inter, sans-serif';  // titles, captions (see Root.tsx for loading a font file)
export const BODY = 'Inter, sans-serif';

/** Shape language of windows and captions. `stepped: true` animates chrome on every other frame (a retro look). */
export const LOOK = {
  border: 2,
  radius: 18,
  shadow: '0 30px 70px -20px rgba(27,35,72,.35), 0 4px 14px rgba(30,41,59,.08)',
  stepped: false,
};

export const FPS = 60;
export const W = 1920;
export const H = 1080;

/**
 * Where recorded footage sits on the stage. The content area keeps the recording's 16:9 shape:
 * 1536x864 shows a 1280x720 page at 1.2x, and the recording is 2560x1440, so the camera can zoom to
 * 1.67x before a single pixel is upscaled.
 */
export const WIN = {x: 190, y: 34, bar: 46, border: LOOK.border, contentW: 1536, contentH: 864};
export const CAPTION = {x: 190, y: 968, w: 1536 + LOOK.border * 2, h: 80};

/** Screen-recording zoom: reaches 90% in about 0.3 s and settles without overshoot. */
export const ZOOM_SPRING = {stiffness: 205, damping: 33.3, mass: 1.5};

/** Frame used by stage furniture; footage, camera and cursor always stay smooth. */
export const tick = (frame: number) => (LOOK.stepped ? Math.floor(frame / 2) * 2 : frame);
