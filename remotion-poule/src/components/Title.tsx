import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Title: React.FC<{ titel: string; ondertitel: string }> = ({
  titel,
  ondertitel,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 12, mass: 0.6 } });
  const scale = interpolate(pop, [0, 1], [0.6, 1]);
  const subOpacity = interpolate(frame, [12, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ textAlign: 'center', transform: `scale(${scale})` }}>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 900,
          fontSize: 120,
          color: '#FFD700',
          textShadow: '0 0 30px rgba(255,215,0,0.6), 0 6px 0 #B8860B',
          letterSpacing: 2,
        }}
      >
        {titel}
      </div>
      <div
        style={{
          marginTop: 18,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 700,
          fontSize: 46,
          color: '#ffffff',
          opacity: subOpacity,
        }}
      >
        {ondertitel}
      </div>
    </div>
  );
};
