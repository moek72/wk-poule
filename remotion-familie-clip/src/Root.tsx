import React from "react";
import { Composition } from "remotion";
import { FamilieClip } from "./FamilieClip";
import { FPS, WIDTH, HEIGHT, TOTAL_FRAMES } from "./clips";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="FamilieClip"
      component={FamilieClip}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
