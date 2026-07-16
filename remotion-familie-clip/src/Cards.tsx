import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONT_TITLE, FONT_UI } from "./theme";

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, 120], [0, 30]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% ${40 + shift}%, ${COLORS.green} 0%, ${COLORS.greenMid} 45%, ${COLORS.bgDark} 100%)`,
      }}
    />
  );
};

export const IntroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const titleScale = interpolate(titleIn, [0, 1], [0.6, 1]);
  const subIn = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  const ballSpin = frame * 6;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Backdrop />
      <div
        style={{
          fontSize: 150,
          transform: `rotate(${ballSpin}deg)`,
          marginBottom: 20,
          filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.6))",
        }}
      >
        ⚽
      </div>
      <div
        style={{
          transform: `scale(${titleScale})`,
          opacity: titleIn,
          textAlign: "center",
          fontFamily: FONT_TITLE,
          fontSize: 130,
          lineHeight: 1,
          color: COLORS.gold,
          textShadow: `0 6px 0 ${COLORS.goldDeep}, 0 10px 30px rgba(0,0,0,0.7)`,
        }}
      >
        WK POULE
        <div style={{ color: COLORS.pink, fontSize: 190 }}>2000</div>
      </div>
      <div
        style={{
          opacity: subIn,
          marginTop: 30,
          fontFamily: FONT_UI,
          fontSize: 44,
          letterSpacing: 6,
          color: COLORS.cyan,
          textShadow: "0 2px 12px #000",
        }}
      >
        DE FAMILIE HIGHLIGHTS
      </div>
    </AbsoluteFill>
  );
};

export const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const heartIn = spring({ frame, fps, config: { damping: 10 } });
  const heartScale = interpolate(heartIn, [0, 1], [0, 1]);
  const pulse = 1 + 0.06 * Math.sin(frame / 6);
  const textIn = spring({ frame: frame - 14, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Backdrop />
      <div
        style={{
          fontSize: 170,
          transform: `scale(${heartScale * pulse})`,
          filter: "drop-shadow(0 8px 24px rgba(255,20,147,0.5))",
        }}
      >
        ❤️
      </div>
      <div
        style={{
          opacity: textIn,
          marginTop: 20,
          fontFamily: FONT_TITLE,
          fontSize: 96,
          color: COLORS.gold,
          textAlign: "center",
          textShadow: `0 5px 0 ${COLORS.goldDeep}, 0 10px 26px rgba(0,0,0,0.7)`,
        }}
      >
        FAMILIE
        <br />
        CLUB 2000
      </div>
      <div
        style={{
          opacity: textIn,
          marginTop: 26,
          fontFamily: FONT_UI,
          fontSize: 40,
          letterSpacing: 4,
          color: COLORS.cyan,
          textShadow: "0 2px 12px #000",
        }}
      >
        tot de volgende wedstrijd ⚽
      </div>
    </AbsoluteFill>
  );
};
