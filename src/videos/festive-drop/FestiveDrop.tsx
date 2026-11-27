// The Festive Edit: a 9:16 collection-drop reel for Loom & Lantern, a
// fictional occasion-wear label. Kinetic type, a split-flap date, three
// garment illustrations, a colour story and an end card, every cut on the
// 120 BPM beat. Scenes and sounds all key off the beat sheet in timeline.ts.
import React from "react";
import { Sequence, useCurrentFrame } from "remotion";
import { Bed, EndFade, Sfx, Stage, ease, tween, useSec } from "../../kit";
import { Lockup } from "./Lantern";
import { LOOKS } from "./looks";
import { fd, mix } from "./palette";
import { ColourStory } from "./scenes/ColourStory";
import { DropDate } from "./scenes/DropDate";
import { EndCard } from "./scenes/EndCard";
import { Hook } from "./scenes/Hook";
import { Looks } from "./scenes/Looks";
import { SIZES, Sizes } from "./scenes/Sizes";
import { flapLandings } from "./SplitFlap";
import { EXIT, FESTIVE_SECONDS, T, colourT, dateT, endT, hookT, lookT, sizesT } from "./timeline";

export const FESTIVEDROP_SECONDS = FESTIVE_SECONDS;

/** The paper's colour wash follows the scene: warm for the hook, each look's own colour after. */
const WASHES: readonly { at: number; colour: string }[] = [
  { at: T.hook, colour: fd.saffron },
  { at: T.date, colour: fd.blush },
  ...LOOKS.map((look, i) => ({
    at: T.looks + i * T.lookLen,
    colour: look.glow,
  })),
  { at: T.colour, colour: fd.sand },
  { at: T.sizes, colour: fd.blush },
  { at: T.end, colour: fd.saffron },
];

const useWash = () => {
  const frame = useCurrentFrame();
  const sec = useSec();
  return WASHES.reduce(
    (c, w, i) =>
      i === 0
        ? w.colour
        : mix(
            c,
            w.colour,
            tween(frame, [sec(w.at - 0.2), sec(w.at + 0.4)], [0, 1], ease.inOutSoft),
          ),
    "",
  );
};

const Audio: React.FC = () => (
  <>
    <Bed name="pulse" volume={0.45} fadeIn={0.1} fadeOut={1.4} />
    {hookT.letters.map((t, i) => (
      <Sfx
        key={`thump-${t}`}
        at={T.hook + t + 0.16}
        name="thump"
        volume={0.6}
        rate={0.9 + i * 0.12}
      />
    ))}
    <Sfx at={T.hook + hookT.sparkle} name="chime" volume={0.2} />
    <Sfx at={T.hook + hookT.title} name="swish" volume={0.28} />

    <Sfx at={T.date} name="whoosh" volume={0.35} />
    {[
      ...flapLandings("FRIDAY", T.date + dateT.tiles).map((t, i) => ({ t, key: `day-${i}` })),
      ...flapLandings("7 PM", T.date + dateT.time).map((t, i) => ({ t, key: `time-${i}` })),
    ].map(({ t, key }) => (
      <Sfx key={key} at={t} name="tick" volume={0.55} />
    ))}

    {LOOKS.map((look, i) => (
      <React.Fragment key={look.id}>
        <Sfx at={T.looks + i * T.lookLen} name="whoosh" volume={0.5} />
        <Sfx at={T.looks + i * T.lookLen + lookT.name} name="swish" volume={0.16} />
      </React.Fragment>
    ))}

    <Sfx at={T.colour} name="whoosh" volume={0.3} />
    {colourT.bars.map((t) => (
      <Sfx key={`bar-${t}`} at={T.colour + t} name="swish" volume={0.26} />
    ))}

    <Sfx at={T.sizes} name="swish" volume={0.3} />
    {SIZES.map((size, i) => (
      <Sfx
        key={`pop-${size}`}
        at={T.sizes + sizesT.pills + i * sizesT.pillStep + 0.05}
        name="pop"
        volume={0.42}
        rate={1 + i * 0.05}
      />
    ))}

    <Sfx at={T.end} name="whoosh" volume={0.28} />
    <Sfx at={T.end + endT.light} name="shimmer" volume={0.42} />
  </>
);

export const FestiveDrop: React.FC = () => {
  const sec = useSec();
  const tint = useWash();
  const span = (from: number, to: number) => ({
    from: sec(from),
    durationInFrames: sec(to - from),
  });
  return (
    <Stage variant="atelier" tint={tint}>
      <Sequence {...span(T.hook, T.date)} name="Hook">
        <Hook />
      </Sequence>
      <Sequence {...span(T.date, T.looks)} name="Drop date">
        <DropDate />
      </Sequence>
      <Sequence {...span(T.looks, T.colour)} name="Looks">
        <Looks />
      </Sequence>
      <Sequence {...span(T.colour, T.sizes)} name="Colour story">
        <ColourStory />
      </Sequence>
      <Sequence {...span(T.sizes, T.end)} name="Sizes">
        <Sizes />
      </Sequence>
      <Sequence {...span(T.end, T.total)} name="End card">
        <EndCard />
      </Sequence>
      <Lockup at={0.1} exitAt={T.end - EXIT} />
      <Audio />
      <EndFade color={fd.paper} seconds={0.8} />
    </Stage>
  );
};
