import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { Background } from './components/Background';
import { Title } from './components/Title';
import { Leaderboard } from './components/Leaderboard';
import { Player } from './data/players';

export type WKGazetteProps = {
  titel: string;
  ondertitel: string;
  players: Player[];
};

// Hoofdcomposition van de WK Gazette. Opgebouwd uit <Sequence>-blokken zodat
// je scenes los kunt timen en toevoegen. Voeg hier gerust nieuwe scenes toe
// (rouwkaart, programma, kampioenen-check, outro) net als in de oude films.
export const WKGazette: React.FC<WKGazetteProps> = ({
  titel,
  ondertitel,
  players,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Background />

      {/* Scene 1 — Titel (0–3s) */}
      <Sequence durationInFrames={fps * 3} name="Titel">
        <AbsoluteFill
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <Title titel={titel} ondertitel={ondertitel} />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 2 — Ranglijst (vanaf 3s) */}
      <Sequence from={fps * 3} name="Ranglijst">
        <AbsoluteFill style={{ justifyContent: 'flex-start', paddingTop: 44 }}>
          <div>
            <div
              style={{
                textAlign: 'center',
                fontFamily: 'Georgia, serif',
                fontWeight: 900,
                fontSize: 60,
                color: '#FFD700',
                textShadow: '0 0 24px rgba(255,215,0,0.5)',
                marginBottom: 22,
              }}
            >
              De Stand
            </div>
            <Leaderboard players={players} />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
