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

// On the beat: wood slams for NEW, real sleigh bells for the sparkle, a click for
// each split-flap tile, a garment swish and landing per look, bells at the lantern.
const Audio: React.FC = () => (
  <>
    <Bed name="pulse" volume={0.45} fadeIn={0.1} fadeOut={1.4} />
    {hookT.letters.map((t, i) => (
      <Sfx key={`slam-${t}`} at={T.hook + t + 0.16} name="wood" take={i} gain={1 + i * 0.1} />
    ))}
    <Sfx at={T.hook + hookT.sparkle} name="sleigh" />
    <Sfx at={T.hook + hookT.title} name="cloth" />

    <Sfx at={T.date} name="rise" />
    {[
      ...flapLandings("FRIDAY", T.date + dateT.tiles).map((t, i) => ({ t, key: `day-${i}` })),
      ...flapLandings("7 PM", T.date + dateT.time).map((t, i) => ({ t, key: `time-${i}` })),
    ].map(({ t, key }, i) => (
      <Sfx key={key} at={t} name="click" take={i} gain={1.3} />
    ))}

    {LOOKS.map((look, i) => (
      <React.Fragment key={look.id}>
        <Sfx at={T.looks + i * T.lookLen} name="cloth" take={i} gain={1.2} />
        <Sfx at={T.looks + i * T.lookLen + 0.35} name="leather" take={i} />
        <Sfx at={T.looks + i * T.lookLen + lookT.name} name="tick" take={i} />
      </React.Fragment>
    ))}

    <Sfx at={T.colour} name="rise" take={2} />
    {colourT.bars.map((t, i) => (
      <Sfx key={`bar-${t}`} at={T.colour + t} name="flip" take={i} />
    ))}

    <Sfx at={T.sizes} name="cloth" take={3} />
    {SIZES.map((size, i) => (
      <Sfx
        key={`pill-${size}`}
        at={T.sizes + sizesT.pills + i * sizesT.pillStep + 0.05}
        name="select"
        take={i}
      />
    ))}

    <Sfx at={T.end} name="fall" />
    <Sfx at={T.end + endT.light} name="bell" />
    <Sfx at={T.end + endT.light + 0.1} name="jingle" />
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
