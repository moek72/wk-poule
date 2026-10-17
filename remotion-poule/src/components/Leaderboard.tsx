import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Player } from '../data/players';
import { Avatar } from './Avatar';

// De ranglijst: rijen schuiven één voor één van rechts in met een spring,
// top-3 krijgen een goud/zilver/brons medaille-accent.

const MEDAL = ['🥇', '🥈', '🥉'];

const Row: React.FC<{ player: Player; index: number }> = ({ player, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Elke rij komt 3 frames na de vorige binnen.
  const delay = index * 3;
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });
  const x = interpolate(enter, [0, 1], [420, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  const isTop3 = index < 3;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        transform: `translateX(${x}px)`,
        opacity,
        padding: isTop3 ? '8px 20px' : '5px 20px',
        borderRadius: 16,
        background: isTop3
          ? `linear-gradient(90deg, ${player.color}22, rgba(255,255,255,0.04))`
          : 'rgba(255,255,255,0.03)',
        border: isTop3
          ? `2px solid ${player.color}88`
          : '2px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          width: 54,
          textAlign: 'center',
          fontFamily: 'Georgia, serif',
          fontWeight: 700,
          fontSize: isTop3 ? 40 : 34,
          color: isTop3 ? player.color : '#cfd8cf',
        }}
      >
        {isTop3 ? MEDAL[index] : player.pos}
      </div>

      <Avatar naam={player.naam} color={player.color} size={isTop3 ? 66 : 50} />

      <div
        style={{
          flex: 1,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 700,
          fontSize: isTop3 ? 40 : 32,
          color: '#ffffff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {player.naam}
        {player.km ? <span style={{ marginLeft: 10 }}>{player.km}</span> : null}
      </div>

      {player.ex > 0 ? (
        <div
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: 24,
            color: '#FFD700',
            opacity: 0.85,
          }}
        >
          ★{player.ex}
        </div>
      ) : null}

      <div
        style={{
          minWidth: 96,
          textAlign: 'right',
          fontFamily: 'Georgia, serif',
          fontWeight: 700,
          fontSize: isTop3 ? 48 : 40,
          color: player.color,
          textShadow: `0 0 14px ${player.color}77`,
        }}
      >
        {player.pt}
      </div>
    </div>
  );
};

export const Leaderboard: React.FC<{ players: Player[] }> = ({ players }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        padding: '0 36px',
        width: '100%',
      }}
    >
      {players.map((p, i) => (
        <Row key={p.naam} player={p} index={i} />
      ))}
    </div>
  );
};
