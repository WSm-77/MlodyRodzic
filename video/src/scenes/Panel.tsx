// Scena 5: panel ustawień – logowanie pracownika, zmiana parametru, efekt w kalkulatorze rodzica.
import React from 'react';
import json from '../../public/captures/panel.json';
import {at, clickAt, cutting, rectOf, timeline, union, type Capture, type Shot} from '../capture';
import {Appear, Captions, Stage} from '../chrome';
import {COPY} from '../copy';
import {Footage} from '../Footage';

const cap = json as unknown as Capture;
const T = COPY.panel;
const m = (n: string, i = 0) => at(cap, n, i);
const r = (n: string, i = 0) => rectOf(cap, n, i);

// Kliknięcia: 0 pole hasła, 1 „Zaloguj”, 2 wyszukiwarka, 3 pole wartości, 4 „Zapisz”.
const zaloguj = clickAt(cap, 1), szukaj = clickAt(cap, 2), pole = clickAt(cap, 3), zapisz = clickAt(cap, 4);
const parametry = m('parametry'), komunikat = m('komunikat'), kalk = m('kalkulator');
const scroll0 = m('scroll-start'), scrolled0 = m('scrolled');

// Przejście z panelu do kalkulatora rodzica to zmiana tematu: cięcie z przenikaniem.
const tl = timeline(cutting(m('logowanie') - 0.1, cap.duration - 0.3, [
  {from: komunikat + 2.4, to: kalk + 0.1},
], 0.3));
export const PANEL_FRAMES = tl.frames;

const shots: Shot[] = [
  {t: 0, rect: r('logowanie'), maxZoom: 1.6},
  {t: zaloguj + 0.3},
  {t: szukaj - 0.4, rect: union(r('naglowek'), r('tabela')), maxZoom: 1.35},
  {t: pole - 0.4, rect: r('wiersz'), maxZoom: 1.6},
  {t: zapisz + 0.3, rect: union(r('komunikat'), r('zapisano-wiersz')), maxZoom: 1.5},
  {t: kalk + 0.1, cut: true, rect: r('ojcowski-suma'), maxZoom: 1.6},
  {t: scroll0 - 0.3},
  {t: scrolled0 + 0.1, rect: union(r('ojcowski-sekcja'), r('ojcowski-os')), maxZoom: 1.5},
];

const f = tl.frameOf;
const lines = [
  {from: f(0), to: f(parametry), text: T.logowanie},
  {from: f(parametry), to: f(pole - 0.3), text: T.parametry},
  {from: f(pole - 0.3), to: f(kalk), text: T.zmiana},
  {from: f(kalk), to: tl.frames, text: T.efekt},
];

const outlines = [
  {from: zapisz + 0.6, to: komunikat + 2.4, rect: r('zapisano-wiersz')},
  {from: scrolled0 + 0.5, to: cap.duration, rect: r('ojcowski-sekcja')},
];

export const Panel: React.FC = () => (
  <Stage>
    <Appear>
      <Footage capture={cap} tl={tl} shots={shots} outlines={outlines} title={T.window}
        right={cap.base ? new URL(cap.base).host : undefined} skipLabel={COPY.skipped} />
      <Captions lines={lines} tag={T.tag} />
    </Appear>
  </Stage>
);
