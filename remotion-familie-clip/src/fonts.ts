import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const bungee = "Bungee";
export const audiowide = "Audiowide";

loadFont({
  family: bungee,
  url: staticFile("fonts/Bungee-Regular.ttf"),
  weight: "400",
});

loadFont({
  family: audiowide,
  url: staticFile("fonts/Audiowide-Regular.ttf"),
  weight: "400",
});
