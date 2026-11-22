// Scena 2: kalkulator – wariant stawki, podział urlopu (suwak), oś czasu, łączenie pracy z urlopem.
import React from 'react';
import json from '../../public/captures/kalkulator.json';
import {at, clickAt, cutting, rectOf, timeline, union, type Capture, type Shot} from '../capture';
import {Appear, Captions, Stage} from '../chrome';
import {COPY} from '../copy';
import {Footage} from '../Footage';

const cap = json as unknown as Capture;
const T = COPY.kalkulator;
const m = (n: string, i = 0) => at(cap, n, i);
const r = (n: string, i = 0) => rectOf(cap, n, i);

// Kliknięcia: 0 „100% potem 70%”, 1 chwyt suwaka, 2 „Praca w czasie urlopu”, 3 „Anna”.
const wariant = clickAt(cap, 0), chwyt = clickAt(cap, 1), praca = clickAt(cap, 2), anna = clickAt(cap, 3);
const poWariancie = m('po-wariancie'), podzial = m('podzial'), poPodziale = m('po-podziale');
const scroll0 = m('scroll-start'), scrolled1 = m('scrolled', 1), scroll2 = m('scroll-start', 2), suma3 = m('suma3');

const tl = timeline(cutting(m('start') - 0.1, cap.duration - 0.3, []));
export const KALKULATOR_FRAMES = tl.frames;

const shots: Shot[] = [
  {t: 0, rect: union(r('warianty'), r('suma')), maxZoom: 1.35},
  {t: wariant - 0.7, rect: r('warianty'), maxZoom: 1.8},
  {t: poWariancie + 0.2, rect: union(r('warianty'), r('suma')), maxZoom: 1.5},
  {t: podzial - 0.3, rect: r('podzial'), maxZoom: 1.7},
  {t: poPodziale + 0.1, rect: union(r('po-podziale'), r('os')), maxZoom: 1.5},
  {t: scroll0 - 0.3},
  {t: scrolled1 + 0.1, rect: r('praca'), maxZoom: 1.6},
  {t: scroll2 - 0.3},
  {t: suma3 + 0.1, rect: union(r('suma3'), r('os')), maxZoom: 1.45},
];

const f = tl.frameOf;
const lines = [
  {from: f(0), to: f(wariant), text: T.warianty},
  {from: f(wariant + 0.2), to: f(podzial), text: T.zmiana},
  {from: f(podzial), to: f(poPodziale), text: T.podzial},
  {from: f(poPodziale), to: f(praca), text: T.os},
  {from: f(praca), to: f(suma3), text: T.praca},
  {from: f(suma3), to: tl.frames, text: T.suma},
];

const outlines = [
  {from: poWariancie + 0.4, to: podzial - 0.3, rect: r('suma2')},
  {from: poPodziale + 0.5, to: scroll0, rect: r('os')},
  {from: anna + 0.6, to: scroll2, rect: r('praca')},
  {from: suma3 + 0.5, to: cap.duration, rect: r('suma3')},
];

export const Kalkulator: React.FC = () => (
  <Stage>
    <Appear>
      <Footage capture={cap} tl={tl} shots={shots} outlines={outlines} title={T.window}
        right={cap.base ? new URL(cap.base).host : undefined} skipLabel={COPY.skipped} />
      <Captions lines={lines} tag={T.tag} />
    </Appear>
  </Stage>
);
