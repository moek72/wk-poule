import React from "react";
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { TIMELINE, TRANSITION_FRAMES } from "./segments";
import { Shot } from "./Shot";

export const FamilieClip: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const timing = linearTiming({ durationInFrames: TRANSITION_FRAMES });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {TIMELINE.flatMap((item, i) => {
          const seq = (
            <TransitionSeries.Sequence
              key={`seq-${i}`}
              durationInFrames={item.durationInFrames}
            >
              {item.kind === "shot" ? (
                <Shot
                  src={item.src}
                  trimBefore={item.trimBefore}
                  durationInFrames={item.durationInFrames}
                  zoomDir={item.zoomDir}
                  fadeInFromBlack={item.fadeInFromBlack}
                  fadeOutToBlack={item.fadeOutToBlack}
                />
              ) : (
                <AbsoluteFill style={{ backgroundColor: "#000" }} />
              )}
            </TransitionSeries.Sequence>
          );
          // Cross-dissolve tussen elk shot (behalve na het laatste).
          if (i === TIMELINE.length - 1) return [seq];
          return [
            seq,
            <TransitionSeries.Transition
              key={`tr-${i}`}
              presentation={fade()}
              timing={timing}
            />,
          ];
        })}
      </TransitionSeries>

      {/* Subtiele achtergrondmuziek — vult vooral de stiltes en overgangen.
          Onder het originele feestgeluid; komt naar voren tijdens de dips. */}
      <Audio
        src={staticFile("bgm.wav")}
        volume={(f) => {
          const fadeIn = Math.min(1, f / 24);
          const fadeOut = Math.min(1, (durationInFrames - f) / 36);
          return Math.max(0, Math.min(fadeIn, fadeOut)) * 0.17;
        }}
      />
    </AbsoluteFill>
  );
};
