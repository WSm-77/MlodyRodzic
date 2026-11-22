// Scena 4: działalność z zaległością – zaświadczenie, pytanie do ZUS, wstrzymany zasiłek, wsparcie.
import React from 'react';
import json from '../../public/captures/trudne.json';
import {at, clickAt, cutting, part, rectOf, timeline, type Capture, type Shot} from '../capture';
import {Appear, Captions, Stage} from '../chrome';
import {COPY} from '../copy';
import {Footage} from '../Footage';

const cap = json as unknown as Capture;
const T = COPY.trudne;
const m = (n: string, i = 0) => at(cap, n, i);
const r = (n: string, i = 0) => rectOf(cap, n, i);

// Kliknięcia: 0 „Stan rozliczeń”, 1 „Wystaw zaświadczenie”, 2 pole pytania, 3 „Wyślij”,
// 4 menu „Świadczenia”, 5 menu „Wsparcie”, 6 filtr „Wcześniactwo”.
const wystaw = clickAt(cap, 1), pole = clickAt(cap, 2);
const swiad = clickAt(cap, 4), wsparcie = clickAt(cap, 5);
const scroll1 = m('scroll-start', 1), scrolled1 = m('scrolled', 1), scrolled3 = m('scrolled', 3);

const tl = timeline(cutting(m('dane') - 0.1, cap.duration - 0.3, []));
export const TRUDNE_FRAMES = tl.frames;

const shots: Shot[] = [
  {t: 0, rect: r('dane'), maxZoom: 1.5},
  {t: m('scroll-start') - 0.2},
  {t: m('zaleglosc') + 0.1, rect: r('zaleglosc'), maxZoom: 1.75},
  {t: wystaw + 0.4, rect: r('zaswiadczenie'), maxZoom: 1.8},
  {t: scroll1 - 0.3},
  {t: scrolled1 + 0.1, rect: r('odpowiedz'), maxZoom: 1.65},
  {t: swiad - 0.5},
  {t: m('wstrzymany') + 0.1, rect: r('wstrzymany'), maxZoom: 1.6},
  {t: wsparcie - 0.5},
  {t: scrolled3 + 0.1, rect: part(r('fundacje'), 0, 0, 1, 6), maxZoom: 1.3},
];

const f = tl.frameOf;
const lines = [
  {from: f(0), to: f(wystaw), text: T.zaleglosc},
  {from: f(wystaw + 0.2), to: f(pole), text: T.zaswiadczenie},
  {from: f(pole), to: f(swiad), text: T.pytanie},
  {from: f(swiad + 0.2), to: f(wsparcie), text: T.wstrzymany},
  {from: f(wsparcie + 0.2), to: tl.frames, text: T.wsparcie},
];

const outlines = [
  {from: m('wstrzymany') + 0.5, to: wsparcie - 0.3, rect: r('wstrzymany')},
];

export const Trudne: React.FC = () => (
  <Stage>
    <Appear>
      <Footage capture={cap} tl={tl} shots={shots} outlines={outlines} title={T.window}
        right={cap.base ? new URL(cap.base).host : undefined} skipLabel={COPY.skipped} />
      <Captions lines={lines} tag={T.tag} />
    </Appear>
  </Stage>
);
