// rng.js — a tiny seeded random generator (mulberry32) so the two panels of a
// scene always get the same decorative scatter (stars, grass, ripples).
// Every scene is painted twice from the same seed; only the listed differences
// differ between the left and the right panel.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick a value in [min, max) from a rng.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// Pick one item of an array from a rng.
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length) % items.length];
}
