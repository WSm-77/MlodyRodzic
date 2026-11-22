// The parts of the video that are not footage: opening, section cards, closing.
import React from 'react';
import {After, Appear, Stage, Typed, Window} from '../chrome';
import {COPY} from '../copy';
import {C, DISPLAY, FPS, H, LOOK, W} from '../theme';

export const INTRO_FRAMES = Math.round(5.5 * FPS);
export const CARD_FRAMES = Math.round(3.2 * FPS);
export const OUTRO_FRAMES = Math.round(7 * FPS);

export const Intro: React.FC = () => (
  <Stage>
    <div style={{position: 'absolute', left: 170, top: 300, width: 1500}}>
      <After frame={4}><div style={{font: `500 26px ${DISPLAY}`, color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase'}}>{COPY.intro.kicker}</div></After>
      <div style={{font: `800 150px/1.05 ${DISPLAY}`, color: C.deep, letterSpacing: '-0.045em', whiteSpace: 'nowrap', marginTop: 10}}>
        <Typed text={COPY.brandA} start={10} cps={16} caret={false} />
        <span style={{color: C.coral}}><Typed text={COPY.brandB} start={10 + Math.round(COPY.brandA.length / 16 * FPS)} cps={16} /></span>&nbsp;
      </div>
      <After frame={56}><div style={{fontSize: 48, letterSpacing: '-0.02em', marginTop: 26}}>{COPY.intro.lead}</div></After>
      <After frame={84}><div style={{fontSize: 30, color: C.muted, marginTop: 14}}>{COPY.intro.sub}</div></After>
      <div style={{display: 'flex', gap: 18, marginTop: 50}}>
        {COPY.intro.chips.map((name, i) => (
          <After key={name} frame={108 + i * 12}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 26px', borderRadius: LOOK.radius,
              background: i === 0 ? C.accent : C.panel, color: i === 0 ? C.onAccent : C.ink,
              border: `${LOOK.border}px solid ${i === 0 ? C.accent : C.line}`, font: `600 27px ${DISPLAY}`}}>
              <span style={{fontSize: 20, opacity: 0.7}}>0{i + 1}</span>{name}
            </div>
          </After>
        ))}
      </div>
    </div>
  </Stage>
);

export const Card: React.FC<{no: string; title: string; sub: string}> = ({no, title, sub}) => {
  const rect = {x: (W - 1180) / 2, y: (H - 440) / 2, w: 1180, h: 440};
  return (
    <Stage>
      <Appear>
        <Window rect={rect} title={COPY.brand}>
          <div style={{display: 'flex', alignItems: 'center', gap: 48, padding: '0 64px', height: '100%'}}>
            <div style={{width: 180, height: 180, borderRadius: LOOK.radius * 1.5, background: C.accent, color: C.onAccent, display: 'grid', placeItems: 'center',
              font: `700 96px/1 ${DISPLAY}`, flexShrink: 0}}>{no}</div>
            <div>
              <div style={{font: `700 92px/1.05 ${DISPLAY}`, letterSpacing: '-0.03em'}}><Typed text={title} start={20} cps={18} caret={false} />&nbsp;</div>
              <After frame={70}><div style={{fontSize: 36, marginTop: 20, color: C.muted, letterSpacing: '-0.015em'}}>{sub}</div></After>
            </div>
          </div>
        </Window>
      </Appear>
    </Stage>
  );
};

export const Outro: React.FC = () => {
  const O = COPY.outro;
  const ROW = 100;
  const rect = {x: 1010, y: 200, w: 760, h: ROW * O.rows.length + 46 + LOOK.border * 2};
  return (
    <Stage>
      <div style={{position: 'absolute', left: 150, top: 250, width: 800}}>
        <div style={{font: `500 26px ${DISPLAY}`, color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 18}}>{COPY.brand}</div>
        <div style={{font: `800 80px/1.1 ${DISPLAY}`, color: C.deep, letterSpacing: '-0.035em', whiteSpace: 'nowrap'}}>
          <Typed text={O.title} start={8} cps={22} caret={false} /><br />
          <Typed text={O.title2} start={8 + Math.round((O.title.length / 22) * FPS)} cps={22} caret={false} />&nbsp;
        </div>
        <After frame={140}>
          <div style={{background: C.panel, border: `${LOOK.border}px solid ${C.line}`, borderRadius: LOOK.radius, padding: '16px 22px', marginTop: 40,
            fontSize: 24, lineHeight: 1.4, color: C.muted}}>{O.note}</div>
        </After>
      </div>
      <Appear delay={30}>
        <Window rect={rect} title={COPY.brand}>
          {O.rows.map(([name, what], i) => (
            <After key={name} frame={50 + i * 16}>
              <div style={{display: 'flex', alignItems: 'center', gap: 26, padding: '0 32px', height: ROW, boxSizing: 'border-box',
                borderBottom: i < O.rows.length - 1 ? `1px solid ${C.line}` : 'none'}}>
                <span style={{font: `700 40px ${DISPLAY}`, color: C.accent, width: 64}}>0{i + 1}</span>
                <span>
                  <span style={{display: 'block', font: `600 36px ${DISPLAY}`}}>{name}</span>
                  <span style={{display: 'block', fontSize: 23, color: C.muted, marginTop: 4}}>{what}</span>
                </span>
              </div>
            </After>
          ))}
        </Window>
      </Appear>
    </Stage>
  );
};
