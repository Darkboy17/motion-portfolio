// Beat sheet for the quadratic explainer, in seconds. Every animation and
// caption keys off these, so retiming a chapter moves everything in it.
import type { Cue } from "../../kit/cues";
import type { Model } from "./model";

export const T = {
  launch: 1.3,
  model: 6,
  replay: 13.2,
  land: 17,
  peak: 35,
  reach: 46.5,
  sweep: 57.4,
  recap: 64.5,
  end: 74,
} as const;

export const QUADRATIC_SECONDS = T.end;

export const chapters = [
  { label: "Model", at: T.model },
  { label: "Land", at: T.land },
  { label: "Peak", at: T.peak },
  { label: "Reach", at: T.reach },
];

export const cues = (m: Model): Cue[] => [
  { at: 0.8, text: "Throw a ball, and its height follows a *quadratic equation.*" },
  {
    at: T.model + 0.3,
    text: "Here's the model: the height *h*, in metres, *t* seconds after the throw.",
  },
  {
    at: T.model + 3.6,
    text: `Gravity pulls back with *${m.text.a.replace("−", "")}t²*. The launch adds *${m.text.b}t*. It starts *${m.text.c} m* up.`,
  },
  { at: T.replay, text: "Replay the throw: the curve tracks the ball *exactly.*" },
  { at: T.land + 0.2, text: "First question: *when does it land?*" },
  { at: T.land + 2.6, text: "Landing means the height is zero, so solve *h(t) = 0.*" },
  { at: T.land + 6, text: "Read off *a*, *b* and *c*, and use the *quadratic formula.*" },
  { at: T.land + 10.6, text: `Two answers. The landing is *${m.text.landing} s.*` },
  { at: T.land + 14.2, text: `*${m.text.before} s* is before the throw, so we drop it.` },
  { at: T.peak + 0.2, text: "Second question: *how high* does it go?" },
  { at: T.peak + 2.8, text: "The peak sits halfway between the roots, at *t = −b ÷ 2a.*" },
  { at: T.peak + 6.6, text: `That's *${m.text.peakT} s* in, at *${m.text.peakH} m.*` },
  { at: T.reach + 0.2, text: `Last question: can it reach a *${m.text.ledgeH} m ledge?*` },
  {
    at: T.reach + 3.2,
    text: "Set the height to the ledge, and check the *discriminant*, b² − 4ac.",
  },
  {
    at: T.reach + 7.2,
    text: m.reaches
      ? "It's not negative, so there's a *real solution.* The ball gets there."
      : `It's negative: *no real solution.* The ball peaks ${m.text.shortBy} m short.`,
  },
  {
    at: T.sweep,
    text: "Slide the line down: at *D = 0* it touches the peak; above zero, it *crosses twice.*",
  },
  { at: T.recap + 0.2, text: "One equation, three answers: *when*, *how high*, and *whether.*" },
];
