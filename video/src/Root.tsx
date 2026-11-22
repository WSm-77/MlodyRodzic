import React from 'react';
import {Composition, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Demo, DEMO_FRAMES, PART_MAP} from './Demo';
import {FPS, H, W} from './theme';

// To use the product's own font: put the file in public/fonts/ (check its licence), then
//   import {loadFont} from '@remotion/fonts';
//   import {staticFile} from 'remotion';
//   loadFont({family: 'My Font', url: staticFile('fonts/MyFont.woff2'), weight: '400'});
// and name the family in theme.ts. Rendering waits for it; a missing file fails the render instead of falling back silently.

for (const [file, weight] of [['Regular', '400'], ['Medium', '500'], ['SemiBold', '600'], ['Bold', '700'], ['ExtraBold', '800']])
  loadFont({family: 'Inter', url: staticFile(`fonts/Inter-${file}.otf`), weight});

export const Root: React.FC = () => (
  <Composition id="Demo" component={Demo} durationInFrames={DEMO_FRAMES} fps={FPS} width={W} height={H}
    defaultProps={{parts: PART_MAP}} />
);
