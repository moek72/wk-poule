import React from 'react';
import { Composition } from 'remotion';
import { WKGazette } from './WKGazette';
import { PLAYERS } from './data/players';

const FPS = 30;

// Alle compositions worden hier geregistreerd. Nieuwe video? Voeg een
// <Composition> toe en 'ie verschijnt automatisch in Remotion Studio.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WKGazette"
        component={WKGazette}
        durationInFrames={FPS * 20}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          titel: 'WK Gazette',
          ondertitel: 'De Stand — Week 12',
          players: PLAYERS,
        }}
      />
    </>
  );
};
