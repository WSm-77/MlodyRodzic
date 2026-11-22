// Scena 1: logowanie mObywatel → dane z ZUS → e-ZLA → pytanie o płatnika → pulpit.
import React from 'react';
import json from '../../public/captures/logowanie.json';
import {at, clickAt, cutting, rectOf, timeline, type Capture, type Shot} from '../capture';
import {Appear, Captions, Stage} from '../chrome';
import {COPY} from '../copy';
import {Footage} from '../Footage';

const cap = json as unknown as Capture;
const T = COPY.logowanie;
const m = (n: string, i = 0) => at(cap, n, i);

// Kliknięcia: 0 „Zaloguj” (Anna), 1 „Zwolnienia lekarskie”, 2 „Pokaż mój plan”.
const anna = clickAt(cap, 0), zla = clickAt(cap, 1), plan = clickAt(cap, 2);
const dane = m('dane'), ezla = m('ezla'), platnik = m('platnik'), pulpit = m('pulpit');
const scroll1 = m('scroll-start', 1), scroll2 = m('scroll-start', 2);

const tl = timeline(cutting(m('konta') - 0.2, cap.duration - 0.3, []));
export const LOGOWANIE_FRAMES = tl.frames;

const shots: Shot[] = [
  {t: 0, rect: rectOf(cap, 'konta'), maxZoom: 1.35},
  {t: anna + 0.3},
  {t: dane - 0.2, rect: rectOf(cap, 'dane'), maxZoom: 1.5},
  {t: zla - 0.1},
  {t: ezla - 0.1, rect: rectOf(cap, 'ezla'), maxZoom: 1.8},
  {t: scroll1 - 0.3},
  {t: platnik + 0.1, rect: rectOf(cap, 'platnik'), maxZoom: 1.75},
  {t: scroll2 - 0.3},
  {t: pulpit + 0.1, rect: rectOf(cap, 'pulpit'), maxZoom: 1.7},
];

const f = tl.frameOf;
const lines = [
  {from: f(0), to: f(anna + 0.2), text: T.wybor},
  {from: f(anna + 0.3), to: f(dane), text: T.pobieranie},
  {from: f(dane), to: f(zla), text: T.dane},
  {from: f(zla + 0.2), to: f(scroll1), text: T.ezla},
  {from: f(platnik), to: f(plan), text: T.platnik},
  {from: f(plan + 0.2), to: tl.frames, text: T.pulpit},
];

const outlines = [
  {from: ezla + 0.4, to: scroll1, rect: rectOf(cap, 'ezla')},
];

export const Logowanie: React.FC = () => (
  <Stage>
    <Appear>
      <Footage capture={cap} tl={tl} shots={shots} outlines={outlines} title={T.window}
        right={cap.base ? new URL(cap.base).host : undefined} skipLabel={COPY.skipped} />
      <Captions lines={lines} tag={T.tag} />
    </Appear>
  </Stage>
);
