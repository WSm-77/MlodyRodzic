// Kolejność filmu. Każda część: [nazwa, węzeł, liczba klatek]; długość całości wynika z sumy.
import React from 'react';
import {Series} from 'remotion';
import {COPY} from './copy';
import {Card, CARD_FRAMES, Intro, INTRO_FRAMES, Outro, OUTRO_FRAMES} from './scenes/Cards';
import {Logowanie, LOGOWANIE_FRAMES} from './scenes/Logowanie';
import {Kalkulator, KALKULATOR_FRAMES} from './scenes/Kalkulator';
import {Swiadczenia, SWIADCZENIA_FRAMES} from './scenes/Swiadczenia';
import {Trudne, TRUDNE_FRAMES} from './scenes/Trudne';
import {Panel, PANEL_FRAMES} from './scenes/Panel';

const PARTS: [name: string, node: React.ReactNode, frames: number][] = [
  ['intro', <Intro />, INTRO_FRAMES],
  ['card 01', <Card {...COPY.logowanie.card} />, CARD_FRAMES],
  ['logowanie', <Logowanie />, LOGOWANIE_FRAMES],
  ['card 02', <Card {...COPY.kalkulator.card} />, CARD_FRAMES],
  ['kalkulator', <Kalkulator />, KALKULATOR_FRAMES],
  ['card 03', <Card {...COPY.swiadczenia.card} />, CARD_FRAMES],
  ['swiadczenia', <Swiadczenia />, SWIADCZENIA_FRAMES],
  ['card 04', <Card {...COPY.trudne.card} />, CARD_FRAMES],
  ['trudne', <Trudne />, TRUDNE_FRAMES],
  ['card 05', <Card {...COPY.panel.card} />, CARD_FRAMES],
  ['panel', <Panel />, PANEL_FRAMES],
  ['outro', <Outro />, OUTRO_FRAMES],
];
export const DEMO_FRAMES = PARTS.reduce((n, p) => n + p[2], 0);
/** Nazwa, pierwsza klatka i długość każdej części – tylko dla narzędzi (mapa filmu). */
export const PART_MAP = PARTS.map((p, i) => ({name: p[0], start: PARTS.slice(0, i).reduce((n, q) => n + q[2], 0), frames: p[2]}));

export const Demo: React.FC<{parts?: typeof PART_MAP}> = () => (
  <Series>
    {PARTS.map(([name, node, frames]) => (
      <Series.Sequence key={name} durationInFrames={frames}>{node}</Series.Sequence>
    ))}
  </Series>
);
