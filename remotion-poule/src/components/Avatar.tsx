import React from 'react';
import { getInitials } from '../data/players';

// Ronde avatar met initialen en gloeiende rand in de accentkleur.
// Ported uit drawAvatar() in de oude render.js.

export const Avatar: React.FC<{
  naam: string;
  color: string;
  size: number;
}> = ({ naam, color, size }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(circle at 35% 35%, ${color}, rgba(0,0,0,0.55))`,
        border: `4px solid ${color}`,
        boxShadow: `0 0 20px ${color}, 0 0 40px ${color}55`,
        color: '#fff',
        fontFamily: 'Georgia, serif',
        fontWeight: 700,
        fontSize: Math.max(16, Math.floor(size * 0.42)),
        textShadow: '0 2px 3px rgba(0,0,0,0.7)',
        flexShrink: 0,
      }}
    >
      {getInitials(naam)}
    </div>
  );
};
