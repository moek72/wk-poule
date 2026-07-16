import React from "react";
import { AbsoluteFill, Audio, staticFile, Sequence, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import {
  CLIPS,
  INTRO_FRAMES,
  OUTRO_FRAMES,
  TRANSITION_FRAMES,
} from "./clips";
import { ClipScene } from "./ClipScene";
import { IntroCard, OutroCard } from "./Cards";

const presentations = [
  slide({ direction: "from-right" }),
  wipe({ direction: "from-left" }),
  slide({ direction: "from-bottom" }),
  fade(),
  slide({ direction: "from-left" }),
  wipe({ direction: "from-top" }),
];

export const FamilieClip: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const timing = linearTiming({ durationInFrames: TRANSITION_FRAMES });

  return (
    <AbsoluteFill style={{ backgroundColor: "#040a04" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_FRAMES}>
          <IntroCard />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {CLIPS.map((clip, i) => (
          <React.Fragment key={clip.src}>
            <TransitionSeries.Sequence durationInFrames={clip.durationInFrames}>
              <ClipScene clip={clip} index={i} total={CLIPS.length} />
            </TransitionSeries.Sequence>
            <TransitionSeries.Transition
              presentation={presentations[i % presentations.length]}
              timing={timing}
            />
          </React.Fragment>
        ))}

        <TransitionSeries.Sequence durationInFrames={OUTRO_FRAMES}>
          <OutroCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Achtergrondmuziek met fade-in en fade-out */}
      <Sequence>
        <Audio
          src={staticFile("bgm.wav")}
          volume={(f) => {
            const fadeIn = Math.min(1, f / 20);
            const fadeOut = Math.min(1, (durationInFrames - f) / 30);
            return Math.max(0, Math.min(fadeIn, fadeOut)) * 0.85;
          }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
