import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { ClipConfig } from "./clips";
import { COLORS, FONT_UI } from "./theme";

export const ClipScene: React.FC<{
  clip: ClipConfig;
  index: number;
  total: number;
}> = ({ clip, index, total }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const src = staticFile(clip.src);

  // Zachte in-zoom over de hele scene voor levendigheid.
  const scale = interpolate(frame, [0, durationInFrames], [1.06, 1.12], {
    extrapolateRight: "clamp",
  });

  // Lower-third komt met een spring omhoog.
  const labelIn = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const labelY = interpolate(labelIn, [0, 1], [60, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDark, overflow: "hidden" }}>
      {/* Blurred fill achtergrond zodat elk formaat het scherm vult */}
      <AbsoluteFill>
        <OffthreadVideo
          src={src}
          trimBefore={clip.trimBefore}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scale(1.25)",
            filter: "blur(28px) brightness(0.45) saturate(1.2)",
          }}
        />
      </AbsoluteFill>

      {/* Voorgrond video, netjes ingepast (contain) */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${scale})`,
        }}
      >
        <OffthreadVideo
          src={src}
          trimBefore={clip.trimBefore}
          muted
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            boxShadow: "0 30px 90px rgba(0,0,0,0.7)",
          }}
        />
      </AbsoluteFill>

      {/* Gouden randframe */}
      <AbsoluteFill
        style={{
          border: `10px solid ${COLORS.gold}`,
          boxSizing: "border-box",
          boxShadow: `inset 0 0 120px rgba(0,0,0,0.55)`,
          pointerEvents: "none",
        }}
      />

      {/* Clip-teller badge rechtsboven */}
      <div
        style={{
          position: "absolute",
          top: 44,
          right: 44,
          fontFamily: FONT_UI,
          fontSize: 40,
          color: COLORS.gold,
          background: "rgba(4,10,4,0.72)",
          border: `3px solid ${COLORS.gold}`,
          borderRadius: 999,
          padding: "10px 26px",
          letterSpacing: 2,
          textShadow: "0 2px 8px #000",
        }}
      >
        {index + 1}/{total}
      </div>

      {/* Lower-third label */}
      <div
        style={{
          position: "absolute",
          left: 44,
          bottom: 70,
          transform: `translateY(${labelY}px)`,
          opacity: labelIn,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 14,
            height: 64,
            background: `linear-gradient(${COLORS.gold}, ${COLORS.pink})`,
            borderRadius: 8,
          }}
        />
        <div>
          <div
            style={{
              fontFamily: FONT_UI,
              fontSize: 30,
              color: COLORS.cyan,
              letterSpacing: 3,
              textShadow: "0 2px 8px #000",
            }}
          >
            WK POULE 2000
          </div>
          <div
            style={{
              fontFamily: FONT_UI,
              fontSize: 58,
              color: "#fff",
              fontWeight: 700,
              textShadow: "0 3px 14px #000, 0 0 30px rgba(255,20,147,0.5)",
            }}
          >
            {clip.label}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
