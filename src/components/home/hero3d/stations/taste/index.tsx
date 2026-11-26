"use client";

import type { StationDef, StationProps } from "../../types";
import DraftSheet from "./DraftSheet";
import { useDraft } from "./draftTexture";
import PreferencePairs from "./PreferencePairs";
import { GALAXY, YOU, sheetPoint } from "./space";
import StyleGalaxy from "./StyleGalaxy";

/*
 * Chapter 5, Taste: "Models average us out. Yours shouldn't."
 * A marked-up draft in the foreground; every tracked change leaves the page as a preference pair and
 * flies into a simulated space of human styles, where the personal model's outputs leave the base
 * model's average and settle in your own cluster.
 */
function TasteStation({ index, quality }: StationProps) {
  const draft = useDraft(quality);
  return (
    <group>
      <DraftSheet draft={draft} quality={quality} />
      <StyleGalaxy index={index} quality={quality} />
      <PreferencePairs index={index} draft={draft} quality={quality} />
    </group>
  );
}

const [gx, gy, gz] = GALAXY;
const [yx, yy, yz] = YOU;
// where the first tracked change sits on the page
const edit = sheetPoint(0.6, 0.27, 0.02);

export const station: StationDef = {
  id: "taste",
  Component: TasteStation,
  shots: [
    // the marked-up page, foreground left; the style space waits behind it on the right
    { pos: [-2.9, 3.3, 13.6], target: [0.2, 1.1, -2], at: 0 },
    { pos: [-2.5, 3.4, 13.1], target: [0.6, 1.2, -2.4], at: 2.4 },
    // follow the preference pairs over into the galaxy
    { pos: [-1.0, 4.5, 12.4], target: [4.0, 2.4, -4.0], at: 4.4 },
    // pull back for the whole story: the page, the pairs, and the personal model settled in your cluster
    { pos: [0.0, 5.2, 18.0], target: [2.0, 1.4, -4.5], at: 7.0 },
  ],
  callouts: [
    { anchor: [gx, gy, gz], text: "base model · pulls toward the average", offset: [-0.2, -2.4, 1.0], from: 1.6 },
    { anchor: [yx, yy, yz], text: "your style", offset: [-0.3, -1.5, 0.5], from: 2.2 },
    { anchor: [edit.x, edit.y, edit.z], text: "preference pairs · from your edits", offset: [2.5, -0.8, -0.3], from: 0.8, to: 3.8 },
    { anchor: [gx - 2.2, gy + 0.9, gz - 0.8], text: "human styles · simulated", offset: [-1.0, 1.1, 0], from: 5.0 },
  ],
  thread: [
    [-16, -1.2, 1.8],
    [-11, -1.0, 3.2],
    [-7.2, -0.9, 4.4],
    [-3.6, -0.6, 4.5],
    [0.0, 0.4, 2.6],
    [3.6, 1.0, -0.8],
    [yx - 0.4, yy, yz + 0.2],
  ],
};
