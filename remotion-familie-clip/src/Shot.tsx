import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

export const Shot: React.FC<{
  src: string;
  trimBefore: number;
  durationInFrames: number;
  zoomDir: 1 | -1;
  fadeInFromBlack?: boolean;
  fadeOutToBlack?: boolean;
}> = ({ src, trimBefore, durationInFrames, zoomDir, fadeInFromBlack, fadeOutToBlack }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const file = staticFile(src);

  // Subtiele Ken Burns push in wisselende richting → filmische beweging.
  const z = interpolate(frame, [0, durationInFrames], [1.05, 1.14], {
    extrapolateRight: "clamp",
  });
  const scale = zoomDir === 1 ? z : 1.14 + 1.05 - z;
  const pan = interpolate(frame, [0, durationInFrames], [0, zoomDir * 22], {
    extrapolateRight: "clamp",
  });

  // Originele clip-audio met korte fades zodat de cut niet klikt.
  const fadeF = 3;
  const audioVolume = (f: number) => {
    const inV = Math.min(1, f / fadeF);
    const outV = Math.min(1, (durationInFrames - f) / fadeF);
    return Math.max(0, Math.min(inV, outV)) * 0.92;
  };

  // Cinematische open/sluit fade uit/naar zwart.
  let blackout = 0;
  if (fadeInFromBlack) {
    blackout = Math.max(blackout, interpolate(frame, [0, 12], [1, 0], { extrapolateRight: "clamp" }));
  }
  if (fadeOutToBlack) {
    blackout = Math.max(
      blackout,
      interpolate(frame, [durationInFrames - 22, durationInFrames], [0, 1], {
        extrapolateLeft: "clamp",
      })
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* Blurred-fill achtergrond zodat elk formaat het scherm vult */}
      <AbsoluteFill>
        <OffthreadVideo
          src={file}
          trimBefore={trimBefore}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scale(1.3)",
            filter: "blur(30px) brightness(0.4) saturate(1.25)",
          }}
        />
      </AbsoluteFill>

      {/* Voorgrond video (origineel geluid) met Ken Burns push */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${scale}) translateX(${pan}px)`,
        }}
      >
        <OffthreadVideo
          src={file}
          trimBefore={trimBefore}
          volume={audioVolume}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </AbsoluteFill>

      {/* Filmische vignette */}
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 260px 40px rgba(0,0,0,0.75)",
          pointerEvents: "none",
        }}
      />

      {/* Fade uit/naar zwart */}
      {blackout > 0 && (
        <AbsoluteFill style={{ backgroundColor: "#000", opacity: blackout }} />
      )}
    </AbsoluteFill>
  );
};
