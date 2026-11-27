// One camera over one world. The world is measured in cells (the weave model's
// units); the camera says which world point sits at the centre of the frame and
// how many pixels a cell spans. Every view, from the single repeat to the full
// field and the thread diagram, is a framing of the same world.

export type Cam = { x: number; y: number; s: number };
export type Box = { x: number; y: number; w: number; h: number };

/** The camera that places a world box exactly on a screen box (fitted by width). */
export const frameBox = (world: Box, screen: Box, size: number): Cam => {
  const s = screen.w / world.w;
  return {
    s,
    x: world.x + (size / 2 - screen.x) / s,
    y: world.y + (size / 2 - screen.y) / s,
  };
};

/** World cell coordinates to screen pixels. */
export const toScreen = (cam: Cam, size: number, wx: number, wy: number) => ({
  x: (wx - cam.x) * cam.s + size / 2,
  y: (wy - cam.y) * cam.s + size / 2,
});

/** A world box in screen pixels. */
export const boxToScreen = (cam: Cam, size: number, b: Box): Box => {
  const p = toScreen(cam, size, b.x, b.y);
  return { x: p.x, y: p.y, w: b.w * cam.s, h: b.h * cam.s };
};

/** The part of the world the camera can see. */
export const viewBox = (cam: Cam, size: number): Box => {
  const half = size / 2 / cam.s;
  return { x: cam.x - half, y: cam.y - half, w: half * 2, h: half * 2 };
};

/** SVG transform that maps world units into the frame. */
export const camTransform = (cam: Cam, size: number) =>
  `translate(${size / 2 - cam.x * cam.s} ${size / 2 - cam.y * cam.s}) scale(${cam.s})`;

/** Zooms feel even when the scale moves geometrically, so it is mixed in log space. */
export const mixCam = (a: Cam, b: Cam, t: number): Cam => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  s: a.s * Math.pow(b.s / a.s, t),
});

export const mixBox = (a: Box, b: Box, t: number): Box => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

export const intersect = (a: Box, b: Box): Box => {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  return {
    x,
    y,
    w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x),
    h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y),
  };
};

/** A move to `value`, starting at `at` seconds and taking `dur` seconds. */
export type Key<V> = { at: number; dur: number; value: V };

/**
 * A keyframed track sampled in seconds. Each key eases from wherever the track
 * is when the key starts, so moves can overlap without jumps.
 */
export const track =
  <V>(first: V, keys: Key<V>[], mix: (a: V, b: V, t: number) => V, easing: (t: number) => number) =>
  (t: number): V => {
    let v = first;
    for (const k of keys) {
      if (t <= k.at) break;
      const p = k.dur > 0 ? Math.min(1, (t - k.at) / k.dur) : 1;
      v = mix(v, k.value, easing(p));
    }
    return v;
  };
