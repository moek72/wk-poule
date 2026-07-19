import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

// Donkergroen/zwarte radial achtergrond + gouden zwevende deeltjes + gloeiende
// gouden rand. Ported uit de drawGradientBg/drawParticles/drawGoldBorder helpers
// van de oude render.js, nu declaratief in React.

const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const count = 30;
  const W = 1080;
  const H = 1920;

  return (
    <AbsoluteFill>
      {Array.from({ length: count }).map((_, i) => {
        const seed = i * 137.508;
        const x = ((seed * 0.618033) % 1) * W;
        const baseY = (seed * 50 + frame * (0.4 + (i % 5) * 0.12)) % H;
        const y = H - baseY;
        const size = 1 + (i % 4) * 0.7;
        const alpha = 0.08 + 0.18 * Math.abs(Math.sin(frame * 0.04 + i * 0.7));
        const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.08 + i * 1.3);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size * twinkle * 2,
              height: size * twinkle * 2,
              borderRadius: '50%',
              background: `rgba(255,215,0,${alpha})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const borderAlpha = 0.3 + 0.2 * Math.sin(frame * 0.05);
  const borderBlur = 18 + 8 * Math.sin(frame * 0.07);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse 80% 80% at 50% 40%, #0d1f0d 0%, #070f07 40%, #010301 100%)',
      }}
    >
      <Particles />

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.72) 100%)',
        }}
      />

      {/* Gloeiende gouden rand */}
      <AbsoluteFill
        style={{
          margin: 8,
          borderRadius: 28,
          border: '6px solid #FFD700',
          opacity: borderAlpha,
          boxShadow: `0 0 ${borderBlur}px #FFD700, inset 0 0 ${borderBlur}px rgba(255,215,0,0.4)`,
          width: 'auto',
          height: 'auto',
          inset: 8,
        }}
      />
    </AbsoluteFill>
  );
};
