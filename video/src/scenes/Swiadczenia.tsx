// Scena 3: świadczenia (kwoty, szczegóły wyliczenia z przepisem) → wnioski i terminy.
import React from 'react';
import json from '../../public/captures/swiadczenia.json';
import {at, clickAt, cutting, part, rectOf, timeline, union, type Capture, type Shot} from '../capture';
import {Appear, Captions, Stage} from '../chrome';
import {COPY} from '../copy';
import {Footage} from '../Footage';

const cap = json as unknown as Capture;
const T = COPY.swiadczenia;
const m = (n: string, i = 0) => at(cap, n, i);
const r = (n: string, i = 0) => rectOf(cap, n, i);

// Kliknięcia: 0 „Szczegóły” (macierzyński), 1 menu „Wnioski”, 2 „Co przygotować”.
const szczegoly = clickAt(cap, 0), wnioski = clickAt(cap, 1), przygotuj = clickAt(cap, 2);
const scroll0 = m('scroll-start'), naWnioskach = m('wnioski'), scrolled1 = m('scrolled', 1);

const tl = timeline(cutting(m('lista') - 0.1, cap.duration - 0.3, []));
export const SWIADCZENIA_FRAMES = tl.frames;

const shots: Shot[] = [
  {t: 0, rect: union(r('naglowek'), part(r('lista'), 0, 0, 1, 0.42)), maxZoom: 1.5},
  {t: scroll0 - 0.2},
  {t: szczegoly + 0.3, rect: r('szczegoly'), maxZoom: 1.65},
  {t: wnioski - 0.5},
  {t: naWnioskach + 0.1, rect: union(r('kto'), r('pilne')), maxZoom: 1.6},
  {t: przygotuj - 0.2},
  {t: scrolled1 + 0.1, rect: r('przygotuj'), maxZoom: 1.6},
];

const f = tl.frameOf;
const lines = [
  {from: f(0), to: f(szczegoly), text: T.lista},
  {from: f(szczegoly + 0.2), to: f(wnioski), text: T.szczegoly},
  {from: f(wnioski + 0.2), to: f(m('pilne')), text: T.wnioski},
  {from: f(m('pilne')), to: f(przygotuj), text: T.kto},
  {from: f(przygotuj + 0.2), to: tl.frames, text: T.przygotuj},
];

const outlines = [
  {from: naWnioskach + 0.4, to: przygotuj - 0.2, rect: r('kto')},
];

export const Swiadczenia: React.FC = () => (
  <Stage>
    <Appear>
      <Footage capture={cap} tl={tl} shots={shots} outlines={outlines} title={T.window}
        right={cap.base ? new URL(cap.base).host : undefined} skipLabel={COPY.skipped} />
      <Captions lines={lines} tag={T.tag} />
    </Appear>
  </Stage>
);
